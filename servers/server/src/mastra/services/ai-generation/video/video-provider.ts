/**
 * 视频生成服务商：MiniMax V2，经网关转发，使用「设置」页的 video 角色配置。
 *
 * 视频是异步任务：POST /v2/video_generation 返回 task_id，
 * GET /v2/query/video_generation/{task_id} 轮询，成功后读取 task.content.url 并转存。
 * 这一层只管请求怎么拼、响应怎么读，不发请求、不碰存储，方便单测。
 *
 * 官方文档：https://platform.minimax.cn/docs/api-reference/video-generation-v2-create
 * 网关前缀示例：https://llm-api.net/minimax/v2（也接受完整 video_generation 地址）。
 */
import { DEFAULT_VIDEO_MODEL, resolveModelConfig } from "@/mastra/provider/model-registry";

import type { VIDEO_RATIOS, VIDEO_RESOLUTIONS } from "./video-input";
import { videoModeError } from "./video-input";

export { DEFAULT_VIDEO_MODEL } from "@/mastra/provider/model-registry";

export interface VideoConfig {
  /** MiniMax V2 前缀，不含 `/video_generation` */
  baseUrl: string;
  apiKey: string;
  modelId: string;
}

export { VIDEO_RATIOS, VIDEO_RESOLUTIONS } from "./video-input";
export type VideoResolution = (typeof VIDEO_RESOLUTIONS)[number];

export type VideoRatio = (typeof VIDEO_RATIOS)[number];

/**
 * 校验并规范化 video 角色配置，接受 V2 前缀或完整提交地址。
 * VIDEO_MODEL_* 仅在角色缺行时用于初始化，运行时以设置页保存的数据库配置为准。
 */
export const resolveVideoConfig = (video: { baseUrl: string; apiKey: string; modelId: string }): VideoConfig => {
  const baseUrl = video.baseUrl.trim();
  if (!baseUrl) {
    throw new Error("未配置视频生成服务：请在「设置」页配置生视频模型的 Base URL");
  }
  const apiKey = video.apiKey.trim();
  if (!apiKey) {
    throw new Error("未配置视频生成密钥：请在「设置」页配置生视频模型的 API Key");
  }
  return {
    baseUrl: normalizeVideoBaseUrl(baseUrl),
    apiKey,
    modelId: video.modelId.trim() || DEFAULT_VIDEO_MODEL
  };
};

/** 取生视频配置：`configId` 为对话选的配置，不传或已失效时用默认 */
export const getVideoConfig = (configId?: string): VideoConfig =>
  resolveVideoConfig(resolveModelConfig("video", configId));

const normalizeVideoBaseUrl = (baseUrl: string): string => {
  const url = new URL(baseUrl.trim());
  url.pathname = url.pathname
    .replace(/\/{2,}/g, "/")
    .replace(/\/+$/, "")
    .replace(/\/video_generation$/, "");
  if (url.search || url.hash) {
    throw new Error("视频 Base URL 不应包含查询参数或片段");
  }
  return url.toString().replace(/\/+$/, "");
};

export interface VideoParams {
  prompt: string;
  durationSec: number;
  resolution: VideoResolution;
  ratio: VideoRatio;
  /** 图片已由服务层转为 data URL；首尾帧与多模态参考不可混用。 */
  firstFrame?: string;
  lastFrame?: string;
  referenceImages?: string[];
  referenceVideos?: string[];
  referenceAudios?: string[];
}

export const tasksEndpoint = (baseUrl: string): string => `${normalizeVideoBaseUrl(baseUrl)}/video_generation`;

export interface VideoRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}

export const buildSubmitRequest = (config: VideoConfig, params: VideoParams): VideoRequest => {
  if (!params.prompt.trim()) {
    throw new Error("视频提示词不能为空");
  }
  const modeError = videoModeError({
    firstFrameUrl: params.firstFrame,
    lastFrameUrl: params.lastFrame,
    referenceImageUrls: params.referenceImages,
    referenceVideoUrls: params.referenceVideos,
    referenceAudioUrls: params.referenceAudios
  });
  if (modeError) {
    throw new Error(modeError);
  }
  const isMax = config.modelId === "MiniMax-H3-Max";
  if (!Number.isInteger(params.durationSec) || params.durationSec < (isMax ? 5 : 4) || params.durationSec > 15) {
    throw new Error(`${config.modelId} 时长必须为 ${isMax ? "5" : "4"}~15 秒的整数`);
  }

  if ((isMax && params.resolution === "2K") || (!isMax && params.resolution === "480P")) {
    throw new Error(`${config.modelId} 不支持 ${params.resolution}，请使用 ${isMax ? "480P / 768P" : "768P / 2K"}`);
  }

  return {
    url: tasksEndpoint(config.baseUrl),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      model: config.modelId,
      content: [
        { type: "text", text: params.prompt },
        ...(params.firstFrame
          ? [{ type: "image_url", image_url: { url: params.firstFrame }, role: "first_frame" }]
          : []),
        ...(params.lastFrame ? [{ type: "image_url", image_url: { url: params.lastFrame }, role: "last_frame" }] : []),
        ...(params.referenceImages ?? []).map((url) => ({
          type: "image_url",
          image_url: { url },
          role: "reference_image"
        })),
        ...(params.referenceVideos ?? []).map((url) => ({
          type: "video_url",
          video_url: { url },
          role: "reference_video"
        })),
        ...(params.referenceAudios ?? []).map((url) => ({
          type: "audio_url",
          audio_url: { url },
          role: "reference_audio"
        }))
      ],
      resolution: params.resolution,
      ratio: params.firstFrame || params.lastFrame ? "adaptive" : params.ratio,
      duration: params.durationSec,
      aigc_watermark: false
    })
  };
};

export const taskUrl = (config: VideoConfig, taskId: string): string =>
  `${normalizeVideoBaseUrl(config.baseUrl)}/query/video_generation/${encodeURIComponent(taskId)}`;

/** MiniMax V2 提交返回 task_id；网关错误原样带出原因。 */
export const parseSubmitResponse = (json: unknown): string => {
  const body = json as { task_id?: unknown; error?: { code?: string; message?: string } };
  if (!body?.error && typeof body?.task_id === "string" && body.task_id) {
    return body.task_id;
  }
  const reason = body?.error?.message ? `${body.error.code ?? "error"}：${body.error.message}` : JSON.stringify(json);
  throw new Error(`提交视频生成任务失败：${reason}`);
};

export type VideoTaskState =
  | { status: "running" }
  | { status: "succeeded"; videoUrl: string }
  | { status: "failed"; reason: string };

const TERMINAL_FAILURES = new Set(["failed", "cancelled", "canceled", "expired"]);

/** 轮询响应 → 任务状态。没见过的状态一律当「还在跑」，由调用方的总超时兜底，不在这里猜成失败 */
export const parseTaskResponse = (json: unknown): VideoTaskState => {
  const response = json as { task?: unknown; error?: { message?: string } };
  if (response?.error) {
    throw new Error(`查询视频任务失败：${response.error.message ?? JSON.stringify(response.error)}`);
  }
  const body = response?.task as {
    status?: string;
    content?: { url?: string };
    error?: { code?: string; message?: string };
  };
  if (!body || typeof body.status !== "string" || !body.status) {
    throw new Error("查询视频任务失败：响应缺少 task.status");
  }
  const status = body?.status ?? "";
  if (status === "succeeded") {
    const videoUrl = body.content?.url;
    if (!videoUrl) {
      return { status: "failed", reason: "任务成功了但响应里没有视频地址" };
    }
    return { status: "succeeded", videoUrl };
  }
  if (TERMINAL_FAILURES.has(status)) {
    const detail = body.error?.message ? `：${body.error.message}` : "";
    return { status: "failed", reason: `视频生成任务${status}${detail}` };
  }
  return { status: "running" };
};
