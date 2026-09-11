import { z } from "zod";

/**
 * h5player (ftH5player)
 * 媒体
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `value` - 视频流地址
 *
 * @example
 * ```typescript
 * const data: FtH5playerData = [
 *   { value: "ws://222.75.96.94:559/openUrl/mvPxVGE" }
 * ];
 * ```
 */

// Single data item Schema
const swH5playerDataItemSchema = z.object({
  value: z.string().describe("视频流地址")
});

// Data array Schema
export const swH5playerDataSchema = z.array(swH5playerDataItemSchema);

export type FtH5playerData = z.infer<typeof swH5playerDataSchema>;

// ==================== Option Schema ====================

/**
 * h5player配置选项 Schema
 */
export const swH5playerOptionSchema = z.object({
  // ============ 边框配置 ============
  borderSelect: z.string().describe("选中边框颜色"),
  borderWidth: z.number().describe("边框宽度"),
  border: z.string().describe("边框颜色"),

  // ============ 背景配置 ============
  background: z.string().describe("背景颜色"),

  // ============ 分屏配置 ============
  splitNum: z.number().describe("分屏数量")
});

export type FtH5playerOption = z.infer<typeof swH5playerOptionSchema>;
