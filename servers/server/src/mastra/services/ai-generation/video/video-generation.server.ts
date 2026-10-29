/**
 * 视频生成核心：给一份参数，拿回一个落库、落存储的视频。和 `image-generation.server.ts` 同一个分层——
 * 只管「提交任务 → 轮询 → 转存 → 记库」，不管队列。
 *
 * 幂等同样靠 `promptHash`：同一份输入（提示词 + 模型 + 输出参数 + 所有输入素材）命中旧记录直接返回。
 * 视频比图更慢更贵，所以**提交任务不重试**——提交请求可能已经被服务商收下只是响应丢了，
 * 重试就是重复计费；轮询和下载可以放心重试。
 */
import { createHash } from "node:crypto";

import { assetStore } from "@/lib/storage";
import { prismaClient } from "@/mastra/storage/prisma";
import { formatErrorChain, retryWithBackoff } from "@/mastra/utils/async";

import { imageSize } from "../../ai-assets/shrink-image";
import { prepareReference } from "../image/image-generation.server";
import { type GenerateVideoInput, VideoGenerationInputSchema } from "./video-input";
import {
  getVideoConfig,
  type VideoAdapter,
  videoAdapter,
  type VideoConfig,
  videoModelKey,
  type VideoParams,
  type VideoRequest
} from "./video-provider";

export type { GenerateVideoInput } from "./video-input";

export interface GeneratedVideoRecord {
  id: string;
  promptHash: string;
  prompt: string;
  model: string;
  durationSec: number;
  resolution: string;
  ratio: string;
  url: string;
  firstFrameUrl: string | null;
  lastFrameUrl: string | null;
  referenceImageUrls: string[];
  referenceVideoUrls: string[];
  referenceAudioUrls: string[];
  /** 命中已有记录时为 true */
  reused: boolean;
}

export const computeVideoHash = (input: GenerateVideoInput, model: string): string =>
  createHash("sha256")
    .update(
      JSON.stringify({
        prompt: input.prompt,
        model,
        durationSec: input.durationSec,
        resolution: input.resolution,
        ratio: input.ratio,
        firstFrameUrl: input.firstFrameUrl,
        lastFrameUrl: input.lastFrameUrl,
        referenceImageUrls: input.referenceImageUrls?.length ? input.referenceImageUrls : undefined,
        referenceVideoUrls: input.referenceVideoUrls?.length ? input.referenceVideoUrls : undefined,
        referenceAudioUrls: input.referenceAudioUrls?.length ? input.referenceAudioUrls : undefined
      })
    )
    .digest("hex");

const SUBMIT_TIMEOUT_MS = 60_000;
const POLL_REQUEST_TIMEOUT_MS = 30_000;
const DOWNLOAD_TIMEOUT_MS = 120_000;
/** 视频生成耗时较长，最多等 10 分钟，超时后保留服务商任务 id 供排查 */
const MAX_WAIT_MS = Number(process.env.VIDEO_MAX_WAIT_MS) || 10 * 60_000;
const POLL_INTERVAL_MS = Number(process.env.VIDEO_POLL_INTERVAL_MS) || 5000;
/** 轮询连续失败几次才放弃：中间隔着代理时偶尔一次连不上不算任务失败 */
const MAX_POLL_FAILURES = 5;

/** 服务商明确说任务失败了：不属于「查询失败」，不能被轮询的容错吞掉 */
class TaskFailedError extends Error {}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const send = (request: VideoRequest, timeoutMs: number): Promise<Response> =>
  fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    signal: AbortSignal.timeout(timeoutMs)
  });

/**
 * 首帧宽高比（宽 / 高）的范围。超出范围的图（如 2.9:1 的横幅）网关不会说原因，只回一个误导人的
 * 503 `supply_unavailable`，实测 2138×735 必现、1672×940 正常。所以提交前先量，超了直接说清楚。
 */
const FIRST_FRAME_RATIO_RANGE = { min: 0.4, max: 2.5 } as const;

async function readImage(imageUrl: string, label: string, isFrame = true): Promise<Buffer> {
  const key = assetStore().keyFromUrl(imageUrl);
  if (!key) {
    throw new Error(`${label}图片不是内部 assetStore 的资源，无法解析：${imageUrl}`);
  }
  const original = await assetStore().get(key);
  const size = await imageSize(original);
  if (isFrame && size) {
    const ratio = size.width / size.height;
    if (ratio < FIRST_FRAME_RATIO_RANGE.min || ratio > FIRST_FRAME_RATIO_RANGE.max) {
      throw new Error(
        `${label}图片 ${size.width}×${size.height}（宽高比 ${ratio.toFixed(2)}）超出视频模型的限制` +
          `（${FIRST_FRAME_RATIO_RANGE.min}~${FIRST_FRAME_RATIO_RANGE.max}）：太扁或太窄的图不能当首尾帧，换一张接近画幅的图，或改用文生视频`
      );
    }
  }
  // 服务商拿不到我们的内网 / localhost 地址，只能把图直接放进请求；压成 JPEG 控制请求体大小
  return prepareReference(original);
}

/** 视频/音频由服务商拉取；内部资源生成临时签名，不把大文件编码进提交请求。 */
async function referenceMediaUrl(sourceUrl: string): Promise<string> {
  const store = assetStore();
  const candidate = store.keyFromUrl(sourceUrl);
  const source = new URL(sourceUrl);
  const canonical = candidate ? new URL(store.publicUrl(candidate)) : undefined;
  // keyFromUrl 只解析路径（MinIO 尤其宽松），还需匹配存储地址，避免把外部素材误认成本地对象。
  const key = canonical?.origin === source.origin && canonical.pathname === source.pathname ? candidate : null;
  if (key && !(await store.head(key))) {
    throw new Error(`参考素材不存在：${sourceUrl}`);
  }
  const url = key ? await store.signedUrl(key, 3600) : sourceUrl;
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const privateHost =
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    /^(?:0|10|127)\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(?:1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host === "::" ||
    host === "::1" ||
    /^(?:fc|fd|fe[89ab])[\da-f]*:/.test(host) ||
    host.startsWith("::ffff:");
  if (!["http:", "https:"].includes(parsed.protocol) || privateHost || parsed.username || parsed.password) {
    throw new Error(
      "参考视频/音频必须提供服务商可直接下载的公网 HTTP/HTTPS URL；内部素材请配置 ASSET_PUBLIC_BASE_URL 或 MinIO 公网地址"
    );
  }
  return url;
}

async function submitTask(config: VideoConfig, params: VideoParams): Promise<string> {
  const adapter = videoAdapter(config);
  const request = adapter.buildSubmitRequest(config, params);
  let response: Response;
  try {
    response = await send(request, SUBMIT_TIMEOUT_MS);
  } catch (error) {
    throw new Error(`提交视频生成任务失败：${formatErrorChain(error)}`);
  }
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`提交视频生成任务失败 ${response.status}（${request.url}）：${text.slice(0, 300)}`);
  }
  return adapter.parseSubmitResponse(JSON.parse(text));
}

/** 查询结果不带视频地址的服务商：另取下载地址，返回 null 表示还没就绪 */
async function fetchResultUrl(config: VideoConfig, adapter: VideoAdapter, taskId: string): Promise<string | null> {
  if (!adapter.resultUrl) {
    throw new TaskFailedError("任务成功了但响应里没有视频地址");
  }
  const response = await send(adapter.resultUrl.request(config, taskId), POLL_REQUEST_TIMEOUT_MS);
  return adapter.resultUrl.parse(response.status, await response.text());
}

/** 轮询到任务结束，返回服务商的临时视频地址 */
async function waitForVideoUrl(
  config: VideoConfig,
  taskId: string,
  onProgress?: (percent: number) => void | Promise<void>
): Promise<string> {
  const adapter = videoAdapter(config);
  const startedAt = Date.now();
  let failures = 0;
  while (Date.now() - startedAt < MAX_WAIT_MS) {
    await sleep(POLL_INTERVAL_MS);
    try {
      const response = await send(adapter.taskRequest(config, taskId), POLL_REQUEST_TIMEOUT_MS);
      if (!response.ok) {
        throw new Error(`查询任务失败 ${response.status}：${(await response.text()).slice(0, 200)}`);
      }
      const state = adapter.parseTaskResponse(await response.json());
      failures = 0;
      if (state.status === "succeeded") {
        const videoUrl = state.videoUrl ?? (await fetchResultUrl(config, adapter, taskId));
        if (videoUrl) {
          return videoUrl;
        }
      }
      if (state.status === "failed") {
        throw new TaskFailedError(state.reason);
      }
      // 服务商不给进度，按已等时间估一个：20%~70% 之间缓慢爬升，避免进度条停死
      await onProgress?.(Math.min(70, 20 + Math.round(((Date.now() - startedAt) / MAX_WAIT_MS) * 50)));
    } catch (error) {
      if (error instanceof TaskFailedError || ++failures >= MAX_POLL_FAILURES) {
        throw error;
      }
      console.warn(
        `[video-generation] 轮询任务 ${taskId} 失败（${failures}/${MAX_POLL_FAILURES}）：${formatErrorChain(error)}`
      );
    }
  }
  throw new Error(`视频生成超时：等了 ${Math.round(MAX_WAIT_MS / 60_000)} 分钟任务还没结束（服务商任务 id ${taskId}）`);
}

async function downloadVideo(videoUrl: string): Promise<Buffer> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(videoUrl, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
      if (!response.ok) {
        throw new Error(`下载视频失败 ${response.status}`);
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length === 0) {
        throw new Error("下载视频为空");
      }
      return bytes;
    },
    {
      maxRetries: 3,
      onRetry: (attempt, error, willRetry) => {
        if (willRetry) {
          console.warn(`[video-generation] 下载视频第 ${attempt}/3 次失败，重试：${formatErrorChain(error)}`);
        }
      }
    }
  );
}

export interface GenerateVideoOptions {
  /** 阶段进度（0~100），供队列任务上报 */
  onProgress?: (percent: number) => void | Promise<void>;
}

/** 生成一个视频，命中已有 promptHash 时直接返回旧记录、不重新调用模型。 */
export async function generateAndStoreVideo(
  input: GenerateVideoInput,
  options: GenerateVideoOptions = {}
): Promise<GeneratedVideoRecord> {
  input = VideoGenerationInputSchema.parse(input);
  const report = async (percent: number) => {
    await options.onProgress?.(percent);
  };
  // 入口解析一次往下传：hash 记的模型和实际提交的模型必须是同一份配置
  const config = getVideoConfig(input.modelConfigId);
  const model = videoModelKey(config);
  const promptHash = computeVideoHash(input, model);

  const existing = await prismaClient.generatedVideo.findUnique({ where: { promptHash } });
  if (existing) {
    return { ...existing, reused: true };
  }

  const [firstFrame, lastFrame, referenceImages, referenceVideos, referenceAudios] = await Promise.all([
    input.firstFrameUrl ? readImage(input.firstFrameUrl, "首帧") : undefined,
    input.lastFrameUrl ? readImage(input.lastFrameUrl, "尾帧") : undefined,
    Promise.all((input.referenceImageUrls ?? []).map((url) => readImage(url, "参考", false))),
    Promise.all((input.referenceVideoUrls ?? []).map(referenceMediaUrl)),
    Promise.all((input.referenceAudioUrls ?? []).map(referenceMediaUrl))
  ]);
  await report(5);
  const taskId = await submitTask(config, {
    prompt: input.prompt,
    durationSec: input.durationSec,
    resolution: input.resolution,
    ratio: input.ratio,
    firstFrame,
    lastFrame,
    referenceImages,
    referenceVideos,
    referenceAudios
  });
  await report(20);

  const videoUrl = await waitForVideoUrl(config, taskId, options.onProgress);
  await report(75);

  // 服务商给的是限时下载链接，转成我们自己 assetStore 里的 url 再落库
  const bytes = await downloadVideo(videoUrl);
  const { url } = await assetStore().put(`generated-videos/${promptHash}.mp4`, bytes, { contentType: "video/mp4" });
  await report(90);

  const row = await prismaClient.generatedVideo.create({
    data: {
      promptHash,
      prompt: input.prompt,
      model,
      durationSec: input.durationSec,
      resolution: input.resolution,
      ratio: input.ratio,
      url,
      firstFrameUrl: input.firstFrameUrl ?? null,
      lastFrameUrl: input.lastFrameUrl ?? null,
      referenceImageUrls: input.referenceImageUrls ?? [],
      referenceVideoUrls: input.referenceVideoUrls ?? [],
      referenceAudioUrls: input.referenceAudioUrls ?? [],
      taskId
    }
  });
  return { ...row, reused: false };
}

/** 设置页「测试」：按服务商用代价最小的请求验证地址和密钥（minimax-v2 只能真提交一次，会计费） */
export async function probeVideoService(config: VideoConfig): Promise<void> {
  const { probe } = videoAdapter(config);
  const response = await send(probe.request(config), 45_000);
  probe.check(response.status, await response.text());
}
