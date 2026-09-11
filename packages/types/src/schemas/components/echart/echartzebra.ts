import { z } from "zod";

/**
 * 斑马柱状图 (echartzebra)
 * 图表 > 项目
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `name` - 类目名称
 * - `value` - 数值
 *
 * @example
 * ```typescript
 * const data: echartzebraData = [
 *   { name: "A", value: 2024 },
 *   { name: "B", value: 1423 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartzebraDataItemSchema = z.object({
  name: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartzebraDataSchema = z.array(echartzebraDataItemSchema);

export type echartzebraData = z.infer<typeof echartzebraDataSchema>;

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
 * 斑马柱状图配置选项 Schema
 */
export const echartzebraOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 系列配置 ============
  dataSeriesName: z.array(z.string()).describe("数据系列名称列表"),
  seriesName: z.array(z.string()).describe("系列名称列表"),
  seriesTabsName: z.array(tabOptionSchema).describe("系列标签页配置"),
  seriesColor: gradientColorSchema.describe("系列颜色配置（渐变）"),
  hoverColor: gradientColorSchema.describe("悬停颜色配置（渐变）"),
  intervalColor: z.string().describe("间隔颜色"),
  isSort: z.boolean().describe("是否排序"),
  isHover: z.boolean().describe("是否启用悬停效果"),
  seriesWidth: z.number().describe("系列宽度"),
  seriesOpacity: z.number().describe("系列透明度（0-100）"),

  // ============ 网格配置 ============
  gridLeft: z.number().describe("网格左边距"),
  gridTop: z.number().describe("网格上边距"),
  gridRight: z.number().describe("网格右边距"),
  gridBottom: z.number().describe("网格下边距"),

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
  xAxisLabelLimit: z.boolean().describe("X轴标签是否限制显示"),
  xAxisLabelLimitNum: z.number().describe("X轴标签限制显示数量"),
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

  // ============ Tooltip 配置 ============
  tooltipLoop: z.boolean().describe("Tooltip 是否循环"),
  tooltipLoopInterval: z.number().describe("Tooltip 循环间隔（秒）"),
  tooltipUnit: z.string().describe("Tooltip 单位"),
  tooltipFixed: z.number().describe("Tooltip 固定位置")
});

export type echartzebraOption = z.infer<typeof echartzebraOptionSchema>;
