/**
 * 视频生成服务商：按 video 角色配置的 `provider` 选协议适配器，使用「设置」页的 video 角色配置。
 *
 * 各家都是异步任务：提交拿任务 id → 轮询状态 → 拿到视频地址后由服务层转存。
 * 适配器只管请求怎么拼、响应怎么读，不发请求、不碰存储，方便单测。
 * - minimax-v2：MiniMax V2 JSON 接口，经网关转发（provider 留空时的默认），见 providers/minimax-v2.ts
 * - runlive：卡密接口，multipart 提交、完成后另取下载地址，见 providers/runlive.ts
 */
import { DEFAULT_VIDEO_MODEL, resolveModelConfig } from "@/mastra/provider/model-registry";

import { minimaxV2Adapter } from "./providers/minimax-v2";
import { runliveAdapter } from "./providers/runlive";
import type { VIDEO_RATIOS, VIDEO_RESOLUTIONS } from "./video-input";

export { VIDEO_RATIOS, VIDEO_RESOLUTIONS } from "./video-input";
export { DEFAULT_VIDEO_MODEL } from "@/mastra/provider/model-registry";

export type VideoResolution = (typeof VIDEO_RESOLUTIONS)[number];
export type VideoRatio = (typeof VIDEO_RATIOS)[number];

export const VIDEO_PROVIDERS = ["minimax-v2", "runlive"] as const;
export type VideoProviderId = (typeof VIDEO_PROVIDERS)[number];
const DEFAULT_VIDEO_PROVIDER: VideoProviderId = "minimax-v2";

export interface VideoConfig {
  provider: VideoProviderId;
  /** 已规范化的接口前缀，不含具体接口路径 */
  baseUrl: string;
  apiKey: string;
  modelId: string;
}

export interface VideoParams {
  prompt: string;
  durationSec: number;
  resolution: VideoResolution;
  ratio: VideoRatio;
  /** 图片已由服务层读出并压缩，由适配器决定编码方式；首尾帧与多模态参考不可混用。 */
  firstFrame?: Buffer;
  lastFrame?: Buffer;
  referenceImages?: Buffer[];
  /** 服务商可直接下载的公网地址 */
  referenceVideos?: string[];
  referenceAudios?: string[];
}

export interface VideoRequest {
  method: "GET" | "POST";
  url: string;
  headers: Record<string, string>;
  body?: string | FormData;
}

export type VideoTaskState =
  | { status: "running" }
  /** `videoUrl` 缺省：查询结果不带地址，要再走适配器的 `resultUrl` 取 */
  | { status: "succeeded"; videoUrl?: string }
  | { status: "failed"; reason: string };

export interface VideoAdapter {
  /** 规范化 Base URL：接受接口前缀或完整提交地址 */
  normalizeBaseUrl(baseUrl: string): string;
  /** 按服务商能力校验参数并拼提交请求 */
  buildSubmitRequest(config: VideoConfig, params: VideoParams): VideoRequest;
  parseSubmitResponse(json: unknown): string;
  taskRequest(config: VideoConfig, taskId: string): VideoRequest;
  /** 没见过的状态一律当「还在跑」，由调用方的总超时兜底 */
  parseTaskResponse(json: unknown): VideoTaskState;
  /** 任务完成后另取下载地址；`parse` 返回 null 表示地址还没就绪，下一轮再取 */
  resultUrl?: {
    request(config: VideoConfig, taskId: string): VideoRequest;
    parse(status: number, text: string): string | null;
  };
  /** 设置页「测试」：用代价最小的请求验证地址和密钥，失败时抛出可读原因 */
  probe: {
    request(config: VideoConfig): VideoRequest;
    check(status: number, text: string): void;
  };
}

const ADAPTERS: Record<VideoProviderId, VideoAdapter> = {
  "minimax-v2": minimaxV2Adapter,
  runlive: runliveAdapter
};

export const videoAdapter = (config: Pick<VideoConfig, "provider">): VideoAdapter => ADAPTERS[config.provider];

const resolveProvider = (provider: string | undefined): VideoProviderId => {
  const id = provider?.trim() || DEFAULT_VIDEO_PROVIDER;
  if (!(VIDEO_PROVIDERS as readonly string[]).includes(id)) {
    throw new Error(`不支持的视频服务商「${id}」，可选：${VIDEO_PROVIDERS.join(" / ")}`);
  }
  return id as VideoProviderId;
};

/**
 * 校验并规范化 video 角色配置。
 * VIDEO_MODEL_* 仅在角色缺行时用于初始化，运行时以设置页保存的数据库配置为准。
 */
export const resolveVideoConfig = (video: {
  provider?: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
}): VideoConfig => {
  const provider = resolveProvider(video.provider);
  const baseUrl = video.baseUrl.trim();
  if (!baseUrl) {
    throw new Error("未配置视频生成服务：请在「设置」页配置生视频模型的 Base URL");
  }
  const apiKey = video.apiKey.trim();
  if (!apiKey) {
    throw new Error("未配置视频生成密钥：请在「设置」页配置生视频模型的 API Key");
  }
  return {
    provider,
    baseUrl: ADAPTERS[provider].normalizeBaseUrl(baseUrl),
    apiKey,
    modelId: video.modelId.trim() || DEFAULT_VIDEO_MODEL
  };
};

/** 取生视频配置：`configId` 为对话选的配置，不传或已失效时用默认 */
export const getVideoConfig = (configId?: string): VideoConfig =>
  resolveVideoConfig(resolveModelConfig("video", configId));

/**
 * 幂等 hash 与落库记的模型标识。默认服务商只用模型 id，保持已有记录的 hash 不变；
 * 其余带上服务商前缀：两家可能用同一个模型名，出的片不能互相复用。
 */
export const videoModelKey = (config: Pick<VideoConfig, "provider" | "modelId">): string =>
  config.provider === DEFAULT_VIDEO_PROVIDER ? config.modelId : `${config.provider}:${config.modelId}`;
