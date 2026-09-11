import { z } from "zod";

/**
 * 雷达图 (echartradar)
 * 图表 > 其他
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `name` - 维度名称
 * - `seriesName` - 系列名称
 * - `value` - 数值
 *
 * @example
 * ```typescript
 * const data: echartradarData = [
 *   { seriesName: "系列一", name: "维度一", value: 20 },
 *   { seriesName: "系列一", name: "维度二", value: 80 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartradarDataItemSchema = z.object({
  name: z.string(),
  seriesName: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartradarDataSchema = z.array(echartradarDataItemSchema);

export type echartradarData = z.infer<typeof echartradarDataSchema>;

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
 * 雷达图配置选项 Schema
 */
export const echartradarOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 系列配置 ============
  dataSeriesName: z.array(z.string()).describe("数据系列名称列表"),
  seriesName: z.array(z.string()).describe("系列名称列表"),
  seriesTabsName: z.array(tabOptionSchema).describe("系列标签页配置"),

  // ============ 雷达图位置配置 ============
  radarCenterX: z.number().describe("雷达图中心X位置（百分比）"),
  radarCenterY: z.number().describe("雷达图中心Y位置（百分比）"),
  radarRadiusMax: z.number().describe("雷达图最大半径（百分比）"),
  radarRadiusMin: z.number().describe("雷达图最小半径（百分比）"),

  // ============ 系列标签配置 ============
  seriesLabelShow: z.boolean().describe("是否显示系列标签"),
  seriesLabelColor: z.string().describe("标签颜色"),
  seriesLabelFontFamily: z.string().describe("标签字体"),
  seriesLabelFontSize: z.number().describe("标签字体大小"),
  seriesLabelFontWeight: z.string().describe("标签字体粗细"),
  seriesLabelFontStyle: z.string().describe("标签字体样式"),
  seriesLabelOffsetX: z.number().describe("标签X轴偏移"),
  seriesLabelOffsetY: z.number().describe("标签Y轴偏移"),

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

  // ============ 雷达图配置 ============
  radarMin: z.number().describe("雷达图最小值"),
  radarMax: z.number().describe("雷达图最大值"),
  radarShape: z.enum(["circle", "polygon"]).describe("雷达图形状"),
  radarNameShow: z.boolean().describe("是否显示雷达图名称"),
  radarNameGap: z.number().describe("雷达图名称间距"),
  radarNameFontFamily: z.string().describe("雷达图名称字体"),
  radarNameFontSize: z.number().describe("雷达图名称字体大小"),
  radarNameColor: z.string().describe("雷达图名称字体颜色"),
  radarNameFontStyle: z.string().describe("雷达图名称字体样式"),
  radarNameFontWeight: z.string().describe("雷达图名称字体粗细"),
  radarLineShow: z.boolean().describe("是否显示雷达图轴线"),
  radarLineColor: z.string().describe("雷达图轴线颜色"),
  radarLineWidth: z.number().describe("雷达图轴线宽度"),
  radarTickShow: z.boolean().describe("是否显示雷达图刻度"),
  radarSplitNumber: z.number().describe("雷达图分割段数"),
  radarTickColor: z.string().describe("雷达图刻度颜色"),
  radarTickWidth: z.number().describe("雷达图刻度宽度"),
  radarTickLength: z.number().describe("雷达图刻度长度"),
  radarLabelShow: z.boolean().describe("是否显示雷达图标签"),
  radarLabelMaxShow: z.boolean().describe("是否显示最大值标签"),
  radarLabelMinShow: z.boolean().describe("是否显示最小值标签"),
  radarLabelMargin: z.number().describe("雷达图标签间距"),
  radarLabelFontFamily: z.string().describe("雷达图标签字体"),
  radarLabelFontSize: z.number().describe("雷达图标签字体大小"),
  radarLabelColor: z.string().describe("雷达图标签字体颜色"),
  radarLabelFontStyle: z.string().describe("雷达图标签字体样式"),
  radarLabelFontWeight: z.string().describe("雷达图标签字体粗细"),
  radarSplitLineShow: z.boolean().describe("是否显示雷达图分割线"),
  radarSplitLineWidth: z.number().describe("雷达图分割线宽度"),
  radarSplitLineColor: z.string().describe("雷达图分割线颜色"),
  radarSplitAreaTabsName: z.array(z.string()).describe("雷达图分割区域标签页名称"),
  radarSplitAreaColor: z.array(z.string()).describe("雷达图分割区域颜色"),

  // ============ 系列线条配置 ============
  seriesLineColor: z.array(z.string()).describe("线条颜色"),
  seriesLineWidth: z.array(z.number()).describe("线条宽度"),
  seriesLineShadowColor: z.array(z.string()).describe("线条阴影颜色"),
  seriesLineShadowOffsetX: z.array(z.number()).describe("线条阴影X偏移"),
  seriesLineShadowOffsetY: z.array(z.number()).describe("线条阴影Y偏移"),
  seriesLineShadowBlur: z.array(z.number()).describe("线条阴影模糊度"),
  seriesLineShadowBlurExtension: z.number().describe("线条阴影模糊扩展"),
  seriesSymbol: z.array(z.string()).describe("标记类型"),
  seriesSymbolImage: z.array(z.string()).describe("标记图片路径"),
  seriesSymbolWidth: z.array(z.number()).describe("标记宽度"),
  seriesSymbolHeight: z.array(z.number()).describe("标记高度"),
  seriesItemColor: z.array(z.string()).describe("数据项颜色"),
  seriesItemBorderWidth: z.array(z.number()).describe("数据项边框宽度"),
  seriesItemBorderColor: z.array(z.string()).describe("数据项边框颜色"),
  seriesAreaColor: z.array(z.string()).describe("面积颜色")
});

export type echartradarOption = z.infer<typeof echartradarOptionSchema>;
