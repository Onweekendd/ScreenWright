import { z } from "zod";

/**
 * 饼图 (echartpie)
 * 图表 > 饼图
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `seriesName` - 系列名称
 * - `value` - 数值
 *
 * @example
 * ```typescript
 * const data: echartpieData = [
 *   { seriesName: "系列一", value: 2024 },
 *   { seriesName: "系列二", value: 2378 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartpieDataItemSchema = z.object({
  seriesName: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartpieDataSchema = z.array(echartpieDataItemSchema);

export type echartpieData = z.infer<typeof echartpieDataSchema>;

// Tab 选项配置
const tabOptionSchema = z.object({
  name: z.string(),
  value: z.string()
});

// 位置配置
const positionSchema = z.object({
  top: z.union([z.number(), z.string()]),
  left: z.union([z.number(), z.string()]).optional(),
  bottom: z.union([z.number(), z.string()]).optional(),
  right: z.union([z.number(), z.string()]).optional()
});

/**
 * 饼图配置选项 Schema
 */
export const echartpieOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 系列配置 ============
  dataSeriesName: z.array(z.string()).describe("数据系列名称列表"),
  seriesName: z.array(z.string()).describe("系列名称列表"),
  seriesTabsName: z.array(tabOptionSchema).describe("系列标签页配置"),

  // ============ 饼图位置配置 ============
  seriesLeft: z.number().describe("系列左边距"),
  seriesTop: z.number().describe("系列上边距"),
  seriesRight: z.number().describe("系列右边距"),
  seriesBottom: z.number().describe("系列下边距"),

  // ============ 系列标签配置 ============
  seriesLabelShow: z.boolean().describe("是否显示系列标签"),
  seriesDistanceToLabelLine: z.number().describe("标签线距离"),
  seriesLabelLineLength: z.number().describe("标签线长度"),
  seriesLabelOrient: z.enum(["horizontal", "vertical", "radial"]).describe("标签排列方向"),
  seriesLabelSeriesShow: z.boolean().describe("是否显示系列名称"),
  seriesLabelSeriesFontFamily: z.string().describe("系列名称字体"),
  seriesLabelSeriesFontSize: z.number().describe("系列名称字体大小"),
  seriesLabelSeriesColor: z.string().describe("系列名称字体颜色"),
  seriesLabelSeriesFontStyle: z.string().describe("系列名称字体样式"),
  seriesLabelSeriesFontWeight: z.string().describe("系列名称字体粗细"),
  seriesLabelPercentShow: z.boolean().describe("是否显示百分比"),
  seriesLabelPercentValue: z.number().describe("百分比小数位数"),
  seriesLabelPercentFontFamily: z.string().describe("百分比字体"),
  seriesLabelPercentFontSize: z.number().describe("百分比字体大小"),
  seriesLabelPercentColor: z.string().describe("百分比字体颜色"),
  seriesLabelPercentFontStyle: z.string().describe("百分比字体样式"),
  seriesLabelPercentFontWeight: z.string().describe("百分比字体粗细"),
  seriesLabelValueShow: z.boolean().describe("是否显示数值"),
  seriesLabelUnit: z.string().describe("标签单位"),
  seriesLabelUnitFontSize: z.number().describe("单位字体大小"),
  seriesLabelUnitLeftPadding: z.number().describe("单位左侧内边距"),
  seriesLabelValueLeftPadding: z.number().describe("数值左侧内边距"),
  seriesLabelValueFontFamily: z.string().describe("数值字体"),
  seriesLabelValueFontSize: z.number().describe("数值字体大小"),
  seriesLabelValueColor: z.string().describe("数值字体颜色"),
  seriesLabelValueFontStyle: z.string().describe("数值字体样式"),
  seriesLabelValueFontWeight: z.string().describe("数值字体粗细"),

  // ============ 图例配置 ============
  legendShow: z.boolean().describe("是否显示图例"),
  legendOrder: z.enum(["default", "ascending", "descending"]).describe("图例排序方式"),
  legendItemWidth: z.number().describe("图例项宽度"),
  legendItemHeight: z.number().describe("图例项高度"),
  legendTextLeftPadding: z.number().describe("图例文字左侧内边距"),
  legendSeriesShow: z.boolean().describe("是否显示系列名称"),
  legendSeriesFontFamily: z.string().describe("图例系列名称字体"),
  legendSeriesFontSize: z.number().describe("图例系列名称字体大小"),
  legendSeriesColor: z.string().describe("图例系列名称字体颜色"),
  legendSeriesFontStyle: z.string().describe("图例系列名称字体样式"),
  legendSeriesFontWeight: z.string().describe("图例系列名称字体粗细"),
  legendPercentShow: z.boolean().describe("是否显示百分比"),
  legendPercent: z.number().describe("百分比小数位数"),
  legendPercentLeftPadding: z.number().describe("百分比左侧内边距"),
  legendPercentFontFamily: z.string().describe("百分比字体"),
  legendPercentFontSize: z.number().describe("百分比字体大小"),
  legendPercentColor: z.string().describe("百分比字体颜色"),
  legendPercentFontStyle: z.string().describe("百分比字体样式"),
  legendPercentFontWeight: z.string().describe("百分比字体粗细"),
  legendPercentColorFollow: z.boolean().describe("百分比颜色是否跟随"),
  legendValueShow: z.boolean().describe("是否显示数值"),
  legendUnit: z.string().describe("图例单位"),
  legendUnitFontSize: z.number().describe("图例单位字体大小"),
  legendUnitLeftPadding: z.number().describe("图例单位左侧内边距"),
  legendValueLeftPadding: z.number().describe("图例数值左侧内边距"),
  legendValueColorFollow: z.boolean().describe("数值颜色是否跟随"),
  legendValueFontFamily: z.string().describe("图例数值字体"),
  legendValueFontSize: z.number().describe("图例数值字体大小"),
  legendValueColor: z.string().describe("图例数值字体颜色"),
  legendValueFontStyle: z.string().describe("图例数值字体样式"),
  legendValueFontWeight: z.string().describe("图例数值字体粗细"),
  legendOrient: z.enum(["horizontal", "vertical"]).describe("图例排列方向"),
  legendWidth: z.number().describe("图例宽度"),
  legendHeight: z.number().describe("图例高度"),
  legendItemGap: z.number().describe("图例项间距"),
  legendGrid: positionSchema.optional().describe("图例位置"),
  legendOffsetX: z.number().describe("图例X轴偏移"),
  legendOffsetY: z.number().describe("图例Y轴偏移"),
  legendSeriesWidthType: z.string().describe("图例系列宽度类型"),
  legendSeriesWidth: z.number().optional().describe("图例系列宽度"),

  // ============ 饼图特定配置 ============
  pieRadiusOuter: z.number().describe("饼图外半径（百分比）"),
  pieRoseType: z.boolean().describe("是否为玫瑰图"),
  pieRadiusInner: z.number().describe("饼图内半径（百分比）"),
  pieStartAngle: z.number().describe("饼图起始角度"),
  pieClockwise: z.boolean().describe("是否顺时针"),
  itemBorderWidth: z.number().describe("扇区边框宽度"),
  itemBorderColor: z.string().describe("扇区边框颜色"),
  seriesOrder: z.enum(["default", "ascending", "descending"]).describe("系列排序"),
  seriesColor: z.array(z.string()).describe("系列颜色列表"),

  // ============ Tooltip 配置 ============
  tooltipLoop: z.boolean().optional().describe("Tooltip 是否循环"),
  tooltipLoopInterval: z.number().optional().describe("Tooltip 循环间隔（秒）"),
  tooltipTriggerOn: z.boolean().optional().describe("Tooltip 是否触发"),
  tooltipOffsetX: z.number().optional().describe("Tooltip X轴偏移"),
  tooltipOffsetY: z.number().optional().describe("Tooltip Y轴偏移"),
  tooltipBackground: z.string().optional().describe("Tooltip 背景色"),
  tooltipWidth: z.number().optional().describe("Tooltip 宽度"),
  tooltipHeight: z.number().optional().describe("Tooltip 高度"),
  tooltipPaddingTop: z.number().optional().describe("Tooltip 顶部内边距"),
  tooltipPaddingBottom: z.number().optional().describe("Tooltip 底部内边距"),
  tooltipPaddingLeft: z.number().optional().describe("Tooltip 左侧内边距"),
  tooltipPaddingRight: z.number().optional().describe("Tooltip 右侧内边距"),
  tooltipNameFontFamily: z.string().optional().describe("Tooltip 名称字体"),
  tooltipNameFontSize: z.number().optional().describe("Tooltip 名称字体大小"),
  tooltipNameColor: z.string().optional().describe("Tooltip 名称字体颜色"),
  tooltipNameFontWeight: z.string().optional().describe("Tooltip 名称字体粗细"),
  tooltipNameFontStyle: z.string().optional().describe("Tooltip 名称字体样式"),
  tooltipAlign: z.enum(["left", "center", "right"]).optional().describe("Tooltip 对齐方式"),
  tooltipNameOffsetX: z.number().optional().describe("Tooltip 名称X轴偏移"),
  tooltipNameOffsetY: z.number().optional().describe("Tooltip 名称Y轴偏移"),
  tooltipArrLineHeight: z.number().optional().describe("Tooltip 数组行高"),
  tooltipSeriesNameFontFamily: z.string().optional().describe("Tooltip 系列名字体"),
  tooltipSeriesNameFontSize: z.number().optional().describe("Tooltip 系列名字体大小"),
  tooltipSeriesNameColor: z.string().optional().describe("Tooltip 系列名字体颜色"),
  tooltipSeriesNameFontWeight: z.string().optional().describe("Tooltip 系列名字体粗细"),
  tooltipSeriesNameFontStyle: z.string().optional().describe("Tooltip 系列名字体样式"),
  tooltipValueFontFamily: z.string().optional().describe("Tooltip 数值字体"),
  tooltipValueFontSize: z.number().optional().describe("Tooltip 数值字体大小"),
  tooltipValueColor: z.string().optional().describe("Tooltip 数值字体颜色"),
  tooltipValueFontWeight: z.string().optional().describe("Tooltip 数值字体粗细"),
  tooltipValueFontStyle: z.string().optional().describe("Tooltip 数值字体样式"),
  tooltipUnit: z.array(z.string()).optional().describe("Tooltip 单位数组"),
  tooltipUnitFontFamily: z.string().optional().describe("Tooltip 单位字体"),
  tooltipUnitFontSize: z.number().optional().describe("Tooltip 单位字体大小"),
  tooltipUnitColor: z.string().optional().describe("Tooltip 单位字体颜色"),
  tooltipUnitFontWeight: z.string().optional().describe("Tooltip 单位字体粗细"),
  tooltipUnitFontStyle: z.string().optional().describe("Tooltip 单位字体样式"),
  tooltipUnitOffsetX: z.number().optional().describe("Tooltip 单位X轴偏移"),
  tooltipUnitOffsetY: z.number().optional().describe("Tooltip 单位Y轴偏移"),
  tooltipMarkerSize: z.number().optional().describe("Tooltip 标记大小"),
  tooltipAxisPointerWidth: z.number().optional().describe("Tooltip 指示线宽度"),
  tooltipAxisPointerColor: z.string().optional().describe("Tooltip 指示线颜色"),

  // ============ 系列强调效果 ============
  seriesEmphasisScale: z.boolean().optional().describe("是否启用系列强调效果"),
  seriesEmphasisScaleSize: z.number().optional().describe("系列强调效果大小")
});

export type echartpieOption = z.infer<typeof echartpieOptionSchema>;
