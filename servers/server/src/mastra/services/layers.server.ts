import { HTTPException } from "hono/http-exception";

import type { Prisma } from "~/generated/prisma/client";

import { ok } from "@/lib/http/envelope";
import { patchVersionConfig } from "@/mastra/services/version.server";
import { prismaClient } from "@/mastra/storage/prisma";

type LayerRow = NonNullable<Awaited<ReturnType<typeof prismaClient.layers.findUnique>>>;

const DEFAULT_VERSION = "1";

/** 读取：DB Json → 前端期望的 JSON 字符串 */
const jsonStr = (v: unknown, fallback = ""): string => {
  if (v == null) {
    return fallback;
  }
  if (typeof v === "string") {
    return v;
  }
  return JSON.stringify(v);
};

/** 写入：string|object → 可存入 Json 列的值 */
const toJson = (v: unknown): Prisma.InputJsonValue | undefined => {
  if (v == null) {
    return undefined;
  }
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as Prisma.InputJsonValue;
    } catch {
      return v as unknown as Prisma.InputJsonValue;
    }
  }
  return v as Prisma.InputJsonValue;
};

/** 把值解析成对象（用于往 config 里注入 id） */
const asObject = (v: unknown): Record<string, unknown> => {
  if (v == null) {
    return {};
  }
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return typeof v === "object" ? (v as Record<string, unknown>) : {};
};

/** Layers 行 → 前端 src/model/Layer.ts 的 GroupCase */
function toGroupCase(row: LayerRow) {
  return {
    id: row.id,
    userId: row.userId ?? 0,
    moduleId: row.moduleId ?? 0,
    largeId: row.largeId,
    config: jsonStr(row.config, "{}"),
    minioIds: jsonStr(row.minioIds, "[]"),
    dataJson: jsonStr(row.dataJson, "{}"),
    versionCode: row.versionCode ?? DEFAULT_VERSION,
    createdBy: row.createdBy ?? "",
    createdTime: row.createdTime.toISOString(),
    updatedBy: row.updatedBy ?? "",
    updatedTime: row.updatedTime.toISOString()
  };
}

/** 断言大屏存在（save 时的权限/存在校验） */
async function assertScreenExists(largeId: number) {
  const screen = await prismaClient.largeScreen.findUnique({ where: { id: largeId } });
  if (!screen) {
    throw new HTTPException(401, { message: "大屏不存在或无权访问" });
  }
  return screen;
}

/**
 * 保存组件。
 * body: { moduleId, largeId, config?, status?, minioIds?, dataJson? }
 * status=true 表示动态面板内组件，不进大屏顶层 config。
 * versionCode：目标版本（由路由从 Version-Code 头解析），组件行按版本作用域。
 */
export async function saveLayer(
  userId: number,
  userName: string,
  body: {
    moduleId?: number;
    largeId: number;
    config?: unknown;
    status?: boolean;
    minioIds?: unknown;
    dataJson?: unknown;
  },
  versionCode: string = DEFAULT_VERSION
) {
  await assertScreenExists(body.largeId);

  const module = body.moduleId ? await prismaClient.module.findFirst({ where: { moduleId: body.moduleId } }) : null;

  // config 为空且模块自带默认配置（javaScript）时用默认配置起手
  const hasConfig = body.config != null && jsonStr(body.config, "") !== "" && jsonStr(body.config, "") !== "{}";
  const baseConfig = hasConfig ? asObject(body.config) : asObject(module?.javaScript);

  const created = await prismaClient.layers.create({
    data: {
      userId,
      moduleId: body.moduleId ?? null,
      largeId: body.largeId,
      config: baseConfig as Prisma.InputJsonValue,
      minioIds: toJson(body.minioIds) ?? [],
      dataJson: toJson(body.dataJson) ?? {},
      versionCode,
      createdBy: userName,
      updatedBy: userName
    }
  });

  // 把自身 id 注入 config，再回写
  const withId = { ...baseConfig, id: created.id };
  const updated = await prismaClient.layers.update({
    where: { id: created.id },
    data: { config: withId as Prisma.InputJsonValue }
  });

  if (!body.status) {
    await patchVersionConfig(body.largeId, versionCode, (ids) =>
      ids.includes(created.id) ? ids : [...ids, created.id]
    );
  }

  return ok(toGroupCase(updated));
}

/** 更新组件 */
export async function updateLayer(
  userName: string,
  body: {
    id: number;
    config?: unknown;
    dataJson?: unknown;
    minioIds?: unknown;
    moduleId?: number;
  }
) {
  const existing = await prismaClient.layers.findUnique({ where: { id: body.id } });
  if (!existing) {
    throw new HTTPException(404, { message: "组件不存在" });
  }
  const data: Prisma.LayersUpdateInput = { updatedBy: userName };
  if (body.config !== undefined) {
    data.config = toJson(body.config);
  }
  if (body.dataJson !== undefined) {
    data.dataJson = toJson(body.dataJson);
  }
  if (body.minioIds !== undefined) {
    data.minioIds = toJson(body.minioIds);
  }
  if (body.moduleId !== undefined) {
    data.moduleId = body.moduleId;
  }

  const updated = await prismaClient.layers.update({ where: { id: body.id }, data });
  return ok(toGroupCase(updated));
}

/** 查询单个组件 */
export async function getLayer(id: number) {
  const row = await prismaClient.layers.findUnique({ where: { id } });
  if (!row) {
    throw new HTTPException(404, { message: "组件不存在" });
  }
  return ok(toGroupCase(row));
}

/**
 * 删除组件：删行 + 从大屏顶层 config 移除。
 * 幂等：目标行已不存在时直接返回成功——期望的最终状态（组件已删除）已经达成，
 * 前端会据此把该 id 从本地组件树 / config 中清掉，避免重复删除（撤销重做、双击）报错。
 */
export async function deleteLayer(id: number) {
  const existing = await prismaClient.layers.findUnique({ where: { id } });
  if (!existing) {
    return ok(null, "删除成功");
  }
  await prismaClient.layers.delete({ where: { id } });
  await patchVersionConfig(existing.largeId, existing.versionCode ?? DEFAULT_VERSION, (ids) =>
    ids.filter((n) => n !== id)
  );
  return ok(null, "删除成功");
}

/**
 * 复制组件。
 * isSaved=1 表示复制后立即持久化并加入大屏 config；status=true 为动态面板内组件。
 */
export async function copyLayer(id: number, isSaved: number, status: boolean) {
  const src = await prismaClient.layers.findUnique({ where: { id } });
  if (!src) {
    throw new HTTPException(404, { message: "组件不存在" });
  }
  const srcConfig = asObject(src.config);
  const created = await prismaClient.layers.create({
    data: {
      userId: src.userId,
      moduleId: src.moduleId,
      largeId: src.largeId,
      config: srcConfig as Prisma.InputJsonValue,
      minioIds: (src.minioIds ?? []) as Prisma.InputJsonValue,
      dataJson: (src.dataJson ?? {}) as Prisma.InputJsonValue,
      versionCode: src.versionCode ?? DEFAULT_VERSION,
      createdBy: src.createdBy,
      updatedBy: src.updatedBy
    }
  });
  const updated = await prismaClient.layers.update({
    where: { id: created.id },
    data: { config: { ...srcConfig, id: created.id } as Prisma.InputJsonValue }
  });
  if (isSaved && !status) {
    await patchVersionConfig(src.largeId, src.versionCode ?? DEFAULT_VERSION, (ids) =>
      ids.includes(created.id) ? ids : [...ids, created.id]
    );
  }
  return ok(toGroupCase(updated));
}
