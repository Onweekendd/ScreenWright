import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { copyFile, updateFile, uploadFile, usedSize } from "@/mastra/services/assets.server";
import { createScreen, openCheck, openScreen } from "@/mastra/services/large-screen.server";
import { saveLayer } from "@/mastra/services/layers.server";
import { ScreenSaveSchema } from "@/mastra/types/large-screen";
import type { AuthVariables } from "@/middleware/auth";
import { authMiddleware } from "@/middleware/auth";

/**
 * bi-online 聚合层路由，挂在 /online 下。
 * Java 侧这些 *Agg 端点做权益 / UE 插件校验后转发到 bi-system；
 * 开源版无权益体系，直接转发到对应 service。
 */
export const onlineRouter = new Hono<{ Variables: AuthVariables }>();

onlineRouter.use("*", authMiddleware);

const LayersAggSaveSchema = z
  .object({
    moduleId: z.coerce.number().optional(),
    largeId: z.coerce.number(),
    config: z.any().optional(),
    status: z.boolean().optional(),
    minioIds: z.any().optional(),
    dataJson: z.any().optional()
  })
  .passthrough();

// /online/layersAgg/save → 组件保存
onlineRouter.post("/layersAgg/save", zValidator("json", LayersAggSaveSchema), async (c) => {
  const body = c.req.valid("json");
  return c.json(await saveLayer(c.get("userId"), c.get("userName"), body));
});

/** multipart：分出 file 与普通字段 */
function splitForm(body: Record<string, unknown>) {
  const file = body.file instanceof File ? (body.file as File) : null;
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!(v instanceof File)) {
      fields[k] = v;
    }
  }
  return { file, fields };
}

// /online/minioAgg/uploadFile → 上传素材
onlineRouter.post("/minioAgg/uploadFile", async (c) => {
  const { file, fields } = splitForm(await c.req.parseBody());
  if (!file) {
    return c.json({ code: 400, success: false, message: "未收到文件", result: null }, 400);
  }
  return c.json(await uploadFile(c.get("userId"), c.get("userName"), file, fields));
});

// /online/minioAgg/updateFile → 更新素材
onlineRouter.post("/minioAgg/updateFile", async (c) => {
  const { file, fields } = splitForm(await c.req.parseBody());
  return c.json(await updateFile(c.get("userId"), c.get("userName"), fields, file));
});

// /online/minioAgg/copy/ → 复制素材
onlineRouter.post("/minioAgg/copy/", async (c) => {
  const { fields } = splitForm(await c.req.parseBody());
  return c.json(await copyFile(c.get("userId"), c.get("userName"), Number(fields.id)));
});

// /online/minioAgg/size/BI → 素材占用大小
onlineRouter.get("/minioAgg/size/:appCode", async (c) => c.json(await usedSize(c.get("userId"))));

/* -------- 大屏聚合：新建数据 / 预览 -------- */

// /online/largeScreenAgg/save → 新建大屏（前端 addScreenData）
onlineRouter.post("/largeScreenAgg/save", async (c) => {
  const body = ScreenSaveSchema.parse(await c.req.json().catch(() => ({})));
  return c.json(await createScreen(c.get("userId"), c.get("userName"), body));
});

// /online/largeScreenAgg/open → 预览打开（含 layers）
onlineRouter.post("/largeScreenAgg/open", async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as { id?: number; password?: string; versionCode?: string };
  return c.json(await openScreen(Number(b.id), b.password, b.versionCode ?? c.req.header("Version-Code")));
});

// /online/largeScreenAgg/openCheck → 预览前置校验
onlineRouter.post("/largeScreenAgg/openCheck", async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as { id?: number; password?: string };
  return c.json(await openCheck(Number(b.id), b.password));
});

// /online/largeScreenAgg/openCheckEquities → 权益校验（开源版恒通过）
onlineRouter.post("/largeScreenAgg/openCheckEquities", (c) =>
  c.json({ code: 200, success: true, message: "ok", result: true })
);
