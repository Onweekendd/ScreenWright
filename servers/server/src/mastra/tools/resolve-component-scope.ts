import { readdirSync } from "node:fs";
import path from "node:path";

import { ComponentScopeEnum } from "@screenwright/types";

import { getAgentWorkspacePath } from "@/agent-resources/workspace-path";

import { extractIdFromIdName } from "./file/utils";

const WORKSPACE_BASE = getAgentWorkspacePath();

/** 递归搜索目录，按 id 前缀匹配返回组件文件完整路径，找不到返回 null。
 *  文件名格式为 `{id}_{name}.json`（旧数据可能是 `{id}_{name}_{title}` 或纯 `{id}`），
 *  故用 extractIdFromIdName 提取数字 id 匹配，而非精确等于 `{id}.json`。 */
function findComponentFile(dir: string, componentId: string | number): string | null {
  const targetId = typeof componentId === "number" ? componentId : extractIdFromIdName(String(componentId));
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const found = findComponentFile(path.join(dir, entry.name), componentId);
      if (found) {
        return found;
      }
    } else if (entry.name.endsWith(".json") && extractIdFromIdName(entry.name) === targetId) {
      return path.join(dir, entry.name);
    }
  }
  return null;
}

/**
 * 按"源/目标是否共享同一直接父目录"判定 componentScope。
 * - 所有 target 与 source 同一直接父目录（同一 panel/canvas 层级） → Current
 * - 任一 target 不在同一层级，或 source / target 文件找不到       → All（兜底全局可寻址）
 */
export function resolveComponentScope(
  sourceComponentId: string | number,
  targetComponentIds: ReadonlyArray<string | number>,
  workspaceBase: string = path.resolve(WORKSPACE_BASE),
  /**
   * 限定在哪块屏里找（`"9002_1"` 这种，不带 `screen_` 前缀）。
   *
   * 不给的话就是全工作区按 id 搜，而这里的 `findComponentFile` 是「递归找到第一个就返回」——
   * 多块屏共存且组件 id 相同时（导入模板、跨环境同步、eval 里多个 case 用同一份 fixture），
   * 源和目标都会命中同一块**错误的**屏。那时两者的父目录仍然一致，函数照样返回 Current，
   * 但依据的是别的屏的层级结构：真实的源/目标可能一个在分组里一个在根级，正确答案是 All。
   * **错得毫无征兆**，所以调用方拿得到屏就一定要传进来。
   */
  screenKey?: string | null
): ComponentScopeEnum {
  if (targetComponentIds.length === 0) {
    return ComponentScopeEnum.Current;
  }

  const searchRoot = screenKey ? path.join(workspaceBase, `screen_${screenKey}`) : workspaceBase;

  const sourceFile = findComponentFile(searchRoot, sourceComponentId);
  if (!sourceFile) {
    return ComponentScopeEnum.All;
  }
  const sourceParent = path.dirname(sourceFile);

  for (const targetId of targetComponentIds) {
    const targetFile = findComponentFile(searchRoot, targetId);
    if (!targetFile) {
      return ComponentScopeEnum.All;
    }
    if (path.dirname(targetFile) !== sourceParent) {
      return ComponentScopeEnum.All;
    }
  }
  return ComponentScopeEnum.Current;
}
