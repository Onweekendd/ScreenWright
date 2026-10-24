/**
 * D8：生图核心——只管"给一份结构化 prompt，拿回一张落库的图"，不管队列、不管工作流。
 *
 * 幂等是这一层的核心职责：生图慢且贵，`promptHash = sha256(prompt + seed + model)`
 * 命中直接返回旧记录，不重新调用生图模型。**调用方每次生成都必须传显式 seed**——
 * 不落到这一层来随机，否则同一份 prompt 每次都会因为 seed 不同而 miss 掉幂等。
 *
 * 这一层之上是 D9 的 JobRunner handler（`type: "image.generate"`）：重活、会失败、
 * 要重试的部分交给它；这一层本身保持同步可测，不依赖 JobRunner 也能直接调用验证。
 */
import { createHash } from "node:crypto";

import { assetStore } from "@/lib/storage";
import { getModelConfigSync } from "@/mastra/provider/model-registry";
import { prismaClient } from "@/mastra/storage/prisma";
import { formatErrorChain, retryWithBackoff } from "@/mastra/workflows/figma-to-bi/utils/async";

import { buildImageRequest, extractImage, imagesEndpoint, mediaTypeOf } from "./image-provider";
import { imageSize, shrinkToJpeg } from "./shrink-image";

export { imagesEndpoint };

export interface GenerateImageInput {
  /** 结构化 prompt 原文（画布/风格/布局/区域内容/文字白名单/禁止，见 docs/生图到大屏工作流.md §5） */
  prompt: string;
  /** 幂等键的一部分，调用方必须显式给出——同一个 seed+prompt+model 视为"同一张图" */
  seed: number;
  width: number;
  height: number;
  /**
   * img2img 参考图，可以多张（如效果图 + 一张风格参考），按顺序发给服务商。
   * **必须是我们自己 assetStore 里的资源 url**，不是任意外部图片——
   * 用 `assetStore().keyFromUrl()` 反查 key 再读字节，查不到直接报错，不做"顺便下载
   * 一个外部 url"这种静默兜底（外部图片来源不可控，也绕开了我们自己的存储审计）。
   */
  seedImageUrls?: string[];
}

export interface GeneratedImageRecord {
  id: string;
  promptHash: string;
  prompt: string;
  model: string;
  seed: number | null;
  width: number;
  height: number;
  url: string;
  /** 命中已有记录时为 true，调用方可以据此跳过"生成中"的进度展示 */
  reused: boolean;
}

/**
 * 从 prompt 派生一个稳定的数字 seed，而不是随机生成。
 *
 * 原因：生图工具都开了 `background`，Mastra 失败后会用同一份 args 重跑 `execute`
 * （见 `background.maxRetries`）。如果 seed 每次调用都随机，`generateAndStoreImage`
 * 里靠 `sha256(prompt+seed+model)` 做的幂等就形同虚设——重试永远打不中缓存，
 * 等于每次重试都真的重新生成一次、重新计费一次。同一份 prompt 派生同一个 seed，
 * 才能让"重试"真正命中已有结果。
 */
// 夹到 int32 正数：方舟要求 seed ≤ 2147483647，GeneratedImage.seed 也是 Prisma Int
export const deriveSeed = (prompt: string): number =>
  createHash("sha256").update(prompt).digest().readUInt32BE(0) & 0x7fffffff;

/**
 * 幂等键。参考图从单张改成多张后，0 / 1 张时仍按旧口径（`seedImageUrl` 字段）算，
 * 已经生成过的图照样命中，不会因为改了字段名整批重新计费；多张时参考图的顺序也算在内。
 */
export const computePromptHash = (prompt: string, seed: number, model: string, seedImageUrls?: string[]): string => {
  const refs = seedImageUrls ?? [];
  const basis =
    refs.length > 1 ? { prompt, seed, model, seedImageUrls: refs } : { prompt, seed, model, seedImageUrl: refs[0] };
  return createHash("sha256").update(JSON.stringify(basis)).digest("hex");
};

interface GeneratedBytes {
  bytes: Buffer;
  mediaType: string;
}

/**
 * 请求 / 下载各自最多试几次。生图一次 30~60s，中间隔着代理（TUN fake-ip）时长连接经常被掐——
 * 请求阶段 `fetch failed (other side closed)`、响应阶段 statusCode 200 但 body 读到一半断掉，两种都见过。
 */
const MAX_ATTEMPTS = 3;
/** 单次生图请求的上限；方舟 seedream 正常 30~60s，超过它基本是连接挂死了 */
const REQUEST_TIMEOUT_MS = 180_000;
const DOWNLOAD_TIMEOUT_MS = 60_000;

const retry = <T>(label: string, fn: () => Promise<T>): Promise<T> =>
  retryWithBackoff(fn, {
    maxRetries: MAX_ATTEMPTS,
    onRetry: (attempt, error, willRetry) => {
      if (willRetry) {
        console.warn(
          `[image-generation] ${label} 第 ${attempt}/${MAX_ATTEMPTS} 次失败，重试：${formatErrorChain(error)}`
        );
      }
    }
  });

/** 拿到 4xx 就别重试了——参数错、鉴权错重试多少次都一样；5xx 和网络错才值得 */
const isClientError = (error: unknown): boolean => error instanceof Error && /^请求失败 4\d\d/.test(error.message);

/**
 * 直连 OpenAI 兼容的 `/images/generations`，文本生图和 img2img 走同一条路。**不走 ai-sdk**：
 * - 它的 OpenAI provider 一收到参考图就改请求 `/images/edits`，火山方舟没有这个端点（404）；
 *   方舟的 img2img 是同一个 `/images/generations` 多一个 `image` 字段
 * - 它的 image provider 对 seedream 会丢掉 `seed`（"seed is not supported" 警告），幂等键形同虚设
 * - 它把 300KB 的 b64 响应体一口气读完，中间隔着代理时经常读到一半被掐（statusCode 200 却 `other side closed`）
 *
 * 所以这里要 `response_format: "url"`：响应只有几百字节，图片再单独下载、单独重试。
 * 每次请求 `Connection: close`——不复用被代理搞脏的连接。
 */
/** 参考图长边上限：方舟对大参考图（base64 进请求体）会直接断连，实测压到 1280 / 100KB 级就稳了 */
const REFERENCE_MAX_EDGE = 1280;

/**
 * 参考图预处理：长边 ≤ 1280、统一转 JPEG。画布截图是 1920×1080 起步（单组件还会放大渲染），
 * 带渐变和发光的深色大屏压不下去，原样 base64 进请求体经常把连接撑断。
 * 解码失败（不是图片 / 损坏）时原样放行，让服务商给出明确的 4xx，别在这里吞成另一种报错。
 */
export const prepareReference = async (bytes: Buffer): Promise<Buffer> => {
  try {
    return await shrinkToJpeg(bytes, REFERENCE_MAX_EDGE);
  } catch (error) {
    console.warn(`[image-generation] 参考图预处理失败，原样发送：${formatErrorChain(error)}`);
    return bytes;
  }
};

/**
 * 提示词长度上限（字符数）。有的网关对 prompt 有硬上限（gpt-image 中转文档写的是 1000），超了不是报错就是被悄悄截断，
 * 而结构化 prompt 很容易写长。配了 IMAGE_PROMPT_MAX_CHARS 就在发请求**之前**拦下并说清楚，让 agent 去精简，
 * 别白白打一次请求（还要重试 6 次）才拿到一个含糊的 400。不配则不限制。
 */
const promptLimit = (): number | undefined => Number(process.env.IMAGE_PROMPT_MAX_CHARS) || undefined;

const requestGeneration = async (input: GenerateImageInput, references: Buffer[]): Promise<GeneratedBytes> => {
  const { baseUrl, apiKey, modelId } = getModelConfigSync("image");
  const limit = promptLimit();
  if (limit && input.prompt.length > limit) {
    throw new Error(
      `提示词 ${input.prompt.length} 字，超过生图服务的上限 ${limit} 字：请精简到 ${limit} 字以内再试` +
        "（保留画布尺寸、风格、关键元素，去掉重复和细枝末节）"
    );
  }
  const request = buildImageRequest({ baseUrl, apiKey, modelId, input, references });
  const endpoint = request.url;
  const kind = references.length > 0 ? "img2img" : "生图";

  const first = await retryWithBackoff(
    async () => {
      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: request.headers,
          body: request.body,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });
      } catch (error) {
        // undici 的 `fetch failed` 本身不说原因，真正的原因在 cause 链里（other side closed / 超时 / TLS）
        throw new Error(`${kind} 请求失败：${formatErrorChain(error)}，请求体 ${request.sizeKB}KB`);
      }
      if (!response.ok) {
        // 带上实际请求的地址：地址拼错时服务商回的 500 不说原因，没有它只能去猜
        throw new Error(`请求失败 ${response.status}（${endpoint}）：${(await response.text()).slice(0, 300)}`);
      }
      // 标准形态 data[0].url / b64_json；个别网关按对话补全格式把图夹在 choices 的文本里，两种都认
      const item = extractImage(await response.json());
      if (!item) {
        throw new Error("生图模型没有返回任何图片");
      }
      return item;
    },
    {
      maxRetries: MAX_ATTEMPTS,
      shouldRetry: (_attempt, error) => !isClientError(error),
      onRetry: (attempt, error, willRetry) => {
        if (willRetry) {
          console.warn(`[image-generation] ${kind} 第 ${attempt}/${MAX_ATTEMPTS} 次失败，重试：${error.message}`);
        }
      }
    }
  );

  // 有的服务商不理 response_format 照样回 b64，也接
  if (first.b64_json) {
    const bytes = Buffer.from(first.b64_json, "base64");
    return { bytes, mediaType: mediaTypeOf(bytes) };
  }
  return retry("下载生图结果", async () => {
    const download = await fetch(first.url!, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
    if (!download.ok) {
      throw new Error(`下载生图结果失败 ${download.status}`);
    }
    const bytes = Buffer.from(await download.arrayBuffer());
    if (bytes.length === 0) {
      throw new Error("下载生图结果为空");
    }
    return { bytes, mediaType: download.headers.get("content-type") ?? mediaTypeOf(bytes) };
  });
};

export interface GenerateImageOptions {
  /** 阶段进度（0~100），供队列任务上报；同步调用方不用传 */
  onProgress?: (percent: number) => void | Promise<void>;
}

/**
 * 重试也不会好的失败（参考图根本不存在、地址不对）。队列据此直接判死、不再重试——
 * 否则同一个错会白白重跑好几轮，用户干等。用 `permanent` 标记而不是 instanceof，worker 侧不必依赖这个类。
 */
export class PermanentImageError extends Error {
  readonly permanent = true;
}

const NOT_FOUND_CODES = new Set(["ENOENT", "NoSuchKey", "NotFound"]);

/** 读参考图字节：文件不存在是永久失败（多半是模型把 64 位哈希抄错了），其他错误（网络抖动等）原样抛出让队列重试 */
async function readSeedImage(key: string, seedImageUrl: string): Promise<Buffer> {
  try {
    return await assetStore().get(key);
  } catch (error) {
    const code = (error as { code?: unknown } | null)?.code;
    if (typeof code === "string" && NOT_FOUND_CODES.has(code)) {
      throw new PermanentImageError(
        `参考图不存在：${seedImageUrl}。seedImages 的 url 要原样复制工具返回的那一串，哈希有 64 位，错一个字符就找不到；` +
          "拿不准就不带 seedImages，只用提示词生成。"
      );
    }
    throw error;
  }
}

/** 生成一张图，命中已有 promptHash 时直接返回旧记录、不重新调用模型。 */
export async function generateAndStoreImage(
  input: GenerateImageInput,
  options: GenerateImageOptions = {}
): Promise<GeneratedImageRecord> {
  const report = async (percent: number) => {
    await options.onProgress?.(percent);
  };
  const { modelId } = getModelConfigSync("image");
  const promptHash = computePromptHash(input.prompt, input.seed, modelId, input.seedImageUrls);

  const existing = await prismaClient.generatedImage.findUnique({ where: { promptHash } });
  if (existing) {
    return { ...existing, reused: true };
  }

  // 参考图不是任意外部地址——必须能从我们自己的 assetStore 反查回 key，
  // 查不到就直接报错，别悄悄发个请求去下载一个不受控的外部 url。
  const references = await Promise.all(
    (input.seedImageUrls ?? []).map(async (seedImageUrl) => {
      const key = assetStore().keyFromUrl(seedImageUrl);
      if (!key) {
        throw new PermanentImageError(`种子图片不是内部 assetStore 的资源，无法解析：${seedImageUrl}`);
      }
      return prepareReference(await readSeedImage(key, seedImageUrl));
    })
  );

  await report(10);
  const image = await requestGeneration(input, references);
  await report(75);

  // 服务商回的是直链，落库前转成我们自己 assetStore 里的 url——
  // 直链几分钟到几小时就过期，不能存它。
  const key = `generated-images/${promptHash}.png`;
  const { url } = await assetStore().put(key, image.bytes, { contentType: image.mediaType });

  await report(90);
  // 记实际出图的尺寸：gpt-image 会把请求的 1920×1080 换成它接受的 2048×1152，模型也未必严格按 size 出图。
  // 读不出来（不是标准图片）才退回请求值。
  const actual = await imageSize(image.bytes);
  const row = await prismaClient.generatedImage.create({
    data: {
      promptHash,
      prompt: input.prompt,
      model: modelId,
      seed: input.seed,
      width: actual?.width ?? input.width,
      height: actual?.height ?? input.height,
      url,
      ...(input.seedImageUrls?.length ? { referenceUrls: input.seedImageUrls } : {})
    }
  });

  return { ...row, reused: false };
}

/**
 * 一句话需求 → 2 张效果图（产品流程的 ①）。两张图共享同一份结构化 prompt，
 * 靠不同 seed 产生视觉差异——`seed` 与 `seed + 1` 而不是随机数，
 * 保证同一次调用重放（比如 Job 重试）时两张图的幂等键不变。
 */
export async function generateEffectImages(input: {
  prompt: string;
  baseSeed: number;
  width: number;
  height: number;
  count?: number;
}): Promise<GeneratedImageRecord[]> {
  const count = input.count ?? 2;
  const seeds = Array.from({ length: count }, (_, i) => input.baseSeed + i);
  // 并发生成：两张图互不依赖，串行只是白等第二张的延迟
  return Promise.all(
    seeds.map((seed) => generateAndStoreImage({ prompt: input.prompt, seed, width: input.width, height: input.height }))
  );
}
