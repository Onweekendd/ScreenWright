import { z } from "zod";

/**
 * 3D柱状折线图 (echartthreedBarAndLine)
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
 * const data: echartthreedBarAndLineData = [
 *   { seriesName: "系列一", name: "A", value: 2024 },
 *   { seriesName: "系列二", name: "A", value: 23 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartthreedBarAndLineDataItemSchema = z.object({
  name: z.string(),
  seriesName: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartthreedBarAndLineDataSchema = z.array(echartthreedBarAndLineDataItemSchema);

export type echartthreedBarAndLineData = z.infer<typeof echartthreedBarAndLineDataSchema>;

// Tab 选项配置
const tabOptionSchema = z.object({
  name: z.string(),
  value: z.string()
});

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

/**
 * 3D柱状折线图配置选项 Schema
 */
export const echartthreedBarAndLineOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 系列配置 ============
  dataSeriesName: z.array(z.string()).describe("数据系列名称列表"),
  seriesName: z.array(z.string()).describe("系列名称列表"),
  seriesTabsName: z.array(tabOptionSchema).describe("系列标签页配置"),
  seriesColor: gradientColorSchema.describe("系列颜色配置"),
  seriesTopColor: z.string().describe("系列头部颜色"),
  seriesBottomColor: z.string().describe("系列底部颜色"),
  seriesHoverColor: gradientColorSchema.describe("系列悬停颜色配置"),
  seriesHoverOpacity: z.number().describe("系列悬停透明度"),
  seriesHoverTopColor: z.string().describe("系列悬停头部颜色"),
  seriesHoverBottomColor: z.string().describe("系列悬停底部颜色"),
  isSort: z.boolean().describe("是否排序"),
  isHover: z.boolean().describe("是否启用悬停效果"),
  seriesWidth: z.number().describe("柱体系列宽度"),
  seriesOpacity: z.number().describe("柱体系列透明度（0-100）"),

  // ============ 折线配置 ============
  seriesLineColor: z.union([z.string(), gradientColorSchema, z.array(z.union([z.string(), gradientColorSchema]))]).describe("折线颜色（各系列）"),
  seriesLineOpacity: z.union([z.number(), z.array(z.number())]).describe("折线透明度（各系列）"),
  seriesLineWidth: z.union([z.number(), z.array(z.number())]).describe("折线宽度（各系列）"),
  seriesSmoothShow: z.union([z.boolean(), z.array(z.boolean())]).describe("是否平滑曲线（各系列）"),
  seriesSmooth: z.union([z.number(), z.array(z.number())]).describe("曲线平滑度（各系列）"),
  seriesConnectNulls: z.union([z.boolean(), z.array(z.boolean())]).optional().describe("是否连接空值（各系列）"),

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
  yAxisShow: z.union([z.boolean(), z.array(z.boolean())]).describe("是否显示Y轴"),
  xAxisLabelShow: z.boolean().describe("是否显示X轴标签"),
  yAxisLabelShow: z.union([z.boolean(), z.array(z.boolean())]).describe("是否显示Y轴标签"),
  xAxisType: z.enum(["category", "value", "time", "log"]).describe("X轴类型"),
  xAxisInterval: z.number().describe("X轴刻度间隔"),
  xAxisRotate: z.number().describe("X轴标签旋转角度"),
  yAxisMin: z.string().optional().describe("Y轴最小值"),
  yAxisMax: z.string().optional().describe("Y轴最大值"),
  xAxisMargin: z.number().describe("X轴轴线与标签间距"),
  yAxisMargin: z.union([z.number(), z.array(z.number())]).describe("Y轴轴线与标签间距"),
  xAxisFontFamily: z.string().describe("X轴字体名称"),
  yAxisFontFamily: z.union([z.string(), z.array(z.string())]).describe("Y轴字体名称"),
  xAxisFontSize: z.number().describe("X轴字体大小"),
  yAxisFontSize: z.union([z.number(), z.array(z.number())]).describe("Y轴字体大小"),
  xAxisColor: z.string().describe("X轴字体颜色"),
  yAxisColor: z.union([z.string(), z.array(z.string())]).describe("Y轴字体颜色"),
  xAxisFontStyle: z.string().describe("X轴字体样式"),
  yAxisFontStyle: z.union([z.string(), z.array(z.string())]).describe("Y轴字体样式"),
  xAxisFontWeight: z.string().describe("X轴字体粗细"),
  yAxisFontWeight: z.union([z.string(), z.array(z.string())]).describe("Y轴字体粗细"),
  yAxisNameShow: z.boolean().optional().describe("是否显示Y轴名称"),
  yAxisName: z.string().optional().describe("Y轴名称"),
  yAxisNameFontFamily: z.string().optional().describe("Y轴名称字体"),
  yAxisNameFontSize: z.number().optional().describe("Y轴名称字体大小"),
  yAxisNameColor: z.string().optional().describe("Y轴名称字体颜色"),
  yAxisNameFontStyle: z.string().optional().describe("Y轴名称字体样式"),
  yAxisNameFontWeight: z.string().optional().describe("Y轴名称字体粗细"),
  yAxisNamePaddingTop: z.number().optional().describe("Y轴名称顶部内边距"),
  yAxisNamePaddingBottom: z.number().optional().describe("Y轴名称底部内边距"),
  yAxisNamePaddingLeft: z.number().optional().describe("Y轴名称左侧内边距"),
  yAxisNamePaddingRight: z.number().optional().describe("Y轴名称右侧内边距"),
  xAxisLineShow: z.boolean().describe("是否显示X轴线"),
  yAxisLineShow: z.union([z.boolean(), z.array(z.boolean())]).describe("是否显示Y轴线"),
  xAxisLineColor: z.string().describe("X轴线颜色"),
  yAxisLineColor: z.union([z.string(), z.array(z.string())]).describe("Y轴线颜色"),
  xAxisLineWidth: z.number().describe("X轴线宽度"),
  yAxisLineWidth: z.union([z.number(), z.array(z.number())]).describe("Y轴线宽度"),
  xAxisLineOpacity: z.number().describe("X轴线透明度"),
  yAxisLineOpacity: z.union([z.number(), z.array(z.number())]).describe("Y轴线透明度"),
  xAxisTickShow: z.boolean().describe("是否显示X轴刻度"),
  yAxisTickShow: z.union([z.boolean(), z.array(z.boolean())]).describe("是否显示Y轴刻度"),
  xAxisTickColor: z.string().describe("X轴刻度颜色"),
  yAxisTickColor: z.union([z.string(), z.array(z.string())]).describe("Y轴刻度颜色"),
  xAxisTickWidth: z.number().describe("X轴刻度宽度"),
  yAxisTickWidth: z.union([z.number(), z.array(z.number())]).describe("Y轴刻度宽度"),
  xAxisTickLength: z.number().describe("X轴刻度长度"),
  yAxisTickLength: z.union([z.number(), z.array(z.number())]).describe("Y轴刻度长度"),
  xAxisSplitLineShow: z.boolean().describe("是否显示X轴分割线"),
  yAxisSplitLineShow: z.union([z.boolean(), z.array(z.boolean())]).describe("是否显示Y轴分割线"),
  xAxisSplitLineInterval: z.number().describe("X轴分割线间隔"),
  xAxisSplitLineWidth: z.number().describe("X轴分割线宽度"),
  yAxisSplitLineWidth: z.union([z.number(), z.array(z.number())]).describe("Y轴分割线宽度"),
  xAxisSplitLineColor: z.string().describe("X轴分割线颜色"),
  yAxisSplitLineColor: z.union([z.string(), z.array(z.string())]).describe("Y轴分割线颜色"),

  // ============ Tooltip 配置 ============
  tooltipLoop: z.boolean().describe("Tooltip 是否循环"),
  tooltipLoopInterval: z.number().describe("Tooltip 循环间隔（秒）"),
  tooltipUnit: z.union([z.string(), z.array(z.string())]).describe("Tooltip 单位"),
  tooltipFixed: z.number().describe("Tooltip 固定位置")
});

export type echartthreedBarAndLineOption = z.infer<typeof echartthreedBarAndLineOptionSchema>;
