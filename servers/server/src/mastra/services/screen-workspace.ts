import path from "path";

import { getAgentWorkspacePath } from "@/agent-resources/workspace-path";

export const buildScreenVersionKey = (screenId: string | number, versionCode: string | number) =>
  `${screenId}_${versionCode}`;

export const getScreenIdFromVersionKey = (screenVersionKey: string) => screenVersionKey.split("_", 1)[0];

export const getWorkspaceBase = () => getAgentWorkspacePath();

export const getScreenDirPath = (screenVersionKey: string) =>
  path.join(getWorkspaceBase(), `screen_${screenVersionKey}`);

/**
 * 从工作区内的文件路径反推它属于哪个大屏，返回 screenVersionKey（screen_ 目录名去掉前缀的部分）。
 * 不在工作区内、或不落在任何 screen_ 目录下时返回 null。
 *
 * 这同时就是路径边界校验：key 由「相对工作区根的第一段目录名」得来，
 * 再用 getScreenDirPath 拼回去必然还是这个文件所在的大屏目录，不存在越界拼接的余地。
 * 判定必须走 path.relative 而不是 includes("/workspace/screen_") 这类子串匹配——
 * 工作区实际叫 agent-workspace，子串匹配在真实部署下恒为 false。
 */
export const getScreenVersionKeyFromPath = (filePath: string): string | null => {
  const relative = path.relative(path.resolve(getWorkspaceBase()), path.resolve(filePath));
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  // path.relative 在 Windows 上返回反斜杠分隔的路径，只切 "/" 会把整串当成一段目录名，
  // 拼回去就成了 <base>/screen_75_1\component\...，找不到 info.json
  const screenDirName = relative.split(/[\\/]/)[0];
  return screenDirName.startsWith("screen_") ? screenDirName.slice("screen_".length) || null : null;
};
