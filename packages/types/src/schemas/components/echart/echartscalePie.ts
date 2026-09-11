import { z } from "zod";

/**
 * 刻度饼图 (echartscalePie)
 * 图表 > 项目
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `seriesName` - 系列名称
 * - `value` - 数值
 *
 * @example
 * ```typescript
 * const data: echartscalePieData = [
 *   { seriesName: "系列一", value: 92 },
 *   { seriesName: "系列二", value: 15 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartscalePieDataItemSchema = z.object({
  seriesName: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartscalePieDataSchema = z.array(echartscalePieDataItemSchema);

export type echartscalePieData = z.infer<typeof echartscalePieDataSchema>;

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

// 位置配置
const positionSchema = z.object({
  top: z.union([z.number(), z.string()]),
  left: z.union([z.number(), z.string()]).optional(),
  bottom: z.union([z.number(), z.string()]).optional(),
  right: z.union([z.number(), z.string()]).optional()
});

/**
 * 刻度饼图配置选项 Schema
 */
export const echartscalePieOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 系列配置 ============
  dataSeriesName: z.array(z.string()).describe("数据系列名称列表"),
  seriesName: z.array(z.string()).describe("系列名称列表"),
  seriesTabsName: z.array(tabOptionSchema).describe("系列标签页配置"),
  seriesColor: z.array(gradientColorSchema).describe("系列颜色配置（渐变）"),
  seriesOpacity: z.array(z.number()).describe("系列透明度（0-100）"),

  // ============ 饼图位置配置 ============
  pieCenterX: z.number().describe("饼图中心X位置（百分比）"),
  pieCenterY: z.number().describe("饼图中心Y位置（百分比）"),
  pieRadiusMax: z.number().describe("饼图最大半径（百分比）"),
  pieRadiusMin: z.number().describe("饼图最小半径（百分比）"),

  // ============ 刻度环配置 ============
  gaugeShow: z.boolean().describe("是否显示刻度环"),
  gaugeRadius: z.number().describe("刻度环半径（百分比）"),
  gaugeLength: z.number().describe("刻度环长度"),
  gaugeCenterX: z.number().describe("刻度环中心X位置（百分比）"),
  gaugeCenterY: z.number().describe("刻度环中心Y位置（百分比）"),
  gaugeColor: z.string().describe("刻度环颜色"),

  // ============ 系列标签配置 ============
  seriesLabelShow: z.boolean().describe("是否显示系列标签"),
  seriesDistanceToLabelLine: z.number().describe("标签线距离"),
  seriesLabelLineLength: z.number().describe("标签线长度"),
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
  legendItemWidthAndHeight: z.number().describe("图例项宽度和高度"),
  legendTextLeftPadding: z.number().describe("图例文字左侧内边距"),
  legendFontFamily: z.string().describe("图例字体名称"),
  legendFontSize: z.number().describe("图例字体大小"),
  legendColor: z.string().describe("图例字体颜色"),
  legendFontStyle: z.string().describe("图例字体样式"),
  legendFontWeight: z.string().describe("图例字体粗细"),
  legendOrient: z.enum(["horizontal", "vertical"]).describe("图例排列方向"),
  legendWidth: z.number().describe("图例宽度"),
  legendHeight: z.number().describe("图例高度"),
  legendItemGap: z.number().describe("图例项间距"),
  legendGrid: positionSchema.describe("图例位置"),
  legendOffsetX: z.number().describe("图例X轴偏移"),
  legendOffsetY: z.number().describe("图例Y轴偏移")
});

export type echartscalePieOption = z.infer<typeof echartscalePieOptionSchema>;
