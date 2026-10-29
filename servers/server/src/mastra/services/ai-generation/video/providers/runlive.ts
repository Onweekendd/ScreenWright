/**
 * runlive 卡密接口（MiniMax H3），Base URL 示例：https://www.runlive.top/mnmx。
 *
 * POST /api/v1/tasks 以 multipart 提交，`task_name` 区分模式：
 * - minimax_h3_v2：文生视频 / 首帧 / 首尾帧，480P / 768P / 1080P
 * - minimax_h3_multi_ref：1~6 张参考图，480P / 768P
 * GET /api/v1/tasks/{id} 轮询状态，completed 后 GET /api/v1/tasks/{id}/file-url 取带时效的签名直链。
 * 鉴权头 `X-Card-Key`；查询和取链各限 1 次/秒。不支持参考视频 / 音频，也不支持只传尾帧。
 */
import { mediaTypeOf } from "../../image/image-provider";
import { videoModeError } from "../video-input";
import type {
  VideoAdapter,
  VideoConfig,
  VideoParams,
  VideoRatio,
  VideoRequest,
  VideoResolution,
  VideoTaskState
} from "../video-provider";
import { normalizeBaseUrl } from "./base-url";

const normalize = (baseUrl: string): string => normalizeBaseUrl(baseUrl, /\/api\/v1\/tasks$/);

const tasksUrl = (config: VideoConfig): string => `${normalize(config.baseUrl)}/api/v1/tasks`;

const taskUrl = (config: VideoConfig, taskId: string): string => `${tasksUrl(config)}/${encodeURIComponent(taskId)}`;

const authHeaders = (config: VideoConfig) => ({ "X-Card-Key": config.apiKey });

const RESOLUTION_CODES: Partial<Record<VideoResolution, string>> = { "480P": "0.4", "768P": "1", "1080P": "2" };

/** 接口只认整串取值 */
const ASPECT_RATIOS: Record<VideoRatio, string> = {
  "21:9": "21:9 (Ultrawide)",
  "16:9": "16:9 (Widescreen)",
  "4:3": "4:3 (Standard)",
  "1:1": "1:1 (Square)",
  "3:4": "3:4 (Portrait Standard)",
  "9:16": "9:16 (Portrait Widescreen)"
};

const MAX_REFERENCE_IMAGES = 6;
/** 首尾帧 + 1080P 的时长上限 */
const FRAMES_1080P_MAX_SEC = 10;

const imageFile = (bytes: Buffer, name: string): [Blob, string] => {
  const type = mediaTypeOf(bytes);
  return [new Blob([new Uint8Array(bytes)], { type }), `${name}.${type.split("/")[1]}`];
};

export const buildSubmitRequest = (config: VideoConfig, params: VideoParams): VideoRequest => {
  if (!params.prompt.trim()) {
    throw new Error("视频提示词不能为空");
  }
  const references = params.referenceImages ?? [];
  const modeError = videoModeError({
    firstFrameUrl: params.firstFrame ? "first" : undefined,
    lastFrameUrl: params.lastFrame ? "last" : undefined,
    referenceImageUrls: references.map(() => "image"),
    referenceVideoUrls: params.referenceVideos,
    referenceAudioUrls: params.referenceAudios
  });
  if (modeError) {
    throw new Error(modeError);
  }
  if (params.referenceVideos?.length || params.referenceAudios?.length) {
    throw new Error("当前视频服务（runlive）不支持参考视频或音频，只能用参考图（最多 6 张）");
  }
  if (params.lastFrame && !params.firstFrame) {
    throw new Error("当前视频服务（runlive）不支持只传尾帧，尾帧需要和首帧一起传");
  }
  if (references.length > MAX_REFERENCE_IMAGES) {
    throw new Error(`参考图最多 ${MAX_REFERENCE_IMAGES} 张，当前 ${references.length} 张`);
  }
  if (!Number.isInteger(params.durationSec) || params.durationSec < 4 || params.durationSec > 15) {
    throw new Error("时长必须为 4~15 秒的整数");
  }
  const multiRef = references.length > 0;
  const supported: VideoResolution[] = multiRef ? ["480P", "768P"] : ["480P", "768P", "1080P"];
  if (!supported.includes(params.resolution)) {
    throw new Error(
      `${multiRef ? "参考图生视频" : "当前视频服务（runlive）"}不支持 ${params.resolution}，请使用 ${supported.join(" / ")}`
    );
  }
  if (
    params.firstFrame &&
    params.lastFrame &&
    params.resolution === "1080P" &&
    params.durationSec > FRAMES_1080P_MAX_SEC
  ) {
    throw new Error(`首尾帧 1080P 视频最长 ${FRAMES_1080P_MAX_SEC} 秒，请缩短时长或降低分辨率`);
  }

  const form = new FormData();
  form.append("task_name", multiRef ? "minimax_h3_multi_ref" : "minimax_h3_v2");
  form.append("prompt", params.prompt);
  form.append("resolution", RESOLUTION_CODES[params.resolution]!);
  form.append("duration", String(params.durationSec));
  form.append("aspect_ratio", ASPECT_RATIOS[params.ratio]);
  if (params.firstFrame) {
    form.append("first_frame", ...imageFile(params.firstFrame, "first_frame"));
  }
  if (params.lastFrame) {
    form.append("last_frame", ...imageFile(params.lastFrame, "last_frame"));
  }
  references.forEach((bytes, index) => form.append(`ref_${index}`, ...imageFile(bytes, `ref_${index}`)));

  // 不手写 Content-Type：multipart 的 boundary 由 fetch 生成
  return { method: "POST", url: tasksUrl(config), headers: authHeaders(config), body: form };
};

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

interface Envelope {
  success?: boolean;
  data?: unknown;
  message?: unknown;
  error?: unknown;
  detail?: unknown;
}

const reasonOf = (json: unknown): string => {
  const body = json as Envelope | undefined;
  const reason = [body?.message, body?.error, body?.detail].find((value) => typeof value === "string" && value);
  return (reason as string | undefined) ?? JSON.stringify(json);
};

export const parseSubmitResponse = (json: unknown): string => {
  const body = json as Envelope | undefined;
  const taskId = (body?.data as { task_id?: unknown } | undefined)?.task_id;
  if (body?.success !== false && typeof taskId === "string" && taskId) {
    return taskId;
  }
  throw new Error(`提交视频生成任务失败：${reasonOf(json)}`);
};

export const parseTaskResponse = (json: unknown): VideoTaskState => {
  const body = json as Envelope | undefined;
  if (body?.success === false) {
    throw new Error(`查询视频任务失败：${reasonOf(json)}`);
  }
  const data = body?.data as { status?: unknown; error?: unknown } | undefined;
  if (typeof data?.status !== "string" || !data.status) {
    throw new Error("查询视频任务失败：响应缺少 data.status");
  }
  if (data.status === "completed") {
    return { status: "succeeded" };
  }
  if (data.status === "failed") {
    const detail = typeof data.error === "string" && data.error ? `：${data.error}` : "";
    return { status: "failed", reason: `视频生成任务失败${detail}` };
  }
  return { status: "running" };
};

/** 任务刚完成的几秒内云端还没同步，取链接口回 404，要当「还没就绪」继续轮询 */
export const parseFileUrlResponse = (status: number, text: string): string | null => {
  if (status === 404) {
    return null;
  }
  if (status < 200 || status >= 300) {
    throw new Error(`获取视频下载地址失败 ${status}：${text.slice(0, 200)}`);
  }
  const json = parseJson(text);
  const url = ((json as Envelope | undefined)?.data as { url?: unknown } | undefined)?.url;
  if (typeof url !== "string" || !url) {
    throw new Error(`获取视频下载地址失败：${reasonOf(json ?? text)}`);
  }
  return url;
};

/** 查一个不存在的任务：密钥有效时回 JSON 的 404，不提交任务、不扣积分 */
export const checkProbeResponse = (status: number, text: string): void => {
  const json = parseJson(text) as Envelope | undefined;
  if ((status === 404 && json?.success === false) || (status >= 200 && status < 300)) {
    return;
  }
  if (status === 401 || status === 403) {
    throw new Error(`卡密钥无效或未被放行（HTTP ${status}）：${reasonOf(json ?? text)}`);
  }
  throw new Error(`视频接口请求失败（HTTP ${status}），请检查 Base URL：${text.slice(0, 300)}`);
};

export const runliveAdapter: VideoAdapter = {
  normalizeBaseUrl: normalize,
  buildSubmitRequest,
  parseSubmitResponse,
  taskRequest: (config, taskId) => ({ method: "GET", url: taskUrl(config, taskId), headers: authHeaders(config) }),
  parseTaskResponse,
  resultUrl: {
    request: (config, taskId) => ({
      method: "GET",
      url: `${taskUrl(config, taskId)}/file-url`,
      headers: authHeaders(config)
    }),
    parse: parseFileUrlResponse
  },
  probe: {
    request: (config) => ({ method: "GET", url: taskUrl(config, "connectivity-check"), headers: authHeaders(config) }),
    check: checkProbeResponse
  }
};
