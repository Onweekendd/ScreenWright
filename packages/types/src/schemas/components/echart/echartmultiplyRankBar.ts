import { z } from "zod";

/**
 * 总数排名图 (echartmultiplyRankBar)
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
 * const data: echartmultiplyRankBarData = [
 *   { seriesName: "系列一", name: "范例1", value: 19 },
 *   { seriesName: "系列二", name: "范例1", value: 22 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartmultiplyRankBarDataItemSchema = z.object({
  name: z.string(),
  seriesName: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartmultiplyRankBarDataSchema = z.array(echartmultiplyRankBarDataItemSchema);

export type echartmultiplyRankBarData = z.infer<typeof echartmultiplyRankBarDataSchema>;

// Tab 选项配置
const tabOptionSchema = z.object({
  name: z.string(),
  value: z.string()
});

// 渐变颜色配置
const gradientColorSchema = z.object({
  type: z.string().optional(),
  angle: z.union([z.number(), z.string()]).optional(),
  colors: z.array(z.object({
    color: z.union([z.string(), z.number()]),
    per: z.number().optional()
  })).optional()
}).passthrough();

// 位置配置
const positionSchema = z.object({
  top: z.union([z.number(), z.string()]).optional(),
  left: z.union([z.number(), z.string()]).optional(),
  bottom: z.union([z.number(), z.string()]).optional(),
  right: z.union([z.number(), z.string()]).optional()
});

/**
 * 总数排名图配置选项 Schema
 */
export const echartmultiplyRankBarOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 系列配置 ============
  dataSeriesName: z.array(z.string()).describe("数据系列名称列表"),
  seriesName: z.array(z.string()).describe("系列名称列表"),
  seriesTabsName: z.array(tabOptionSchema).describe("系列标签页配置"),
  seriesColor: z.array(gradientColorSchema).describe("系列颜色配置（渐变）"),
  seriesWidth: z.number().describe("系列宽度"),
  intervalColor: z.string().describe("间隔颜色"),

  // ============ 网格配置 ============
  gridLeft: z.number().describe("网格左边距"),
  gridTop: z.number().describe("网格上边距"),
  gridRight: z.number().describe("网格右边距"),
  gridBottom: z.number().describe("网格下边距"),

  // ============ 图例配置 ============
  legendShow: z.boolean().describe("是否显示图例"),
  legendOrient: z.enum(["horizontal", "vertical"]).describe("图例排列方向"),
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

  // ============ 数值标签配置 ============
  valueShow: z.boolean().describe("是否显示数值标签"),
  valueFontFamily: z.string().describe("数值标签字体"),
  valueFontSize: z.number().describe("数值标签字体大小"),
  valueColor: z.string().describe("数值标签字体颜色"),
  valueFontStyle: z.string().describe("数值标签字体样式"),
  valueFontWeight: z.string().describe("数值标签字体粗细"),
  valueOffSetX: z.number().describe("数值标签X偏移"),
  valueOffSetY: z.number().describe("数值标签Y偏移"),

  // ============ 名称标签配置 ============
  nameFontFamily: z.string().describe("名称标签字体"),
  nameFontSize: z.number().describe("名称标签字体大小"),
  nameColor: z.string().describe("名称标签字体颜色"),
  nameFontStyle: z.string().describe("名称标签字体样式"),
  nameFontWeight: z.string().describe("名称标签字体粗细"),
  nameWidth: z.number().describe("名称标签宽度"),
  nameLeftPadding: z.number().describe("名称标签左侧内边距"),

  // ============ 数据循环配置 ============
  dataLoop: z.boolean().describe("是否启用数据循环"),
  dataLoopInterval: z.number().describe("数据循环间隔（秒）"),
  dataLoopDisplayRows: z.number().describe("数据循环显示行数"),
  dataLoopRollNum: z.number().describe("数据循环滚动数量")
});

export type echartmultiplyRankBarOption = z.infer<typeof echartmultiplyRankBarOptionSchema>;
