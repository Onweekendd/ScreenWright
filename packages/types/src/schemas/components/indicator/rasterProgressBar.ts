import { z } from "zod";

/**
 * 栅格进度条 (rasterProgressBar)
 * 指标
 *
 * ## 数据结构
 *
 * 数据为包含数值(value)字符串的对象数组。value 为字符串类型，表示进度值。
 *
 * @example
 * ```typescript
 * const data: RasterProgressBarData = [
 *   { value: "0.65" }
 * ];
 * ```
 */

// 渐变颜色配置 Schema
const rasterProgressBarGradientColorSchema = z.object({
  color: z.string().describe("颜色值，如 rgba(24,144,255,1)"),
  per: z.number().describe("渐变位置百分比，0~100")
});

const rasterProgressBarGradientConfigSchema = z.object({
  type: z.string().describe("渐变类型，如 linear-gradient"),
  angle: z.string().describe("渐变角度"),
  colors: z.array(rasterProgressBarGradientColorSchema).describe("渐变颜色数组")
});

// 单个数据项 Schema
const rasterProgressBarDataItemSchema = z.object({
  value: z.string().describe("进度值，字符串类型，如 \"0.65\"")
});

// 数据数组 Schema
export const rasterProgressBarDataSchema = z.array(rasterProgressBarDataItemSchema);

export type RasterProgressBarData = z.infer<typeof rasterProgressBarDataSchema>;

// 全局配置 Schema
const rasterProgressBarGlobalConfigSchema = z.object({
  animatieTime: z.number().describe("动画时长(ms)"),
  numType: z.string().describe("数值类型，如 percent(百分比)"),
  isUsed: z.boolean().describe("是否启用全局配置"),
  extremeValueMax: z.number().describe("最大值"),
  extremeValueMin: z.number().describe("最小值")
});

// 栅格配置 Schema
const rasterProgressBarGridConfigSchema = z.object({
  sectionNums: z.number().describe("栅格分段数量"),
  borderRadius: z.number().describe("栅格圆角(px)"),
  foregroundOpacity: z.number().describe("前景透明度(0~100)"),
  backgroundOpacity: z.number().describe("背景透明度(0~100)"),
  interval: z.number().describe("栅格间隔(px)"),
  foregroundColor: rasterProgressBarGradientConfigSchema.describe("前景颜色渐变配置"),
  backgroundColor: z.string().describe("背景颜色，如 rgba(59,58,58,1)")
});

// 系列配置 Schema
const rasterProgressBarSeriesConfigSchema = z.object({
  seriesFontFamily: z.string().describe("系列文字字体"),
  seriesFontSize: z.number().describe("系列文字字号(px)"),
  seriesLetterSpacing: z.number().describe("系列文字字间距(px)"),
  seriesColor: z.string().describe("系列文字颜色"),
  seriesFontStyle: z.string().describe("系列文字样式(normal/italic/oblique)"),
  seriesFontWeight: z.string().describe("系列文字字重(normal/bold/bolder)"),
  seriesLineHeight: z.number().describe("系列文字行高(px)"),
  decimalPlace: z.number().describe("小数位数"),
  seriesTranslateX: z.number().describe("系列文字水平偏移(px)"),
  seriesTranslateY: z.number().describe("系列文字垂直偏移(px)"),
  bgImgSrc: z.string().describe("背景图片路径"),
  bgImgWidth: z.number().describe("背景图片宽度(px)"),
  bgImgHeight: z.number().describe("背景图片高度(px)"),
  bgImgTranslateX: z.number().describe("背景图片水平偏移(px)"),
  bgImgTranslateY: z.number().describe("背景图片垂直偏移(px)"),
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
  tagShow: z.boolean().describe("是否显示标签"),
  tagFontFamily: z.string().describe("标签字体"),
  tagFontSize: z.number().describe("标签字号(px)"),
  tagLetterSpacing: z.number().describe("标签字间距(px)"),
  tagColor: z.string().describe("标签颜色"),
  tagFontStyle: z.string().describe("标签字体样式(normal/italic/oblique)"),
  tagFontWeight: z.string().describe("标签字重(normal/bold/bolder)"),
  tagLineHeight: z.number().describe("标签行高(px)"),
  tagTranslateX: z.number().describe("标签水平偏移(px)"),
  tagTranslateY: z.number().describe("标签垂直偏移(px)"),
  tagUnitText: z.string().describe("标签单位文字"),
  tagUnitTranslateX: z.number().describe("标签单位水平偏移(px)"),
  tagUnitTranslateY: z.number().describe("标签单位垂直偏移(px)"),
  isTagUnitCustomStyle: z.boolean().describe("是否启用标签单位自定义样式"),
  tagUnitFontFamily: z.string().describe("标签单位字体"),
  tagUnitFontSize: z.number().describe("标签单位字号(px)"),
  tagUnitLineHeight: z.number().describe("标签单位行高(px)"),
  tagUnitLetterSpacing: z.number().describe("标签单位字间距(px)"),
  tagUnitColor: z.string().describe("标签单位颜色"),
  tagUnitFontStyle: z.string().describe("标签单位字体样式(normal/italic/oblique)"),
  tagUnitFontWeight: z.string().describe("标签单位字重(normal/bold/bolder)")
});

// 区间配置 Schema
const rasterProgressBarSectionItemSchema = z.object({
  sectionMin: z.number().describe("区间最小值"),
  sectionMax: z.number().describe("区间最大值"),
  sectionBgColor: rasterProgressBarGradientConfigSchema.describe("区间背景色渐变配置"),
  sectionOpacity: z.number().describe("区间透明度(0~100)"),
  seriesFontFamily: z.string().describe("区间文字字体"),
  seriesFontSize: z.number().describe("区间文字字号(px)"),
  seriesLineHeight: z.number().describe("区间文字行高(px)"),
  seriesLetterSpacing: z.number().describe("区间文字字间距(px)"),
  seriesColor: z.string().describe("区间文字颜色"),
  seriesFontStyle: z.string().describe("区间文字样式(normal/italic/oblique)"),
  seriesFontWeight: z.string().describe("区间文字字重(normal/bold/bolder)"),
  seriesBgImgSrc: z.string().describe("区间背景图片路径"),
  seriesBgImgWidth: z.number().describe("区间背景图片宽度(px)"),
  seriesBgImgHeight: z.number().describe("区间背景图片高度(px)"),
  seriesBgImgTranslateX: z.number().describe("区间背景图片水平偏移(px)"),
  seriesBgImgTranslateY: z.number().describe("区间背景图片垂直偏移(px)"),
  sectionName: z.string().describe("区间名称")
});

/**
 * 栅格进度条配置选项 Schema
 */
export const rasterProgressBarOptionSchema = z.object({
  // ============ 全局配置 ============
  globalConfig: rasterProgressBarGlobalConfigSchema.describe("全局配置"),

  // ============ 栅格配置 ============
  gridConfig: rasterProgressBarGridConfigSchema.describe("栅格样式配置"),

  // ============ 系列配置 ============
  seriesConfig: rasterProgressBarSeriesConfigSchema.describe("系列文字和标签配置"),

  // ============ 区间配置 ============
  sectionList: z.array(rasterProgressBarSectionItemSchema).describe("区间列表，按数值范围分段显示不同样式"),

  // ============ 刷新配置 ============
  refresh: z.boolean().describe("是否刷新")
});

export type RasterProgressBarOption = z.infer<typeof rasterProgressBarOptionSchema>;
