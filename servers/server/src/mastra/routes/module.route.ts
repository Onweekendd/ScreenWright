import { Hono } from "hono";

import { getModule, listModules } from "@/mastra/services/module.server";
import type { AuthVariables } from "@/middleware/auth";
import { authMiddleware } from "@/middleware/auth";

/** 组件模块路由，挂在 /bi-system 下：/bi-system/module/list、/bi-system/module/info/:id */
export const moduleRouter = new Hono<{ Variables: AuthVariables }>();

moduleRouter.use("*", authMiddleware);

moduleRouter.post("/module/list", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  return c.json(await listModules(body ?? {}));
});

moduleRouter.get("/module/info/:id", async (c) => {
  return c.json(await getModule(Number(c.req.param("id"))));
});
