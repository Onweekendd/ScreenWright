/**
 * 视频生成核心：给一份参数，拿回一个落库、落存储的视频。和 `image-generation.server.ts` 同一个分层——
 * 只管「提交任务 → 轮询 → 转存 → 记库」，不管队列。
 *
 * 幂等同样靠 `promptHash`：同一份输入（提示词 + 模型 + 时长 / 分辨率 / 比例 + 首帧）命中旧记录直接返回。
 * 视频比图更慢更贵，所以**提交任务不重试**——提交请求可能已经被服务商收下只是响应丢了，
 * 重试就是重复计费；轮询和下载可以放心重试。
 */
import { createHash } from "node:crypto";

import { assetStore } from "@/lib/storage";
import { prismaClient } from "@/mastra/storage/prisma";
import { formatErrorChain, retryWithBackoff } from "@/mastra/workflows/figma-to-bi/utils/async";

import { prepareReference } from "./image-generation.server";
import { mediaTypeOf } from "./image-provider";
import { imageSize } from "./shrink-image";
import {
  buildSubmitRequest,
  getVideoConfig,
  parseSubmitResponse,
  parseTaskResponse,
  taskUrl,
  type VideoConfig,
  type VideoParams
} from "./video-provider";

export interface GenerateVideoInput {
  prompt: string;
  durationSec: number;
  resolution: VideoParams["resolution"];
  ratio: VideoParams["ratio"];
  /** 首帧图 url，**必须是我们自己 assetStore 里的资源**（和生图的参考图同一条规矩）；不传就是文生视频 */
  firstFrameUrl?: string;
}

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
        firstFrameUrl: input.firstFrameUrl
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

const toDataUrl = (bytes: Buffer): string => `data:${mediaTypeOf(bytes)};base64,${bytes.toString("base64")}`;

/**
 * 首帧宽高比（宽 / 高）的范围。超出范围的图（如 2.9:1 的横幅）网关不会说原因，只回一个误导人的
 * 503 `supply_unavailable`，实测 2138×735 必现、1672×940 正常。所以提交前先量，超了直接说清楚。
 */
const FIRST_FRAME_RATIO_RANGE = { min: 0.4, max: 2.5 } as const;

async function readFirstFrame(firstFrameUrl: string): Promise<string> {
  const key = assetStore().keyFromUrl(firstFrameUrl);
  if (!key) {
    throw new Error(`首帧图片不是内部 assetStore 的资源，无法解析：${firstFrameUrl}`);
  }
  const original = await assetStore().get(key);
  const size = await imageSize(original);
  if (size) {
    const ratio = size.width / size.height;
    if (ratio < FIRST_FRAME_RATIO_RANGE.min || ratio > FIRST_FRAME_RATIO_RANGE.max) {
      throw new Error(
        `首帧图片 ${size.width}×${size.height}（宽高比 ${ratio.toFixed(2)}）超出视频模型的限制` +
          `（${FIRST_FRAME_RATIO_RANGE.min}~${FIRST_FRAME_RATIO_RANGE.max}）：太扁或太窄的图不能当首帧，换一张接近画幅的图，或改用文生视频`
      );
    }
  }
  // 服务商拿不到我们的内网 / localhost 地址，只能把图直接放进请求；压成 JPEG 控制请求体大小
  return toDataUrl(await prepareReference(original));
}

async function submitTask(config: VideoConfig, params: VideoParams): Promise<string> {
  const request = buildSubmitRequest(config, params);
  let response: Response;
  try {
    response = await fetch(request.url, {
      method: "POST",
      headers: request.headers,
      body: request.body,
      signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS)
    });
  } catch (error) {
    throw new Error(`提交视频生成任务失败：${formatErrorChain(error)}`);
  }
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`提交视频生成任务失败 ${response.status}（${request.url}）：${text.slice(0, 300)}`);
  }
  return parseSubmitResponse(JSON.parse(text));
}

/** 轮询到任务结束，返回服务商的临时视频地址 */
async function waitForVideoUrl(
  config: VideoConfig,
  taskId: string,
  onProgress?: (percent: number) => void | Promise<void>
): Promise<string> {
  const startedAt = Date.now();
  let failures = 0;
  while (Date.now() - startedAt < MAX_WAIT_MS) {
    await sleep(POLL_INTERVAL_MS);
    try {
      const response = await fetch(taskUrl(config, taskId), {
        headers: { Authorization: `Bearer ${config.apiKey}` },
        signal: AbortSignal.timeout(POLL_REQUEST_TIMEOUT_MS)
      });
      if (!response.ok) {
        throw new Error(`查询任务失败 ${response.status}：${(await response.text()).slice(0, 200)}`);
      }
      const state = parseTaskResponse(await response.json());
      failures = 0;
      if (state.status === "succeeded") {
        return state.videoUrl;
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
  const report = async (percent: number) => {
    await options.onProgress?.(percent);
  };
  const config = getVideoConfig();
  const promptHash = computeVideoHash(input, config.modelId);

  const existing = await prismaClient.generatedVideo.findUnique({ where: { promptHash } });
  if (existing) {
    return { ...existing, reused: true };
  }

  const firstFrame = input.firstFrameUrl ? await readFirstFrame(input.firstFrameUrl) : undefined;
  await report(5);
  const taskId = await submitTask(config, {
    prompt: input.prompt,
    durationSec: input.durationSec,
    resolution: input.resolution,
    ratio: input.ratio,
    firstFrame
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
      model: config.modelId,
      durationSec: input.durationSec,
      resolution: input.resolution,
      ratio: input.ratio,
      url,
      firstFrameUrl: input.firstFrameUrl ?? null,
      taskId
    }
  });
  return { ...row, reused: false };
}
