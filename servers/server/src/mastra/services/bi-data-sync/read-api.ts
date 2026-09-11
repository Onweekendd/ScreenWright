import type { ComponentType } from "@screenwright/types";
import { existsSync, readFileSync } from "fs";
import path from "path";

import { resolveFilePath } from "../../tools/file/state";
import { readFileWithMeta } from "../../tools/file/utils";
import { findJsonFile, getScreenDirPath } from "./fs-utils";

/**
 * 供前端 client tool / 路由读取 workspace 内容的查询接口（只读，不涉及同步写入）。
 */

/**
 * 读取工作区文件内容（供前端 client tool 调用）
 * @param relativePath 工作区相对路径，如 "screen_29445_1/component/123.json"
 */
export const readWorkspaceFile = async (relativePath: string) => {
  const absPath = resolveFilePath(relativePath);

  if (!existsSync(absPath)) {
    throw new Error(`文件不存在: ${relativePath}`);
  }

  const { content, encoding, lineEnding } = await readFileWithMeta(absPath);
  const totalLines = content.split("\n").length;

  return { content, totalLines, encoding, lineEnding: (lineEnding === "\r\n" ? "CRLF" : "LF") as "CRLF" | "LF" };
};

/**
 * 从 workspace 中读取指定组件的数据
 *
 * 组件文件以 `{id}_{name}.json` 命名，按层级存储在 `screen_{screenWithVersion}/component/` 目录下：
 * - 叶子组件：`component/{id}_{name}.json`
 * - 分组子组件：`component/{groupId}_{groupName}/{id}_{name}.json`
 * - 动态面板子组件：`component/{panelId}_{panelName}/{stateId}_{stateName}/{id}_{name}.json`
 *
 * @param screenWithVersion 大屏标识，格式为 "{screenId}_{versionCode}"，如 "29483_1"
 * @param componentId 目标组件 id
 * @returns 组件数据，workspace 不存在或组件未找到时返回 null
 */
export const getComponentFormWorkspace = (screenWithVersion: string, componentId: number): ComponentType => {
  const screenDir = getScreenDirPath(screenWithVersion);
  if (!existsSync(screenDir)) {
    throw new Error(`Workspace 不存在: screen_${screenWithVersion}`);
  }

  const componentDir = path.join(screenDir, "component");
  if (!existsSync(componentDir)) {
    throw new Error(`组件目录不存在: ${componentDir}`);
  }

  const filePath = findJsonFile(componentDir, `${componentId}.json`);
  if (!filePath) {
    throw new Error(`组件 ${componentId} 未找到`);
  }

  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as ComponentType;
  } catch (e) {
    throw new Error(`组件 JSON 解析失败: ${e instanceof Error ? e.message : String(e)}`);
  }
};
