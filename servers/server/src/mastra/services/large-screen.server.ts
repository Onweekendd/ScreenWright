import { randomUUID } from "node:crypto";

import { HTTPException } from "hono/http-exception";

import type { Prisma } from "~/generated/prisma/client";

import { ok } from "@/lib/http/envelope";
import { prismaClient } from "@/mastra/storage/prisma";
import {
  ensureVersionRow,
  mirrorVersionToScreen,
  pickVersionFields,
  resolveVersionCode
} from "@/mastra/services/version.server";
import type {
  LargeGroupSaveReq,
  LargeGroupUpdateReq,
  ScreenListReq,
  ScreenSaveReq,
  ScreenUpdateReq
} from "@/mastra/types/large-screen";

type ScreenRow = Awaited<ReturnType<typeof prismaClient.largeScreen.findUnique>>;

/** 读取：DB Json → 前端期望的 JSON 字符串 */
const jsonField = (v: unknown): string => {
  if (v == null) {
    return "";
  }
  if (typeof v === "string") {
    return v;
  }
  return JSON.stringify(v);
};

/** 写入：string|object → 可存入 Json 列的对象 */
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

const canAccess = (role: number, ownerUserId: number, userId: number) => role === 0 || ownerUserId === userId;

/** 大屏身份行 + 版本行 → 合并行（版本作用域字段以版本行为准，身份字段仍取大屏行） */
function mergeVersion(
  screen: NonNullable<ScreenRow>,
  version: { versionCode: string } & Record<string, unknown>
): NonNullable<ScreenRow> {
  return {
    ...screen,
    ...pickVersionFields(version),
    versionCode: version.versionCode
  } as NonNullable<ScreenRow>;
}

/** 列表项 → 前端 src/model/Visual.ts 的 ScreenItem */
function toScreenItem(row: NonNullable<ScreenRow>) {
  return {
    id: row.id,
    userId: row.userId,
    moduleId: row.moduleId ?? null,
    config: jsonField(row.config),
    name: row.name,
    detail: jsonField(row.detail),
    backgroundUrl: row.backgroundUrl ?? "",
    sceneInfo: row.sceneInfo ?? "",
    type: row.type,
    stockType: row.stockType,
    groupId: row.groupId,
    password: row.password ?? "",
    hasPassword: !!row.password,
    invitationCode: row.invitationCode ?? "",
    status: row.status,
    expirationTime: row.expirationTime ? row.expirationTime.toISOString() : null,
    hasExpirationTime: !!row.expirationTime,
    sort: row.sort,
    versionCode: row.versionCode || "1",
    versionDesc: row.versionDesc ?? null,
    minioIds: row.minioIds ?? null,
    dataFilterArr: row.dataFilterArr ?? null,
    aniFrameSet: row.aniFrameSet ?? null,
    newApplication: row.newApplication,
    encodedControl: row.encodedControl ?? null,
    publishInfo: row.publishInfo,
    path: row.path,
    createdBy: row.createdBy ?? "",
    createdTime: row.createdTime.toISOString(),
    updatedBy: row.updatedBy ?? "",
    updatedTime: row.updatedTime.toISOString()
  };
}

/** 详情 → 前端 src/model/Build.ts 的 LargeScreeInfo（config/detail 等为 JSON 字符串，layers 为组件 config 对象数组） */
function toLargeScreeInfo(row: NonNullable<ScreenRow>, layers: unknown[]) {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    config: jsonField(row.config),
    detail: jsonField(row.detail),
    backgroundUrl: row.backgroundUrl ?? "",
    invitationCode: row.invitationCode ?? "",
    status: row.status,
    type: row.type,
    versionCode: row.versionCode || "1",
    versionDesc: row.versionDesc ?? null,
    dataFilterArr: jsonField(row.dataFilterArr),
    encodedControl: jsonField(row.encodedControl),
    aniFrameSet: jsonField(row.aniFrameSet),
    statusAnimation: jsonField(row.statusAnimation),
    layers,
    component: [] as unknown[],
    updatedBy: row.updatedBy ?? "",
    updatedTime: row.updatedTime.toISOString()
  };
}

/** 面板类模块名（其 config.panelData[].config 为子组件 id 数组，读取时需回填成完整 config） */
const PANEL_LIKE_MODULES = new Set(["动态面板", "终端交互", "专题面板"]);
const GROUP_MODULE = "分组";

/**
 * 组装大屏顶层组件的 config，并把「引用型」结构里的子组件 id 回填成完整 config
 * （对齐 Java LayersServiceImpl 的 dynamicPanel() / group() 读取逻辑）：
 *   - 面板：config.panelData[].config = [子id...] → [子config...]（递归）
 *   - 分组：config.children = [子id...] → [子config...]（递归）
 * 只返回大屏 config 数组里列出的顶层组件（面板内组件通过回填出现，不平铺在顶层）。
 */
async function loadScreenLayers(largeId: number, screenConfig: unknown, versionCode?: string): Promise<unknown[]> {
  const rows = await prismaClient.layers.findMany({
    where: versionCode ? { largeId, versionCode } : { largeId },
    orderBy: [{ id: "asc" }]
  });
  const rowById = new Map(rows.map((r) => [r.id, r]));

  const moduleIds = [...new Set(rows.map((r) => r.moduleId).filter((n): n is number => n != null))];
  const modules = moduleIds.length
    ? await prismaClient.module.findMany({
        where: { moduleId: { in: moduleIds } },
        select: { moduleId: true, name: true }
      })
    : [];
  const moduleNameById = new Map(modules.map((m) => [m.moduleId, m.name]));

  /**
   * 被「引用型」结构（分组 children / 面板 panelData[].config）以 id 形式包住的子组件。
   * 这些组件只应通过父级回填出现，不能再平铺在顶层——否则同一组件渲染两次。
   * 分组成员的行 status=false（顶层），建组时会被写进版本 config，故必须在读取时剔除；
   * 面板成员 status=true 本就不在版本 config 里，这里一并兜底。
   */
  const collectIds = (v: unknown): number[] =>
    Array.isArray(v) ? v.map(Number).filter((n) => !Number.isNaN(n)) : [];
  const nestedIds = new Set<number>();
  for (const row of rows) {
    const cfg = (row.config as Record<string, unknown>) ?? {};
    for (const id of collectIds(cfg.children)) {
      nestedIds.add(id);
    }
    if (Array.isArray(cfg.panelData)) {
      for (const state of cfg.panelData as Array<Record<string, unknown>>) {
        for (const id of collectIds(state?.config)) {
          nestedIds.add(id);
        }
      }
    }
  }

  const resolveRef = (ref: unknown, seen: Set<number>): unknown => {
    if (ref == null) {
      return null;
    }
    if (typeof ref === "object") {
      return ref; // 已经是完整 config（老数据 / fullUpdate 存法）
    }
    const id = Number(ref);
    const childRow = rowById.get(id);
    if (Number.isNaN(id) || !childRow || seen.has(id)) {
      return null;
    }
    return resolveRow(childRow, new Set([...seen, id]));
  };

  const resolveRow = (row: (typeof rows)[number], seen: Set<number>): Record<string, unknown> => {
    const cfg = { ...((row.config as Record<string, unknown>) ?? {}) };
    const moduleName = row.moduleId != null ? moduleNameById.get(row.moduleId) : undefined;

    if (moduleName && PANEL_LIKE_MODULES.has(moduleName) && Array.isArray(cfg.panelData)) {
      cfg.panelData = (cfg.panelData as Array<Record<string, unknown>>).map((state) => ({
        ...state,
        config: Array.isArray(state.config)
          ? (state.config as unknown[]).map((r) => resolveRef(r, seen)).filter((x) => x != null)
          : []
      }));
    }
    if (moduleName === GROUP_MODULE && Array.isArray(cfg.children)) {
      cfg.children = (cfg.children as unknown[]).map((r) => resolveRef(r, seen)).filter((x) => x != null);
    }
    return cfg;
  };

  const topIds = Array.isArray(screenConfig)
    ? (screenConfig as unknown[]).map(Number).filter((n) => !Number.isNaN(n))
    : [];
  // config 数组为空的老数据兜底：退回平铺所有组件（同样剔除已被父级包住的子组件）
  if (topIds.length === 0) {
    return rows.filter((r) => !nestedIds.has(r.id)).map((r) => resolveRow(r, new Set([r.id])));
  }
  return topIds
    .filter((id) => !nestedIds.has(id))
    .map((id) => rowById.get(id))
    .filter((r): r is (typeof rows)[number] => r != null)
    .map((r) => resolveRow(r, new Set([r.id])));
}

/** MyBatis-Plus 分页形状（前端 ScreenList 按此解构，字段需齐全） */
const pageOf = (records: unknown[], total: number, current: number, size: number) => ({
  records,
  total,
  size,
  current,
  pages: size > 0 ? Math.ceil(total / size) : 0,
  orders: [] as unknown[],
  optimizeCountSql: true,
  searchCount: true,
  maxLimit: null,
  countId: null
});

/** 列表 */
export async function listScreens(userId: number, role: number, req: ScreenListReq) {
  const { current, size, name, groupId, status } = req;
  const where: Record<string, unknown> = {};
  if (role !== 0) {
    where.userId = userId;
  } // 超管可看全部
  if (name) {
    where.name = { contains: name };
  }
  if (typeof groupId === "number" && groupId > 0) {
    where.groupId = groupId;
  }
  if (typeof status === "boolean") {
    where.status = status;
  }

  const [total, rows] = await Promise.all([
    prismaClient.largeScreen.count({ where }),
    prismaClient.largeScreen.findMany({
      where,
      skip: (current - 1) * size,
      take: size,
      orderBy: [{ sort: "desc" }, { id: "desc" }]
    })
  ]);

  return ok(pageOf(rows.map(toScreenItem), total, current, size));
}

/** 详情（含所有组件 layers，供编辑器 / 预览加载） */
export async function getScreen(userId: number, role: number, id: number, versionCode?: string | null) {
  const row = await prismaClient.largeScreen.findUnique({ where: { id } });
  if (!row) {
    throw new HTTPException(404, { message: "大屏不存在" });
  }
  if (!canAccess(role, row.userId, userId)) {
    throw new HTTPException(401, { message: "无权访问该大屏" });
  }
  const vc = await resolveVersionCode(id, versionCode);
  const merged = mergeVersion(row, await ensureVersionRow(id, vc));
  return ok(toLargeScreeInfo(merged, await loadScreenLayers(id, merged.config, vc)));
}

/**
 * 大屏基本信息 → 前端 ScreenMeta。
 * 只有标量字段：不含 layers / config / detail / dataFilterArr / aniFrameSet / statusAnimation / encodedControl / minioIds
 * 这些重 JSON。供发布弹窗、缓存新鲜度比对（updatedTime）等只需元信息的场景。
 */
function toScreenMeta(row: NonNullable<ScreenRow>) {
  return {
    id: row.id,
    userId: row.userId,
    moduleId: row.moduleId ?? null,
    name: row.name,
    backgroundUrl: row.backgroundUrl ?? "",
    sceneInfo: row.sceneInfo ?? "",
    type: row.type,
    stockType: row.stockType,
    groupId: row.groupId,
    password: row.password ?? "",
    hasPassword: !!row.password,
    invitationCode: row.invitationCode ?? "",
    status: row.status,
    expirationTime: row.expirationTime ? row.expirationTime.toISOString() : null,
    hasExpirationTime: !!row.expirationTime,
    sort: row.sort,
    versionCode: row.versionCode || "1",
    versionDesc: row.versionDesc ?? null,
    newApplication: row.newApplication,
    publishInfo: row.publishInfo,
    path: row.path,
    createdBy: row.createdBy ?? "",
    createdTime: row.createdTime.toISOString(),
    updatedBy: row.updatedBy ?? "",
    updatedTime: row.updatedTime.toISOString()
  };
}

/** 大屏基本信息（不含 layers 及各类重 JSON），供缓存时间比对 / 发布弹窗 */
export async function getScreenMeta(userId: number, role: number, id: number, versionCode?: string | null) {
  const row = await prismaClient.largeScreen.findUnique({ where: { id } });
  if (!row) {
    throw new HTTPException(404, { message: "大屏不存在" });
  }
  if (!canAccess(role, row.userId, userId)) {
    throw new HTTPException(401, { message: "无权访问该大屏" });
  }
  const vc = await resolveVersionCode(id, versionCode);
  // status / versionDesc / publishInfo / expirationTime / password 是版本作用域字段，需 merge 后取
  return ok(toScreenMeta(mergeVersion(row, await ensureVersionRow(id, vc))));
}

/**
 * 预览打开（分享 / view 模式）。开源版无发布 / 权益 / 密码强校验，
 * 直接返回带 layers 的详情。
 */
export async function openScreen(id: number, _password?: string, versionCode?: string | null) {
  const row = await prismaClient.largeScreen.findUnique({ where: { id } });
  if (!row) {
    throw new HTTPException(404, { message: "大屏不存在" });
  }
  const vc = await resolveVersionCode(id, versionCode);
  const merged = mergeVersion(row, await ensureVersionRow(id, vc));
  return ok(toLargeScreeInfo(merged, await loadScreenLayers(id, merged.config, vc)));
}

/** 预览前置校验：是否需要密码 / 能否直接进（开源版恒为 true） */
export async function openCheck(_id: number, _password?: string) {
  return ok(true);
}

/**
 * 引用面板：把被引用大屏（quoteId）的配置 + layers 返回，宿主大屏据此内嵌渲染。
 * 对齐 Java quoteInfo（LargeVo：config + layers[]）。开源版不做版本 / 权益校验。
 * openQuote 是发布态的同一逻辑。
 */
export async function quoteInfo(quoteId: number, versionCode?: string | null) {
  const row = await prismaClient.largeScreen.findUnique({ where: { id: quoteId } });
  if (!row) {
    throw new HTTPException(404, { message: "被引用的大屏不存在" });
  }
  const vc = await resolveVersionCode(quoteId, versionCode);
  const merged = mergeVersion(row, await ensureVersionRow(quoteId, vc));
  return ok(toLargeScreeInfo(merged, await loadScreenLayers(quoteId, merged.config, vc)));
}

/** 新增 */
export async function createScreen(userId: number, userName: string, req: ScreenSaveReq) {
  const versionCode = req.versionCode || "1";
  const created = await prismaClient.largeScreen.create({
    data: {
      userId,
      name: req.name,
      groupId: req.groupId ?? 0,
      type: req.type ?? 1,
      stockType: req.stockType ?? 1,
      password: req.password || null,
      config: toJson(req.config),
      detail: toJson(req.detail),
      invitationCode: randomUUID(),
      versionCode,
      createdBy: userName,
      updatedBy: userName
    }
  });
  await prismaClient.largeScreenVersion.create({
    data: {
      largeId: created.id,
      versionCode,
      config: toJson(req.config) ?? undefined,
      detail: toJson(req.detail) ?? undefined,
      password: req.password || null,
      createdBy: userName,
      updatedBy: userName
    }
  });
  return ok(toScreenItem(created));
}

/** 更新（身份字段写 large_screen，版本作用域字段写 large_screen_version[目标版本]） */
export async function updateScreen(
  userId: number,
  role: number,
  userName: string,
  req: ScreenUpdateReq,
  headerVersionCode?: string | null
) {
  const { id } = req;
  const existing = await prismaClient.largeScreen.findUnique({ where: { id } });
  if (!existing) {
    throw new HTTPException(404, { message: "大屏不存在" });
  }
  if (!canAccess(role, existing.userId, userId)) {
    throw new HTTPException(401, { message: "无权修改该大屏" });
  }

  const targetVersion = (req.versionCode || "").trim() || (await resolveVersionCode(id, headerVersionCode));
  await ensureVersionRow(id, targetVersion);

  // 身份字段 → large_screen
  const identity: Record<string, unknown> = { updatedBy: userName };
  for (const [k, v] of [
    ["name", req.name],
    ["groupId", req.groupId],
    ["type", req.type],
    ["stockType", req.stockType]
  ] as Array<[string, unknown]>) {
    if (v !== undefined) {
      identity[k] = v;
    }
  }

  // 版本作用域字段 → large_screen_version[targetVersion]
  const vdata: Record<string, unknown> = { updatedBy: userName };
  for (const [k, v] of [
    ["status", req.status],
    ["backgroundUrl", req.backgroundUrl],
    ["sceneInfo", req.sceneInfo],
    ["publishInfo", req.publishInfo],
    ["versionDesc", req.versionDesc]
  ] as Array<[string, unknown]>) {
    if (v !== undefined) {
      vdata[k] = v;
    }
  }
  for (const [k, v] of [
    ["config", req.config],
    ["detail", req.detail],
    ["minioIds", req.minioIds],
    ["dataFilterArr", req.dataFilterArr],
    ["aniFrameSet", req.aniFrameSet],
    ["encodedControl", req.encodedControl],
    ["statusAnimation", req.statusAnimation]
  ] as Array<[string, unknown]>) {
    if (v !== undefined) {
      vdata[k] = toJson(v);
    }
  }
  if (req.password !== undefined) {
    vdata.password = req.password || null;
  }

  await prismaClient.largeScreen.update({
    where: { id },
    data: identity as unknown as Prisma.LargeScreenUpdateInput
  });
  await prismaClient.largeScreenVersion.update({
    where: { largeId_versionCode: { largeId: id, versionCode: targetVersion } },
    data: vdata as unknown as Prisma.LargeScreenVersionUpdateInput
  });

  const current = await resolveVersionCode(id);
  if (current === targetVersion) {
    await mirrorVersionToScreen(id, targetVersion);
  }

  const finalRow = await prismaClient.largeScreen.findUnique({ where: { id } });
  const versionRow = await ensureVersionRow(id, targetVersion);
  return ok(toScreenItem(mergeVersion(finalRow as NonNullable<ScreenRow>, versionRow)));
}

/** 删除 */
export async function deleteScreen(userId: number, role: number, id: number) {
  const existing = await prismaClient.largeScreen.findUnique({ where: { id } });
  if (!existing) {
    throw new HTTPException(404, { message: "大屏不存在" });
  }
  if (!canAccess(role, existing.userId, userId)) {
    throw new HTTPException(401, { message: "无权删除该大屏" });
  }
  await prismaClient.$transaction([
    prismaClient.layers.deleteMany({ where: { largeId: id } }),
    prismaClient.largeScreenVersion.deleteMany({ where: { largeId: id } }),
    prismaClient.largeScreen.delete({ where: { id } })
  ]);
  return ok(null, "删除成功");
}

/**
 * 分组列表（对齐 Java LargeScreenVo）
 * result: { allCount, unCount, list: [{ id, name, count, ... }] }
 * 前端侧边树（useSiderTreeData.getTreeData）与 refreshTreeCount 都按这个形状读。
 */
export async function listGroups(userId: number, role: number) {
  const screenWhere = role === 0 ? {} : { userId };
  const groupWhere = role === 0 ? {} : { userId };
  const groups = await prismaClient.largeGroup.findMany({
    where: groupWhere,
    orderBy: [{ sort: "asc" }, { id: "asc" }]
  });
  const [allCount, unCount, list] = await Promise.all([
    prismaClient.largeScreen.count({ where: screenWhere }),
    prismaClient.largeScreen.count({ where: { ...screenWhere, groupId: 0 } }),
    Promise.all(
      groups.map(async (g) => ({
        id: g.id,
        userId: g.userId,
        name: g.name,
        type: g.type,
        sort: g.sort,
        count: await prismaClient.largeScreen.count({ where: { groupId: g.id } })
      }))
    )
  ]);
  return ok({ allCount, unCount, list });
}

/** 新增分组 */
export async function createGroup(userId: number, userName: string, req: LargeGroupSaveReq) {
  const dup = await prismaClient.largeGroup.findFirst({ where: { userId, name: req.name } });
  if (dup) {
    throw new HTTPException(400, { message: "分组名称已存在" });
  }
  const created = await prismaClient.largeGroup.create({
    data: { userId, name: req.name, type: req.type ?? 0, sort: req.sort ?? 0, createdBy: userName }
  });
  return ok({ id: created.id, name: created.name, userId: created.userId });
}

/** 更新分组 */
export async function updateGroup(userId: number, role: number, userName: string, req: LargeGroupUpdateReq) {
  const { id, ...rest } = req;
  const existing = await prismaClient.largeGroup.findUnique({ where: { id } });
  if (!existing) {
    throw new HTTPException(404, { message: "分组不存在" });
  }
  if (!canAccess(role, existing.userId, userId)) {
    throw new HTTPException(401, { message: "无权修改该分组" });
  }
  if (rest.name) {
    const dup = await prismaClient.largeGroup.findFirst({ where: { userId, name: rest.name, NOT: { id } } });
    if (dup) {
      throw new HTTPException(400, { message: "分组名称已存在" });
    }
  }
  const updated = await prismaClient.largeGroup.update({ where: { id }, data: { ...rest, updatedBy: userName } });
  return ok({ id: updated.id, name: updated.name, userId: updated.userId });
}

/** 删除分组：deleted=true 连带删除子大屏，否则子大屏归到未分组(0) */
export async function deleteGroup(userId: number, role: number, id: number, deleted: boolean) {
  const existing = await prismaClient.largeGroup.findUnique({ where: { id } });
  if (!existing) {
    throw new HTTPException(404, { message: "分组不存在" });
  }
  if (!canAccess(role, existing.userId, userId)) {
    throw new HTTPException(401, { message: "无权删除该分组" });
  }

  if (deleted) {
    await prismaClient.largeScreen.deleteMany({ where: { groupId: id } });
  } else {
    await prismaClient.largeScreen.updateMany({ where: { groupId: id }, data: { groupId: 0 } });
  }
  await prismaClient.largeGroup.delete({ where: { id } });
  return ok(null, "删除成功");
}
