/**
 * 存储装配点：下游拿 `assetStore()` / `recordStore()`，不关心背后是哪个 `ObjectStore` 实现
 * （`FsObjectStore` / `MinioObjectStore` / `CompositeObjectStore`）。
 *
 * ── 素材类（聊天贴图、Figma 资源、Codia 转存图、BI 素材库）───────────────────
 *   单一后端，由 `STORAGE_DRIVER` 选择：
 *     fs   （默认）→ 落 `BLOB_STORAGE_DIR`，经 `GET /blobs/<key>` 对外服务
 *     minio        → 落对象存储
 *
 * ── 录制归档（llm_exchange 记录）──────────────────────────────────────────────
 *   **恒写本地文件系统**（唯一事实来源）。当 `RECORD_SINK=both` 且 MinIO 已配置
 *   （有 access/secret key）时，额外镜像一份到 MinIO 供 agent-trace / 离线评估集中读取。
 *   读取一律本地优先、缺了再回落 MinIO。
 */
import path from "node:path";

import { CompositeObjectStore } from "./composite-object-store";
import { FsObjectStore } from "./fs-object-store";
import { MinioObjectStore, type MinioObjectStoreOptions } from "./minio-object-store";
import type { ObjectStore } from "./object-store";

export { CompositeObjectStore } from "./composite-object-store";
export { FsObjectStore } from "./fs-object-store";
export { MinioObjectStore } from "./minio-object-store";
export type { ObjectStore } from "./object-store";

/* ---------------- 共享配置 ---------------- */

export const BLOB_ROOT = process.env.BLOB_STORAGE_DIR
  ? path.resolve(process.env.BLOB_STORAGE_DIR)
  : path.resolve(process.cwd(), "blob-storage");

const PUBLIC_BASE = (process.env.ASSET_PUBLIC_BASE_URL || `http://localhost:${process.env.DEV_PORT || 4111}`).replace(
  /\/$/,
  ""
);

/** MinIO 是否已配置（有凭据）。没配就当没有 minio，`both` 静默降级为纯 fs。 */
export function minioConfigured(): boolean {
  return Boolean(process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY);
}

function minioEnvConfig(): MinioObjectStoreOptions {
  return {
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: Number(process.env.MINIO_PORT) || 9002,
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "admin",
    secretKey: process.env.MINIO_SECRET_KEY || "password123",
    bucket: process.env.MINIO_BUCKET || "screenwright",
    publicEndpoint: process.env.MINIO_PUBLIC_ENDPOINT
  };
}

/* ---------------- 素材 store ---------------- */

let _assetStore: ObjectStore | undefined;

export function assetStore(): ObjectStore {
  if (!_assetStore) {
    _assetStore =
      process.env.STORAGE_DRIVER === "minio"
        ? new MinioObjectStore(minioEnvConfig())
        : new FsObjectStore({ root: BLOB_ROOT, publicBase: PUBLIC_BASE });
  }
  return _assetStore;
}

/* ---------------- 录制归档 store ---------------- */

/** 录制文件系统根目录（eval 会用 `LLM_RECORD_DIR` 重定向到自己的 runs 目录）。 */
export const RECORD_ROOT = process.env.LLM_RECORD_DIR
  ? path.resolve(process.env.LLM_RECORD_DIR)
  : path.resolve(process.cwd(), ".data", "records");

/** 录制是否额外镜像到 MinIO：`RECORD_SINK` 含 minio 意图且 MinIO 已配置。 */
export function recordMirrorsMinio(): boolean {
  const sink = process.env.RECORD_SINK;
  return (sink === "both" || sink === "minio") && minioConfigured();
}

let _recordStore: ObjectStore | undefined;

export function recordStore(): ObjectStore {
  if (!_recordStore) {
    const fs = new FsObjectStore({ root: RECORD_ROOT, publicBase: PUBLIC_BASE });
    _recordStore = recordMirrorsMinio() ? new CompositeObjectStore(fs, new MinioObjectStore(minioEnvConfig())) : fs;
  }
  return _recordStore;
}

/** 测试用：清掉记忆化的单例。 */
export function __resetStoresForTest(): void {
  _assetStore = undefined;
  _recordStore = undefined;
}
