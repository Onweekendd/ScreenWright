import { z } from "zod";

/**
 * 漏斗图 (echartfunnel)
 * 图表 > 其他
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `seriesName` - 系列名称
 * - `value` - 数值
 *
 * @example
 * ```typescript
 * const data: echartfunnelData = [
 *   { seriesName: "系列一", value: 200 },
 *   { seriesName: "系列二", value: 150 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartfunnelDataItemSchema = z.object({
  seriesName: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartfunnelDataSchema = z.array(echartfunnelDataItemSchema);

export type echartfunnelData = z.infer<typeof echartfunnelDataSchema>;

// Tab 选项配置
const tabOptionSchema = z.object({
  name: z.string(),
  value: z.string()
});

// 位置配置
const positionSchema = z.object({
  top: z.union([z.number(), z.string()]),
  left: z.union([z.number(), z.string()])
});

/**
 * 漏斗图配置选项 Schema
 */
export const echartfunnelOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),
  radius: z.boolean().describe("是否为漏斗形状"),

  // ============ 系列配置 ============
  dataSeriesName: z.array(z.string()).describe("数据系列名称列表"),
  seriesName: z.array(z.string()).describe("系列名称列表"),
  seriesTabsName: z.array(tabOptionSchema).describe("系列标签页配置"),
  seriesColor: z.array(z.string()).describe("系列颜色列表"),

  // ============ 漏斗配置 ============
  barGap: z.number().describe("项间距（百分比）"),
  barCategoryGap: z.number().describe("类目间距离（百分比）"),
  seriesOrient: z.enum(["vertical", "horizontal"]).describe("漏斗方向"),
  seriesSort: z.enum(["ascending", "descending", "none"]).describe("漏斗排序方式"),
  seriesGap: z.number().describe("数据项间距"),
  seriesFunnelAlign: z.enum(["left", "center", "right"]).describe("漏斗对齐方式"),
  labelPosition: z.enum(["left", "center", "right", "top", "bottom", "inside", "insideLeft", "insideRight"]).describe("标签位置"),
  borderShow: z.boolean().describe("是否显示边框"),
  borderColor: z.string().describe("边框颜色"),
  borderWidth: z.number().describe("边框宽度"),

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

  // ============ 系列标签配置 ============
  seriesLabelShow: z.boolean().describe("是否显示系列标签"),
  seriesLabelColor: z.string().describe("标签颜色"),
  seriesLabelFontFamily: z.string().describe("标签字体"),
  seriesLabelFontSize: z.number().describe("标签字体大小"),
  seriesLabelFontWeight: z.string().describe("标签字体粗细"),
  seriesLabelFontStyle: z.string().describe("标签字体样式")
});

export type echartfunnelOption = z.infer<typeof echartfunnelOptionSchema>;
