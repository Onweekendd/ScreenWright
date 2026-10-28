import { z } from "zod";

/**
 * 生图入参的唯一定义：服务层的类型、队列任务的运行时校验都从这里来。
 * 以前接口和队列 schema 各写一份，漏改一边时新字段会在 worker 的 parse 里被 zod 悄悄剔掉。
 */
export const ImageGenerationInputSchema = z.object({
  /** 结构化 prompt 原文（画布/风格/布局/区域内容/文字白名单/禁止，见 docs/生图到大屏工作流.md §5） */
  prompt: z.string().min(1),
  /** 幂等键的一部分，调用方必须显式给出——同一个 seed+prompt+model 视为"同一张图" */
  seed: z.number().int(),
  width: z.number().positive(),
  height: z.number().positive(),
  /**
   * img2img 参考图，可以多张（如效果图 + 一张风格参考），按顺序发给服务商。
   * **必须是我们自己 assetStore 里的资源 url**，不是任意外部图片——
   * 用 `assetStore().keyFromUrl()` 反查 key 再读字节，查不到直接报错，不做"顺便下载
   * 一个外部 url"这种静默兜底（外部图片来源不可控，也绕开了我们自己的存储审计）。
   */
  seedImageUrls: z.array(z.string()).optional(),
  /** 对话选的生图配置 id；为空用默认配置。只传 id 不传密钥：任务数据会进 Redis */
  modelConfigId: z.string().optional()
});

export type GenerateImageInput = z.infer<typeof ImageGenerationInputSchema>;
