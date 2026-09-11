/**
 * bi-data-sync 公共 API 汇总（barrel）。
 * 原单文件 services/bi-data-sync.ts 已按职责拆分为本目录下多个模块，
 * 此处 re-export 对外接口，使既有 `../services/bi-data-sync` 引用零改动。
 */

export { readScreenMeta } from "./fs-utils";
export { getComponentFormWorkspace, readWorkspaceFile } from "./read-api";
export { syncScreenData, syncScreenDescribe } from "./screen-sync";
export type { ScreenMeta } from "./types";
export { stripVuePartTypeAnchors } from "./vue-part-sfc";
