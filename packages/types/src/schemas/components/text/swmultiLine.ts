import { z } from "zod";

/**
 * 多行文本 (ftmultiLine)
 * 文字
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `name` - 文字段落内容
 * - `src` - 前缀图标URL
 *
 * @example
 * ```typescript
 * const data: FtMultiLineData = [
 *   { name: "文字段落1", src: "" },
 *   { name: "文字段落2", src: "https://example.com/icon.png" }
 * ];
 * ```
 */

// 单个数据项的 Schema
const swMultiLineDataItemSchema = z.object({
  name: z.string().describe("文字段落内容"),
  src: z.string().describe("前缀图标URL")
});

// 数据数组 Schema
export const swMultiLineDataSchema = z.array(swMultiLineDataItemSchema);

export type FtMultiLineData = z.infer<typeof swMultiLineDataSchema>;

// ==================== Option Schema ====================

/**
 * 多行文本配置选项 Schema
 */
export const swMultiLineOptionSchema = z.object({
  // ============ 基础配置 ============
  type: z.string().describe("类型标识"),
  scroll: z.boolean().describe("是否滚动"),
  speed: z.number().describe("滚动速度"),
  textDeraction: z.string().describe("文本滚动方向(ToLeft/ToRight/ToTop/ToBottom)"),

  // ============ 字体配置 ============
  fontFamily: z.string().describe("字体"),
  fontSize: z.number().describe("字号"),
  color: z.string().describe("字体颜色"),
  fontWeight: z.string().describe("字重"),
  fontStyle: z.string().describe("字体样式"),
  lineHeight: z.number().describe("行高(px)"),

  // ============ 选中文字配置 ============
  selectedTextType: z.string().describe("选中文字类型(normal/gradient)"),
  selectedTextColor: z.string().describe("选中文字颜色(支持渐变)"),
  selectedTextOpacity: z.number().describe("选中文字透明度(0-100)"),

  // ============ 布局配置 ============
  textAlign: z.string().describe("水平对齐(left/center/right)"),
  textAlignVertical: z.string().describe("垂直对齐(top/center/bottom)"),
  split: z.number().describe("字间距"),
  whiteSpace: z.boolean().describe("是否不换行"),
  textIndent: z.number().describe("首行缩进(px)"),

  // ============ 行边距配置 ============
  lineMarginTop: z.number().describe("行上边距"),
  lineMarginBottom: z.number().describe("行下边距"),
  lineMarginLeft: z.number().describe("行左边距"),
  lineMarginRight: z.number().describe("行右边距"),

  // ============ 背景配置 ============
  backgroundColor: z.string().describe("背景颜色"),

  // ============ 文字阴影配置 ============
  shadowShow: z.boolean().describe("文字阴影开关"),
  shadowColor: z.string().describe("阴影颜色"),
  shadowX: z.number().describe("阴影X偏移"),
  shadowY: z.number().describe("阴影Y偏移"),
  shadowFuzzy: z.number().describe("阴影模糊度"),
  shadowExtension: z.number().describe("阴影扩展"),

  // ============ 图标配置 ============
  icon: z.any().nullable().describe("图标资源"),
  iconWidth: z.number().describe("图标宽度(px)"),
  iconHeight: z.number().describe("图标高度(px)"),
  iconMargin: z.array(z.number()).describe("图标边距[上,右,下,左]")
});

export type FtMultiLineOption = z.infer<typeof swMultiLineOptionSchema>;
