/**
 * MiniMax V2 视频接口，经网关转发。
 *
 * POST /v2/video_generation 返回 task_id，
 * GET /v2/query/video_generation/{task_id} 轮询，成功后读取 task.content.url。
 *
 * 官方文档：https://platform.minimax.cn/docs/api-reference/video-generation-v2-create
 * 网关前缀示例：https://llm-api.net/minimax/v2（也接受完整 video_generation 地址）。
 */
import { mediaTypeOf } from "../../image/image-provider";
import { videoModeError } from "../video-input";
import type { VideoAdapter, VideoConfig, VideoParams, VideoRequest, VideoTaskState } from "../video-provider";
import { normalizeBaseUrl } from "./base-url";

const normalize = (baseUrl: string): string => normalizeBaseUrl(baseUrl, /\/video_generation$/);

const toDataUrl = (bytes: Buffer): string => `data:${mediaTypeOf(bytes)};base64,${bytes.toString("base64")}`;

export const tasksEndpoint = (baseUrl: string): string => `${normalize(baseUrl)}/video_generation`;

export const taskUrl = (config: VideoConfig, taskId: string): string =>
  `${normalize(config.baseUrl)}/query/video_generation/${encodeURIComponent(taskId)}`;

const authHeaders = (config: VideoConfig) => ({ Authorization: `Bearer ${config.apiKey}` });

export const buildSubmitRequest = (config: VideoConfig, params: VideoParams): VideoRequest => {
  if (!params.prompt.trim()) {
    throw new Error("视频提示词不能为空");
  }
  const modeError = videoModeError({
    firstFrameUrl: params.firstFrame ? "first" : undefined,
    lastFrameUrl: params.lastFrame ? "last" : undefined,
    referenceImageUrls: params.referenceImages?.map(() => "image"),
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

  const supported = isMax ? ["480P", "768P"] : ["768P", "2K"];
  if (!supported.includes(params.resolution)) {
    throw new Error(`${config.modelId} 不支持 ${params.resolution}，请使用 ${supported.join(" / ")}`);
  }

  return {
    method: "POST",
    url: tasksEndpoint(config.baseUrl),
    headers: { "Content-Type": "application/json", ...authHeaders(config) },
    body: JSON.stringify({
      model: config.modelId,
      content: [
        { type: "text", text: params.prompt },
        ...(params.firstFrame
          ? [{ type: "image_url", image_url: { url: toDataUrl(params.firstFrame) }, role: "first_frame" }]
          : []),
        ...(params.lastFrame
          ? [{ type: "image_url", image_url: { url: toDataUrl(params.lastFrame) }, role: "last_frame" }]
          : []),
        ...(params.referenceImages ?? []).map((bytes) => ({
          type: "image_url",
          image_url: { url: toDataUrl(bytes) },
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

/** MiniMax V2 提交返回 task_id；网关错误原样带出原因。 */
export const parseSubmitResponse = (json: unknown): string => {
  const body = json as { task_id?: unknown; error?: { code?: string; message?: string } };
  if (!body?.error && typeof body?.task_id === "string" && body.task_id) {
    return body.task_id;
  }
  const reason = body?.error?.message ? `${body.error.code ?? "error"}：${body.error.message}` : JSON.stringify(json);
  throw new Error(`提交视频生成任务失败：${reason}`);
};

const TERMINAL_FAILURES = new Set(["failed", "cancelled", "canceled", "expired"]);

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
  const status = body.status;
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

export const minimaxV2Adapter: VideoAdapter = {
  normalizeBaseUrl: normalize,
  buildSubmitRequest,
  parseSubmitResponse,
  taskRequest: (config, taskId) => ({ method: "GET", url: taskUrl(config, taskId), headers: authHeaders(config) }),
  parseTaskResponse,
  // 没有免费的查询接口能验证密钥，只能真提交一次：会生成一段 5 秒视频并计费
  probe: {
    request: (config) =>
      buildSubmitRequest(config, {
        prompt: "白色背景上的一朵云缓慢移动",
        durationSec: 5,
        resolution: "768P",
        ratio: "16:9"
      }),
    check: (status, text) => {
      if (status < 200 || status >= 300) {
        throw new Error(`视频接口请求失败（HTTP ${status}）：${text.slice(0, 300)}`);
      }
      parseSubmitResponse(JSON.parse(text));
    }
  }
};
