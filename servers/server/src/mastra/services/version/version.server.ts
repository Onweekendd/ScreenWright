import { HTTPException } from "hono/http-exception";

import { Prisma } from "~/generated/prisma/client";

import { ok } from "@/lib/http/envelope";
import { prismaClient } from "@/mastra/storage/prisma";

/**
 * 大屏多版本
 *
 * 每个大屏可有多个版本，版本之间 config + layers 完全隔离：
 *   - large_screen_version：每版本一行，存该版本的 config/detail/背景/动画/发布信息等版本作用域字段
 *   - layers：按 (large_id, version_code) 作用域
 *   - large_screen：身份字段（name/userId/groupId/type/sort...）+ version_code（当前版本）
 *     + 版本作用域字段的「当前版本冗余镜像」，供列表页 / 未改的旧读路径零改动使用
 *
 * 版本解析优先级：Version-Code 请求头 → large_screen.version_code → "1"
 */

const DEFAULT_VERSION = "1";

/** 版本作用域字段：既在 large_screen 也在 large_screen_version 上（同名） */
export const VERSION_SCOPED_FIELDS = [
  "config",
  "detail",
  "backgroundUrl",
  "sceneInfo",
  "statusAnimation",
  "aniFrameSet",
  "dataFilterArr",
  "encodedControl",
  "minioIds",
  "status",
  "password",
  "expirationTime",
  "publishInfo",
  "versionDesc"
] as const;

const JSON_SCOPED_FIELDS = new Set([
  "config",
  "detail",
  "statusAnimation",
  "aniFrameSet",
  "dataFilterArr",
  "encodedControl",
  "minioIds"
]);

type VersionScopedRow = Record<(typeof VERSION_SCOPED_FIELDS)[number], unknown>;
type LargeScreenVersionRow = NonNullable<Awaited<ReturnType<typeof prismaClient.largeScreenVersion.findUnique>>>;

/** 从任意行（large_screen 或 large_screen_version）取版本作用域字段 */
export function pickVersionFields(row: Record<string, unknown>): VersionScopedRow {
  const out = {} as VersionScopedRow;
  for (const k of VERSION_SCOPED_FIELDS) {
    out[k] = row[k] ?? null;
  }
  return out;
}

/** 版本作用域字段 → Prisma 写入对象（Json 列的 null 走 Prisma.DbNull） */
function toWrite(fields: Partial<VersionScopedRow>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (JSON_SCOPED_FIELDS.has(k)) {
      data[k] = v == null ? Prisma.DbNull : v;
    } else {
      data[k] = v ?? null;
    }
  }
  return data;
}

async function mustGetScreen(largeId: number) {
  const row = await prismaClient.largeScreen.findUnique({ where: { id: largeId } });
  if (!row) {
    throw new HTTPException(404, { message: "大屏不存在" });
  }
  return row;
}

/** 当前版本号（Version-Code 头 → large_screen.version_code → "1"） */
export async function resolveVersionCode(largeId: number, headerVersionCode?: string | null): Promise<string> {
  const header = (headerVersionCode ?? "").trim();
  if (header && header !== "undefined" && header !== "null") {
    return header;
  }
  const row = await prismaClient.largeScreen.findUnique({
    where: { id: largeId },
    select: { versionCode: true }
  });
  return row?.versionCode || DEFAULT_VERSION;
}

/** 取版本行；不存在则用 large_screen 当前字段建一行（兜底老数据 / header 指向未建版本） */
export async function ensureVersionRow(largeId: number, versionCode: string): Promise<LargeScreenVersionRow> {
  const existing = await prismaClient.largeScreenVersion.findUnique({
    where: { largeId_versionCode: { largeId, versionCode } }
  });
  if (existing) {
    return existing;
  }
  const screen = await mustGetScreen(largeId);
  return prismaClient.largeScreenVersion.create({
    data: {
      largeId,
      versionCode,
      createdBy: screen.createdBy,
      updatedBy: screen.updatedBy,
      ...toWrite(pickVersionFields(screen as unknown as Record<string, unknown>))
    } as unknown as Prisma.LargeScreenVersionCreateInput
  });
}

/** 把某版本行的作用域字段镜像回 large_screen，并把它设为当前版本 */
export async function mirrorVersionToScreen(largeId: number, versionCode: string): Promise<void> {
  const version = await prismaClient.largeScreenVersion.findUnique({
    where: { largeId_versionCode: { largeId, versionCode } }
  });
  if (!version) {
    return;
  }
  await prismaClient.largeScreen.update({
    where: { id: largeId },
    data: {
      versionCode,
      ...toWrite(pickVersionFields(version as unknown as Record<string, unknown>))
    } as unknown as Prisma.LargeScreenUpdateInput
  });
}

/** patch 某版本的顶层 config（组件 id 数组）；若是当前版本则同步镜像到 large_screen */
export async function patchVersionConfig(
  largeId: number,
  versionCode: string,
  mutate: (ids: number[]) => number[]
): Promise<void> {
  const version = await ensureVersionRow(largeId, versionCode);
  const current = Array.isArray(version.config)
    ? (version.config as unknown[]).map(Number).filter((n) => !Number.isNaN(n))
    : [];
  const next = mutate(current);
  await prismaClient.largeScreenVersion.update({
    where: { id: version.id },
    data: { config: next as unknown as Prisma.InputJsonValue }
  });
  const screen = await prismaClient.largeScreen.findUnique({ where: { id: largeId }, select: { versionCode: true } });
  if ((screen?.versionCode || DEFAULT_VERSION) === versionCode) {
    await prismaClient.largeScreen.update({
      where: { id: largeId },
      data: { config: next as unknown as Prisma.InputJsonValue }
    });
  }
}

interface VersionVo {
  id: number;
  versionCode: string;
  versionDesc: string | null;
  status: boolean;
  hasPassword: boolean;
  hasExpirationTime: boolean;
  password: string;
  expirationTime: string | null;
  updatedBy: string | null;
  updatedTime: string;
  createdTime: string;
}

function toVersionVo(row: LargeScreenVersionRow): VersionVo {
  return {
    id: row.largeId,
    versionCode: row.versionCode,
    versionDesc: row.versionDesc ?? null,
    status: row.status,
    hasPassword: !!row.password,
    hasExpirationTime: !!row.expirationTime,
    password: row.password || "",
    expirationTime: row.expirationTime ? row.expirationTime.toISOString() : null,
    updatedBy: row.updatedBy,
    updatedTime: row.updatedTime.toISOString(),
    createdTime: row.createdTime.toISOString()
  };
}

const toInt = (v: string) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
};

async function nextVersionCode(largeId: number): Promise<string> {
  const rows = await prismaClient.largeScreenVersion.findMany({
    where: { largeId },
    select: { versionCode: true }
  });
  const max = rows.reduce((m, r) => Math.max(m, toInt(r.versionCode)), 0);
  return String(max + 1);
}

/** 面板类模块名（其 config.panelData[].config 为子组件 id 数组）；分组用 config.children */
const PANEL_LIKE_MODULES = new Set(["动态面板", "终端交互", "专题面板"]);
const GROUP_MODULE = "分组";

/**
 * 深拷某版本的所有 layers 到新版本，按 oldId→newId 重写面板/分组里的子组件 id 引用。
 * 返回 oldId→newId 映射（调用方据此重写版本行的顶层 config 数组）。
 */
async function cloneLayers(
  largeId: number,
  fromVersion: string,
  toVersion: string,
  userName: string
): Promise<Map<number, number>> {
  const rows = await prismaClient.layers.findMany({
    where: { largeId, versionCode: fromVersion },
    orderBy: [{ id: "asc" }]
  });
  if (rows.length === 0) {
    return new Map();
  }

  const moduleIds = [...new Set(rows.map((r) => r.moduleId).filter((n): n is number => n != null))];
  const modules = moduleIds.length
    ? await prismaClient.module.findMany({
        where: { moduleId: { in: moduleIds } },
        select: { moduleId: true, name: true }
      })
    : [];
  const moduleNameById = new Map(modules.map((m) => [m.moduleId, m.name]));

  // 第一遍：建行（config 先原样拷），拿到 oldId→newId
  const idMap = new Map<number, number>();
  for (const src of rows) {
    const created = await prismaClient.layers.create({
      data: {
        userId: src.userId,
        moduleId: src.moduleId,
        largeId,
        versionCode: toVersion,
        config: (src.config ?? {}) as Prisma.InputJsonValue,
        minioIds: (src.minioIds ?? []) as Prisma.InputJsonValue,
        dataJson: (src.dataJson ?? {}) as Prisma.InputJsonValue,
        createdBy: userName,
        updatedBy: userName
      }
    });
    idMap.set(src.id, created.id);
  }

  const remapRef = (ref: unknown): unknown => {
    if (typeof ref === "object" || ref == null) {
      return ref;
    }
    const mapped = idMap.get(Number(ref));
    return mapped ?? ref;
  };

  // 第二遍：重写 config 里的自身 id + 面板/分组子引用
  for (const src of rows) {
    const newId = idMap.get(src.id)!;
    const cfg = { ...((src.config as Record<string, unknown>) ?? {}) };
    cfg.id = newId;
    const moduleName = src.moduleId != null ? moduleNameById.get(src.moduleId) : undefined;
    if (moduleName && PANEL_LIKE_MODULES.has(moduleName) && Array.isArray(cfg.panelData)) {
      cfg.panelData = (cfg.panelData as Array<Record<string, unknown>>).map((state) => ({
        ...state,
        config: Array.isArray(state.config) ? (state.config as unknown[]).map(remapRef) : state.config
      }));
    }
    if (moduleName === GROUP_MODULE && Array.isArray(cfg.children)) {
      cfg.children = (cfg.children as unknown[]).map(remapRef);
    }
    await prismaClient.layers.update({
      where: { id: newId },
      data: { config: cfg as Prisma.InputJsonValue }
    });
  }

  return idMap;
}

/**
 * 从源版本派生一个新版本。
 * - blank=false（复制）：深拷 layers + 顶层 config，版本间组件完全隔离
 * - blank=true（新增）：只继承页面作用域字段（画布 detail / 背景 / 动画容器等），
 *   config 置空、不拷任何 layers —— 新版本是一块「空白大屏」
 */
async function createFromVersion(
  largeId: number,
  srcVersion: string,
  userName: string,
  opts: { blank?: boolean } = {}
): Promise<VersionVo> {
  const src = await ensureVersionRow(largeId, srcVersion);
  const newCode = await nextVersionCode(largeId);

  const created = await prismaClient.largeScreenVersion.create({
    data: {
      largeId,
      versionCode: newCode,
      createdBy: userName,
      updatedBy: userName,
      ...toWrite({
        ...pickVersionFields(src as unknown as Record<string, unknown>),
        versionDesc: null,
        status: false,
        publishInfo: null,
        ...(opts.blank ? { config: [] } : {})
      })
    } as unknown as Prisma.LargeScreenVersionCreateInput
  });

  if (!opts.blank) {
    const idMap = await cloneLayers(largeId, srcVersion, newCode, userName);

    // 版本行的顶层 config（组件 id 数组）也要按 oldId→newId 重映射
    if (Array.isArray(src.config) && idMap.size > 0) {
      const remapped = (src.config as unknown[]).map((v) => {
        const n = Number(v);
        return Number.isNaN(n) ? v : (idMap.get(n) ?? v);
      });
      await prismaClient.largeScreenVersion.update({
        where: { id: created.id },
        data: { config: remapped as unknown as Prisma.InputJsonValue }
      });
    }
  }

  await mirrorVersionToScreen(largeId, newCode);
  return toVersionVo(created);
}

/** GET /largeScreen/version/list?id= */
export async function listVersion(largeId: number) {
  await mustGetScreen(largeId);
  await ensureVersionRow(largeId, await resolveVersionCode(largeId));
  const rows = await prismaClient.largeScreenVersion.findMany({
    where: { largeId },
    orderBy: [{ id: "asc" }]
  });
  return ok(rows.map(toVersionVo));
}

/** POST /largeScreen/version/create（body.id）—— 新增一块空白大屏版本（保留画布/背景，无组件） */
export async function createVersion(largeId: number, userName: string) {
  await mustGetScreen(largeId);
  const current = await resolveVersionCode(largeId);
  return ok(await createFromVersion(largeId, current, userName, { blank: true }));
}

/** GET /largeScreen/version/copy?id=&versionCode= —— 从指定版本快照出新版本 */
export async function copyVersion(largeId: number, srcVersionCode: string, userName: string) {
  await mustGetScreen(largeId);
  const src = (srcVersionCode || "").trim() || (await resolveVersionCode(largeId));
  return ok(await createFromVersion(largeId, src, userName));
}

/** GET /largeScreen/version/update?id=&versionCode=&versionDesc= */
export async function updateVersion(largeId: number, versionCode: string, versionDesc: string, userName: string) {
  await mustGetScreen(largeId);
  const code = (versionCode || "").trim() || (await resolveVersionCode(largeId));
  await ensureVersionRow(largeId, code);
  await prismaClient.largeScreenVersion.update({
    where: { largeId_versionCode: { largeId, versionCode: code } },
    data: { versionDesc, updatedBy: userName }
  });
  const screen = await prismaClient.largeScreen.findUnique({ where: { id: largeId }, select: { versionCode: true } });
  if ((screen?.versionCode || DEFAULT_VERSION) === code) {
    await prismaClient.largeScreen.update({ where: { id: largeId }, data: { versionDesc, updatedBy: userName } });
  }
  const row = await prismaClient.largeScreenVersion.findUnique({
    where: { largeId_versionCode: { largeId, versionCode: code } }
  });
  return ok(row ? toVersionVo(row) : null);
}

/** GET /largeScreen/version/delete?id=&versionCode= */
export async function deleteVersion(largeId: number, versionCode: string) {
  await mustGetScreen(largeId);
  const code = (versionCode || "").trim();
  if (!code) {
    throw new HTTPException(400, { message: "缺少版本号" });
  }
  const all = await prismaClient.largeScreenVersion.findMany({ where: { largeId }, select: { versionCode: true } });
  if (all.length <= 1) {
    throw new HTTPException(400, { message: "无法删除唯一版本" });
  }

  await prismaClient.$transaction([
    prismaClient.layers.deleteMany({ where: { largeId, versionCode: code } }),
    prismaClient.largeScreenVersion.deleteMany({ where: { largeId, versionCode: code } })
  ]);

  const screen = await prismaClient.largeScreen.findUnique({ where: { id: largeId }, select: { versionCode: true } });
  if ((screen?.versionCode || DEFAULT_VERSION) === code) {
    const remain = await prismaClient.largeScreenVersion.findMany({
      where: { largeId },
      select: { versionCode: true }
    });
    const target = remain.map((r) => r.versionCode).sort((a, b) => toInt(b) - toInt(a))[0] || DEFAULT_VERSION;
    await mirrorVersionToScreen(largeId, target);
  }
  return ok(null, "删除成功");
}

/** POST /largeScreen/publish（body.id）—— 标记当前版本为已发布 */
export async function publishVersion(largeId: number, userName: string, publishInfo?: unknown) {
  await mustGetScreen(largeId);
  const code = await resolveVersionCode(largeId);
  await ensureVersionRow(largeId, code);
  const info = publishInfo == null ? undefined : JSON.stringify(publishInfo);
  await prismaClient.largeScreenVersion.update({
    where: { largeId_versionCode: { largeId, versionCode: code } },
    data: { status: true, publishInfo: info, updatedBy: userName }
  });
  await mirrorVersionToScreen(largeId, code);
  const row = await prismaClient.largeScreenVersion.findUnique({
    where: { largeId_versionCode: { largeId, versionCode: code } }
  });
  return ok(row ? toVersionVo(row) : null);
}
