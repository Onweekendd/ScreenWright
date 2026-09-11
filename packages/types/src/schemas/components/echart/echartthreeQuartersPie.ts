import { z } from "zod";

/**
 * 环形饼图 (echartthreeQuartersPie)
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
 * const data: echartthreeQuartersPieData = [
 *   { seriesName: "系列一", value: 2024 },
 *   { seriesName: "系列二", value: 1423 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartthreeQuartersPieDataItemSchema = z.object({
  seriesName: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartthreeQuartersPieDataSchema = z.array(echartthreeQuartersPieDataItemSchema);

export type echartthreeQuartersPieData = z.infer<typeof echartthreeQuartersPieDataSchema>;

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
 * 环形饼图配置选项 Schema
 */
export const echartthreeQuartersPieOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 饼图半径配置 ============
  pieRadiusOuter: z.number().describe("饼图外半径（百分比）"),

  // ============ 系列配置 ============
  dataSeriesName: z.array(z.string()).describe("数据系列名称列表"),
  seriesName: z.array(z.string()).describe("系列名称列表"),
  seriesTabsName: z.array(tabOptionSchema).describe("系列标签页配置"),
  seriesColor: z.array(gradientColorSchema).describe("系列颜色配置（渐变）"),
  seriesOrder: z.enum(["default", "ascending", "descending"]).describe("系列排序"),
  seriesOpacity: z.array(z.number()).describe("系列透明度（0-100）"),
  seriesOffsetX: z.number().describe("系列X轴偏移"),
  seriesOffsetY: z.number().describe("系列Y轴偏移"),
  seriesRemainColor: z.string().describe("剩余部分颜色"),
  seriesBottomColor: z.string().describe("底部颜色"),

  // ============ 系列标签配置 ============
  seriesLabelShow: z.boolean().describe("是否显示系列标签"),
  seriesLabelFontFamily: z.string().describe("标签字体"),
  seriesLabelFontSize: z.number().describe("标签字体大小"),
  seriesLabelColor: z.string().describe("标签颜色"),
  seriesLabelFontStyle: z.string().describe("标签字体样式"),
  seriesLabelFontWeight: z.string().describe("标签字体粗细"),
  seriesLabelOffsetX: z.number().describe("标签X轴偏移"),
  seriesLabelOffsetY: z.number().describe("标签Y轴偏移"),

  // ============ 图例配置 ============
  legendShow: z.boolean().describe("是否显示图例"),
  legendItemWidthHeight: z.number().describe("图例项宽度和高度"),
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
  legendItemGap: z.number().describe("图例项间距"),
  legendOffsetX: z.number().describe("图例X轴偏移"),
  legendOffsetY: z.number().describe("图例Y轴偏移"),
  legendUnderlineShow: z.boolean().describe("是否显示下划线"),
  legendUnderlineWidth: z.number().describe("下划线宽度"),
  legendUnderlineInterval: z.number().describe("下划线间隔"),
  legendUnderlineOffsetX: z.number().describe("下划线X轴偏移"),
  legendUnderlineOffsetY: z.number().describe("下划线Y轴偏移")
});

export type echartthreeQuartersPieOption = z.infer<typeof echartthreeQuartersPieOptionSchema>;
