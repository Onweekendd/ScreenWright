import { z } from "zod";

/**
 * 特殊型折线图 (echartdoubleValueLine)
 * 图表 > 项目
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `seriesName` - 系列名称
 * - `value` - 坐标点数组，每个元素为 [x, y] 坐标对
 *
 * @example
 * ```typescript
 * const data: echartdoubleValueLineData = [
 *   { seriesName: "系列一", value: [[0, 0], [3, 5], [4, 6]] },
 *   { seriesName: "系列二", value: [[0, 0], [4, 7], [5, 6]] }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartdoubleValueLineDataItemSchema = z.object({
  seriesName: z.string(),
  value: z.array(z.tuple([z.number(), z.number()]))
});

// 数据数组 Schema（最终导出的类型）
export const echartdoubleValueLineDataSchema = z.array(echartdoubleValueLineDataItemSchema);

export type echartdoubleValueLineData = z.infer<typeof echartdoubleValueLineDataSchema>;

// Tab 选项配置
const tabOptionSchema = z.object({
  name: z.string(),
  value: z.string()
});

/**
 * 特殊型折线图配置选项 Schema
 */
export const echartdoubleValueLineOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 系列配置 ============
  dataSeriesName: z.array(z.string()).describe("数据系列名称列表"),
  seriesName: z.array(z.string()).describe("系列名称列表"),
  seriesTabsName: z.array(tabOptionSchema).describe("系列标签页配置"),
  seriesColor: z.array(z.string()).describe("系列颜色列表"),

  // ============ 系列标签配置 ============
  seriesLabelShow: z.array(z.boolean()).describe("是否显示标签"),
  seriesLabelColor: z.array(z.string()).describe("标签颜色"),
  seriesLabelFontFamily: z.array(z.string()).describe("标签字体"),
  seriesLabelFontSize: z.array(z.number()).describe("标签字体大小"),
  seriesLabelFontWeight: z.array(z.string()).describe("标签字体粗细"),
  seriesLabelFontStyle: z.array(z.string()).describe("标签字体样式"),
  seriesLabelOffsetX: z.array(z.number()).describe("标签X轴偏移"),
  seriesLabelOffsetY: z.array(z.number()).describe("标签Y轴偏移"),

  // ============ 网格配置 ============
  gridLeft: z.number().describe("网格左边距"),
  gridTop: z.number().describe("网格上边距"),
  gridRight: z.number().describe("网格右边距"),
  gridBottom: z.number().describe("网格下边距"),

  // ============ 坐标轴通用配置 ============
  xNameFontSize: z.number().describe("X轴名称字体大小"),
  yNameFontSize: z.number().describe("Y轴名称字体大小"),
  xAxisLabelUtil: z.string().describe("X轴标签单位"),
  yAxisLabelUtil: z.string().describe("Y轴标签单位"),

  // ============ 坐标轴配置 ============
  yAxisInverse: z.boolean().describe("Y轴是否反向"),
  xAxisInverse: z.boolean().describe("X轴是否反向"),
  xAxisShow: z.boolean().describe("是否显示X轴"),
  yAxisShow: z.boolean().describe("是否显示Y轴"),
  xAxisLabelShow: z.boolean().describe("是否显示X轴标签"),
  yAxisLabelShow: z.boolean().describe("是否显示Y轴标签"),
  yAxisMin: z.string().describe("Y轴最小值"),
  yAxisMax: z.string().describe("Y轴最大值"),
  xAxisMargin: z.number().describe("X轴轴线与标签间距"),
  yAxisMargin: z.number().describe("Y轴轴线与标签间距"),
  xAxisFontFamily: z.string().describe("X轴字体名称"),
  yAxisFontFamily: z.string().describe("Y轴字体名称"),
  xAxisFontSize: z.number().describe("X轴字体大小"),
  yAxisFontSize: z.number().describe("Y轴字体大小"),
  xAxisColor: z.string().describe("X轴字体颜色"),
  yAxisColor: z.string().describe("Y轴字体颜色"),
  xAxisFontStyle: z.string().describe("X轴字体样式"),
  yAxisFontStyle: z.string().describe("Y轴字体样式"),
  xAxisFontWeight: z.string().describe("X轴字体粗细"),
  yAxisFontWeight: z.string().describe("Y轴字体粗细"),
  yAxisNameShow: z.boolean().describe("是否显示Y轴名称"),
  yAxisName: z.string().describe("Y轴名称"),
  yAxisNameFontFamily: z.string().describe("Y轴名称字体"),
  yAxisNameFontSize: z.number().describe("Y轴名称字体大小"),
  yAxisNameColor: z.string().describe("Y轴名称字体颜色"),
  yAxisNameFontStyle: z.string().describe("Y轴名称字体样式"),
  yAxisNameFontWeight: z.string().describe("Y轴名称字体粗细"),
  yAxisNamePaddingTop: z.number().describe("Y轴名称顶部内边距"),
  yAxisNamePaddingBottom: z.number().describe("Y轴名称底部内边距"),
  yAxisNamePaddingLeft: z.number().describe("Y轴名称左侧内边距"),
  yAxisNamePaddingRight: z.number().describe("Y轴名称右侧内边距"),
  xAxisLineShow: z.boolean().describe("是否显示X轴线"),
  yAxisLineShow: z.boolean().describe("是否显示Y轴线"),
  xAxisLineColor: z.string().describe("X轴线颜色"),
  yAxisLineColor: z.string().describe("Y轴线颜色"),
  xAxisLineWidth: z.number().describe("X轴线宽度"),
  yAxisLineWidth: z.number().describe("Y轴线宽度"),
  xAxisLineOpacity: z.number().describe("X轴线透明度"),
  yAxisLineOpacity: z.number().describe("Y轴线透明度"),
  xAxisTickShow: z.boolean().describe("是否显示X轴刻度"),
  yAxisTickShow: z.boolean().describe("是否显示Y轴刻度"),
  xAxisTickColor: z.string().describe("X轴刻度颜色"),
  yAxisTickColor: z.string().describe("Y轴刻度颜色"),
  xAxisTickWidth: z.number().describe("X轴刻度宽度"),
  yAxisTickWidth: z.number().describe("Y轴刻度宽度"),
  xAxisTickLength: z.number().describe("X轴刻度长度"),
  yAxisTickLength: z.number().describe("Y轴刻度长度"),
  xAxisSplitLineShow: z.boolean().describe("是否显示X轴分割线"),
  yAxisSplitLineShow: z.boolean().describe("是否显示Y轴分割线"),
  xAxisSplitLineInterval: z.number().describe("X轴分割线间隔"),
  xAxisSplitLineWidth: z.number().describe("X轴分割线宽度"),
  yAxisSplitLineWidth: z.number().describe("Y轴分割线宽度"),
  xAxisSplitLineColor: z.string().describe("X轴分割线颜色"),
  yAxisSplitLineColor: z.string().describe("Y轴分割线颜色")
});

export type echartdoubleValueLineOption = z.infer<typeof echartdoubleValueLineOptionSchema>;
