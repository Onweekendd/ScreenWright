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
  // ============ JSON 主通道 ============
  echartsOption: z
    .record(z.string(), z.unknown())
    .describe("原生 ECharts option，不含数据；数据由 dataset.source 注入，series 用 encode 引用列")
    .optional(),
  // ============ 配置代码（兜底） ============
  echartFormatter: z
    .string()
    .describe(
      "可选。在 echartsOption 基础上再加工，仅在 JSON 表达不了时使用；无 echartsOption 时按 (dataChart) => option 调用，有则按 (dataChart, option) => option 调用"
    )
    .optional()
});

export type EchartcommonOption = z.infer<typeof echartcommonOptionSchema>;
