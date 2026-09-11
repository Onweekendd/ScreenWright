import type { HtmlTagDescriptor, Plugin, ResolvedConfig } from "vite";

/**
 * 提示模式
 * - default: 使用内置的默认提示 UI
 * - custom: 使用外部自定义回调进行提示
 */
export type NoticeMode = "default" | "custom";

/**
 * 插件用户可配置项
 */
export interface PluginOptions {
  /** 版本来源类型固定为 git，无需配置 */
  customVersion?: string;
  /** 注入资源的基础路径，默认取 vite 的 base */
  injectFileBase?: string;
  /** 轮询检查间隔（毫秒），默认 60000 */
  pollingIntervalMs?: number;
  /** 静默模式，发现新版本时不弹窗（可结合自定义 UI 提示） */
  silence?: boolean;
  /** 提示模式，默认 default */
  noticeMode?: NoticeMode;
  /** 语言，默认 zh-CN */
  locale?: "zh-CN" | "en-US";
  /** 是否启用页面可见性切换时的更新检查 */
  enableVisibilityCheck?: boolean;
  /** 是否启用资源加载错误时的更新检查 */
  enableLoadErrorCheck?: boolean;
  /** 版本 JSON 文件名（无扩展名），默认 web_version_by_plugin */
  jsonFilename?: string;
  /** 生成资源的目录，默认 pluginWebUpdateNotice */
  assetDir?: string;
  /** 调试开关，输出调试日志 */
  debug?: boolean;
}

/**
 * 解析后的完整配置（含默认值）
 */
export interface ResolvedOptions extends Required<Omit<PluginOptions, "customVersion" | "injectFileBase">> {
  /** 注入资源的基础路径 */
  injectFileBase: string;
  /** 自定义版本号 */
  customVersion?: string;
}

/**
 * 版本信息（将被写入 JSON 并被前端轮询读取）
 */
export interface VersionInfo {
  /** 版本号 */
  version: string;
  /** 是否静默 */
  silence: boolean;
}

/**
 * 构建阶段生成/注入的资源信息
 */
export interface InjectAssets {
  /** 版本 JSON 文件的最终文件名（含扩展名） */
  jsonFileName: string;
  /** 注入的运行时脚本文件名（可选） */
  jsFileName?: string;
  /** 注入的样式文件名（可选） */
  cssFileName?: string;
  /** 运行时脚本内容哈希（可选） */
  jsFileHash?: string;
  /** 样式内容哈希（可选） */
  cssFileHash?: string;
}

/**
 * 运行时回调钩子
 */
export interface RuntimeHooks {
  /** 远端版本与本地版本不一致时触发 */
  onVersionDifferent?: (remote: string, local: string) => void;
  /** 检测或网络异常时触发 */
  onError?: (error: unknown) => void;
}

/**
 * i18n 文案结构
 */
export interface LocaleMessages {
  /** 标题 */
  title: string;
  /** 描述内容 */
  description: string;
  /** 立即刷新按钮文案 */
  refreshNow: string;
  /** 稍后再说按钮文案 */
  later: string;
}

/**
 * 运行时多语言映射表
 */
export interface RuntimeI18nMap {
  [locale: string]: LocaleMessages;
}

/**
 * 计算版本号的方法签名（仅支持 git 或自定义覆盖）
 */
export type GetVersionFn = (customVersion?: string) => string;

/**
 * 生成构建产物（资源）所需的参数
 */
export interface GenerateBundleAssetsParams {
  /** 版本信息 */
  version: VersionInfo;
  /** 资源生成目录 */
  assetDir: string;
  /** JSON 文件名（无扩展名） */
  jsonFilename: string;
}

/**
 * 生成构建产物（资源）的函数签名
 */
export type GenerateBundleAssetsFn = (params: GenerateBundleAssetsParams) => InjectAssets;

/**
 * 注入 HTML 阶段的参数
 */
export interface TransformHtmlParams {
  /** 原始 HTML 文本 */
  html: string;
  /** 本地版本号（用于注入到 data-v 等） */
  version: string;
  /** 基础路径（base） */
  base: string;
  /** 注入资源信息 */
  assets: InjectAssets;
}

/**
 * 转换/注入 HTML 的方法签名
 */
export type TransformIndexHtmlFn = (
  params: TransformHtmlParams
) => string | { html: string; tags?: HtmlTagDescriptor[] };

/**
 * 运行时脚本的可配置参数
 */
export interface RuntimeScriptOptions {
  /** 基础路径（与构建时一致） */
  base: string;
  /** 资源目录 */
  assetDir: string;
  /** JSON 文件名 */
  jsonFilename: string;
  /** 轮询间隔 */
  pollingIntervalMs: number;
  /** 提示模式 */
  noticeMode: NoticeMode;
  /** 静默模式 */
  silence: boolean;
  /** 语言 */
  locale: string;
  /** 运行时钩子 */
  hooks?: RuntimeHooks;
}

/**
 * 插件工厂方法签名
 */
export type CreateWebUpdateNoticePluginFn = (options?: PluginOptions) => Plugin;

/**
 * 插件内部上下文
 */
export interface InternalContext {
  /** Vite 解析完成的配置 */
  viteConfig?: ResolvedConfig;
  /** 解析后的插件配置 */
  resolved?: ResolvedOptions;
}
