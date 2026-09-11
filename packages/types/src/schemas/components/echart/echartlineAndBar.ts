import { z } from "zod";

/**
 * 折线柱形图 (echartlineAndBar)
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
 * const data: echartlineAndBarData = [
 *   { seriesName: "系列一", name: "A", value: 2024 },
 *   { seriesName: "系列二", name: "A", value: 2378 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartlineAndBarDataItemSchema = z.object({
  name: z.string(),
  seriesName: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartlineAndBarDataSchema = z.array(echartlineAndBarDataItemSchema);

export type echartlineAndBarData = z.infer<typeof echartlineAndBarDataSchema>;

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
 * 折线柱形图配置选项 Schema
 */
export const echartlineAndBarOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 系列配置 ============
  dataSeriesName: z.array(z.string()).describe("数据系列名称列表"),
  seriesName: z.array(z.string()).describe("系列名称列表"),
  seriesTabsName: z.array(tabOptionSchema).describe("系列标签页配置"),
  seriesType: z.array(z.enum(["bar", "line", "scatter"])).describe("系列类型数组（bar=柱状,line=折线）"),

  // ============ 柱状图系列配置 ============
  seriesBarColor: z.array(gradientColorSchema).describe("柱状图系列颜色配置"),
  seriesBarOpacity: z.array(z.number()).describe("柱状图系列透明度（0-100）"),

  // ============ 折线图系列配置 ============
  seriesAreaOpacity: z.array(z.number()).describe("面积图透明度（0-100）"),
  seriesAreaColor: z.array(gradientColorSchema).describe("面积图颜色配置"),
  seriesLineColor: z.array(z.string()).describe("折线颜色"),
  seriesLineWidth: z.array(z.number()).describe("折线宽度"),
  seriesSmoothShow: z.array(z.boolean()).describe("是否平滑曲线"),
  seriesSmooth: z.array(z.number()).describe("平滑度（0-1）"),
  seriesConnectNulls: z.array(z.boolean()).describe("是否连接空值"),

  // ============ 系列标记配置 ============
  seriesSymbolShow: z.array(z.boolean()).describe("是否显示标记"),
  seriesSymbol: z.array(z.string()).describe("标记类型"),
  seriesSymbolImage: z.array(z.string()).describe("标记图片路径"),
  seriesSymbolWidth: z.array(z.number()).describe("标记宽度"),
  seriesSymbolHeight: z.array(z.number()).describe("标记高度"),
  seriesItemColor: z.array(z.string()).describe("数据项颜色"),
  seriesItemBorderWidth: z.array(z.number()).describe("数据项边框宽度"),
  seriesItemBorderColor: z.array(z.string()).describe("数据项边框颜色"),

  // ============ 系列标签配置 ============
  seriesLabelShow: z.array(z.boolean()).describe("是否显示标签"),
  seriesLabelColor: z.array(z.string()).describe("标签颜色"),
  seriesLabelFontFamily: z.array(z.string()).describe("标签字体"),
  seriesLabelFontSize: z.array(z.number()).describe("标签字体大小"),
  seriesLabelFontWeight: z.array(z.string()).describe("标签字体粗细"),
  seriesLabelFontStyle: z.array(z.string()).describe("标签字体样式"),
  seriesLabelOffsetX: z.array(z.number()).describe("标签X轴偏移"),
  seriesLabelOffsetY: z.array(z.number()).describe("标签Y轴偏移"),

  // ============ 柱状图配置 ============
  barGap: z.number().describe("柱间距离（百分比）"),
  barCategoryGap: z.number().describe("类目间距离（百分比）"),
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

  // ============ X轴配置 ============
  xAxisInverse: z.boolean().describe("X轴是否反向"),
  xAxisShow: z.boolean().describe("是否显示X轴"),
  xAxisLabelShow: z.boolean().describe("是否显示X轴标签"),
  xAxisType: z.enum(["category", "value", "time", "log"]).describe("X轴类型"),
  xAxisInterval: z.number().describe("X轴刻度间隔"),
  xAxisRotate: z.number().describe("X轴标签旋转角度"),
  xAxisMargin: z.number().describe("X轴轴线与标签间距"),
  xAxisFontFamily: z.string().describe("X轴字体名称"),
  xAxisFontSize: z.number().describe("X轴字体大小"),
  xAxisColor: z.string().describe("X轴字体颜色"),
  xAxisFontStyle: z.string().describe("X轴字体样式"),
  xAxisFontWeight: z.string().describe("X轴字体粗细"),
  xAxisLineShow: z.boolean().describe("是否显示X轴线"),
  xAxisLineColor: z.string().describe("X轴线颜色"),
  xAxisLineWidth: z.number().describe("X轴线宽度"),
  xAxisLineOpacity: z.number().describe("X轴线透明度"),
  xAxisTickShow: z.boolean().describe("是否显示X轴刻度"),
  xAxisTickColor: z.string().describe("X轴刻度颜色"),
  xAxisTickWidth: z.number().describe("X轴刻度宽度"),
  xAxisTickLength: z.number().describe("X轴刻度长度"),
  xAxisSplitLineShow: z.boolean().describe("是否显示X轴分割线"),
  xAxisSplitLineInterval: z.number().describe("X轴分割线间隔"),
  xAxisSplitLineWidth: z.number().describe("X轴分割线宽度"),
  xAxisSplitLineColor: z.string().describe("X轴分割线颜色"),

  // ============ Y轴配置（双Y轴）============
  yAxisInverse: z.array(z.boolean()).describe("Y轴是否反向（对应各系列）"),
  yAxisShow: z.array(z.boolean()).describe("是否显示Y轴（对应各系列）"),
  yAxisLabelShow: z.array(z.boolean()).describe("是否显示Y轴标签（对应各系列）"),
  yAxisMin: z.array(z.string()).describe("Y轴最小值（对应各系列）"),
  yAxisMax: z.array(z.string()).describe("Y轴最大值（对应各系列）"),
  yAxisMargin: z.array(z.number()).describe("Y轴轴线与标签间距（对应各系列）"),
  yAxisFontFamily: z.array(z.string()).describe("Y轴字体名称（对应各系列）"),
  yAxisFontSize: z.array(z.number()).describe("Y轴字体大小（对应各系列）"),
  yAxisColor: z.array(z.string()).describe("Y轴字体颜色（对应各系列）"),
  yAxisFontStyle: z.array(z.string()).describe("Y轴字体样式（对应各系列）"),
  yAxisFontWeight: z.array(z.string()).describe("Y轴字体粗细（对应各系列）"),
  yAxisNameShow: z.array(z.boolean()).describe("是否显示Y轴名称（对应各系列）"),
  yAxisName: z.array(z.string()).describe("Y轴名称（对应各系列）"),
  yAxisNameFontFamily: z.array(z.string()).describe("Y轴名称字体（对应各系列）"),
  yAxisNameFontSize: z.array(z.number()).describe("Y轴名称字体大小（对应各系列）"),
  yAxisNameColor: z.array(z.string()).describe("Y轴名称字体颜色（对应各系列）"),
  yAxisNameFontStyle: z.array(z.string()).describe("Y轴名称字体样式（对应各系列）"),
  yAxisNameFontWeight: z.array(z.string()).describe("Y轴名称字体粗细（对应各系列）"),
  yAxisNamePaddingTop: z.array(z.number()).describe("Y轴名称顶部内边距（对应各系列）"),
  yAxisNamePaddingBottom: z.array(z.number()).describe("Y轴名称底部内边距（对应各系列）"),
  yAxisNamePaddingLeft: z.array(z.number()).describe("Y轴名称左侧内边距（对应各系列）"),
  yAxisNamePaddingRight: z.array(z.number()).describe("Y轴名称右侧内边距（对应各系列）"),
  yAxisLineShow: z.array(z.boolean()).describe("是否显示Y轴线（对应各系列）"),
  yAxisLineColor: z.array(z.string()).describe("Y轴线颜色（对应各系列）"),
  yAxisLineWidth: z.array(z.number()).describe("Y轴线宽度（对应各系列）"),
  yAxisLineOpacity: z.array(z.number()).describe("Y轴线透明度（对应各系列）"),
  yAxisTickShow: z.array(z.boolean()).describe("是否显示Y轴刻度（对应各系列）"),
  yAxisTickColor: z.array(z.string()).describe("Y轴刻度颜色（对应各系列）"),
  yAxisTickWidth: z.array(z.number()).describe("Y轴刻度宽度（对应各系列）"),
  yAxisTickLength: z.array(z.number()).describe("Y轴刻度长度（对应各系列）"),
  yAxisSplitLineShow: z.array(z.boolean()).describe("是否显示Y轴分割线（对应各系列）"),
  yAxisSplitLineInterval: z.number().optional().describe("Y轴分割线间隔"),
  yAxisSplitLineWidth: z.array(z.number()).describe("Y轴分割线宽度（对应各系列）"),
  yAxisSplitLineColor: z.array(z.string()).describe("Y轴分割线颜色（对应各系列）"),
  yAxisIndex: z.array(z.number()).describe("Y轴索引（对应各系列）"),

  // ============ 数据循环配置 ============
  dataLoop: z.boolean().describe("是否启用数据循环"),
  dataLoopInterval: z.number().describe("数据循环间隔（秒）"),
  dataLoopDisplayRows: z.number().describe("数据循环显示行数"),
  dataLoopRollNum: z.number().describe("数据循环滚动数量"),

  // ============ Tooltip 配置 ============
  tooltipLoop: z.boolean().describe("Tooltip 是否循环"),
  tooltipLoopInterval: z.number().describe("Tooltip 循环间隔（秒）"),
  tooltipTriggerOn: z.boolean().describe("Tooltip 是否触发"),
  tooltipOffsetX: z.number().describe("Tooltip X轴偏移"),
  tooltipOffsetY: z.number().describe("Tooltip Y轴偏移"),
  tooltipBackground: z.string().describe("Tooltip 背景色"),
  tooltipWidth: z.number().describe("Tooltip 宽度"),
  tooltipHeight: z.number().describe("Tooltip 高度"),
  tooltipPaddingTop: z.number().describe("Tooltip 顶部内边距"),
  tooltipPaddingBottom: z.number().describe("Tooltip 底部内边距"),
  tooltipPaddingLeft: z.number().describe("Tooltip 左侧内边距"),
  tooltipPaddingRight: z.number().describe("Tooltip 右侧内边距"),
  tooltipNameFontFamily: z.string().describe("Tooltip 名称字体"),
  tooltipNameFontSize: z.number().describe("Tooltip 名称字体大小"),
  tooltipNameColor: z.string().describe("Tooltip 名称字体颜色"),
  tooltipNameFontWeight: z.string().describe("Tooltip 名称字体粗细"),
  tooltipNameFontStyle: z.string().describe("Tooltip 名称字体样式"),
  tooltipAlign: z.enum(["left", "center", "right"]).describe("Tooltip 对齐方式"),
  tooltipNameOffsetX: z.number().describe("Tooltip 名称X轴偏移"),
  tooltipNameOffsetY: z.number().describe("Tooltip 名称Y轴偏移"),
  tooltipArrLineHeight: z.number().describe("Tooltip 数组行高"),
  tooltipSeriesNameFontFamily: z.string().describe("Tooltip 系列名字体"),
  tooltipSeriesNameFontSize: z.number().describe("Tooltip 系列名字体大小"),
  tooltipSeriesNameColor: z.string().describe("Tooltip 系列名字体颜色"),
  tooltipSeriesNameFontWeight: z.string().describe("Tooltip 系列名字体粗细"),
  tooltipSeriesNameFontStyle: z.string().describe("Tooltip 系列名字体样式"),
  tooltipValueFontFamily: z.string().describe("Tooltip 数值字体"),
  tooltipValueFontSize: z.number().describe("Tooltip 数值字体大小"),
  tooltipValueColor: z.string().describe("Tooltip 数值字体颜色"),
  tooltipValueFontWeight: z.string().describe("Tooltip 数值字体粗细"),
  tooltipValueFontStyle: z.string().describe("Tooltip 数值字体样式"),
  tooltipUnit: z.array(z.string()).describe("Tooltip 单位数组"),
  tooltipUnitFontFamily: z.string().describe("Tooltip 单位字体"),
  tooltipUnitFontSize: z.number().describe("Tooltip 单位字体大小"),
  tooltipUnitColor: z.string().describe("Tooltip 单位字体颜色"),
  tooltipUnitFontWeight: z.string().describe("Tooltip 单位字体粗细"),
  tooltipUnitFontStyle: z.string().describe("Tooltip 单位字体样式"),
  tooltipUnitOffsetX: z.number().describe("Tooltip 单位X轴偏移"),
  tooltipUnitOffsetY: z.number().describe("Tooltip 单位Y轴偏移"),
  tooltipMarkerSize: z.number().describe("Tooltip 标记大小"),
  dataUnitName: z.array(z.string()).describe("数据单位名称"),
  unitTabsName: z.array(tabOptionSchema).describe("单位标签页配置"),
  tooltipAxisPointerWidth: z.number().describe("Tooltip 指示线宽度"),
  tooltipAxisPointerColor: z.string().describe("Tooltip 指示线颜色"),
  xAxisLabelCustom: z.array(z.string()).optional().describe("X轴自定义标签")
});

export type echartlineAndBarOption = z.infer<typeof echartlineAndBarOptionSchema>;
