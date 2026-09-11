import { z } from "zod";

/**
 * 图片墙 (ftPeriodictable)
 * 指标
 *
 * ## 数据结构
 *
 * 无数据字段（data 为空数组）。
 *
 * @example
 * ```typescript
 * const data: ftPeriodictableData = [];
 * ```
 */

// 数据数组 Schema（图片墙无数据字段）
export const swPeriodictableDataSchema = z.array(z.object({}));

export type ftPeriodictableData = z.infer<typeof swPeriodictableDataSchema>;

// 单个图片配置
const imageItemSchema = z.object({
  url: z.string().describe("图片地址")
});

/**
 * 图片墙配置选项 Schema
 */
export const swPeriodictableOptionSchema = z.object({
  // ============ 图片列表配置 ============
  images: z.array(imageItemSchema).describe("图片列表，每项包含图片地址"),

  // ============ 布局配置 ============
  offsetX: z.number().describe("整体水平偏移量"),
  offsetY: z.number().describe("整体垂直偏移量"),
  rows: z.number().describe("每行显示的图片数量"),
  imageWidth: z.number().describe("单张图片宽度"),
  imageHeight: z.number().describe("单张图片高度"),
  rowSpace: z.number().describe("行间距"),
  columnSpace: z.number().describe("列间距"),
  duration: z.number().describe("动画切换间隔时间（毫秒）")
});

export type ftPeriodictableOption = z.infer<typeof swPeriodictableOptionSchema>;
