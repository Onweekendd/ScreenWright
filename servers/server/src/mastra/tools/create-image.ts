import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { addAiAsset, type AiAssetInput, largeIdOf } from "@/mastra/services/ai-asset-library";
import { trackGeneration } from "@/mastra/services/generation-progress";
import { deriveSeed } from "@/mastra/services/image-generation.server";
import { formatErrorChain } from "@/mastra/workflows/figma-to-bi/utils/async";
import { generateImage } from "@/queue/image-client";

import { TOOL_IMAGES_FIELD } from "../provider/image-middleware";

/**
 * 参考图张数上限。方舟、gpt-image 都收得下更多张，但参考图是整张进请求体的（方舟是 base64），
 * 张数一多请求体就大到容易被掐断连接；组合构图 + 风格 + 一两张局部参考，4 张够用。
 */
export const MAX_SEED_IMAGES = 4;

/** 一次调用最多生成几张：和服务商并发上限、一次对话里要看的图的数量对得上即可，再多就该分批 */
export const MAX_BATCH_IMAGES = 8;

const imageItemSchema = z.object({
  name: z.string().optional().describe("素材名，如「卡片底板」「天空底图」；在素材库里显示用，不传则取提示词开头"),
  prompt: z.string().min(1).describe("这张图的提示词"),
  // 必须是我们自己 assetStore 里的资源 url（比如之前生成过的图、系统素材库里的图），
  // 不是任意外部图片地址——校验与报错都在 generateAndStoreImage 里做。
  seedImages: z
    .array(z.string())
    .min(1)
    .max(MAX_SEED_IMAGES)
    .optional()
    .describe(
      `可选的参考图 url 列表（img2img，最多 ${MAX_SEED_IMAGES} 张，按顺序发给生图模型；须是本系统 assetStore 里的资源）：` +
        "用户上传的图、之前生成的图，或 capture_canvas 返回的画布截图 url 都可以直接传。url 必须原样复制工具返回的那一串（64 位哈希，错一个字符就找不到文件），不要手敲或改动。每张参考图的宽高比不能超过 16:1"
    ),
  // 默认值改成 1920x1080：512x512 是通用素材图的量级，大屏效果图/设计稿这类要看清
  // 卡片内文字的场景用它做默认值太小了，模型不主动指定尺寸时至少给到 HD 起步。
  width: z.number().positive().default(1920).describe("图片宽度，大屏效果图建议 1920 起"),
  height: z.number().positive().default(1080).describe("图片高度，大屏效果图建议 1080 起")
});

type ImageItem = z.infer<typeof imageItemSchema>;

const resultItemSchema = z.object({
  index: z.number().describe("对应入参 images 的下标（从 0 起）"),
  name: z.string(),
  id: z.string().optional().describe("图片记录 id；这张失败时没有"),
  url: z.string().optional().describe("生成图片的可访问 url；这张失败时没有"),
  reused: z.boolean().optional().describe("是否命中了已有的同款结果（未重新生成）"),
  libraryFileId: z.number().optional().describe("放进素材库后的素材 id；没放进去时为空，原因见 note"),
  note: z.string().optional(),
  error: z.string().optional().describe("这张生成失败的原因；只需重试失败的这几张")
});

export const createImageInputSchema = z.object({
  screenId: z
    .string()
    .describe(
      '当前大屏，格式 "{screenId}_{versionCode}"（如 "29445_1"），从 editor-context 取；生成的图记在这个大屏的所有者名下'
    ),
  images: z.array(imageItemSchema).min(1).max(MAX_BATCH_IMAGES).describe("要生成的图片，每项一张")
});

export const createImageTool = createTool({
  id: "createImageTool",
  description:
    "根据提示词生成图片，落库并返回可直接引用的 url（不是原始像素/base64）。一次调用可以带多张（images 数组，最多 " +
    MAX_BATCH_IMAGES +
    " 张），服务端同时生成：要几张就一次放进 images，不要分成多次调用。" +
    "每张各自写 prompt / 尺寸 / 参考图；同一批里的图不能互相当参考图（要拿一张当参考，等它生成完再调下一次）。" +
    "某几张失败不影响其他张：结果里按下标给出每张的 url 或 error，只重试失败的那几张。" +
    "不要给本工具传 _background:{enabled:false}：默认就是后台执行，整批约 1~2 分钟；改成前台会卡住整轮对话。后台完成后系统会自动把结果（url、素材 id）送回给你，不用为了拿 url 去开前台。" +
    "生成大屏效果图/设计稿时，width/height 应该和目标画布一致（通常 1920x1080 起），" +
    "不要用默认的小尺寸——分辨率太低会导致卡片内的文字、数字看不清。" +
    "要基于当前画布的样子生成（如按现有大屏的色调出配套素材、把截图重绘成效果图）时，" +
    "先 capture_canvas 截图，再把返回的 url 放进那张图的 seedImages 传进来。" +
    `参考图每张最多 ${MAX_SEED_IMAGES} 张，可以组合着用（比如一张定构图、一张定风格），在 prompt 里说清每张参考什么（第 1 张…第 2 张…）。` +
    "生成边框 / 卡片底板 / 标题栏这类要贴合组件边缘的素材时，在 prompt 里写明「边框线紧贴画面四条边、四周不留空白」。" +
    "提示词要精炼：部分生图服务限制在 1000 字以内，超长会被拒绝，需要精简后重试。" +
    "返回图片的实际尺寸可能和你要的不完全一致（服务商会取它支持的最接近的尺寸），铺满组件时用 objectFit: fill 即可。" +
    "生成的图会自动放进用户素材库的「AI 生成」分组，所有大屏都能用。",
  inputSchema: createImageInputSchema,
  outputSchema: z.object({
    images: z.array(resultItemSchema).describe("与入参 images 一一对应"),
    [TOOL_IMAGES_FIELD]: z.array(z.object({ url: z.string(), label: z.string() })).optional()
  }),
  // 生图慢（实测豆包一次 40+ 秒；gpt-image-2 出 1920×1080 要约 2 分钟），不开 background 会卡住整个 agentic loop 干等。
  // 一批最多 8 张同时生成，队列里 worker 并发有限时要排几轮，超时按整批留足余量。
  background: { enabled: true, timeoutMs: 8 * 60_000, maxRetries: 1 },
  execute: async ({ screenId, images }, context) => {
    // 进度按 toolCallId 登记，前端按它轮询；前台 / 后台执行走的都是这个函数。
    // 整批的进度取各张的平均值：一张还在排队时整批不会显示成快完了
    const percents = images.map(() => 0);
    return trackGeneration("image", context?.agent?.toolCallId, async (onProgress) => {
      const items = await Promise.all(
        images.map((item, index) =>
          generateOne(screenId, item, index, (percent) => {
            percents[index] = percent;
            onProgress(percents.reduce((sum, value) => sum + value, 0) / percents.length);
          })
        )
      );
      const succeeded = items.filter((item) => item.ok);
      if (succeeded.length === 0) {
        // 一张都没成功才算工具失败；单张时原样抛出，错误信息不被「全部失败」包一层
        const [only] = items;
        throw items.length === 1 && !only.ok ? only.error : new Error(failureSummary(items));
      }
      return {
        images: items.map((item) => item.result),
        // 图本身不进工具结果（tool 消息带不了图）：写进约定字段，由 inlineImagesMiddleware 在这批 tool 消息
        // 之后补一条 user 图片消息，模型下一步就能直接看到刚生成的图，不用再截图或猜。
        [TOOL_IMAGES_FIELD]: succeeded.flatMap((item) => (item.image ? [item.image] : []))
      };
    });
  }
});

type OneResult =
  | { ok: true; result: z.infer<typeof resultItemSchema>; image: { url: string; label: string } }
  | { ok: false; result: z.infer<typeof resultItemSchema>; error: Error; image?: undefined };

/** 生一张并放进素材库；失败不抛，记在这一项里，不连累同批的其他张 */
async function generateOne(
  screenId: string,
  { name, prompt, width, height, seedImages }: ImageItem,
  index: number,
  onProgress: (percent: number) => void
): Promise<OneResult> {
  const displayName = name?.trim() || defaultName(prompt);
  try {
    const record = await generateImage(
      { prompt, seed: deriveSeed(prompt), width, height, seedImageUrls: seedImages },
      { onProgress }
    );
    const library = await saveToLibrary({
      screenId,
      name: displayName,
      url: record.url,
      generatedImageId: record.id,
      referenceUrls: seedImages
    });
    const label = `[${index + 1}] ${displayName}：生成的图片 ${record.width}×${record.height}${record.reused ? "（命中缓存的旧图）" : ""}`;
    return {
      ok: true,
      result: { index, name: displayName, id: record.id, url: record.url, reused: record.reused, ...library },
      image: { url: record.url, label }
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { ok: false, result: { index, name: displayName, error: err.message }, error: err };
  }
}

const failureSummary = (items: OneResult[]): string =>
  `${items.length} 张全部生成失败：${items.map((item) => `[${item.result.index + 1}] ${item.result.name}：${item.result.error}`).join("；")}`;

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
