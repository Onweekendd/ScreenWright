import { Hono } from "hono";

import {
  copyVersion,
  createVersion,
  deleteVersion,
  listVersion,
  publishVersion,
  updateVersion
} from "@/mastra/services/version.server";
import type { AuthVariables } from "@/middleware/auth";
import { authMiddleware } from "@/middleware/auth";

/**
 * 大屏版本管理路由，挂在 /bi-system 下：
 *   GET  /largeScreen/version/list?id=
 *   POST /largeScreen/version/create        （body 含 id）
 *   GET  /largeScreen/version/update?id=&versionCode=&versionDesc=
 *   GET  /largeScreen/version/delete?id=&versionCode=
 *   GET  /largeScreen/version/copy?id=&versionCode=
 *   POST /largeScreen/publish               （body 含 id）
 * 单版本模型，见 version.server.ts 说明。
 */
export const versionRouter = new Hono<{ Variables: AuthVariables }>();

versionRouter.use("*", authMiddleware);

versionRouter.get("/largeScreen/version/list", async (c) => {
  const id = Number(c.req.query("id"));
  return c.json(await listVersion(id));
});

versionRouter.post("/largeScreen/version/create", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { id?: number | string };
  return c.json(await createVersion(Number(body.id), c.get("userName")));
});

versionRouter.get("/largeScreen/version/update", async (c) => {
  const id = Number(c.req.query("id"));
  const versionCode = c.req.query("versionCode") ?? "";
  const versionDesc = c.req.query("versionDesc") ?? "";
  return c.json(await updateVersion(id, versionCode, versionDesc, c.get("userName")));
});

versionRouter.get("/largeScreen/version/delete", async (c) => {
  return c.json(await deleteVersion(Number(c.req.query("id")), c.req.query("versionCode") ?? ""));
});

versionRouter.get("/largeScreen/version/copy", async (c) => {
  return c.json(await copyVersion(Number(c.req.query("id")), c.req.query("versionCode") ?? "", c.get("userName")));
});

versionRouter.post("/largeScreen/publish", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { id?: number | string; publishInfo?: unknown };
  return c.json(await publishVersion(Number(body.id), c.get("userName"), body.publishInfo));
});
