import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { getAgentWorkspacePath } from "@/agent-resources/workspace-path";

const ARCHIVE_DIR = ".tool-results";

interface ToolResultRecord {
  toolName: string;
  toolCallId: string;
  args: unknown;
  result: unknown;
}

/** 读取的本来就是存档时返回其路径，避免“大结果 → 存档 → 再读 → 再存档”的递归转存。 */
const existingArchivePath = ({ toolName, args }: ToolResultRecord): string | undefined => {
  const source = args && typeof args === "object" && "path" in args ? args.path : undefined;
  if (toolName !== "readFileTool" || typeof source !== "string") {
    return undefined;
  }
  const base = path.resolve(getAgentWorkspacePath());
  const relative = path.relative(base, path.resolve(base, source));
  if (relative.startsWith(`${ARCHIVE_DIR}${path.sep}`) && !relative.split(path.sep).includes("..")) {
    return relative.replace(/\\/g, "/");
  }
  return undefined;
};

const writeArchive = async (record: ToolResultRecord): Promise<string> => {
  // 文件名独立生成，不把模型提供的工具名、调用 ID 拼进路径。
  const relativePath = `${ARCHIVE_DIR}/${randomUUID()}.json`;
  const absolutePath = path.join(getAgentWorkspacePath(), relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  const { toolName, toolCallId, result } = record;
  await writeFile(absolutePath, JSON.stringify({ toolName, toolCallId, result }, null, 2), {
    encoding: "utf8",
    flag: "wx"
  });
  return relativePath;
};

/** 返回惰性存档函数：首次调用时保存完整结果，之后复用同一路径；返回 readFileTool 可读取的工作区相对路径。 */
export const createResultArchiver = (record: ToolResultRecord): (() => Promise<string>) => {
  let archived: Promise<string> | undefined;
  return () => {
    const existing = existingArchivePath(record);
    archived ??= existing === undefined ? writeArchive(record) : Promise.resolve(existing);
    return archived;
  };
};
