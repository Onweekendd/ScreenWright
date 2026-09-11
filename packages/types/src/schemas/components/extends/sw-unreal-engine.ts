import { z } from "zod";

/**
 * UE模板 (ft-unreal-engine)
 * 扩展
 *
 * ## 数据结构
 * 数据字段:
 * - `text` - 文本内容
 */

// 单个数据项的 Schema
const swUnrealEngineDataItemSchema = z.object({
  text: z.string().describe("文本内容")
});

export const swUnrealEngineDataSchema = z.array(swUnrealEngineDataItemSchema);
export type ftUnrealEngineData = z.infer<typeof swUnrealEngineDataSchema>;

export const swUnrealEngineOptionSchema = z.object({
  muted: z.boolean().describe("是否静音"),
  initLoad: z.boolean().describe("是否初始化加载"),
  id: z.string().describe("UE实例ID"),
  url: z.string().describe("UE服务地址"),
  publishPath: z.string().describe("发布路径"),
  cover: z.string().describe("封面图片路径"),
  version: z.string().describe("版本号"),
  sceneJsonPath: z.string().describe("场景JSON配置路径"),
  sceneList: z.array(z.unknown()).describe("场景列表"),
  bluePrintOption: z.array(z.unknown()).describe("蓝图选项列表")
});

export type ftUnrealEngineOption = z.infer<typeof swUnrealEngineOptionSchema>;
