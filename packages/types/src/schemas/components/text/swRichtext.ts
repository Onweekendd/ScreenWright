import { z } from "zod";

/**
 * 富文本 (ftRichtext)
 * 文字
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `value` - 富文本HTML内容
 *
 * @example
 * ```typescript
 * const data: FtRichtextData = [
 *   { value: "<p>这是<strong>富文本</strong>内容</p>" }
 * ];
 * ```
 */

// 单个数据项的 Schema
const swRichtextDataItemSchema = z.object({
  value: z.string().describe("富文本HTML内容")
});

// 数据数组 Schema
export const swRichtextDataSchema = z.array(swRichtextDataItemSchema);

export type FtRichtextData = z.infer<typeof swRichtextDataSchema>;

// ==================== Option Schema ====================

/**
 * 富文本配置选项 Schema
 */
export const swRichtextOptionSchema = z.object({
  // ============ 内容配置 ============
  content: z.string().describe("富文本HTML内容"),

  // ============ 文字动画配置 ============
  textAnimationType: z.string().describe("动画类型"),
  textAnimationTiming: z.number().describe("动画速度"),
  textAnimationDelay: z.number().describe("动画延迟(ms)"),

  // ============ 滚动配置 ============
  startScroll: z.boolean().describe("是否开启滚动"),
  scrollLoop: z.boolean().describe("是否循环滚动"),
  scrollInterval: z.number().describe("滚动间隔")
});

export type FtRichtextOption = z.infer<typeof swRichtextOptionSchema>;
