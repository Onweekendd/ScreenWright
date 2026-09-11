import { z } from "zod";

/**
 * UE像素流beta (ue-peer-streaming)
 * 扩展
 *
 * ## 数据结构
 * 数据字段:
 * - `text` - 文本内容
 */

// 单个数据项的 Schema
const uePeerStreamingDataItemSchema = z.object({
  text: z.string().describe("文本内容")
});

export const uePeerStreamingDataSchema = z.array(uePeerStreamingDataItemSchema);
export type uePeerStreamingData = z.infer<typeof uePeerStreamingDataSchema>;

export const uePeerStreamingOptionSchema = z.object({
  muted: z.boolean().describe("是否静音"),
  initLoad: z.boolean().describe("是否初始化加载"),
  pixelStreamingUrl: z.string().describe("像素流服务地址"),
  cover: z.string().describe("封面图片路径")
});

export type uePeerStreamingOption = z.infer<typeof uePeerStreamingOptionSchema>;
