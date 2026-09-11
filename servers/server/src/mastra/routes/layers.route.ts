import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { ok } from "@/lib/http/envelope";
import { copyLayer, deleteLayer, getLayer, saveLayer, updateLayer } from "@/mastra/services/layers.server";
import { resolveVersionCode } from "@/mastra/services/version.server";
import type { AuthVariables } from "@/middleware/auth";
import { authMiddleware } from "@/middleware/auth";

const SaveSchema = z
  .object({
    moduleId: z.coerce.number().optional(),
    largeId: z.coerce.number(),
    config: z.any().optional(),
    status: z.boolean().optional(),
    minioIds: z.any().optional(),
    dataJson: z.any().optional()
  })
  .passthrough();

const UpdateSchema = z
  .object({
    id: z.coerce.number().int(),
    config: z.any().optional(),
    dataJson: z.any().optional(),
    minioIds: z.any().optional(),
    moduleId: z.coerce.number().optional()
  })
  .passthrough();

/** 组件路由，挂在 /bi-system 下：/bi-system/layers/* */
export const layersRouter = new Hono<{ Variables: AuthVariables }>();

layersRouter.use("*", authMiddleware);

layersRouter.post("/layers/save", zValidator("json", SaveSchema), async (c) => {
  const body = c.req.valid("json");
  const versionCode = await resolveVersionCode(body.largeId, c.req.header("Version-Code"));
  return c.json(await saveLayer(c.get("userId"), c.get("userName"), body, versionCode));
});

layersRouter.put("/layers/update", zValidator("json", UpdateSchema), async (c) => {
  const body = c.req.valid("json");
  return c.json(await updateLayer(c.get("userName"), body));
});

layersRouter.get("/layers/info/:id", async (c) => {
  return c.json(await getLayer(Number(c.req.param("id"))));
});

layersRouter.delete("/layers/delete/:id", async (c) => {
  return c.json(await deleteLayer(Number(c.req.param("id"))));
});

layersRouter.get("/layers/copy/:id/:isSaved/:status", async (c) => {
  const id = Number(c.req.param("id"));
  const isSaved = Number(c.req.param("isSaved"));
  const status = c.req.param("status") === "true";
  return c.json(await copyLayer(id, isSaved, status));
});

/**
 * 图层锁 —— 单机空实现。
 * Java 版是多人协作的编辑锁（谁在编哪个图层）。开源版走单机 / 去用户概念，
 * 无锁竞争，setLayerLock 恒返回「锁已归当前用户」，setLayerUnLock 直接成功。
 */
layersRouter.get("/layers/setLayerLock/:id", (c) => {
  return c.json(ok({ userId: c.get("userId"), userName: c.get("userName"), lockValue: String(c.req.param("id")) }));
});

layersRouter.get("/layers/setLayerUnLock/:id", (c) => {
  return c.json(ok("解锁成功"));
});
