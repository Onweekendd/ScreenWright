import { z } from "zod";

/**
 * 音频 (ft-embed-audio)
 * 媒体
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `value` - 音频地址
 *
 * @example
 * ```typescript
 * const data: FtEmbedAudioData = [
 *   { value: "audio.mp3" }
 * ];
 * ```
 */

// Single data item Schema
const swEmbedAudioDataItemSchema = z.object({
  value: z.string().describe("音频地址")
});

// Data array Schema
export const swEmbedAudioDataSchema = z.array(swEmbedAudioDataItemSchema);

export type FtEmbedAudioData = z.infer<typeof swEmbedAudioDataSchema>;

// ==================== Option Schema ====================

/**
 * 音频配置选项 Schema
 */
export const swEmbedAudioOptionSchema = z.object({
  // ============ 播放控制 ============
  url: z.string().describe("音频地址"),
  controler: z.boolean().describe("是否显示播放控件"),
  autoPlay: z.boolean().describe("是否自动播放"),
  loopPlay: z.boolean().describe("是否循环播放"),
  autoHidden: z.boolean().describe("是否自动隐藏控件")
});

export type FtEmbedAudioOption = z.infer<typeof swEmbedAudioOptionSchema>;
