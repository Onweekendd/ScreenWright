import { Hono } from "hono";

import {
  addGroup,
  deleteFile,
  deleteFilesBatch,
  deleteGroup,
  editGroup,
  getFile,
  getLargeUse,
  listGroups,
  pageFiles,
  pageSystemMaterials,
  uploadFile
} from "@/mastra/services/assets.server";
import type { AuthVariables } from "@/middleware/auth";
import { authMiddleware } from "@/middleware/auth";

async function jsonBody(c: { req: { json: () => Promise<unknown> } }): Promise<Record<string, unknown>> {
  try {
    return ((await c.req.json()) ?? {}) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** 拆分 multipart：分出 file / cover 与其余普通字段 */
function splitForm(body: Record<string, unknown>) {
  const file = body.file instanceof File ? (body.file as File) : null;
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (v instanceof File) {
      continue;
    }
    fields[k] = v;
  }
  return { file, fields };
}

/** 素材库路由，挂在 /bi-system 下：/bi-system/minio/*、/minioGroup/*、/minioLargeSystem/* */
export const assetsRouter = new Hono<{ Variables: AuthVariables }>();

assetsRouter.use("*", authMiddleware);

/* -------- 素材文件 -------- */
assetsRouter.post("/minio/page", async (c) => c.json(await pageFiles(c.get("userId"), await jsonBody(c))));
assetsRouter.get("/minio/info/:id", async (c) => c.json(await getFile(Number(c.req.param("id")))));

assetsRouter.post("/minio/uploadFile", async (c) => {
  const { file, fields } = splitForm(await c.req.parseBody());
  if (!file) {
    return c.json({ code: 400, success: false, message: "未收到文件", result: null }, 400);
  }
  return c.json(await uploadFile(c.get("userId"), c.get("userName"), file, fields));
});

assetsRouter.delete("/minio/deleteFile/:id", async (c) =>
  c.json(await deleteFile(c.get("userId"), Number(c.req.param("id"))))
);

assetsRouter.delete("/minio/deleteBatch", async (c) => {
  const b = await jsonBody(c);
  const ids = String(b.ids ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  return c.json(await deleteFilesBatch(c.get("userId"), ids));
});

assetsRouter.get("/minio/getLargeUse/:id", (c) => c.json(getLargeUse()));

/* -------- 系统素材（全局只读） -------- */
assetsRouter.post("/systemMaterial/page", async (c) => c.json(await pageSystemMaterials(await jsonBody(c))));

/* -------- 素材分组 -------- */
assetsRouter.get("/minioGroup/list", async (c) => c.json(await listGroups(c.get("userId"))));
assetsRouter.post("/minioGroup/add", async (c) => {
  const b = await jsonBody(c);
  return c.json(await addGroup(c.get("userId"), c.get("userName"), String(b.name ?? ""), Number(b.type ?? 0)));
});
assetsRouter.post("/minioGroup/edit", async (c) => {
  const b = await jsonBody(c);
  return c.json(await editGroup(c.get("userId"), c.get("userName"), Number(b.id), String(b.name ?? "")));
});
assetsRouter.delete("/minioGroup/delete/:id", async (c) =>
  c.json(await deleteGroup(c.get("userId"), Number(c.req.param("id"))))
);

// 组合案例（groupLayerData/*）：依赖 Screenwright 内部素材云，开源版移除
