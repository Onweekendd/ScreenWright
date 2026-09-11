import { z } from "zod";

/**
 * 分类占比条 (sortRatioBar)
 * 指标
 *
 * ## 数据结构
 *
 * 数据为包含系列名称(name)和数值(value)的对象数组。
 *
 * @example
 * ```typescript
 * const data: SortRatioBarData = [
 *   { name: "剩余数", value: 20 },
 *   { name: "使用数", value: 43 },
 *   { name: "故障数", value: 20 }
 * ];
 * ```
 */

// 渐变颜色配置 Schema
const sortRatioBarGradientColorSchema = z.object({
  color: z.string().describe("颜色值，如 rgba(0,245,171,1)"),
  per: z.number().describe("渐变位置百分比，0~100")
});

const sortRatioBarGradientConfigSchema = z.object({
  type: z.string().describe("渐变类型，如 linear-gradient"),
  angle: z.string().describe("渐变角度"),
  colors: z.array(sortRatioBarGradientColorSchema).describe("渐变颜色数组")
});

// 单个数据项 Schema
const sortRatioBarDataItemSchema = z.object({
  name: z.string().describe("系列名称"),
  value: z.number().describe("数值")
});

// 数据数组 Schema
export const sortRatioBarDataSchema = z.array(sortRatioBarDataItemSchema);

export type SortRatioBarData = z.infer<typeof sortRatioBarDataSchema>;

// 全局配置 Schema
const sortRatioBarGlobalConfigSchema = z.object({
  bgColor: z.string().describe("背景颜色，如 rgba(255,255,255,1)"),
  interval: z.number().describe("系列间隔(px)")
});

// 文字配置 Schema
const sortRatioBarTextConfigSchema = z.object({
  translateX: z.number().describe("文字整体水平偏移(px)"),
  translateY: z.number().describe("文字整体垂直偏移(px)"),
  tagFontFamily: z.string().describe("标签字体"),
  tagFontSize: z.number().describe("标签字号(px)"),
  tagColor: z.string().describe("标签颜色，如 rgba(255, 255, 255, 0.7)"),
  tagFontStyle: z.string().describe("标签字体样式(normal/italic/oblique)"),
  tagFontWeight: z.string().describe("标签字重(normal/bold/bolder/lighter)"),
  tagLetterSpacing: z.number().describe("标签字间距(px)"),
  tagLineHeight: z.number().describe("标签行高(px)"),
  indexTranslateX: z.number().describe("数值标签水平偏移(px)"),
  indexTranslateY: z.number().describe("数值标签垂直偏移(px)"),
  isUsed: z.boolean().describe("是否启用文字配置"),
  tagShow: z.boolean().describe("是否显示系列标签"),
  indexShow: z.boolean().describe("是否显示数值标签"),
  decimalPlace: z.number().describe("小数位数")
});

// 单个系列配置 Schema
const sortRatioBarSeriesItemSchema = z.object({
  seriesKeyValue: z.string().describe("系列对应的数据键值"),
  seriesBgColor: sortRatioBarGradientConfigSchema.describe("系列背景色渐变配置"),
  seriesColor: z.string().describe("系列颜色"),
  seriesOpacity: z.number().describe("系列透明度(0~100)"),
  seriesFontFamily: z.string().describe("系列文字字体"),
  seriesFontSize: z.number().describe("系列文字字号(px)"),
  seriesLineHeight: z.number().describe("系列文字行高(px)"),
  seriesLetterSpacing: z.number().describe("系列文字字间距(px)"),
  seriesFontStyle: z.string().describe("系列文字样式(normal/italic/oblique)"),
  seriesFontWeight: z.string().describe("系列文字字重(normal/bold/bolder)"),
  seriesTranslateX: z.number().describe("系列文字水平偏移(px)"),
  seriesTranslateY: z.number().describe("系列文字垂直偏移(px)"),
  unitText: z.string().describe("单位文字"),
  unitTranslateX: z.number().describe("单位水平偏移(px)"),
  unitTranslateY: z.number().describe("单位垂直偏移(px)"),
  isUnitCustomStyle: z.boolean().describe("是否启用单位自定义样式"),
  unitFontFamily: z.string().describe("单位字体"),
  unitFontSize: z.number().describe("单位字号(px)"),
  unitLineHeight: z.number().describe("单位行高(px)"),
  unitLetterSpacing: z.number().describe("单位字间距(px)"),
  unitColor: z.string().describe("单位颜色"),
  unitFontStyle: z.string().describe("单位字体样式(normal/italic/oblique)"),
  unitFontWeight: z.string().describe("单位字重(normal/bold/bolder)"),
  seriesName: z.string().describe("系列名称")
});

/**
 * 分类占比条配置选项 Schema
 */
export const sortRatioBarOptionSchema = z.object({
  // ============ 全局配置 ============
  globalConfig: sortRatioBarGlobalConfigSchema.describe("全局配置"),

  // ============ 文字配置 ============
  textConfig: sortRatioBarTextConfigSchema.describe("文字标签配置"),

  // ============ 系列配置 ============
  seriesList: z.array(sortRatioBarSeriesItemSchema).describe("系列列表，每个系列对应一个数据项的样式")
});

export type SortRatioBarOption = z.infer<typeof sortRatioBarOptionSchema>;
