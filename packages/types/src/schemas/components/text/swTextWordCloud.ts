import { z } from "zod";

/**
 * 词云 (ftTextWordCloud)
 * 文字
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `text` - 词语文本
 * - `value` - 权重值（决定显示大小）
 *
 * @example
 * ```typescript
 * const data: FtTextWordCloudData = [
 *   { text: "北京", value: 93 },
 *   { text: "上海", value: 45 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const swTextWordCloudDataItemSchema = z.object({
  text: z.string().describe("词语文本"),
  value: z.number().describe("权重值（决定显示大小）")
});

// 数据数组 Schema
export const swTextWordCloudDataSchema = z.array(swTextWordCloudDataItemSchema);

export type FtTextWordCloudData = z.infer<typeof swTextWordCloudDataSchema>;

// ==================== Option Schema ====================

/**
 * 词云配置选项 Schema
 */
export const swTextWordCloudOptionSchema = z.object({
  // ============ 基础配置 ============
  type: z.string().describe("类型标识"),
  scroll: z.boolean().describe("是否自动旋转"),
  speed: z.number().describe("旋转速度"),
  maxNumber: z.number().describe("最大显示词语数量"),
  dragControl: z.boolean().describe("是否允许鼠标拖拽控制旋转"),

  // ============ 字体配置 ============
  fontFamily: z.string().describe("基础字体"),
  fontSize: z.number().describe("基础字号（最大词语字号）"),
  textFontSize: z.number().describe("最小字号（最小词语字号）"),
  color: z.string().describe("基础颜色"),

  // ============ 颜色配置 ============
  seriesColor: z.array(z.string()).describe("词语颜色数组（循环使用）")
});

export type FtTextWordCloudOption = z.infer<typeof swTextWordCloudOptionSchema>;
