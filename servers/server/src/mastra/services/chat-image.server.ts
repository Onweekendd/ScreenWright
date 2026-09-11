import { HTTPException } from "hono/http-exception";

import { assetStore } from "@/lib/storage";

const PREFIX = "chat-images";

export interface UploadChatImageInput {
  conversationId: string;
  file: File;
}

export async function uploadChatImage({ conversationId, file }: UploadChatImageInput) {
  if (!conversationId || !file) {
    throw new HTTPException(400, { message: "conversationId and file are required" });
  }

  const ext = file.name.split(".").pop() || "png";
  const uuid = crypto.randomUUID();
  const objectKey = `${PREFIX}/${conversationId}/${uuid}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "image/png";

  const { url } = await assetStore().put(objectKey, buffer, { contentType });
  return { objectKey, url };
}

export async function getChatImageBuffer(objectKey: string) {
  return assetStore().get(objectKey);
}

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif"
};

/**
 * 从访问 URL 中解析出 objectKey。
 * fs:    `http://host/blobs/chat-images/<conv>/<uuid>.png`         → `chat-images/<conv>/<uuid>.png`
 * minio: `http://host/<bucket>/chat-images/<conv>/<uuid>.png?...`  → `chat-images/<conv>/<uuid>.png`
 */
const parseObjectKey = (imageUrl: string): string => {
  const key = assetStore().keyFromUrl(imageUrl);
  if (!key) {
    throw new HTTPException(400, { message: `无法从 URL 解析 objectKey: ${imageUrl}` });
  }
  return key;
};

const inferMime = (objectKey: string): string => {
  const ext = objectKey.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "image/png";
};

/**
 * 把图取回本地内存,再转成 base64 data URL,避免外网模型直接访问内网 URL。
 * 识图 / 生成 echart 等多个工具都会用到,统一放这里避免重复实现。
 */
export async function fetchChatImageAsDataUrl(imageUrl: string): Promise<string> {
  const objectKey = parseObjectKey(imageUrl);
  const buffer = await getChatImageBuffer(objectKey);
  return `data:${inferMime(objectKey)};base64,${buffer.toString("base64")}`;
}

/**
 * 把图取回内存二进制,连同文件名与 MIME 一并返回,
 * 供需要以 multipart/form-data 上传原图的场景(如 Codia image_to_design)使用。
 */
export async function fetchChatImageBuffer(
  imageUrl: string
): Promise<{ buffer: Buffer; filename: string; mime: string }> {
  const objectKey = parseObjectKey(imageUrl);
  const buffer = await getChatImageBuffer(objectKey);
  const filename = objectKey.split("/").pop() || "image.png";
  return { buffer, filename, mime: inferMime(objectKey) };
}
