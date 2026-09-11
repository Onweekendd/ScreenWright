import { HTTPException } from "hono/http-exception";

import type { Prisma } from "~/generated/prisma/client";

import { runQuery, testConnection } from "@/lib/db/execute";
import { ok } from "@/lib/http/envelope";
import { pageOf } from "@/lib/http/page";
import { prismaClient } from "@/mastra/storage/prisma";

/* ============================ 数据分组 ============================ */

/**
 * 数据分组列表（对齐 Java DataGroupServiceImpl.getGroupList）
 * result: { list: [{ id, name, userId, count }], groupedCount, allCount, unGroupedCount }
 * allCount = 该用户全部数据源(DB/API) + 本地文件；socket 类不在开源范围。
 * 前端侧边树（useSiderTreeData）与 useActionMenu / useNewAddDialog 都按这个形状读。
 */
export async function listDataGroups(userId: number) {
  const groups = await prismaClient.dataGroup.findMany({
    where: { userId },
    orderBy: [{ id: "asc" }]
  });
  const [sourceAll, localAll] = await Promise.all([
    prismaClient.dataSource.count({ where: { userId } }),
    prismaClient.dataLocal.count({ where: { userId } })
  ]);
  const allCount = sourceAll + localAll;
  const list = await Promise.all(
    groups.map(async (g) => {
      const [sc, lc] = await Promise.all([
        prismaClient.dataSource.count({ where: { userId, dataGroupId: g.id } }),
        prismaClient.dataLocal.count({ where: { userId, dataGroupId: g.id } })
      ]);
      return { id: g.id, name: g.name, userId: g.userId ?? 0, count: sc + lc };
    })
  );
  const groupedCount = list.reduce((sum, g) => sum + g.count, 0);
  return ok({ list, groupedCount, allCount, unGroupedCount: allCount - groupedCount });
}

export async function addDataGroup(userId: number, userName: string, name: string) {
  const dup = await prismaClient.dataGroup.findFirst({ where: { userId, name } });
  if (dup) {
    throw new HTTPException(400, { message: "分组名称已存在" });
  }
  const created = await prismaClient.dataGroup.create({
    data: { userId, name, createdBy: userName, updatedBy: userName }
  });
  return ok({ id: created.id, name: created.name, userId });
}

export async function editDataGroup(userId: number, userName: string, id: number, name: string) {
  const existing = await prismaClient.dataGroup.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new HTTPException(404, { message: "分组不存在" });
  }
  const updated = await prismaClient.dataGroup.update({ where: { id }, data: { name, updatedBy: userName } });
  return ok({ id: updated.id, name: updated.name, userId });
}

export async function deleteDataGroup(userId: number, id: number) {
  const existing = await prismaClient.dataGroup.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new HTTPException(404, { message: "分组不存在" });
  }
  // 子数据源 / 本地文件归到未分组
  await prismaClient.dataSource.updateMany({ where: { dataGroupId: id }, data: { dataGroupId: null } });
  await prismaClient.dataLocal.updateMany({ where: { dataGroupId: id }, data: { dataGroupId: null } });
  await prismaClient.dataGroup.delete({ where: { id } });
  return ok(null, "删除成功");
}

/** 某分组下的数据源 + 本地文件（前端 group/dataList/:id） */
export async function listGroupData(userId: number, groupId: number) {
  const where = groupId > 0 ? { userId, dataGroupId: groupId } : { userId };
  const [sources, locals] = await Promise.all([
    prismaClient.dataSource.findMany({ where }),
    prismaClient.dataLocal.findMany({ where })
  ]);
  return ok([...sources.map(toSourceItem), ...locals.map(toLocalItem)]);
}

/* ============================ 数据源（DB / API） ============================ */

type SourceRow = Awaited<ReturnType<typeof prismaClient.dataSource.findFirst>> & object;
type LocalRow = Awaited<ReturnType<typeof prismaClient.dataLocal.findFirst>> & object;

const jsonStr = (v: unknown, fallback = ""): string => {
  if (v == null) {
    return fallback;
  }
  if (typeof v === "string") {
    return v;
  }
  return JSON.stringify(v);
};
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

function toSourceItem(row: SourceRow) {
  return {
    id: row.id,
    userId: row.userId ?? 0,
    type: String(row.type),
    name: row.name,
    description: row.description ?? "",
    config: jsonStr(row.config, "{}"),
    dataGroupId: row.dataGroupId ?? null,
    layerIds: jsonStr(row.layerIds, ""),
    url: "",
    fileName: "",
    size: 0,
    charsetName: "",
    createdBy: row.createdBy ?? "",
    createdTime: row.createdTime.toISOString(),
    updatedBy: row.updatedBy ?? "",
    updatedTime: row.updatedTime.toISOString()
  };
}

function toLocalItem(row: LocalRow) {
  return {
    id: row.id,
    userId: row.userId ?? 0,
    type: row.type ?? "csv",
    name: row.name,
    description: row.description ?? "",
    config: "",
    dataGroupId: row.dataGroupId ?? null,
    layerIds: jsonStr(row.layerIds, ""),
    url: row.url ?? "",
    fileName: row.fileName ?? "",
    size: row.size ?? 0,
    charsetName: row.charsetName ?? "utf-8",
    createdBy: row.createdBy ?? "",
    createdTime: row.createdTime.toISOString(),
    updatedBy: row.updatedBy ?? "",
    updatedTime: row.updatedTime.toISOString()
  };
}

/** DB(type=1) / API(type=2) 分页列表 */
export async function listSources(
  userId: number,
  type: number,
  req: { current?: number; size?: number; groupId?: number; name?: string }
) {
  const current = req.current ?? 1;
  const size = req.size ?? 10;
  const where: Prisma.DataSourceWhereInput = { userId, type };
  if (req.name) {
    where.name = { contains: req.name };
  }
  if (req.groupId && req.groupId > 0) {
    where.dataGroupId = req.groupId;
  }
  const [total, rows] = await Promise.all([
    prismaClient.dataSource.count({ where }),
    prismaClient.dataSource.findMany({ where, skip: (current - 1) * size, take: size, orderBy: [{ id: "desc" }] })
  ]);
  return ok(pageOf(rows.map(toSourceItem), total, current, size));
}

export async function createSource(
  userId: number,
  userName: string,
  type: number,
  body: { name: string; description?: string; dataGroupId?: number; config?: unknown }
) {
  const created = await prismaClient.dataSource.create({
    data: {
      userId,
      type,
      name: body.name,
      description: body.description ?? null,
      dataGroupId: body.dataGroupId ?? null,
      config: toJson(body.config) ?? {},
      layerIds: [],
      createdBy: userName,
      updatedBy: userName
    }
  });
  return ok(toSourceItem(created));
}

export async function updateSource(
  userId: number,
  userName: string,
  body: { id: number; name?: string; description?: string; dataGroupId?: number; config?: unknown }
) {
  const existing = await prismaClient.dataSource.findUnique({ where: { id: body.id } });
  if (!existing || existing.userId !== userId) {
    throw new HTTPException(404, { message: "数据源不存在" });
  }
  const data: Prisma.DataSourceUpdateInput = { updatedBy: userName };
  if (body.name !== undefined) {
    data.name = body.name;
  }
  if (body.description !== undefined) {
    data.description = body.description;
  }
  if (body.dataGroupId !== undefined) {
    data.dataGroupId = body.dataGroupId;
  }
  if (body.config !== undefined) {
    data.config = toJson(body.config);
  }
  const updated = await prismaClient.dataSource.update({ where: { id: body.id }, data });
  return ok(toSourceItem(updated));
}

export async function deleteSource(userId: number, id: number) {
  const existing = await prismaClient.dataSource.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new HTTPException(404, { message: "数据源不存在" });
  }
  await prismaClient.dataSource.delete({ where: { id } });
  return ok(null, "删除成功");
}

export async function deleteSourcesBatch(userId: number, ids: number[]) {
  await prismaClient.dataSource.deleteMany({ where: { userId, id: { in: ids } } });
  return ok(null, "删除成功");
}

/* ============================ 连接测试 / SQL 执行 / API 代理 ============================ */

/** 前端表单：{ url|jdbcUrl, username, password, dbType } */
export async function testDbConnection(body: Record<string, unknown>) {
  const jdbcUrl = String(body.url ?? body.jdbcUrl ?? "");
  await testConnection({
    jdbcUrl,
    username: String(body.username ?? ""),
    password: String(body.password ?? "")
  });
  return ok(null, "数据库连接成功");
}

/**
 * 执行 SQL。body 结构见前端 dataSource.ts::executeSql：
 * { baseInfoSource: { jdbcUrl, username, password, ... }, sql, limit }
 * 返回行数组（sqlFilter 直接把 result 当数组用）。
 */
export async function executeSql(body: {
  baseInfoSource?: { jdbcUrl?: string; username?: string; password?: string };
  sql?: string;
  limit?: number;
}) {
  const src = body.baseInfoSource;
  if (!src?.jdbcUrl || !body.sql) {
    throw new HTTPException(400, { message: "缺少连接信息或 SQL" });
  }
  const rows = await runQuery(
    { jdbcUrl: src.jdbcUrl, username: src.username ?? "", password: src.password ?? "" },
    body.sql,
    body.limit ?? 0
  );
  return ok(rows);
}

/**
 * API 数据源后端代理（绕过浏览器跨域）。
 * body: { url, method, headers, params, data, dataSite }
 * 返回 { headers: [{name,type}], values } —— 对齐 Java apiConnect。
 */
export async function apiConnect(body: {
  url: string;
  method?: string;
  headers?: unknown;
  params?: unknown;
  data?: unknown;
  dataSite?: string;
}) {
  if (!body.url) {
    throw new HTTPException(400, { message: "缺少接口地址" });
  }
  const method = (body.method ?? "get").toUpperCase();
  const headers = parseKv(body.headers);
  const params = parseKv(body.params);

  let url = body.url;
  const init: RequestInit = { method, headers };
  if (method === "GET") {
    const qs = new URLSearchParams(params).toString();
    if (qs) {
      url += (url.includes("?") ? "&" : "?") + qs;
    }
  } else {
    init.headers = { "Content-Type": "application/json", ...headers };
    init.body = JSON.stringify(body.data ?? params ?? {});
  }

  let json: unknown;
  try {
    const resp = await fetch(url, init);
    json = await resp.json();
  } catch {
    throw new HTTPException(502, { message: "连接该接口地址请求异常" });
  }

  const picked = body.dataSite ? getByPath(json, body.dataSite) : json;
  const values = Array.isArray(picked) ? picked : [picked];
  const first = values[0];
  const columns =
    first && typeof first === "object"
      ? Object.entries(first as Record<string, unknown>).map(([name, v]) => ({
          name,
          type: typeof v === "number" ? "number" : typeof v === "boolean" ? "boolean" : "string"
        }))
      : [];
  return ok({ headers: columns, values });
}

function parseKv(v: unknown): Record<string, string> {
  if (v == null) {
    return {};
  }
  const obj = typeof v === "string" ? safeParse(v) : v;
  if (!obj || typeof obj !== "object") {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(obj as Record<string, unknown>)) {
    out[k] = String(val ?? "");
  }
  return out;
}
function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
/** 简易 a.b.c 取值（够用即可，不引 jsonpath） */
function getByPath(obj: unknown, path: string): unknown {
  const clean = path.replace(/^\$\.?/, "").trim();
  if (!clean) {
    return obj;
  }
  return clean.split(".").reduce<unknown>((acc, key) => {
    if (acc == null) {
      return undefined;
    }
    const m = /^([^[\]]+)(?:\[(\d+)\])?$/.exec(key);
    if (!m) {
      return (acc as Record<string, unknown>)[key];
    }
    const base = (acc as Record<string, unknown>)[m[1]];
    return m[2] != null ? (base as unknown[])?.[Number(m[2])] : base;
  }, obj);
}

/* ============================ 本地文件（CSV / Excel） ============================ */

export async function listLocals(
  userId: number,
  req: { current?: number; size?: number; groupId?: number; name?: string }
) {
  const current = req.current ?? 1;
  const size = req.size ?? 10;
  const where: Prisma.DataLocalWhereInput = { userId };
  if (req.name) {
    where.name = { contains: req.name };
  }
  if (req.groupId && req.groupId > 0) {
    where.dataGroupId = req.groupId;
  }
  const [total, rows] = await Promise.all([
    prismaClient.dataLocal.count({ where }),
    prismaClient.dataLocal.findMany({ where, skip: (current - 1) * size, take: size, orderBy: [{ id: "desc" }] })
  ]);
  return ok(pageOf(rows.map(toLocalItem), total, current, size));
}

/** 已解析好的行数据（前端解析 CSV/Excel 后提交 { name, dataGroupId, content:{headers,values} }） */
export async function createLocal(
  userId: number,
  userName: string,
  body: {
    name: string;
    description?: string;
    type?: string;
    dataGroupId?: number;
    fileName?: string;
    content?: unknown;
  }
) {
  const created = await prismaClient.dataLocal.create({
    data: {
      userId,
      name: body.name,
      description: body.description ?? null,
      type: body.type ?? "csv",
      dataGroupId: body.dataGroupId ?? null,
      fileName: body.fileName ?? null,
      charsetName: "utf-8",
      content: toJson(body.content) ?? { headers: [], values: [] },
      layerIds: [],
      createdBy: userName,
      updatedBy: userName
    }
  });
  return ok(toLocalItem(created));
}

export async function updateLocal(
  userId: number,
  userName: string,
  body: { id: number; name?: string; description?: string; dataGroupId?: number; content?: unknown }
) {
  const existing = await prismaClient.dataLocal.findUnique({ where: { id: body.id } });
  if (!existing || existing.userId !== userId) {
    throw new HTTPException(404, { message: "文件数据源不存在" });
  }
  const data: Prisma.DataLocalUpdateInput = { updatedBy: userName };
  if (body.name !== undefined) {
    data.name = body.name;
  }
  if (body.description !== undefined) {
    data.description = body.description;
  }
  if (body.dataGroupId !== undefined) {
    data.dataGroupId = body.dataGroupId;
  }
  if (body.content !== undefined) {
    data.content = toJson(body.content);
  }
  const updated = await prismaClient.dataLocal.update({ where: { id: body.id }, data });
  return ok(toLocalItem(updated));
}

export async function deleteLocal(userId: number, id: number) {
  const existing = await prismaClient.dataLocal.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new HTTPException(404, { message: "文件数据源不存在" });
  }
  await prismaClient.dataLocal.delete({ where: { id } });
  return ok(null, "删除成功");
}

/** 取本地文件内容（前端 getLocalData / viewLocalData） */
export async function getLocalData(id: number) {
  const row = await prismaClient.dataLocal.findUnique({ where: { id } });
  if (!row) {
    throw new HTTPException(404, { message: "文件数据源不存在" });
  }
  return ok(row.content ?? { headers: [], values: [] });
}
