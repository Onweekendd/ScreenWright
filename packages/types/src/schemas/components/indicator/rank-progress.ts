import { z } from "zod";

/**
 * 排名进度 (rank-progress)
 * 指标
 *
 * ## 数据结构
 *
 * 数据为包含标签(name)和数值(value)的对象数组，按数值大小排列展示排名。
 *
 * @example
 * ```typescript
 * const data: RankProgressData = [
 *   { name: "广州", value: 9999 },
 *   { name: "深圳", value: 9000 },
 *   { name: "佛山", value: 8000 }
 * ];
 * ```
 */

// 文字阴影配置 Schema
const rankProgressTextShadowSchema = z.object({
  x: z.number().describe("阴影水平偏移(px)"),
  y: z.number().describe("阴影垂直偏移(px)"),
  blur: z.number().describe("阴影模糊度(px)"),
  color: z.string().describe("阴影颜色，如 rgba(255,255,255,1)"),
  extend: z.number().describe("阴影扩展(px)")
});

// 文字样式配置 Schema（name 和 value 共用）
const rankProgressTextStyleSchema = z.object({
  textTranslateX: z.number().describe("文字水平偏移(px)"),
  textTranslateY: z.number().describe("文字垂直偏移(px)"),
  fontSize: z.number().describe("字号(px)"),
  fontWeight: z.string().describe("字重(normal/bold/bolder/lighter)"),
  fontStyle: z.string().describe("字体样式(normal/italic/oblique)"),
  fontFamily: z.string().describe("字体"),
  fontColor: z.string().describe("字体颜色，如 rgba(255,255,255,1)"),
  letterSpacing: z.number().describe("字间距(px)"),
  isTextShadow: z.boolean().describe("是否启用文字阴影"),
  showBg: z.boolean().describe("是否显示背景").optional(),
  textShadow: rankProgressTextShadowSchema.describe("文字阴影配置")
});

// 单个数据项 Schema
const rankProgressDataItemSchema = z.object({
  name: z.string().describe("标签名称"),
  value: z.number().describe("数值")
});

// 数据数组 Schema
export const rankProgressDataSchema = z.array(rankProgressDataItemSchema);

export type RankProgressData = z.infer<typeof rankProgressDataSchema>;

// 条形配置 Schema
const rankProgressBarConfigSchema = z.object({
  isScroll: z.boolean().describe("是否启用滚动"),
  scrollType: z.string().describe("滚动类型，如 bar"),
  showNum: z.number().describe("显示条数"),
  showCircle: z.boolean().describe("是否显示圆形标记"),
  width: z.number().describe("进度条宽度(px)"),
  height: z.number().describe("进度条高度(px)"),
  margin: z.array(z.number()).describe("外边距 [上, 右, 下, 左]")
});

// 系列标签配置 Schema
const rankProgressSeriesTabSchema = z.object({
  tabName: z.string().describe("标签页名称，如 排名1"),
  name: z.string().describe("对应数据名称"),
  color: z.string().describe("对应颜色，如 rgba(238,214,124,1.00)")
});

/**
 * 排名进度配置选项 Schema
 */
export const rankProgressOptionSchema = z.object({
  // ============ 名称样式配置 ============
  name: rankProgressTextStyleSchema.describe("名称(标签)文字样式配置"),

  // ============ 数值样式配置 ============
  value: z.object({
    textTranslateX: z.number().describe("文字水平偏移(px)"),
    textTranslateY: z.number().describe("文字垂直偏移(px)"),
    fontSize: z.number().describe("字号(px)"),
    fontWeight: z.string().describe("字重(normal/bold/bolder/lighter)"),
    fontStyle: z.string().describe("字体样式(normal/italic/oblique)"),
    fontFamily: z.string().describe("字体"),
    fontColor: z.string().describe("字体颜色，如 rgba(255,255,255,1)"),
    letterSpacing: z.number().describe("字间距(px)"),
    isTextShadow: z.boolean().describe("是否启用文字阴影"),
    textShadow: rankProgressTextShadowSchema.describe("文字阴影配置")
  }).describe("数值文字样式配置"),

  // ============ 条形配置 ============
  bar: rankProgressBarConfigSchema.describe("进度条样式配置"),

  // ============ 系列标签配置 ============
  seriesTabs: z.array(rankProgressSeriesTabSchema).describe("系列标签列表，每条数据对应一个排名的颜色和名称")
});

export type RankProgressOption = z.infer<typeof rankProgressOptionSchema>;
