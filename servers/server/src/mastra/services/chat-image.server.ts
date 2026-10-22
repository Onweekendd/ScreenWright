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
 * 按 URL 读本系统 assetStore 里的图;不是本系统资源(外部公网图等)返回 null,由调用方原样放行。
 * 按 objectKey 直读而不是 fetch URL:MinIO presigned URL 24h 过期,老会话里的图照样能读。
 */
export async function readStoredImage(imageUrl: string): Promise<{ buffer: Buffer; mime: string } | null> {
  const objectKey = assetStore().keyFromUrl(imageUrl);
  if (!objectKey) {
    return null;
  }
  return { buffer: await getChatImageBuffer(objectKey), mime: inferMime(objectKey) };
}
