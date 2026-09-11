import { z } from "zod";

/**
 * UE容器beta (ue-vessel)
 * 扩展
 *
 * ## 数据结构
 * 数据字段:
 * - `text` - 文本内容
 */

// 单个数据项的 Schema
const ueVesselDataItemSchema = z.object({
  text: z.string().describe("文本内容")
});

export const ueVesselDataSchema = z.array(ueVesselDataItemSchema);
export type ueVesselData = z.infer<typeof ueVesselDataSchema>;

export const ueVesselOptionSchema = z.object({
  msgName: z.string().describe("消息通道名称"),
  fontSize: z.number().describe("字号"),
  fontWeight: z.boolean().describe("是否加粗"),
  fontStyle: z.boolean().describe("是否斜体"),
  fontFamily: z.string().describe("字体"),
  fontColor: z.string().describe("字体颜色"),
  backgroundColor: z.string().describe("背景颜色")
});

export type ueVesselOption = z.infer<typeof ueVesselOptionSchema>;
