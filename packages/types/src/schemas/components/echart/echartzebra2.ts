import { z } from "zod";

/**
 * 斑马柱状图2 (echartzebra2)
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
 * const data: echartzebra2Data = [
 *   { seriesName: "系列一", name: "A", value: 2024 },
 *   { seriesName: "系列一", name: "B", value: 1423 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartzebra2DataItemSchema = z.object({
  name: z.string(),
  seriesName: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartzebra2DataSchema = z.array(echartzebra2DataItemSchema);

export type echartzebra2Data = z.infer<typeof echartzebra2DataSchema>;

// Tab 选项配置
const tabOptionSchema = z.object({
  name: z.string(),
  value: z.string()
});

// 渐变颜色配置
const gradientColorSchema = z.object({
  type: z.literal("linear-gradient").optional(),
  angle: z.union([z.number(), z.string()]),
  colors: z.array(z.object({
    color: z.string(),
    per: z.number()
  })).optional()
});

/**
 * 斑马柱状图2配置选项 Schema
 */
export const echartzebra2OptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),
  stack: z.boolean().describe("是否堆叠显示"),

  // ============ 柱状样式配置 ============
  barWidth: z.number().describe("柱子宽度（px）"),
  barCategoryGap: z.number().describe("柱间间距"),
  barBlockItemHeight: z.number().describe("斑马格高度"),
  barBlockItemInterval: z.number().describe("斑马格间隔"),
  barBlockItemRadio: z.number().describe("斑马格边角（px）"),

  // ============ 系列配置 ============
  dataSeriesName: z.array(z.string()).describe("数据系列名称列表"),
  seriesName: z.array(z.string()).describe("系列名称列表"),
  seriesTabsName: z.array(tabOptionSchema).describe("系列标签页配置"),
  seriesColor: z.array(z.union([z.string(), gradientColorSchema])).describe("系列颜色列表"),
  seriesColorpicker: z.array(z.string()).describe("系列颜色选择器值"),
  seriesOpacity: z.array(z.number()).describe("系列透明度（0-100）"),

  // ============ 极值配置 ============
  extremeShow: z.array(z.boolean()).describe("是否显示极值标注"),
  extremeType: z.array(z.enum(["max", "min"])).describe("极值类型"),
  xAxisSplitLineType: z.string().describe("X轴分割线类型"),
  yAxisSplitLineType: z.string().describe("Y轴分割线类型"),
  extremeColor: z.array(gradientColorSchema).describe("极值颜色配置"),
  extremeOpacity: z.array(z.number()).describe("极值透明度"),
  extremeColorpicker: z.array(z.string()).describe("极值颜色选择器值"),

  // ============ 标线配置 ============
  markLineDataType: z.array(z.string()).describe("标线数据类型"),
  markLineData: z.array(z.any()).describe("标线数据"),
  markLineSymbolStart: z.array(z.string()).describe("标线起始标记类型"),
  markLineSymbolStartImage: z.array(z.string()).describe("标线起始标记图片路径"),
  markLineSymbolEnd: z.array(z.string()).describe("标线结束标记类型"),
  markLineSymbolEndImage: z.array(z.string()).describe("标线结束标记图片路径"),
  markLineSymbolWidth: z.array(z.number()).describe("标线标记宽度"),
  markLineSymbolHeight: z.array(z.number()).describe("标线标记高度"),
  markLineLabelShow: z.array(z.boolean()).describe("是否显示标线标签"),
  markLineLabelPosition: z.array(z.string()).describe("标线标签位置"),
  markLineLabelDistance: z.array(z.number()).describe("标线标签距离"),
  markLineLabelCustom: z.array(z.string()).describe("标线标签自定义内容"),
  markLineLabelFontFamily: z.array(z.string()).describe("标线标签字体"),
  markLineLabelFontStyle: z.array(z.string()).describe("标线标签字体样式"),
  markLineLabelFontSize: z.array(z.number()).describe("标线标签字体大小"),
  markLineLabelColor: z.array(z.string()).describe("标线标签字体颜色"),
  markLineLabelFontWeight: z.array(z.string()).describe("标线标签字体粗细"),

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

  // ============ 坐标轴通用配置 ============
  xNameFontSize: z.number().describe("X轴名称字体大小"),
  yNameFontSize: z.number().describe("Y轴名称字体大小"),

  // ============ 坐标轴配置 ============
  yAxisInverse: z.boolean().describe("Y轴是否反向"),
  xAxisInverse: z.boolean().describe("X轴是否反向"),
  xAxisShow: z.boolean().describe("是否显示X轴"),
  yAxisShow: z.boolean().describe("是否显示Y轴"),
  xAxisLabelShow: z.boolean().describe("是否显示X轴标签"),
  yAxisLabelShow: z.boolean().describe("是否显示Y轴标签"),
  xAxisType: z.enum(["category", "value", "time", "log"]).describe("X轴类型"),
  xAxisInterval: z.number().describe("X轴刻度间隔"),
  xAxisRotate: z.number().describe("X轴标签旋转角度"),
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
  yAxisSplitLineColor: z.string().describe("Y轴分割线颜色"),

  // ============ 数据循环配置 ============
  dataLoop: z.boolean().describe("是否启用数据循环"),
  dataLoopInterval: z.number().describe("数据循环间隔（秒）"),
  dataLoopDisplayRows: z.number().describe("数据循环显示行数"),
  dataLoopRollNum: z.number().describe("数据循环滚动数量")
});

export type echartzebra2Option = z.infer<typeof echartzebra2OptionSchema>;
