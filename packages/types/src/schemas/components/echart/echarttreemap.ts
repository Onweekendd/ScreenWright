import { z } from "zod";

/**
 * 矩形树图 (echarttreemap)
 * 图表 > 其他
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `name` - 节点名称
 * - `value` - 数值
 * - `children` - 子节点（递归结构）
 *
 * @example
 * ```typescript
 * const data: echarttreemapData = [
 *   {
 *     name: "节点A",
 *     value: 50,
 *     children: [
 *       { name: "节点A-1", value: 10 },
 *       { name: "节点A-2", value: 10 }
 *     ]
 *   },
 *   { name: "节点B", value: 40 }
 * ];
 * ```
 */

// 单个数据项的 Schema（使用 z.lazy 支持递归）
const echarttreemapDataItemSchema: z.ZodType<{
  name: string;
  value: number;
  children?: Array<{
    name: string;
    value: number;
    children?: any;
  }>;
}> = z.lazy(() =>
  z.object({
    name: z.string(),
    value: z.number(),
    children: z.array(z.lazy(() => echarttreemapDataItemSchema)).optional()
  })
);

// 数据数组 Schema（最终导出的类型）
export const echarttreemapDataSchema = z.array(echarttreemapDataItemSchema);

export type echarttreemapData = z.infer<typeof echarttreemapDataSchema>;

/**
 * 矩形树图配置选项 Schema
 */
export const echarttreemapOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 系列配置 ============
  dataSeriesName: z.array(z.string()).describe("数据系列名称列表"),
  seriesTabsName: z.array(z.string()).describe("系列标签页名称"),
  seriesColor: z.array(z.string()).describe("系列颜色列表"),

  // ============ 系列标签配置 ============
  seriesLabelShow: z.boolean().describe("是否显示系列标签"),
  seriesLabelColor: z.string().describe("标签颜色"),
  seriesLabelFontFamily: z.string().describe("标签字体"),
  seriesLabelFontSize: z.number().describe("标签字体大小"),
  seriesLabelFontWeight: z.string().describe("标签字体粗细"),
  seriesLabelFontStyle: z.string().describe("标签字体样式"),

  // ============ 边框配置 ============
  seriesBorderColor: z.string().describe("父节点边框颜色"),
  seriesBorderWidth: z.number().describe("父节点边框宽度"),
  seriesChildBorderColor: z.string().describe("子节点边框颜色"),
  seriesChildBorderWidth: z.number().describe("子节点边框宽度")
});

export type echarttreemapOption = z.infer<typeof echarttreemapOptionSchema>;
