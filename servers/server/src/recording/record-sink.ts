/**
 * 录制写出目标：把一条记录落到 `recordStore()`，供 exchange-archive 与 recording-scope 共用。
 *
 * `recordStore()`（见 `@/lib/storage`）**恒写本地文件系统**；当 `RECORD_SINK=both` 且
 * MinIO 已配置时，额外镜像一份到 MinIO。列举只读本地。调用方无需关心落地细节。
 *
 * key 统一用 "/" 作逻辑分隔（如 "<threadId>/turn_00/step_00.json"）；对外暴露的
 * `recordKey()` 会补上业务前缀 `RECORD_PREFIX`（默认 `llm-records`，eval 覆盖为 `eval-records`）。
 */
import { recordStore } from "@/lib/storage";

export const RECORD_PREFIX = process.env.LLM_RECORD_MINIO_PREFIX ?? "llm-records";

/** 用 "/" 拼接 record key，过滤空段 */
export function joinKey(...parts: Array<string | undefined>): string {
  return parts.filter((p): p is string => Boolean(p)).join("/");
}

/** 相对 key → 带业务前缀的完整存储 key（fs 与 minio 共用同一份 key） */
export function recordKey(key: string): string {
  return joinKey(RECORD_PREFIX, key);
}

/** 写一条记录（key 为相对 key，如 "<thread>/turn_00/step_00.json"）。 */
export async function writeRecord(key: string, obj: unknown): Promise<void> {
  const json = `${JSON.stringify(obj, null, 2)}\n`;
  await recordStore().put(recordKey(key), Buffer.from(json, "utf-8"), { contentType: "application/json" });
}

/**
 * 列出某相对前缀下的直接子项（非递归），返回末段名。
 * 用于跨重启从已落地内容推导 turn / step 序号续接。
 */
export async function listChildren(prefix: string): Promise<{ dirs: string[]; files: string[] }> {
  return recordStore().list(recordKey(prefix));
}
