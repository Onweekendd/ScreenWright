import { z } from "zod";

/**
 * 语音控件beta (ft-voice-control)
 * 交互
 *
 * ## 数据结构
 * 数据字段:
 * - `value` - 文本内容（语音识别结果）
 *
 * @example
 * ```typescript
 * const data: ftVoiceControlData = [
 *   { value: "" }
 * ];
 * ```
 */

// 单个数据项的 Schema
const swVoiceControlDataItemSchema = z.object({
  value: z.string().describe("文本内容")
});

export const swVoiceControlDataSchema = z.array(swVoiceControlDataItemSchema);
export type ftVoiceControlData = z.infer<typeof swVoiceControlDataSchema>;

/**
 * 语音控件配置选项 Schema
 */
export const swVoiceControlOptionSchema = z.object({
  asrUrl: z.string().describe("语音识别服务地址"),
  isWakeUp: z.boolean().describe("是否启用唤醒词"),
  wakeUpWord: z.string().describe("唤醒词"),
  hotwords: z.string().describe("热词列表"),
  mode: z.string().describe("识别模式"),
  itn: z.boolean().describe("是否启用逆文本归一化"),
  showResult: z.boolean().describe("是否显示识别结果"),
  wav_name: z.string().describe("音频名称"),
  is_speaking: z.boolean().describe("是否正在说话"),
  chunk_size: z.array(z.number()).describe("音频块大小"),
  chunk_interval: z.number().describe("音频块间隔"),
  voiceImg: z.string().describe("语音按钮默认图片"),
  voiceStartImg: z.string().describe("语音按钮激活图片")
});

export type ftVoiceControlOption = z.infer<typeof swVoiceControlOptionSchema>;
