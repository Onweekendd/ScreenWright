import { z } from "zod";

/**
 * 增长率柱状图 (echartgrowthRateBar)
 * 图表 > 项目
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `name` - 类目名称
 * - `seriesName` - 系列名称
 * - `value` - 数值
 *
 * @example
 * ```typescript
 * const data: echartgrowthRateBarData = [
 *   { seriesName: "系列一", name: "A", value: 20 },
 *   { seriesName: "系列二", name: "A", value: 22 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartgrowthRateBarDataItemSchema = z.object({
  name: z.string(),
  seriesName: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartgrowthRateBarDataSchema = z.array(echartgrowthRateBarDataItemSchema);

export type echartgrowthRateBarData = z.infer<typeof echartgrowthRateBarDataSchema>;

/**
 * 增长率柱状图配置选项 Schema
 */
export const echartgrowthRateBarOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 系列配置 ============
  dataSeriesName: z.array(z.string()).describe("数据系列名称列表"),
  seriesName: z.array(z.string()).describe("系列名称列表"),
  seriesTabsName: z.array(z.string()).describe("系列标签页名称"),
  seriesColor: z.array(z.string()).describe("系列颜色列表"),
  borderColor: z.array(z.string()).describe("边框颜色列表"),
  isSort: z.boolean().describe("是否排序"),
  isHover: z.boolean().describe("是否启用悬停效果"),
  seriesWidth: z.number().describe("系列宽度"),
  seriesOpacity: z.number().describe("系列透明度（0-100）"),

  // ============ 网格配置 ============
  gridLeft: z.number().describe("网格左边距"),
  gridTop: z.number().describe("网格上边距"),
  gridRight: z.number().describe("网格右边距"),
  gridBottom: z.number().describe("网格下边距"),

  // ============ 图例配置 ============
  legendShow: z.boolean().describe("是否显示图例"),
  legendItemWidth: z.number().describe("图例项宽度"),
  legendItemHeight: z.number().describe("图例项高度"),
  legendItemGap: z.number().describe("图例项间距"),
  legendFontFamily: z.string().describe("图例字体名称"),
  legendFontSize: z.number().describe("图例字体大小"),
  legendColor: z.string().describe("图例字体颜色"),
  legendFontStyle: z.string().describe("图例字体样式"),
  legendFontWeight: z.string().describe("图例字体粗细"),

  // ============ Y轴标签悬停配置 ============
  yAxisLabelHover: z.array(z.boolean()).describe("Y轴标签是否悬停高亮"),
  yAxisLabelHoverColor: z.array(z.string()).describe("Y轴标签悬停颜色"),

  // ============ 坐标轴通用配置 ============
  xNameFontSize: z.number().describe("X轴名称字体大小"),
  yNameFontSize: z.number().describe("Y轴名称字体大小"),

  // ============ 坐标轴配置（条形图X/Y轴互换）============
  yAxisInverse: z.boolean().describe("Y轴是否反向"),
  xAxisInverse: z.boolean().describe("X轴是否反向"),
  xAxisShow: z.boolean().describe("是否显示X轴"),
  yAxisShow: z.boolean().describe("是否显示Y轴"),
  xAxisLabelShow: z.boolean().describe("是否显示X轴标签"),
  yAxisLabelShow: z.boolean().describe("是否显示Y轴标签"),
  yAxisType: z.enum(["category", "value", "time", "log"]).describe("Y轴类型"),
  yAxisInterval: z.number().describe("Y轴刻度间隔"),
  yAxisRotate: z.number().describe("Y轴标签旋转角度"),
  xAxisMin: z.string().describe("X轴最小值"),
  xAxisMax: z.string().describe("X轴最大值"),
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
  xAxisNameShow: z.boolean().describe("是否显示X轴名称"),
  xAxisName: z.string().describe("X轴名称"),
  xAxisNameFontFamily: z.string().describe("X轴名称字体"),
  xAxisNameFontSize: z.number().describe("X轴名称字体大小"),
  xAxisNameColor: z.string().describe("X轴名称字体颜色"),
  xAxisNameFontStyle: z.string().describe("X轴名称字体样式"),
  xAxisNameFontWeight: z.string().describe("X轴名称字体粗细"),
  xAxisNamePaddingTop: z.number().describe("X轴名称顶部内边距"),
  xAxisNamePaddingBottom: z.number().describe("X轴名称底部内边距"),
  xAxisNamePaddingLeft: z.number().describe("X轴名称左侧内边距"),
  xAxisNamePaddingRight: z.number().describe("X轴名称右侧内边距"),
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
  yAxisSplitLineColor: z.string().describe("Y轴分割线颜色"),

  // ============ Tooltip 配置 ============
  tooltipLoop: z.boolean().describe("Tooltip 是否循环"),
  tooltipLoopInterval: z.number().describe("Tooltip 循环间隔（秒）"),
  tooltipUnit: z.string().describe("Tooltip 单位"),
  tooltipFixed: z.number().describe("Tooltip 固定位置")
});

export type echartgrowthRateBarOption = z.infer<typeof echartgrowthRateBarOptionSchema>;
