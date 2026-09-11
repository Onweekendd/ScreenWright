import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "fs";
import path from "path";

import { readFileState } from "../../tools/file/state";
import { extractIdFromIdName } from "../../tools/file/utils";
import { getScreenDirPath } from "../screen-workspace";
import type { ScreenMeta } from "./types";

/**
 * bi-data-sync 的文件系统工具（写盘幂等、孤儿清理、组件文件定位等）。
 * 与 agent 的 readFileState 协作，避免结构等价的回写打断连续编辑。
 */

/**
 * 大屏目录路径：screen_{id}
 * id 格式为 "{screenId}_{versionCode}"，由调用方组合传入（如 "29445_1"）
 * 版本变更时 id 不同，自然隔离；同版本内通过 _meta.json.updatedTime 对账
 *
 * WORKSPACE_PATH 在调用时读取（非模块级常量），支持测试时动态覆盖
 */
export { getScreenDirPath };

/**
 * key 顺序无关的深度序列化，用于判断两份 JSON 是否结构等价。
 *
 * `JSON.stringify(JSON.parse(x))` 骗不过去：JSON.parse 保留原文本的 key 插入顺序，
 * stringify 照样按那个顺序输出——只是甩掉了缩进，key 顺序不同的两份内容仍然不相等。
 * 组件经 ScreenReader 的 zod schema 读回再序列化，key 顺序必然跟磁盘原文件不同
 * （schema 按自己声明的字段顺序输出），所以这里显式按 key 排序后再比。
 */
const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
};

/**
 * sync 回写后，如果该文件被 agent 读过且新旧内容结构等价（只是序列化格式不同），
 * 把 readFileState 快照刷新到最新 mtime/content，供 edit_files 使用最新内容。
 * 结构不等说明用户在 UI 真的改了数据，保留旧快照，下次 edit 自然触发重读。
 */
const refreshReadFileStateIfEcho = (filePath: string, content: string) => {
  const record = readFileState.get(filePath);
  if (!record || !filePath.endsWith(".json")) {
    return;
  }
  try {
    if (stableStringify(JSON.parse(record.content)) !== stableStringify(JSON.parse(content))) {
      return;
    }
  } catch {
    return;
  }
  readFileState.set(filePath, { ...record, content, mtimeMs: statSync(filePath).mtimeMs });
};

export const writeIfChanged = (filePath: string, content: string) => {
  const existing = existsSync(filePath) ? readFileSync(filePath, "utf-8") : null;
  if (existing === content) {
    return;
  }
  // 结构等价（只是 JSON 序列化时的 key 顺序/格式不同）就跳过写入：既避免 mtime 无意义变更打断
  // agent 连续编辑，也避免整屏回写（syncScreenData）把没真正改过的文件全部重新格式化一遍。
  if (existing !== null && filePath.endsWith(".json")) {
    try {
      if (stableStringify(JSON.parse(existing)) === stableStringify(JSON.parse(content))) {
        return;
      }
    } catch {
      /* fall through */
    }
  }
  writeFileSync(filePath, content, "utf-8");
  refreshReadFileStateIfEcho(filePath, content);
};

export const writeJson = (filePath: string, data: unknown) => writeIfChanged(filePath, JSON.stringify(data, null, 2));

export const ensureDir = (dirPath: string) => mkdirSync(dirPath, { recursive: true });

/** 删除 dir 下扩展名命中、且 basename（去扩展名）不在 keep 集合中的文件 */
export const pruneStaleFiles = (dir: string, keep: Set<string>, extensions: string[]) => {
  for (const entry of readdirSync(dir)) {
    const ext = extensions.find((e) => entry.endsWith(e));
    if (ext && !keep.has(entry.slice(0, -ext.length))) {
      rmSync(path.join(dir, entry));
    }
  }
};

/** 删除组件落盘产物：{base}.json 及其伴生 {base}.vue 与 {base}/ 子目录（各自存在才删） */
export const removeComponentArtifacts = (jsonPath: string) => {
  if (existsSync(jsonPath)) {
    rmSync(jsonPath);
  }
  const vueFile = jsonPath.replace(/\.json$/, ".vue");
  if (existsSync(vueFile)) {
    rmSync(vueFile);
  }
  const subDir = jsonPath.replace(/\.json$/, "");
  if (existsSync(subDir)) {
    rmSync(subDir, { recursive: true });
  }
};

/**
 * 递归收集磁盘上现有的组件 id → 文件绝对路径映射
 * 忽略以 _ 开头的文件
 */
export const collectExistingIds = (dir: string): Map<number, string> => {
  const result = new Map<number, string>();
  if (!existsSync(dir)) {
    return result;
  }
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      for (const [id, p] of collectExistingIds(fullPath)) {
        result.set(id, p);
      }
    } else if (entry.endsWith(".json") && !entry.startsWith("_")) {
      const id = extractIdFromIdName(entry);
      if (id !== null) {
        result.set(id, fullPath);
      }
    }
  }
  return result;
};

/**
 * 在目录树中递归查找指定文件名的 JSON 文件
 * @param dir 起始搜索目录
 * @param fileName 目标文件名（含扩展名，如 "123.json"）
 * @returns 找到的文件绝对路径，未找到返回 null
 */
export const findJsonFile = (dir: string, fileName: string): string | null => {
  if (!existsSync(dir)) {
    return null;
  }
  const targetId = extractIdFromIdName(fileName);
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      const found = findJsonFile(fullPath, fileName);
      if (found) {
        return found;
      }
    } else if (entry.endsWith(".json") && targetId !== null && extractIdFromIdName(entry) === targetId) {
      return fullPath;
    }
  }
  return null;
};

/**
 * 读取大屏同步元数据
 * 用于 check-before-sync：比较 updatedTime 决定是否需要全量推送
 */
export const readScreenMeta = (screenId: string): ScreenMeta | null => {
  const metaPath = path.join(getScreenDirPath(screenId), "_meta.json");
  if (!existsSync(metaPath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(metaPath, "utf-8")) as ScreenMeta;
  } catch {
    return null;
  }
};

/**
 * 读取文本文件，文件不存在返回 null
 * 与 writeIfChanged / writeJson 对称：一律接收绝对路径，目录拼接交给调用方
 * @param filePath 绝对路径
 */
export const readTextFile = (filePath: string): string | null =>
  existsSync(filePath) ? readFileSync(filePath, "utf-8") : null;
