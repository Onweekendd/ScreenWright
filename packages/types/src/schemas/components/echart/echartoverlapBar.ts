import { z } from "zod";

/**
 * 堆叠占比图 (echartoverlapBar)
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
 * const data: echartoverlapBarData = [
 *   { seriesName: "系列一", name: "1小时内等时圈", value: 7.31 },
 *   { seriesName: "系列一", name: "2小时内等时圈", value: 34.2 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartoverlapBarDataItemSchema = z.object({
  name: z.string(),
  seriesName: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartoverlapBarDataSchema = z.array(echartoverlapBarDataItemSchema);

export type echartoverlapBarData = z.infer<typeof echartoverlapBarDataSchema>;

/**
 * 堆叠占比图配置选项 Schema
 */
export const echartoverlapBarOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 系列配置 ============
  seriesWidth: z.array(z.number()).describe("柱体宽度（各系列）"),
  seriesTabsName: z.array(z.string()).describe("系列标签页配置"),
  barBodyColor: z.array(z.object({
    type: z.string().optional(),
    angle: z.union([z.number(), z.string()]).optional(),
    colors: z.array(z.object({
      color: z.union([z.string(), z.number()]),
      per: z.number().optional()
    })).optional()
  }).passthrough()).describe("柱体颜色（各系列）"),
  barBodyOpacity: z.array(z.number()).describe("柱体透明度（各系列）"),
  barBorderColor: z.string().describe("边框颜色"),
  borderWidth: z.number().describe("边框大小"),

  // ============ 数值标签配置 ============
  valueShow: z.array(z.boolean()).describe("是否显示数值标签（各系列）"),
  valueFontFamily: z.array(z.string()).describe("数值标签字体（各系列）"),
  valueFontSize: z.array(z.number()).describe("数值标签字体大小（各系列）"),
  valueColor: z.array(z.string()).describe("数值标签字体颜色（各系列）"),
  valueFontStyle: z.array(z.string()).describe("数值标签字体样式（各系列）"),
  valueFontWeight: z.array(z.string()).describe("数值标签字体粗细（各系列）"),
  valueOffSetX: z.array(z.number()).describe("数值标签X偏移（各系列）"),
  valueOffSetY: z.array(z.number()).describe("数值标签Y偏移（各系列）"),

  // ============ 分隔线配置（系列1）============
  splitLineFontSize: z.number().describe("分隔线大小"),
  splitLineColor: z.string().describe("分隔线颜色"),

  // ============ 网格配置 ============
  gridLeft: z.number().describe("网格左边距"),
  gridTop: z.number().describe("网格上边距"),
  gridRight: z.number().describe("网格右边距"),
  gridBottom: z.number().describe("网格下边距"),

  // ============ Y轴标签配置 ============
  yAxisLabelShow: z.boolean().optional().describe("是否显示Y轴标签"),
  yAxisFontFamily: z.string().optional().describe("Y轴标签字体"),
  yAxisFontSize: z.number().optional().describe("Y轴标签字体大小"),
  yAxisColor: z.string().optional().describe("Y轴标签字体颜色"),
  yAxisFontStyle: z.string().optional().describe("Y轴标签字体样式"),
  yAxisFontWeight: z.string().optional().describe("Y轴标签字体粗细"),

  // ============ 名称标签配置 ============
  nameFontFamily: z.string().describe("名称标签字体"),
  nameFontSize: z.number().describe("名称标签字体大小"),
  nameColor: z.string().describe("名称标签字体颜色"),
  nameFontStyle: z.string().describe("名称标签字体样式"),
  nameFontWeight: z.string().describe("名称标签字体粗细"),
  nameWidth: z.number().describe("名称标签宽度"),
  nameLeftPadding: z.number().describe("名称标签左侧内边距"),

  // ============ X轴分割线配置 ============
  xAxisSplitLineShow: z.boolean().describe("是否显示X轴分割线"),
  xAxisSplitLineWidth: z.number().describe("X轴分割线宽度"),
  xAxisSplitLineColor: z.string().describe("X轴分割线颜色"),

  // ============ 数据循环配置 ============
  dataLoop: z.boolean().describe("是否启用数据循环"),
  dataLoopInterval: z.number().describe("数据循环间隔（秒）"),
  dataLoopDisplayRows: z.number().describe("数据循环显示行数"),
  dataLoopRollNum: z.number().describe("数据循环滚动数量"),

  // ============ 间隔颜色配置 ============
  intervalColor: z.string().describe("间隔颜色")
});

export type echartoverlapBarOption = z.infer<typeof echartoverlapBarOptionSchema>;
