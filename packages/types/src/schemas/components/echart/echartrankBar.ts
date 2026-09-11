import { z } from "zod";

/**
 * 排名图 (echartrankBar)
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
 * const data: echartrankBarData = [
 *   { name: "范例1", value: 2024 },
 *   { name: "范例2", value: 1920 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartrankBarDataItemSchema = z.object({
  name: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartrankBarDataSchema = z.array(echartrankBarDataItemSchema);

export type echartrankBarData = z.infer<typeof echartrankBarDataSchema>;

/**
 * 排名图配置选项 Schema
 */
export const echartrankBarOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 系列配置 ============
  seriesWidth: z.number().describe("系列宽度"),
  intervalColor: z.string().describe("间隔颜色"),

  // ============ 网格配置 ============
  gridLeft: z.number().describe("网格左边距"),
  gridTop: z.number().describe("网格上边距"),
  gridRight: z.number().describe("网格右边距"),
  gridBottom: z.number().describe("网格下边距"),

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

export type echartrankBarOption = z.infer<typeof echartrankBarOptionSchema>;
