import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { addAiAsset, type AiAssetInput, largeIdOf } from "@/mastra/services/ai-asset-library";
import { deriveSeed } from "@/mastra/services/image-generation.server";
import { formatErrorChain } from "@/mastra/workflows/figma-to-bi/utils/async";
import { generateImage } from "@/queue/image-client";

import { TOOL_IMAGES_FIELD } from "../provider/image-middleware";

/**
 * 参考图张数上限。方舟、gpt-image 都收得下更多张，但参考图是整张进请求体的（方舟是 base64），
 * 张数一多请求体就大到容易被掐断连接；组合构图 + 风格 + 一两张局部参考，4 张够用。
 */
export const MAX_SEED_IMAGES = 4;

export const createImageTool = createTool({
  id: "createImageTool",
  description:
    "根据提示词生成一张图片，落库并返回可直接引用的 url（不是原始像素/base64）。" +
    "生成大屏效果图/设计稿时，width/height 应该和目标画布一致（通常 1920x1080 起），" +
    "不要用默认的小尺寸——分辨率太低会导致卡片内的文字、数字看不清。" +
    "要基于当前画布的样子生成（如按现有大屏的色调出配套素材、把截图重绘成效果图）时，" +
    "先 capture_canvas 截图，再把返回的 url 放进 seedImages 传进来。" +
    `参考图最多 ${MAX_SEED_IMAGES} 张，可以组合着用（比如一张定构图、一张定风格），在 prompt 里说清每张参考什么（第 1 张…第 2 张…）。` +
    "生成边框 / 卡片底板 / 标题栏这类要贴合组件边缘的素材时，在 prompt 里写明「边框线紧贴画面四条边、四周不留空白」。" +
    "提示词要精炼：部分生图服务限制在 1000 字以内，超长会被拒绝，需要精简后重试。" +
    "返回图片的实际尺寸可能和你要的不完全一致（服务商会取它支持的最接近的尺寸），铺满组件时用 objectFit: fill 即可。" +
    "生成的图会自动放进用户素材库的「AI 生成」分组，所有大屏都能用。",
  inputSchema: z.object({
    screenId: z
      .string()
      .describe(
        '当前大屏，格式 "{screenId}_{versionCode}"（如 "29445_1"），从 editor-context 取；生成的图记在这个大屏的所有者名下'
      ),
    name: z.string().optional().describe("素材名，如「卡片底板」「天空底图」；在素材库里显示用，不传则取提示词开头"),
    // 必须是我们自己 assetStore 里的资源 url（比如之前生成过的图、系统素材库里的图），
    // 不是任意外部图片地址——校验与报错都在 generateAndStoreImage 里做。
    seedImages: z
      .array(z.string())
      .min(1)
      .max(MAX_SEED_IMAGES)
      .optional()
      .describe(
        `可选的参考图 url 列表（img2img，最多 ${MAX_SEED_IMAGES} 张，按顺序发给生图模型；须是本系统 assetStore 里的资源）：` +
          "用户上传的图、之前生成的图，或 capture_canvas 返回的画布截图 url 都可以直接传。每张参考图的宽高比不能超过 16:1"
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
    libraryFileId: z.number().optional().describe("放进素材库后的素材 id；没放进去时为空，原因见 note"),
    note: z.string().optional(),
    [TOOL_IMAGES_FIELD]: z.array(z.object({ url: z.string(), label: z.string() })).optional()
  }),
  // 生图慢（实测豆包一次 40+ 秒），不开 background 会卡住整个 agentic loop 干等。
  background: { enabled: true, timeoutMs: 120_000, maxRetries: 1 },
  execute: async ({ screenId, name, prompt, width, height, seedImages }) => {
    const result = await generateImage({
      prompt,
      seed: deriveSeed(prompt),
      width,
      height,
      seedImageUrls: seedImages
    });
    const library = await saveToLibrary({
      screenId,
      name: name?.trim() || defaultName(prompt),
      url: result.url,
      generatedImageId: result.id,
      referenceUrls: seedImages
    });
    // 图本身不进工具结果（tool 消息带不了图）：写进约定字段，由 inlineImagesMiddleware 在这批 tool 消息
    // 之后补一条 user 图片消息，模型下一步就能直接看到刚生成的图，不用再截图或猜。
    const label = `生成的图片 ${result.width}×${result.height}${result.reused ? "（命中缓存的旧图）" : ""}`;
    return {
      id: result.id,
      url: result.url,
      reused: result.reused,
      ...library,
      [TOOL_IMAGES_FIELD]: [{ url: result.url, label }]
    };
  }
});

/** 素材名缺省取提示词开头：去掉风格前缀之类的标点，截到素材库卡片放得下的长度 */
const defaultName = (prompt: string): string => prompt.replace(/\s+/g, " ").trim().slice(0, 20);

/** 放进素材库只是附带的：失败了图照样返回，原因写进 note 让模型知道 */
async function saveToLibrary({
  screenId,
  ...asset
}: Omit<AiAssetInput, "largeId"> & { screenId: string }): Promise<{ libraryFileId?: number; note?: string }> {
  const largeId = largeIdOf(screenId);
  if (largeId === null) {
    return { note: `screenId 格式不对（${screenId}），图没有放进素材库` };
  }
  try {
    const { id } = await addAiAsset({ ...asset, largeId });
    return { libraryFileId: id };
  } catch (error) {
    console.warn(`[createImageTool] 放进素材库失败：${formatErrorChain(error)}`);
    return { note: `图没有放进素材库：${error instanceof Error ? error.message : String(error)}` };
  }
}
