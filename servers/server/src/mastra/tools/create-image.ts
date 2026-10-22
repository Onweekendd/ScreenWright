import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { deriveSeed } from "@/mastra/services/image-generation.server";
import { generateImage } from "@/queue/image-client";

import { TOOL_IMAGES_FIELD } from "../provider/image-middleware";

export const createImageTool = createTool({
  id: "createImageTool",
  description:
    "根据提示词生成一张图片，落库并返回可直接引用的 url（不是原始像素/base64）。" +
    "生成大屏效果图/设计稿时，width/height 应该和目标画布一致（通常 1920x1080 起），" +
    "不要用默认的小尺寸——分辨率太低会导致卡片内的文字、数字看不清。" +
    "要基于当前画布的样子生成（如按现有大屏的色调出配套素材、把截图重绘成效果图）时，" +
    "先 capture_canvas 截图，再把返回的 url 作为 seedImage 传进来。" +
    "生成边框 / 卡片底板 / 标题栏这类要贴合组件边缘的素材时，在 prompt 里写明「边框线紧贴画面四条边、四周不留空白」。" +
    "提示词要精炼：部分生图服务限制在 1000 字以内，超长会被拒绝，需要精简后重试。" +
    "返回图片的实际尺寸可能和你要的不完全一致（服务商会取它支持的最接近的尺寸），铺满组件时用 objectFit: fill 即可。",
  inputSchema: z.object({
    // 必须是我们自己 assetStore 里的资源 url（比如之前生成过的图、系统素材库里的图），
    // 不是任意外部图片地址——校验与报错都在 generateAndStoreImage 里做。
    seedImage: z
      .string()
      .optional()
      .describe(
        "可选的种子图片 url（img2img，须是本系统 assetStore 里的资源）：用户上传的图、之前生成的图，" +
          "或 capture_canvas 返回的画布截图 url 都可以直接传。参考图的宽高比不能超过 16:1"
      ),
    prompt: z.string().min(1).describe("图片生成的提示词"),
    // 默认值改成 1920x1080：512x512 是通用素材图的量级，大屏效果图/设计稿这类要看清
    // 卡片内文字的场景用它做默认值太小了，模型不主动指定尺寸时至少给到 HD 起步。
    width: z.number().positive().default(1920).describe("图片宽度，大屏效果图建议 1920 起"),
    height: z.number().positive().default(1080).describe("图片高度，大屏效果图建议 1080 起")
  }),
  outputSchema: z.object({
    id: z.string().describe("图片记录 id"),
    url: z.string().describe("生成图片的可访问 url"),
    reused: z.boolean().describe("是否命中了已有的同款结果（未重新生成）"),
    [TOOL_IMAGES_FIELD]: z.array(z.object({ url: z.string(), label: z.string() })).optional()
  }),
  // 生图慢（实测豆包一次 40+ 秒），不开 background 会卡住整个 agentic loop 干等。
  background: { enabled: true, timeoutMs: 120_000, maxRetries: 1 },
  execute: async ({ prompt, width, height, seedImage }) => {
    const result = await generateImage({
      prompt,
      seed: deriveSeed(prompt),
      width,
      height,
      seedImageUrl: seedImage
    });
    // 图本身不进工具结果（tool 消息带不了图）：写进约定字段，由 inlineImagesMiddleware 在这批 tool 消息
    // 之后补一条 user 图片消息，模型下一步就能直接看到刚生成的图，不用再截图或猜。
    const label = `生成的图片 ${result.width}×${result.height}${result.reused ? "（命中缓存的旧图）" : ""}`;
    return { id: result.id, url: result.url, reused: result.reused, [TOOL_IMAGES_FIELD]: [{ url: result.url, label }] };
  }
});
