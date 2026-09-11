import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

import { Hono } from "hono";
import mime from "mime";

import { resolveBlobPath } from "@/lib/storage/blob-store";

/**
 * blob 静态服务 —— 供 <img>/<video> 直接引用，不走鉴权。
 * 顶层挂载：GET /blobs/<key>
 */
export const blobRouter = new Hono();

blobRouter.get("/blobs/:key{.+}", async (c) => {
  const key = c.req.param("key");
  const abs = resolveBlobPath(key);
  if (!abs || !existsSync(abs)) {
    return c.notFound();
  }
  const data = await readFile(abs);
  return c.body(new Uint8Array(data), 200, {
    "Content-Type": mime.getType(abs) || "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable"
  });
});
