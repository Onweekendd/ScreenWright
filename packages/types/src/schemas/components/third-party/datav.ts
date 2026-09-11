import { z } from "zod";

/**
 * datav (datav)
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
 * const data: DatavData = [
 *   {
 *     categories: ["苹果", "三星", "小米"],
 *     series: [{ name: "手机品牌", data: [100, 340, 230] }]
 *   }
 * ];
 * ```
 */

// 系列数据项的 Schema
const datavSeriesItemSchema = z.object({
  name: z.string().describe("系列名称"),
  data: z.array(z.number()).describe("系列数据值数组")
});

// 单个数据项的 Schema
const datavDataItemSchema = z.object({
  categories: z.array(z.string()).describe("类目数组"),
  series: z.array(datavSeriesItemSchema).describe("系列数据数组")
});

// 数据数组 Schema
export const datavDataSchema = z.array(datavDataItemSchema);

export type DatavData = z.infer<typeof datavDataSchema>;

// ==================== Option Schema ====================

/**
 * datav配置选项 Schema
 */
export const datavOptionSchema = z.object({
  // ============ 组件标识 ============
  is: z.string().describe("DataV组件名称标识，如 dv-water-level-pond"),

  // ============ 配置代码 ============
  echartFormatter: z.string().describe("DataV配置替换代码，用于输出config或option等配置对象")
});

export type DatavOption = z.infer<typeof datavOptionSchema>;
