import path from "node:path";

import { getAgentWorkspacePath } from "@/agent-resources/workspace-path";

export const WORKSPACE_BASE = getAgentWorkspacePath();

/**
 * 将文件路径统一解析为绝对路径（相对路径基于工作区根）。
 *
 * 基准**每次调用时现读**，不用上面那个模块加载时的快照：解析出来的路径随后要交给
 * getScreenVersionKeyFromPath 反推大屏，而它读的是现值。两边取值时机不一致，就会出现
 * 「按 A 处解析、按 B 处算 key」——路径明明有效，key 却算成 null。
 */
export function resolveFilePath(filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.resolve(getAgentWorkspacePath(), filePath);
}

/**
 * 记录每个文件的最后一次读取状态。
 * EditFilesTool 在落盘后刷新它，供后续读取与编辑获得最新内容。
 */
export interface ReadFileRecord {
  content: string; // 读取时的文件内容（统一 LF）
  mtimeMs: number; // 读取时的文件修改时间（毫秒）
  encoding: "utf8" | "utf16le";
  lineEnding: "\r\n" | "\n";
}

export const readFileState = new Map<string, ReadFileRecord>();
