import type { ResolvedConfig } from "vite";

import type {
  InjectAssets,
  InternalContext,
  PluginOptions,
  ResolvedOptions,
  RuntimeHooks,
  RuntimeScriptOptions,
  VersionInfo
} from "./types";

/**
 * 解析用户配置与 Vite 配置，返回完整的插件配置（仅接口占位）
 */
export function resolveOptions(_options?: PluginOptions, _config?: ResolvedConfig): ResolvedOptions {
  // no-op
  return {
    pollingIntervalMs: 60000,
    silence: false,
    noticeMode: "default",
    locale: "zh-CN",
    enableVisibilityCheck: true,
    enableLoadErrorCheck: false,
    jsonFilename: "web_version_by_plugin",
    assetDir: "pluginWebUpdateNotice",
    debug: false,
    injectFileBase: "",
    customVersion: undefined
  };
}

/**
 * 创建插件内部上下文（仅接口占位）
 */
export function createInternalContext(): InternalContext {
  // no-op
  return {};
}

/**
 * 根据版本号与静默配置创建版本信息对象（仅接口占位）
 */
export function createVersionInfo(_version: string, _silence: boolean): VersionInfo {
  // no-op
  return { version: "", silence: false };
}

/**
 * 构造运行时脚本所需的参数（仅接口占位）
 */
export function createRuntimeOptions(_params: {
  base: string;
  assetDir: string;
  jsonFilename: string;
  pollingIntervalMs: number;
  noticeMode: "default" | "custom";
  silence: boolean;
  locale: string;
  hooks?: RuntimeHooks;
}): RuntimeScriptOptions {
  // no-op
  return {
    base: "",
    assetDir: "",
    jsonFilename: "",
    pollingIntervalMs: 60000,
    noticeMode: "default",
    silence: false,
    locale: "zh-CN"
  };
}

/**
 * 计算产物的公共访问路径（仅接口占位）
 */
export function getInjectAssetPublicPaths(
  _base: string,
  _assets: InjectAssets
): {
  jsonUrl: string;
  jsUrl?: string;
  cssUrl?: string;
} {
  // no-op
  return { jsonUrl: "" };
}

/**
 * 启动通知流程（仅接口占位）
 */
const startNotice = () => {};
