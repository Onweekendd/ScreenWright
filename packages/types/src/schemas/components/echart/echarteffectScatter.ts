import { z } from "zod";

/**
 * Top10气泡图 (echarteffectScatter)
 * 图表 > 项目
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `name` - 地区名称
 * - `value` - 数值
 *
 * @example
 * ```typescript
 * const data: echarteffectScatterData = [
 *   { name: "地区A", value: 150 },
 *   { name: "地区B", value: 130 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echarteffectScatterDataItemSchema = z.object({
  name: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echarteffectScatterDataSchema = z.array(echarteffectScatterDataItemSchema);

export type echarteffectScatterData = z.infer<typeof echarteffectScatterDataSchema>;

// 系列列表项配置
const seriesListItemSchema = z.object({
  name: z.string(),
  tabName: z.string(),
  translateX: z.number(),
  translateY: z.number(),
  size: z.number(),
  insideColor: z.string(),
  outsideColor: z.string(),
  showEffectOn: z.enum(["render", "emphasis"]),
  seriesLabelTopShow: z.boolean(),
  seriesLabelTopFontFamily: z.string(),
  seriesLabelTopFontSize: z.number(),
  seriesLabelTopColor: z.string(),
  seriesLabelTopFontStyle: z.string(),
  seriesLabelTopFontWeight: z.string(),
  seriesLabelNameShow: z.boolean(),
  seriesLabelNameFontFamily: z.string(),
  seriesLabelNameFontSize: z.number(),
  seriesLabelNameColor: z.string(),
  seriesLabelNameFontStyle: z.string(),
  seriesLabelNameFontWeight: z.string(),
  seriesLabelValueShow: z.boolean(),
  seriesLabelValueFontFamily: z.string(),
  seriesLabelValueFontSize: z.number(),
  seriesLabelValueColor: z.string(),
  seriesLabelValueFontStyle: z.string(),
  seriesLabelValueFontWeight: z.string()
});

/**
 * Top10气泡图配置选项 Schema
 */
export const echarteffectScatterOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 网格配置 ============
  gridLeft: z.number().describe("网格左边距"),
  gridTop: z.number().describe("网格上边距"),
  gridRight: z.number().describe("网格右边距"),
  gridBottom: z.number().describe("网格下边距"),

  // ============ 边框配置 ============
  borderWidth: z.number().describe("边框宽度"),
  borderColor: z.string().describe("边框颜色"),

  // ============ 涟漪效果配置 ============
  rippleEffectNumber: z.number().describe("涟漪数量"),
  rippleEffectPeriod: z.number().describe("涟漪周期（秒）"),
  rippleEffectScale: z.number().describe("涟漪缩放比例"),
  rippleEffectBrushType: z.enum(["fill", "stroke"]).describe("涟漪刷子类型"),

  // ============ 数据点配置 ============
  points: z.array(z.string()).describe("点位标签列表"),

  // ============ 系列列表配置 ============
  seriesList: z.array(seriesListItemSchema).describe("系列配置列表")
});

export type echarteffectScatterOption = z.infer<typeof echarteffectScatterOptionSchema>;
