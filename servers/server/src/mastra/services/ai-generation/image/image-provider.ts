/**
 * 生图服务商的「方言」：同一件事（给提示词，拿回一张图），不同服务商的请求格式不一样。
 *
 * - ark：火山方舟（seedream）。`/images/generations` 带 seed / watermark / response_format:"url"，
 *   图生图是同一个端点多一个 `image` 字段：一张是 data URL，多张是 data URL 数组。
 * - openai：OpenAI 兼容的 gpt-image 系列（含各种中转网关）。**不能**带 seed / watermark / response_format
 *   （收到未知参数会直接 400），size 有自己的一套规则，图生图是另一个端点 `/images/edits`（multipart，
 *   一张传 `image`，多张重复传 `image[]`）。
 *
 * 按模型 id 自动判断；判断不准（比如网关把模型改了名）时用环境变量 IMAGE_API_STYLE 强制指定。
 */
import type { GenerateImageInput } from "./image-input";

export type ImageApiStyle = "ark" | "openai";

const OPENAI_MODEL_RE = /^(gpt-image|chatgpt-image|dall-e)/i;

export const resolveImageApiStyle = (modelId: string, env: NodeJS.ProcessEnv = process.env): ImageApiStyle => {
  const forced = env.IMAGE_API_STYLE;
  if (forced === "ark" || forced === "openai") {
    return forced;
  }
  return OPENAI_MODEL_RE.test(modelId.trim()) ? "openai" : "ark";
};

export const mediaTypeOf = (bytes: Buffer): string =>
  bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ? "image/jpeg" : "image/png";

/** baseUrl 去掉结尾斜杠和误填的 `/images/generations` */
export const imagesBase = (baseUrl: string): string =>
  baseUrl.replace(/\/+$/, "").replace(/\/images\/generations$/, "");

/**
 * 生图接口地址。baseUrl 只该写到 `/api/v3` 或 `/v1`，但把完整的 `.../images/generations` 填进去是个反复踩的坑：
 * 直接再拼一次后缀得到 `/images/generations/images/generations`，方舟对这个不存在的路径回的是
 * **500 InternalServiceError**（不是 404），看着像服务商故障，重试多少次都一样。所以这里先把已有的后缀去掉。
 */
export const imagesEndpoint = (baseUrl: string): string => `${imagesBase(baseUrl)}/images/generations`;

export interface ImageRequest {
  url: string;
  headers: Record<string, string>;
  body: string | FormData;
  /** 请求体大小（KB），只用于失败时的日志 */
  sizeKB: number;
}

interface BuildArgs {
  baseUrl: string;
  apiKey: string;
  modelId: string;
  input: GenerateImageInput;
  /** 已经预处理过的参考图字节，按顺序发送 */
  references?: Buffer[];
  env?: NodeJS.ProcessEnv;
}

const dataUrl = (bytes: Buffer) => `data:${mediaTypeOf(bytes)};base64,${bytes.toString("base64")}`;

export const buildArkRequest = ({ baseUrl, apiKey, modelId, input, references = [] }: BuildArgs): ImageRequest => {
  // 一张时保持单个字符串（只支持单图的老模型只认这种），多张才发数组
  const image =
    references.length === 0 ? undefined : references.length === 1 ? dataUrl(references[0]) : references.map(dataUrl);
  const body = JSON.stringify({
    model: modelId,
    prompt: input.prompt,
    ...(image ? { image } : {}),
    size: `${input.width}x${input.height}`,
    seed: input.seed,
    response_format: "url",
    watermark: false
  });
  return {
    url: imagesEndpoint(baseUrl),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, Connection: "close" },
    body,
    sizeKB: Math.round(body.length / 1024)
  };
};

// ==================== gpt-image 的 size ====================

/** 文档里明确列出的尺寸：任何分组都能用；其余「自定义分辨率」只有部分分组开放 */
const GPT_IMAGE_PRESETS: ReadonlyArray<readonly [number, number]> = [
  [1024, 1024],
  [1536, 1024],
  [1024, 1536],
  [2048, 2048],
  [2048, 1152],
  [3840, 2160],
  [2160, 3840]
];

const MAX_EDGE = 3840;
const MIN_PIXELS = 655_360;
const MAX_PIXELS = 8_294_400;
const MAX_ASPECT = 3;
const STEP = 16;

/** 宽高比差在这个范围内，就直接用预设尺寸（预设一定被接受，不依赖自定义分辨率权限） */
const PRESET_ASPECT_TOLERANCE = 0.03;

const round16 = (value: number) => Math.max(STEP, Math.round(value / STEP) * STEP);

/**
 * 把想要的宽高换成 gpt-image 接受的 size。
 *
 * 1. 宽高比与某个预设接近（±3%）就用预设——1920×1080 落到 2048×1152（16:9），卡片这类也是；
 *    同宽高比有多个预设时取面积最接近的。
 * 2. 否则走自定义分辨率：长短边比夹到 ≤3:1，面积夹进 [65.5 万, 829 万]，最长边 ≤3840，宽高取 16 的倍数。
 *    自定义分辨率只有部分分组可用，用不了时服务商会返回 400，错误会原样带回给 agent。
 *
 * 实际出图尺寸以服务商返回为准（见 generateAndStoreImage 里读图片元数据），所以这里的取整不会让记录失真。
 */
export const resolveGptImageSize = (width: number, height: number): string => {
  const aspect = width / height;
  const area = width * height;

  const candidates = GPT_IMAGE_PRESETS.map(([w, h]) => ({
    w,
    h,
    aspectDiff: Math.abs(w / h / aspect - 1),
    areaDiff: Math.abs(Math.log((w * h) / area))
  })).filter((p) => p.aspectDiff <= PRESET_ASPECT_TOLERANCE);
  if (candidates.length > 0) {
    candidates.sort((a, b) => a.areaDiff - b.areaDiff);
    return `${candidates[0].w}x${candidates[0].h}`;
  }

  let w = width;
  let h = height;
  if (w / h > MAX_ASPECT) {
    w = h * MAX_ASPECT;
  } else if (h / w > MAX_ASPECT) {
    h = w * MAX_ASPECT;
  }
  // 太大要缩（最长边、面积两个上限取更紧的），太小要放大到面积下限
  const downscale = Math.min(1, MAX_EDGE / Math.max(w, h), Math.sqrt(MAX_PIXELS / (w * h)));
  const upscale = w * h < MIN_PIXELS ? Math.sqrt(MIN_PIXELS / (w * h)) : 1;
  w *= downscale * upscale;
  h *= downscale * upscale;

  let rw = round16(w);
  let rh = round16(h);
  // 取整可能把面积推出范围：下限向上取、上限 / 最长边向下取
  if (rw * rh < MIN_PIXELS) {
    rw = Math.ceil(w / STEP) * STEP;
    rh = Math.ceil(h / STEP) * STEP;
  }
  if (rw * rh > MAX_PIXELS || Math.max(rw, rh) > MAX_EDGE) {
    rw = Math.max(STEP, Math.floor(w / STEP) * STEP);
    rh = Math.max(STEP, Math.floor(h / STEP) * STEP);
  }
  // 取整还可能让长短边比略超 3:1（如 1500×500 取成 1504×496）：把长边收回到 3 倍短边以内
  if (rw > rh * MAX_ASPECT) {
    rw = Math.floor((rh * MAX_ASPECT) / STEP) * STEP;
  } else if (rh > rw * MAX_ASPECT) {
    rh = Math.floor((rw * MAX_ASPECT) / STEP) * STEP;
  }
  return `${rw}x${rh}`;
};

const QUALITIES = new Set(["low", "medium", "high", "auto"]);

export const buildOpenAiRequest = ({
  baseUrl,
  apiKey,
  modelId,
  input,
  references = [],
  env = process.env
}: BuildArgs): ImageRequest => {
  const size = resolveGptImageSize(input.width, input.height);
  const quality =
    env.IMAGE_MODEL_QUALITY && QUALITIES.has(env.IMAGE_MODEL_QUALITY) ? env.IMAGE_MODEL_QUALITY : undefined;
  const base = imagesBase(baseUrl);

  // 图生图是另一个端点：multipart，参考图作为文件上传（不是 JSON 里的 data URL）
  if (references.length > 0) {
    const form = new FormData();
    form.append("model", modelId);
    form.append("prompt", input.prompt);
    form.append("n", "1");
    form.append("size", size);
    if (quality) {
      form.append("quality", quality);
    }
    // 一张用 `image`，多张按 OpenAI 的写法重复 `image[]`
    const field = references.length === 1 ? "image" : "image[]";
    references.forEach((reference, i) => {
      const mime = mediaTypeOf(reference);
      const name = references.length === 1 ? "reference" : `reference-${i + 1}`;
      form.append(
        field,
        new Blob([new Uint8Array(reference)], { type: mime }),
        `${name}.${mime === "image/jpeg" ? "jpg" : "png"}`
      );
    });
    return {
      url: `${base}/images/edits`,
      // multipart 的 Content-Type（含 boundary）必须交给 fetch 自己生成，不能手写
      headers: { Authorization: `Bearer ${apiKey}`, Connection: "close" },
      body: form,
      sizeKB: Math.round(references.reduce((sum, reference) => sum + reference.length, 0) / 1024)
    };
  }

  const body = JSON.stringify({
    model: modelId,
    prompt: input.prompt,
    n: 1,
    size,
    ...(quality ? { quality } : {})
  });
  return {
    url: `${base}/images/generations`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      Connection: "close"
    },
    body,
    sizeKB: Math.round(body.length / 1024)
  };
};

export const buildImageRequest = (args: BuildArgs): ImageRequest =>
  resolveImageApiStyle(args.modelId, args.env) === "openai" ? buildOpenAiRequest(args) : buildArkRequest(args);

// ==================== 响应 ====================

export interface ExtractedImage {
  url?: string;
  b64_json?: string;
}

const DATA_URL_RE = /data:image\/[a-z0-9.+-]+;base64,([A-Za-z0-9+/=]+)/i;
const HTTP_URL_RE = /https?:\/\/[^\s)"'<>\]]+/i;

/**
 * 从响应里取出图片。标准形态是 `{ data: [{ url | b64_json }] }`；
 * 有的网关的文档（和少数实现）把图生图写成对话补全格式 `choices[0].message.content`，
 * 图片以 markdown 链接 / 裸链接 / data URL 的形式夹在文本里——两种都认，认不出返回 null。
 */
export const extractImage = (payload: unknown): ExtractedImage | null => {
  const body = payload as {
    data?: Array<ExtractedImage>;
    choices?: Array<{ message?: { content?: unknown } }>;
  } | null;

  const item = body?.data?.[0];
  if (item?.url || item?.b64_json) {
    return { url: item.url, b64_json: item.b64_json };
  }

  const content = body?.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    const dataUrl = DATA_URL_RE.exec(content);
    if (dataUrl) {
      return { b64_json: dataUrl[1] };
    }
    const link = HTTP_URL_RE.exec(content);
    if (link) {
      return { url: link[0] };
    }
  }
  return null;
};
