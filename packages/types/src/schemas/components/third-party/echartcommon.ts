import { z } from "zod";

/**
 * Echarts通用型 (echartcommon)
 * 第三方
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `categories` - 类目数组
 * - `series` - 系列数组，每项包含 name 和 data
 *
 * @example
 * ```typescript
 * const data: EchartcommonData = [
 *   {
 *     categories: ["Mon", "Tue", "Wed"],
 *     series: [
 *       { name: "系列一", data: [10, 30, 20] },
 *       { name: "系列二", data: [10, 30, 20] }
 *     ]
 *   }
 * ];
 * ```
 */

// 系列数据项的 Schema
const echartcommonSeriesItemSchema = z.object({
  name: z.string().describe("系列名称"),
  data: z.array(z.number()).describe("系列数据值数组")
});

// 单个数据项的 Schema
const echartcommonDataItemSchema = z.object({
  categories: z.array(z.string()).describe("类目数组"),
  series: z.array(echartcommonSeriesItemSchema).describe("系列数据数组")
});

// 数据数组 Schema
export const echartcommonDataSchema = z.array(echartcommonDataItemSchema);

export type EchartcommonData = z.infer<typeof echartcommonDataSchema>;

// ==================== Option Schema ====================

/**
 * Echarts通用型配置选项 Schema
 */
export const echartcommonOptionSchema = z.object({
  // ============ 配置代码 ============
  echartFormatter: z.string().describe("Echarts配置替换代码，用于输出完整的Echarts option配置对象")
});

export type EchartcommonOption = z.infer<typeof echartcommonOptionSchema>;
