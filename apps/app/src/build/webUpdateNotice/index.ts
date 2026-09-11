import type { Plugin } from "vite";

import type {
  CreateWebUpdateNoticePluginFn,
  GenerateBundleAssetsFn,
  GetVersionFn,
  PluginOptions,
  TransformIndexHtmlFn
} from "./types";

/**
 * 计算并返回构建版本号（仅接口占位，不含实现）
 */
export const getVersion: GetVersionFn = (_customVersion) => {
  // no-op: interface only
  return "";
};

/**
 * 在打包阶段生成需要注入的资源信息（仅接口占位，不含实现）
 */
export const generateBundleAssets: GenerateBundleAssetsFn = (_params) => {
  // no-op: interface only
  return { jsonFileName: "" };
};

/**
 * 根据注入资源对 index.html 进行转换/注入（仅接口占位，不含实现）
 */
export const transformIndexHtmlWithAssets: TransformIndexHtmlFn = (_params) => {
  // no-op: interface only
  return "";
};

/**
 * Vite 插件工厂方法，提供 web 更新提示能力（仅接口占位，不含实现）
 */
export const webUpdateNotice: CreateWebUpdateNoticePluginFn = (_options?: PluginOptions): Plugin => {
  return {
    name: "vue-vite-web-update-notice",
    apply: "build",
    enforce: "post",
    /**
     * Vite 配置解析完成后回调（仅接口占位，不含实现）
     */
    configResolved(_resolved) {
      // no-op
    },
    /**
     * 生成产物阶段回调（仅接口占位，不含实现）
     */
    generateBundle(_options, _bundle) {
      // no-op
    },
    /**
     * 注入/转换 HTML（仅接口占位，不含实现）
     */
    transformIndexHtml(_html) {
      // no-op
      return _html;
    }
  };
};

export default webUpdateNotice;
