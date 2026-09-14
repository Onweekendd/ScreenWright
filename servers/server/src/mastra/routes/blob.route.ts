import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { Hono } from "hono";
import mime from "mime";

import { resolveBlobPath } from "@/lib/storage/blob-store";

/**
 * blob 静态服务 —— 供 <img>/<video> 直接引用，不走鉴权。
 * 顶层挂载：GET /blobs/<key>
 * 支持 Range 请求（视频/音频 seek、断点续传必需，否则浏览器只能整包重新下载）。
 */
export const blobRouter = new Hono();

blobRouter.get("/blobs/:key{.+}", async (c) => {
  const key = c.req.param("key");
  const abs = resolveBlobPath(key);
  if (!abs || !existsSync(abs)) {
    return c.notFound();
  }

  const { size } = await stat(abs);
  const contentType = mime.getType(abs) || "application/octet-stream";
  const range = c.req.header("range");

  if (!range) {
    return c.body(Readable.toWeb(createReadStream(abs)) as ReadableStream, 200, {
      "Content-Type": contentType,
      "Content-Length": String(size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable"
    });
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) {
    return c.body(null, 416, { "Content-Range": `bytes */${size}` });
  }
  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Number(match[2]) : size - 1;
  if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= size) {
    return c.body(null, 416, { "Content-Range": `bytes */${size}` });
  }

  return c.body(Readable.toWeb(createReadStream(abs, { start, end })) as ReadableStream, 206, {
    "Content-Type": contentType,
    "Content-Length": String(end - start + 1),
    "Content-Range": `bytes ${start}-${end}/${size}`,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable"
  });
});
