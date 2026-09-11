import { z } from "zod";

/**
 * 颜色块 (ftflop)
 * 指标
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `backgroundColor` - 背景色
 * - `prefixText` - 前缀文本
 * - `value` - 值（字符串）
 * - `suffixText` - 后缀文本
 *
 * @example
 * ```typescript
 * const data: FtflopData = [
 *   { backgroundColor: "#67C23A", prefixText: "总人数", value: "12345", suffixText: "人" }
 * ];
 * ```
 */

// 单个数据项的 Schema
const ftflopDataItemSchema = z.object({
  backgroundColor: z.string().describe("背景色").optional().default(""),
  prefixText: z.string().describe("前缀文本").optional().default(""),
  value: z.coerce.string().describe("显示值"),
  suffixText: z.string().describe("后缀文本").optional().default("")
});

// 数据数组 Schema（最终导出的类型）
export const ftflopDataSchema = z.array(ftflopDataItemSchema);

export type FtflopData = z.infer<typeof ftflopDataSchema>;

/**
 * 颜色块配置选项 Schema
 */
export const ftflopOptionSchema = z.object({
  // ============ 布局配置 ============
  padding: z.coerce.number().describe("内边距").optional().default(0),
  suffixInline: z
    .union([z.string(), z.boolean().transform((v) => (v ? "inline-block" : "block"))])
    .describe("后缀显示方式，如 block/inline-block；兼容历史 boolean（true→inline-block，false→block）"),
  whole: z.boolean().describe("是否整体展示"),
  decimals: z.number().describe("小数位数"),
  span: z.number().describe("数字间距"),
  splitx: z.number().describe("水平间距"),
  splity: z.number().describe("垂直间距"),

  // ============ 边框配置 ============
  type: z.string().describe("背景类型，如 img/color"),
  borderColor: z.string().describe("边框颜色"),
  borderTopWidth: z.number().describe("上边框宽度"),
  borderBottomWidth: z.number().describe("下边框宽度"),
  borderLeftWidth: z.number().describe("左边框宽度"),
  borderRightWidth: z.number().describe("右边框宽度"),
  backgroundBorder: z.string().describe("背景边框"),

  // ============ 背景配置 ============
  backgroundColor: z.string().describe("背景色"),
  backgroundImage: z.string().describe("背景图片地址"),

  // ============ 数值字体配置 ============
  fontFamily: z.string().describe("数值字体名称"),
  fontSize: z.number().describe("数值字体大小"),
  color: z.string().describe("数值字体颜色"),
  fontWeight: z.string().describe("数值字体粗细"),
  fontStyle: z.string().describe("数值字体样式"),
  textAlign: z.string().describe("数值文本对齐方式"),

  // ============ 前缀配置 ============
  prefixText: z.string().describe("前缀文本内容"),
  prefixTextAlign: z.string().describe("前缀文本对齐方式"),
  prefixSplitx: z.number().describe("前缀水平间距"),
  prefixSplity: z.number().describe("前缀垂直间距"),
  prefixFontFamily: z.string().describe("前缀字体名称"),
  prefixFontSize: z.number().describe("前缀字体大小"),
  prefixColor: z.string().describe("前缀字体颜色"),
  prefixFontWeight: z.string().describe("前缀字体粗细"),
  prefixFontStyle: z.string().describe("前缀字体样式"),

  // ============ 后缀配置 ============
  suffixText: z.string().describe("后缀文本内容"),
  suffixTextAlign: z.string().describe("后缀文本对齐方式"),
  suffixSplitx: z.number().describe("后缀水平间距"),
  suffixSplity: z.number().describe("后缀垂直间距"),
  suffixFontFamily: z.string().describe("后缀字体名称"),
  suffixFontSize: z.number().describe("后缀字体大小"),
  suffixColor: z.string().describe("后缀字体颜色"),
  suffixFontWeight: z.string().describe("后缀字体粗细"),
  suffixFontStyle: z.string().describe("后缀字体样式")
});

export type FtflopOption = z.infer<typeof ftflopOptionSchema>;
