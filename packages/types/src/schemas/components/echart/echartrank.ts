import { z } from "zod";

/**
 * 排名图 (echartrank)
 * 图表 > 柱形图
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `name` - 类目名称
 * - `value` - 数值
 *
 * @example
 * ```typescript
 * const data: echartrankData = [
 *   { name: "A", value: 2024 },
 *   { name: "B", value: 1423 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartrankDataItemSchema = z.object({
  name: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartrankDataSchema = z.array(echartrankDataItemSchema);

export type echartrankData = z.infer<typeof echartrankDataSchema>;

// 渐变颜色配置
const gradientColorSchema = z.object({
  type: z.literal("linear-gradient").optional(),
  angle: z.union([z.number(), z.string()]),
  colors: z.array(
    z.object({
      color: z.string(),
      per: z.number()
    })
  ).optional()
});

// 位置配置
const positionSchema = z.object({
  top: z.union([z.number(), z.string()]),
  left: z.union([z.number(), z.string()]).optional(),
  bottom: z.union([z.number(), z.string()]).optional(),
  right: z.union([z.number(), z.string()]).optional()
});

/**
 * 排名图配置选项 Schema
 */
export const echartrankOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),
  stack: z.boolean().describe("是否堆叠显示"),

  // ============ 系列配置 ============
  seriesTabsName: z.array(z.string()).describe("系列标签页名称"),
  sortType: z.enum(["asc", "desc", "none"]).describe("排序方式"),
  defaultSeriesColor: gradientColorSchema.describe("默认系列颜色"),
  defaultSeriesOpacity: z.number().describe("默认系列透明度（0-100）"),
  seriesColor: z.array(gradientColorSchema).describe("系列颜色配置（渐变）"),
  seriesColorpicker: z.array(z.string()).describe("系列颜色选择器值"),
  seriesOpacity: z.array(z.number()).describe("系列透明度（0-100）"),

  // ============ 柱状图配置 ============
  barGap: z.number().describe("柱间距离（百分比）"),
  barCategoryGap: z.number().describe("类目间距离（百分比）"),
  barBorderRadius: z.string().describe("柱子圆角"),
  barBackgroundColor: z.string().describe("柱子背景色"),

  // ============ 网格配置 ============
  gridLeft: z.number().describe("网格左边距"),
  gridTop: z.number().describe("网格上边距"),
  gridRight: z.number().describe("网格右边距"),
  gridBottom: z.number().describe("网格下边距"),

  // ============ 图例配置 ============
  legendShow: z.boolean().describe("是否显示图例"),
  legendWidth: z.number().describe("图例宽度"),
  legendHeight: z.number().describe("图例高度"),
  legendItemWidth: z.number().describe("图例项宽度"),
  legendItemHeight: z.number().describe("图例项高度"),
  legendItemGap: z.number().describe("图例项间距"),
  legendFontFamily: z.string().describe("图例字体名称"),
  legendFontSize: z.number().describe("图例字体大小"),
  legendColor: z.string().describe("图例字体颜色"),
  legendFontStyle: z.string().describe("图例字体样式"),
  legendFontWeight: z.string().describe("图例字体粗细"),
  legendTextLeftPadding: z.number().describe("图例文字左侧内边距"),
  legendSelectedMode: z.boolean().describe("图例是否可选择"),
  legendGrid: positionSchema.describe("图例位置"),
  legendOffsetX: z.number().describe("图例X轴偏移"),
  legendOffsetY: z.number().describe("图例Y轴偏移"),
  legendOrient: z.enum(["horizontal", "vertical"]).describe("图例排列方向"),

  // ============ 坐标轴通用配置 ============
  xNameFontSize: z.number().describe("X轴名称字体大小"),
  yNameFontSize: z.number().describe("Y轴名称字体大小"),

  // ============ 系列标签配置 ============
  seriesLabelShow: z.array(z.boolean()).describe("是否显示标签"),
  seriesLabelColor: z.array(z.string()).describe("标签颜色"),
  seriesLabelFontFamily: z.array(z.string()).describe("标签字体"),
  seriesLabelFontSize: z.array(z.number()).describe("标签字体大小"),
  seriesLabelFontWeight: z.array(z.string()).describe("标签字体粗细"),
  seriesLabelFontStyle: z.array(z.string()).describe("标签字体样式"),
  seriesLabelOffsetX: z.array(z.number()).describe("标签X轴偏移"),
  seriesLabelOffsetY: z.array(z.number()).describe("标签Y轴偏移"),
  seriesLabelSuffix: z.string().describe("标签后缀"),
  defaultSeriesLabelBackground: z.string().describe("默认标签背景色"),
  seriesLabelBackground: z.array(z.string()).describe("标签背景色"),

  // ============ 坐标轴配置（排名图X/Y轴互换）============
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
  xAxisNameGap: z.number().describe("X轴名称间距"),
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
  yAxisSplitLineInterval: z.number().describe("Y轴分割线间隔"),
  xAxisSplitLineWidth: z.number().describe("X轴分割线宽度"),
  yAxisSplitLineWidth: z.number().describe("Y轴分割线宽度"),
  xAxisSplitLineColor: z.string().describe("X轴分割线颜色"),
  yAxisSplitLineColor: z.string().describe("Y轴分割线颜色"),

  // ============ 数据循环配置 ============
  dataLoop: z.boolean().describe("是否启用数据循环"),
  dataLoopInterval: z.number().describe("数据循环间隔（秒）"),
  dataLoopDisplayRows: z.number().describe("数据循环显示行数"),
  dataLoopRollNum: z.number().describe("数据循环滚动数量"),

  // ============ 数据缩放配置 ============
  dataZoomShow: z.boolean().describe("是否显示数据缩放"),
  moveHandleSize: z.number().describe("移动手柄大小"),
  moveHandleColor: z.string().describe("移动手柄颜色"),
  moveHandleEmphasisColor: z.string().describe("移动手柄高亮颜色"),
  dataZoomRight: z.number().describe("数据缩放右侧距离")
});

export type echartrankOption = z.infer<typeof echartrankOptionSchema>;
