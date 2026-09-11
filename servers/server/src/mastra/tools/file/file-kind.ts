import path from "node:path";

import { getScreenVersionKeyFromPath } from "@/mastra/services/screen-workspace";

/**
 * 「这是哪一类文件」的判定，全是路径上的纯函数（不碰磁盘、不看内容）。
 *
 * 从 edit-files.ts 抽出来单独成文件，是因为这几条谓词决定了一次编辑走哪条前端同步分支，
 * 而它们此前散在工具内部、口径还不一致，出过一次真实故障（见 isInScreenWorkspace 的注释）。
 */

/**
 * 是否落在某块大屏的 workspace 目录下。
 *
 * **必须走 getScreenVersionKeyFromPath**（path.relative + 取首段目录名），
 * 不能用 `includes("/workspace/screen_")` 这类子串匹配——工作区实际叫 `agent-workspace`
 * （见 .env 与 docs/docker-deploy-guide.md），`agent-workspace/screen_x` 里 workspace 前面是
 * "-" 不是 "/"，子串在真实部署下**恒为 false**。
 *
 * 这个坑 screen-workspace.ts 的注释里已经栽过一次，那次只修了它自己那一处；
 * edit-files 里的 info.json / agent 产物两条判定一直是死的，直到现在。
 */
const isInScreenWorkspace = (normalizedPath: string): boolean => getScreenVersionKeyFromPath(normalizedPath) !== null;

/**
 * `_` 开头的是元数据与 agent 产物（_layout.json / _analysis.json），不是用户组件。
 * 与 ScreenReader.readComponents、collectExistingIds 的忽略规则同口径——
 * 少了这条，component/ 下的 _layout.json 会被当成组件送去校验，必然失败，agent 根本改不动它。
 */
const isMetaFileName = (normalizedPath: string): boolean => path.basename(normalizedPath).startsWith("_");

/** 组件 json：大屏 component/ 目录下的 {id}_{name}.json */
export function isComponentFilePath(normalizedPath: string): boolean {
  return normalizedPath.endsWith(".json") && normalizedPath.includes("/component/") && !isMetaFileName(normalizedPath);
}

/** 数据过滤器：dataFilterArr/ 下成对的 {name}.json 与 {name}.js */
export function isDataFilterFilePath(normalizedPath: string): boolean {
  return (
    normalizedPath.includes("/dataFilterArr/") && (normalizedPath.endsWith(".json") || normalizedPath.endsWith(".js"))
  );
}

/** 大屏配置：某块大屏根目录下的 info.json */
export function isScreenInfoFilePath(normalizedPath: string): boolean {
  return normalizedPath.endsWith("/info.json") && isInScreenWorkspace(normalizedPath);
}

/** vue-part 组件的伴生 SFC：component/ 下的 .vue */
export function isVuePartFilePath(normalizedPath: string): boolean {
  return normalizedPath.endsWith(".vue") && normalizedPath.includes("/component/");
}

/**
 * AI 内部产物文件（模板范式 / 探索分析 / 几何骨架），位于大屏 workspace 下。
 * 这类文件不需要前端同步、也不需要 resume data，编辑应直接落盘，
 * 不应在 ASK 模式下阻塞询问用户（它们是 agent 自己的中间产物，非用户大屏内容）。
 */
export function isAgentArtifactFilePath(normalizedPath: string): boolean {
  if (!isInScreenWorkspace(normalizedPath)) {
    return false;
  }
  return (
    /\/template-[^/]+\.json$/.test(normalizedPath) ||
    normalizedPath.endsWith("/_analysis.json") ||
    normalizedPath.endsWith("/_layout.json")
  );
}
