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

export interface GenerateImageInput {
  /** 结构化 prompt 原文（画布/风格/布局/区域内容/文字白名单/禁止，见 docs/生图到大屏工作流.md §5） */
  prompt: string;
  /** 幂等键的一部分，调用方必须显式给出——同一个 seed+prompt+model 视为"同一张图" */
  seed: number;
  width: number;
  height: number;
  /**
   * img2img 参考图。**必须是我们自己 assetStore 里的资源 url**，不是任意外部图片——
   * 用 `assetStore().keyFromUrl()` 反查 key 再读字节，查不到直接报错，不做"顺便下载
   * 一个外部 url"这种静默兜底（外部图片来源不可控，也绕开了我们自己的存储审计）。
   */
  seedImageUrl?: string;
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

export const computePromptHash = (prompt: string, seed: number, model: string, seedImageUrl?: string): string =>
  createHash("sha256").update(JSON.stringify({ prompt, seed, model, seedImageUrl })).digest("hex");

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

const mediaTypeOf = (bytes: Buffer): string =>
  bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ? "image/jpeg" : "image/png";

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
const requestGeneration = async (input: GenerateImageInput, reference?: Buffer): Promise<GeneratedBytes> => {
  const { baseUrl, apiKey, modelId } = getModelConfigSync("image");
  const body = JSON.stringify({
    model: modelId,
    prompt: input.prompt,
    ...(reference ? { image: `data:${mediaTypeOf(reference)};base64,${reference.toString("base64")}` } : {}),
    size: `${input.width}x${input.height}`,
    seed: input.seed,
    response_format: "url",
    watermark: false
  });
  const kind = reference ? "img2img" : "生图";

  const first = await retryWithBackoff(
    async () => {
      let response: Response;
      try {
        response = await fetch(`${baseUrl.replace(/\/+$/, "")}/images/generations`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, Connection: "close" },
          body,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });
      } catch (error) {
        // undici 的 `fetch failed` 本身不说原因，真正的原因在 cause 链里（other side closed / 超时 / TLS）
        throw new Error(`${kind} 请求失败：${formatErrorChain(error)}，请求体 ${Math.round(body.length / 1024)}KB`);
      }
      if (!response.ok) {
        throw new Error(`请求失败 ${response.status}：${(await response.text()).slice(0, 300)}`);
      }
      const payload = (await response.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
      const item = payload.data?.[0];
      if (!item?.url && !item?.b64_json) {
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

/** 生成一张图，命中已有 promptHash 时直接返回旧记录、不重新调用模型。 */
export async function generateAndStoreImage(input: GenerateImageInput): Promise<GeneratedImageRecord> {
  const { modelId } = getModelConfigSync("image");
  const promptHash = computePromptHash(input.prompt, input.seed, modelId, input.seedImageUrl);

  const existing = await prismaClient.generatedImage.findUnique({ where: { promptHash } });
  if (existing) {
    return { ...existing, reused: true };
  }

  // 参考图不是任意外部地址——必须能从我们自己的 assetStore 反查回 key，
  // 查不到就直接报错，别悄悄发个请求去下载一个不受控的外部 url。
  let referenceImage: Buffer | undefined;
  if (input.seedImageUrl) {
    const key = assetStore().keyFromUrl(input.seedImageUrl);
    if (!key) {
      throw new Error(`种子图片不是内部 assetStore 的资源，无法解析：${input.seedImageUrl}`);
    }
    referenceImage = await assetStore().get(key);
  }

  const image = await requestGeneration(input, referenceImage);

  // 服务商回的是直链，落库前转成我们自己 assetStore 里的 url——
  // 直链几分钟到几小时就过期，不能存它。
  const key = `generated-images/${promptHash}.png`;
  const { url } = await assetStore().put(key, image.bytes, { contentType: image.mediaType });

  const row = await prismaClient.generatedImage.create({
    data: {
      promptHash,
      prompt: input.prompt,
      model: modelId,
      seed: input.seed,
      width: input.width,
      height: input.height,
      url
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
