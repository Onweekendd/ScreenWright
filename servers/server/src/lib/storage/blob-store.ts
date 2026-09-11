import { randomUUID } from "node:crypto";
import path from "node:path";

import { resolveUnder } from "./fs-object-store";
import { assetStore, BLOB_ROOT } from "./index";

/**
 * 素材上传的便捷封装 —— 在 `assetStore()` 之上加一层「按 prefix + 随机名生成 key」。
 * 具体走 fs 还是 minio 由 `STORAGE_DRIVER` 决定，这里不关心。
 */

export function blobRoot(): string {
  return BLOB_ROOT;
}

export function blobUrl(key: string): string {
  return assetStore().publicUrl(key);
}

/** 把已知在 blobRoot 下的 key 解析成绝对路径（供 `blob.route` fs 静态服务用），越权返回 null。 */
export function resolveBlobPath(key: string): string | null {
  return resolveUnder(BLOB_ROOT, path.normalize(key));
}

export async function saveBlob(
  prefix: string,
  filename: string,
  data: Buffer
): Promise<{ key: string; url: string; size: number }> {
  const ext = path.extname(filename || "").slice(0, 16);
  const key = `${prefix}/${randomUUID()}${ext}`;
  const saved = await assetStore().put(key, data);
  return { key: saved.key, url: saved.url, size: saved.size };
}

export async function deleteBlob(key: string | null | undefined): Promise<void> {
  if (key) {
    await assetStore().delete(key);
  }
}
