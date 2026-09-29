import { createHash } from "node:crypto";

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { generateAndStoreImage } from "@/mastra/services/image-generation.server";

/**
 * 从 prompt 派生一个稳定的数字 seed，而不是随机生成。
 *
 * 原因：生图这个工具会开 `background`，Mastra 失败后会用同一份 args 重跑 `execute`
 * （见 `background.maxRetries`）。如果 seed 每次调用都随机，`generateAndStoreImage`
 * 里靠 `sha256(prompt+seed+model)` 做的幂等就形同虚设——重试永远打不中缓存，
 * 等于每次重试都真的重新生成一次、重新计费一次。同一份 prompt 派生同一个 seed，
 * 才能让"重试"真正命中已有结果。
 */
// 夹到 int32 正数：方舟要求 seed ≤ 2147483647，GeneratedImage.seed 也是 Prisma Int
const deriveSeed = (prompt: string): number =>
  createHash("sha256").update(prompt).digest().readUInt32BE(0) & 0x7fffffff;

export const createImageTool = createTool({
  id: "createImageTool",
  description:
    "根据提示词生成一张图片，落库并返回可直接引用的 url（不是原始像素/base64）。" +
    "生成大屏效果图/设计稿时，width/height 应该和目标画布一致（通常 1920x1080 起），" +
    "不要用默认的小尺寸——分辨率太低会导致卡片内的文字、数字看不清。",
  inputSchema: z.object({
    // 必须是我们自己 assetStore 里的资源 url（比如之前生成过的图、系统素材库里的图），
    // 不是任意外部图片地址——校验与报错都在 generateAndStoreImage 里做。
    seedImage: z.string().optional().describe("可选的种子图片 url（img2img，须是本系统 assetStore 里的资源）"),
    prompt: z.string().min(1).describe("图片生成的提示词"),
    // 默认值改成 1920x1080：512x512 是通用素材图的量级，大屏效果图/设计稿这类要看清
    // 卡片内文字的场景用它做默认值太小了，模型不主动指定尺寸时至少给到 HD 起步。
    width: z.number().positive().default(1920).describe("图片宽度，大屏效果图建议 1920 起"),
    height: z.number().positive().default(1080).describe("图片高度，大屏效果图建议 1080 起")
  }),
  outputSchema: z.object({
    id: z.string().describe("图片记录 id；要把这张图交给 screenFromEffectImageWorkflow 时传它当 imageId"),
    url: z.string().describe("生成图片的可访问 url"),
    reused: z.boolean().describe("是否命中了已有的同款结果（未重新生成）")
  }),
  // 生图慢（实测豆包一次 40+ 秒），不开 background 会卡住整个 agentic loop 干等。
  background: { enabled: true, timeoutMs: 120_000, maxRetries: 1 },
  execute: async ({ prompt, width, height, seedImage }) => {
    const result = await generateAndStoreImage({
      prompt,
      seed: deriveSeed(prompt),
      width,
      height,
      seedImageUrl: seedImage
    });
    return { id: result.id, url: result.url, reused: result.reused };
  }
});
