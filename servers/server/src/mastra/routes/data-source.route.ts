import { Hono } from "hono";

import {
  addDataGroup,
  apiConnect,
  createLocal,
  createSource,
  deleteDataGroup,
  deleteLocal,
  deleteSource,
  deleteSourcesBatch,
  editDataGroup,
  executeSql,
  getLocalData,
  listDataGroups,
  listGroupData,
  listLocals,
  listSources,
  testDbConnection,
  updateLocal,
  updateSource
} from "@/mastra/services/data-source.server";
import type { AuthVariables } from "@/middleware/auth";
import { authMiddleware } from "@/middleware/auth";

/** 同时兼容 JSON 与 multipart/form-data 请求体 */
async function readBody(c: {
  req: { json: () => Promise<unknown>; parseBody: () => Promise<Record<string, unknown>> };
}) {
  try {
    return ((await c.req.json()) ?? {}) as Record<string, unknown>;
  } catch {
    try {
      return await c.req.parseBody();
    } catch {
      return {};
    }
  }
}

const num = (v: unknown, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

/** 数据管理路由，挂在 /bi-system 下：/bi-system/data/* */
export const dataSourceRouter = new Hono<{ Variables: AuthVariables }>();

dataSourceRouter.use("*", authMiddleware);

/* -------- 分组 -------- */
dataSourceRouter.get("/data/group/list", async (c) => c.json(await listDataGroups(c.get("userId"))));

dataSourceRouter.post("/data/group/add", async (c) => {
  const b = await readBody(c);
  return c.json(await addDataGroup(c.get("userId"), c.get("userName"), String(b.name ?? "")));
});

dataSourceRouter.post("/data/group/edit", async (c) => {
  const b = await readBody(c);
  return c.json(await editDataGroup(c.get("userId"), c.get("userName"), num(b.id), String(b.name ?? "")));
});

dataSourceRouter.delete("/data/group/delete/:id", async (c) =>
  c.json(await deleteDataGroup(c.get("userId"), Number(c.req.param("id"))))
);

dataSourceRouter.get("/data/group/dataList/:id", async (c) =>
  c.json(await listGroupData(c.get("userId"), Number(c.req.param("id"))))
);

/* -------- 数据库源 (type=1) -------- */
dataSourceRouter.post("/data/db/list", async (c) => c.json(await listSources(c.get("userId"), 1, await readBody(c))));
dataSourceRouter.post("/data/db/add", async (c) =>
  c.json(await createSource(c.get("userId"), c.get("userName"), 1, (await readBody(c)) as never))
);
dataSourceRouter.post("/data/db/edit", async (c) =>
  c.json(await updateSource(c.get("userId"), c.get("userName"), (await readBody(c)) as never))
);
dataSourceRouter.delete("/data/db/delete/:id", async (c) =>
  c.json(await deleteSource(c.get("userId"), Number(c.req.param("id"))))
);
dataSourceRouter.delete("/data/db/deleteBatch", async (c) => {
  const b = await readBody(c);
  return c.json(await deleteSourcesBatch(c.get("userId"), (b.ids as number[]) ?? []));
});
dataSourceRouter.post("/data/db/testConnection", async (c) => c.json(await testDbConnection(await readBody(c))));
dataSourceRouter.post("/data/db/executeSql", async (c) => c.json(await executeSql((await readBody(c)) as never)));

/* -------- API 源 (type=2) -------- */
dataSourceRouter.post("/data/api/list", async (c) => c.json(await listSources(c.get("userId"), 2, await readBody(c))));
dataSourceRouter.post("/data/api/add", async (c) =>
  c.json(await createSource(c.get("userId"), c.get("userName"), 2, (await readBody(c)) as never))
);
dataSourceRouter.post("/data/api/edit", async (c) =>
  c.json(await updateSource(c.get("userId"), c.get("userName"), (await readBody(c)) as never))
);
dataSourceRouter.delete("/data/api/delete/:id", async (c) =>
  c.json(await deleteSource(c.get("userId"), Number(c.req.param("id"))))
);
dataSourceRouter.delete("/data/api/deleteBatch", async (c) => {
  const b = await readBody(c);
  return c.json(await deleteSourcesBatch(c.get("userId"), (b.ids as number[]) ?? []));
});
dataSourceRouter.post("/data/api/connect", async (c) => c.json(await apiConnect((await readBody(c)) as never)));

/* -------- 本地文件源 -------- */
dataSourceRouter.post("/data/local/list", async (c) => c.json(await listLocals(c.get("userId"), await readBody(c))));
dataSourceRouter.post("/data/local/add", async (c) =>
  c.json(await createLocal(c.get("userId"), c.get("userName"), (await readBody(c)) as never))
);
dataSourceRouter.post("/data/local/edit", async (c) =>
  c.json(await updateLocal(c.get("userId"), c.get("userName"), (await readBody(c)) as never))
);
dataSourceRouter.delete("/data/local/delete/:id", async (c) =>
  c.json(await deleteLocal(c.get("userId"), Number(c.req.param("id"))))
);
dataSourceRouter.get("/data/local/getLocalData/:id", async (c) =>
  c.json(await getLocalData(Number(c.req.param("id"))))
);
dataSourceRouter.get("/data/local/viewLocalData/:id", async (c) =>
  c.json(await getLocalData(Number(c.req.param("id"))))
);
