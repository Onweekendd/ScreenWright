import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  BatchByNodeIdsRequestSchema,
  CreateOrUpdateRequestSchema,
  IdParamSchema,
  NodeIdParamSchema,
  UpdateByIdRequestSchema,
  UploadImageRequestSchema
} from "@/mastra/types/figma-node-asset";

import {
  batchByNodeIds,
  createOrUpdate,
  deleteById,
  downloadImage,
  getByNodeId,
  listAll,
  simplifyFigmaNodeData,
  updateById,
  uploadImage
} from "../services/figma-node-asset.server";

export const figmaNodeAssetRouter = new Hono()
  .post("/upload", zValidator("json", UploadImageRequestSchema), async (c) => {
    const body = c.req.valid("json");
    return c.json(await uploadImage(body), 201);
  })
  .get("/download", async (c) => {
    const result = await downloadImage(c.req.query("nodeId"), c.req.query("bucket"));
    return c.body(new Uint8Array(result.body), 200, {
      "Content-Type": result.mimeType,
      "Content-Length": String(result.size),
      "Content-Disposition": `attachment; filename="${result.fileName}"`
    });
  })
  .post("/batch-by-node-ids", zValidator("json", BatchByNodeIdsRequestSchema), async (c) => {
    const body = c.req.valid("json");
    return c.json(await batchByNodeIds(body));
  })
  .get("/by-node-id/:nodeId", async (c) => {
    const { nodeId } = NodeIdParamSchema.parse({ nodeId: c.req.param("nodeId") });
    return c.json(await getByNodeId(nodeId));
  })
  .get("/", async (c) => {
    const page = Math.max(1, Number(c.req.query("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(c.req.query("pageSize") ?? 20)));
    return c.json(await listAll(c.req.query("fileKey"), page, pageSize));
  })
  .post("/", zValidator("json", CreateOrUpdateRequestSchema), async (c) => {
    const body = c.req.valid("json");
    return c.json(await createOrUpdate(body), 201);
  })
  .post("/simplify-node-data", async (c) => {
    const formData = await c.req.formData();
    const nodeId = formData.get("nodeId") as string;
    const fileKey = formData.get("fileKey") as string;
    const nodeName = (formData.get("nodeName") as string) || "";
    const file = formData.get("file") as File;
    if (!nodeId || !fileKey || !file) {
      return c.json({ success: false, error: "nodeId, fileKey, file are required" }, 400);
    }
    const figmaData = JSON.parse(await file.text());
    return c.json(await simplifyFigmaNodeData({ nodeId, fileKey, nodeName, figmaData }));
  })
  .put("/:id", zValidator("json", UpdateByIdRequestSchema), async (c) => {
    const body = c.req.valid("json");
    const { id } = IdParamSchema.parse({ id: c.req.param("id") });
    return c.json(await updateById(id, body));
  })
  .delete("/:id", async (c) => {
    const { id } = IdParamSchema.parse({ id: c.req.param("id") });
    return c.json(await deleteById(id));
  });
