import { z } from "zod";

/**
 * 数据容器 (ft-dataContainer)
 * 扩展
 *
 * ## 数据结构
 * 数据字段:
 * - `text` - 文本内容
 */

// 单个数据项的 Schema
const swDataContainerDataItemSchema = z.object({
  text: z.string().describe("文本内容")
});

export const swDataContainerDataSchema = z.array(swDataContainerDataItemSchema);
export type ftDataContainerData = z.infer<typeof swDataContainerDataSchema>;

export const swDataContainerOptionSchema = z.object({
  text: z.string().describe("文本内容"),
  fontFamily: z.string().describe("字体"),
  fontSize: z.number().describe("字号"),
  color: z.string().describe("字体颜色"),
  fontStyle: z.string().describe("字体样式"),
  fontWeight: z.string().describe("字重"),
  backgroundColor: z.string().describe("背景颜色")
});

export type ftDataContainerOption = z.infer<typeof swDataContainerOptionSchema>;
