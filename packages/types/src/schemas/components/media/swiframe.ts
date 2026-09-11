import { z } from "zod";

/**
 * iframe (ftiframe)
 * 媒体
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `value` - iframe嵌入地址
 *
 * @example
 * ```typescript
 * const data: FtiframeData = [
 *   { value: "https://www.example.com" }
 * ];
 * ```
 */

// Single data item Schema
const ftiframeDataItemSchema = z.object({
  value: z.string().describe("iframe嵌入地址")
});

// Data array Schema
export const ftiframeDataSchema = z.array(ftiframeDataItemSchema);

export type FtiframeData = z.infer<typeof ftiframeDataSchema>;

// ==================== Option Schema ====================

/**
 * iframe配置选项 Schema
 */
export const ftiframeOptionSchema = z.object({
  // ============ URL配置 ============
  extendIframeUrl: z.string().describe("扩展iframe地址"),

  // ============ 布局配置 ============
  gridTop: z.number().describe("上边距"),
  gridBottom: z.number().describe("下边距"),
  gridLeft: z.number().describe("左边距"),
  gridRight: z.number().describe("右边距"),

  // ============ 关闭按钮配置 ============
  closeColor: z.string().describe("关闭按钮颜色"),
  closeSize: z.number().describe("关闭按钮大小"),
  showClose: z.boolean().describe("是否显示关闭按钮"),
  closeTop: z.number().describe("关闭按钮上边距"),
  closeBottom: z.number().describe("关闭按钮下边距"),
  closeLeft: z.number().describe("关闭按钮左边距"),
  closeRight: z.number().describe("关闭按钮右边距"),

  // ============ 权限配置 ============
  allowScripts: z.boolean().describe("是否允许脚本"),
  allowForms: z.boolean().describe("是否允许表单"),
  allowSameOrigin: z.boolean().describe("是否允许同源"),
  allowTopNavigation: z.boolean().describe("是否允许顶层导航"),
  allowMicrophone: z.boolean().describe("是否允许麦克风"),
  allowCamera: z.boolean().describe("是否允许摄像头"),
  allowFullscreen: z.boolean().describe("是否允许全屏"),

  // ============ 边框配置 ============
  frameborder: z.boolean().describe("是否显示边框"),
  scrolling: z.boolean().describe("是否允许滚动"),

  // ============ 字体配置 ============
  fontFamily: z.string().describe("字体"),
  fontStyle: z.string().describe("字体样式"),
  fontWeight: z.string().describe("字重"),

  // ============ 引用配置 ============
  isQuote: z.boolean().describe("是否引用"),
  quoteId: z.string().describe("引用ID"),
  quoteVersion: z.string().describe("引用版本"),
  isQuoteReload: z.boolean().describe("引用是否重新加载")
});

export type FtiframeOption = z.infer<typeof ftiframeOptionSchema>;
