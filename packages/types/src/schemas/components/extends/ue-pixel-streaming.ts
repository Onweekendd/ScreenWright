import { z } from "zod";

/**
 * UE像素流v2 (ue-pixel-streaming)
 * 扩展
 *
 * ## 数据结构
 * 数据字段:
 * - `text` - 文本内容
 */

// 单个数据项的 Schema
const uePixelStreamingDataItemSchema = z.object({
  text: z.string().describe("文本内容")
});

export const uePixelStreamingDataSchema = z.array(uePixelStreamingDataItemSchema);
export type uePixelStreamingData = z.infer<typeof uePixelStreamingDataSchema>;

export const uePixelStreamingOptionSchema = z.object({
  muted: z.boolean().describe("是否静音"),
  initLoad: z.boolean().describe("是否初始化加载"),
  pixelStreamingUrl: z.string().describe("像素流服务地址"),
  cover: z.string().describe("封面图片路径")
});

export type uePixelStreamingOption = z.infer<typeof uePixelStreamingOptionSchema>;
