import { z } from "zod";

/**
 * 双向条形图 (echartbothWayStripBar)
 * 图表 > 柱形图
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
 * const data: echartbothWayStripBarData = [
 *   { seriesName: "系列一", name: "A", value: 2024 },
 *   { seriesName: "系列二", name: "A", value: 2378 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartbothWayStripBarDataItemSchema = z.object({
  name: z.string(),
  seriesName: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartbothWayStripBarDataSchema = z.array(echartbothWayStripBarDataItemSchema);

export type echartbothWayStripBarData = z.infer<typeof echartbothWayStripBarDataSchema>;

// 渐变颜色配置
const gradientColorSchema = z.object({
  type: z.string().optional(),
  angle: z.union([z.number(), z.string()]).optional(),
  colors: z.array(
    z.object({
      color: z.union([z.string(), z.number()]),
      per: z.number().optional()
    })
  ).optional()
}).passthrough();

// Tab 选项配置
const tabOptionSchema = z.object({
  name: z.string(),
  value: z.string()
});

// 位置配置
const positionSchema = z.object({
  top: z.union([z.number(), z.string()]).optional(),
  left: z.union([z.number(), z.string()]).optional(),
  bottom: z.union([z.number(), z.string()]).optional(),
  right: z.union([z.number(), z.string()]).optional()
});

/**
 * 双向条形图配置选项 Schema
 */
export const echartbothWayStripBarOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 系列配置 ============
  dataSeriesName: z.array(z.string()).describe("数据系列名称列表"),
  seriesName: z.array(z.string()).describe("系列名称列表"),
  seriesTabsName: z.array(tabOptionSchema).describe("系列标签页配置"),
  seriesColor: z.array(gradientColorSchema).describe("系列颜色配置（渐变）"),
  seriesColorpicker: z.array(z.string()).describe("系列颜色选择器值"),
  seriesOpacity: z.array(z.number()).describe("系列透明度（0-100）"),

  // ============ 极值标注配置 ============
  extremeShow: z.array(z.boolean()).describe("是否显示极值标注"),
  extremeType: z.array(z.enum(["max", "min"])).describe("极值类型"),
  extremeColor: z.array(gradientColorSchema).describe("极值颜色配置"),
  extremeOpacity: z.array(z.number()).describe("极值透明度"),
  extremeColorpicker: z.array(z.string()).describe("极值颜色选择器值"),

  // ============ 柱状图配置 ============
  barCategoryGap: z.number().describe("类目间距离（百分比）"),
  barBorderRadius: z.string().describe("柱子圆角"),
  barBackgroundColor: z.string().describe("柱子背景色"),

  // ============ 网格配置 ============
  gridLeft: z.array(z.number()).describe("网格左边距（各系列）"),
  gridTop: z.number().describe("网格上边距"),
  gridRight: z.array(z.number()).describe("网格右边距（各系列）"),
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

  // ============ 双X轴配置（双向条形图）============
  yAxisInverse: z.boolean().describe("Y轴是否反向"),
  xAxisInverse: z.array(z.boolean()).describe("X轴是否反向（对应各系列）"),
  xAxisShow: z.array(z.boolean()).describe("是否显示X轴（对应各系列）"),
  yAxisShow: z.boolean().describe("是否显示Y轴"),
  xAxisLabelShow: z.array(z.boolean()).describe("是否显示X轴标签（对应各系列）"),
  yAxisLabelShow: z.boolean().describe("是否显示Y轴标签"),
  yAxisType: z.enum(["category", "value", "time", "log"]).describe("Y轴类型"),
  yAxisInterval: z.number().describe("Y轴刻度间隔"),
  yAxisRotate: z.number().describe("Y轴标签旋转角度"),
  xAxisMin: z.array(z.string()).describe("X轴最小值（对应各系列）"),
  xAxisMax: z.array(z.string()).describe("X轴最大值（对应各系列）"),
  xAxisMargin: z.array(z.number()).describe("X轴轴线与标签间距（对应各系列）"),
  yAxisMargin: z.number().describe("Y轴轴线与标签间距"),
  xAxisFontFamily: z.array(z.string()).describe("X轴字体名称（对应各系列）"),
  yAxisFontFamily: z.string().describe("Y轴字体名称"),
  xAxisFontSize: z.array(z.number()).describe("X轴字体大小（对应各系列）"),
  yAxisFontSize: z.number().describe("Y轴字体大小"),
  xAxisColor: z.array(z.string()).describe("X轴字体颜色（对应各系列）"),
  yAxisColor: z.string().describe("Y轴字体颜色"),
  xAxisFontStyle: z.array(z.string()).describe("X轴字体样式（对应各系列）"),
  yAxisFontStyle: z.string().describe("Y轴字体样式"),
  xAxisFontWeight: z.array(z.string()).describe("X轴字体粗细（对应各系列）"),
  yAxisFontWeight: z.string().describe("Y轴字体粗细"),
  xAxisNameShow: z.array(z.boolean()).describe("是否显示X轴名称（对应各系列）"),
  xAxisName: z.array(z.string()).describe("X轴名称（对应各系列）"),
  xAxisNameFontFamily: z.array(z.string()).describe("X轴名称字体（对应各系列）"),
  xAxisNameFontSize: z.array(z.number()).describe("X轴名称字体大小（对应各系列）"),
  xAxisNameColor: z.array(z.string()).describe("X轴名称字体颜色（对应各系列）"),
  xAxisNameFontStyle: z.array(z.string()).describe("X轴名称字体样式（对应各系列）"),
  xAxisNameFontWeight: z.array(z.string()).describe("X轴名称字体粗细（对应各系列）"),
  xAxisNameGap: z.array(z.number()).describe("X轴名称间距（对应各系列）"),
  xAxisLineShow: z.array(z.boolean()).describe("是否显示X轴线（对应各系列）"),
  yAxisLineShow: z.boolean().describe("是否显示Y轴线"),
  xAxisLineColor: z.array(z.string()).describe("X轴线颜色（对应各系列）"),
  yAxisLineColor: z.string().describe("Y轴线颜色"),
  xAxisLineWidth: z.array(z.number()).describe("X轴线宽度（对应各系列）"),
  yAxisLineWidth: z.number().describe("Y轴线宽度"),
  xAxisLineOpacity: z.array(z.number()).describe("X轴线透明度（对应各系列）"),
  yAxisLineOpacity: z.number().describe("Y轴线透明度"),
  xAxisTickShow: z.array(z.boolean()).describe("是否显示X轴刻度（对应各系列）"),
  yAxisTickShow: z.boolean().describe("是否显示Y轴刻度"),
  xAxisTickColor: z.array(z.string()).describe("X轴刻度颜色（对应各系列）"),
  yAxisTickColor: z.string().describe("Y轴刻度颜色"),
  xAxisTickWidth: z.array(z.number()).describe("X轴刻度宽度（对应各系列）"),
  yAxisTickWidth: z.number().describe("Y轴刻度宽度"),
  xAxisTickLength: z.array(z.number()).describe("X轴刻度长度（对应各系列）"),
  yAxisTickLength: z.number().describe("Y轴刻度长度"),
  xAxisSplitLineShow: z.array(z.boolean()).describe("是否显示X轴分割线（对应各系列）"),
  yAxisSplitLineShow: z.boolean().describe("是否显示Y轴分割线"),
  yAxisSplitLineInterval: z.number().describe("Y轴分割线间隔"),
  xAxisSplitLineWidth: z.array(z.number()).describe("X轴分割线宽度（对应各系列）"),
  yAxisSplitLineWidth: z.number().describe("Y轴分割线宽度"),
  xAxisSplitLineColor: z.array(z.string()).describe("X轴分割线颜色（对应各系列）"),
  yAxisSplitLineColor: z.string().describe("Y轴分割线颜色"),

  // ============ 数据循环配置 ============
  dataLoop: z.boolean().describe("是否启用数据循环"),
  dataLoopInterval: z.number().describe("数据循环间隔（秒）"),
  dataLoopDisplayRows: z.number().describe("数据循环显示行数"),
  dataLoopRollNum: z.number().describe("数据循环滚动数量")
});

export type echartbothWayStripBarOption = z.infer<typeof echartbothWayStripBarOptionSchema>;
