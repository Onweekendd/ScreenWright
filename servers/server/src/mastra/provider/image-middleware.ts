import type { LanguageModelMiddleware } from "ai";

import { readStoredImage } from "../services/chat-image.server";
import { shrinkToJpeg } from "../services/shrink-image";

// ============================================================
// 让主模型直接「看图」
//
// 两件事都在发给模型的那一份 prompt 上做，不碰 memory：
// 1. 用户消息里的图片 file part：本系统的图（MinIO / fs）外网模型访问不到，按 objectKey 读出来换成
//    二进制（provider 会转成 base64 data URL）；同时附一段 `<attached-images>` 把 URL 以文本留给模型——
//    设计蓝图的 sourceImage、createImageTool 的 seedImages 这类入参要的是 URL，不是像素。
// 2. 工具产出的图：Chat Completions 的 tool 消息不能带图（DeepSeek 只认 user 消息里的图），
//    所以工具只在结果里写 `imagesForModel: [{url,label}]`，这里在那批 tool 消息之后补一条 user 图片消息。
//
// 不落 memory 的好处：前端不会冒出假的用户气泡；历史里只存短 URL 不存 base64；
// 旧图裁剪（只注入最近几张）顺手就做了。
// ============================================================

type Prompt = Parameters<NonNullable<LanguageModelMiddleware["transformParams"]>>[0]["params"]["prompt"];
type Message = Prompt[number];
type UserContent = Extract<Message, { role: "user" }>["content"];
type FilePart = Extract<UserContent[number], { type: "file" }>;
type ToolResultPart = Extract<Extract<Message, { role: "tool" }>["content"][number], { type: "tool-result" }>;

/** 工具结果里的约定字段：工具想让模型看到的图放这里 */
export const TOOL_IMAGES_FIELD = "imagesForModel";

export interface ToolImage {
  url: string;
  /** 给模型看的一句话说明，比如「画布截图 1920×1080」 */
  label: string;
}

/**
 * 最多注入最近几张工具图。DeepSeek 每张图最多 1024 token，token 不是瓶颈；
 * 瓶颈是请求体 48 MiB——base64 每一步都要重发，截图越攒越多迟早撞线。
 */
export const MAX_TOOL_IMAGES = 3;

export type ImageReader = (url: string) => Promise<{ buffer: Buffer; mime: string } | null>;

/** 读图结果：二进制、原样放行的 URL（非本系统资源），或读取失败 */
type LoadedImage = { data: Uint8Array; mime: string } | { data: URL; mime: null } | null;

const HTTP_URL = /^https?:\/\//i;

const toHttpUrl = (data: FilePart["data"]): string | null => {
  if (data instanceof URL) {
    return data.href;
  }
  return typeof data === "string" && HTTP_URL.test(data) ? data : null;
};

const isImageFile = (part: UserContent[number]): part is FilePart =>
  part.type === "file" && part.mediaType.startsWith("image/");

const loadImage = async (url: string, read: ImageReader): Promise<LoadedImage> => {
  try {
    const stored = await read(url);
    return stored ? { data: new Uint8Array(stored.buffer), mime: stored.mime } : { data: new URL(url), mime: null };
  } catch (error) {
    console.error("[image-middleware] 读图失败:", url, error);
    return null;
  }
};

const escapeAttr = (value: string): string => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

const buildAttachedImagesHint = (entries: Array<{ url: string; filename?: string }>): string => {
  const items = entries
    .map(
      (e, i) =>
        `  <image index="${i + 1}" url="${escapeAttr(e.url)}"${e.filename ? ` filename="${escapeAttr(e.filename)}"` : ""} />`
    )
    .join("\n");
  return `<attached-images>\n${items}\n</attached-images>`;
};

/**
 * 用户消息：本系统 URL 图换成二进制，并附 `<attached-images>`。
 * Mastra 会把同一张图同时写进 parts 和 experimental_attachments，转成 prompt 后可能出现两个
 * 同 URL 的 file part——按 URL 去重，否则模型以为收到了两张图。
 */
const inlineUserImages = async (content: UserContent, read: ImageReader): Promise<UserContent> => {
  const seen = new Set<string>();
  const entries: Array<{ url: string; filename?: string }> = [];
  const next: UserContent = [];

  for (const part of content) {
    const url = isImageFile(part) ? toHttpUrl(part.data) : null;
    if (!isImageFile(part) || !url) {
      next.push(part);
      continue;
    }
    if (seen.has(url)) {
      continue;
    }
    seen.add(url);
    entries.push({ url, filename: part.filename });

    const loaded = await loadImage(url, read);
    if (!loaded) {
      next.push({ type: "text", text: `〔图片读取失败：${url}〕` });
    } else if (loaded.mime === null) {
      next.push(part);
    } else {
      // 只在声明的类型是通配（image/*）时用存储侧推断的类型覆盖，声明了具体类型就信它
      const mediaType = part.mediaType === "image/*" ? loaded.mime : part.mediaType;
      next.push({ ...part, data: loaded.data, mediaType });
    }
  }

  if (entries.length > 0) {
    next.push({ type: "text", text: buildAttachedImagesHint(entries) });
  }
  return next;
};

const parseToolImages = (part: ToolResultPart): ToolImage[] => {
  let value: unknown;
  if (part.output.type === "json") {
    value = part.output.value;
  } else if (part.output.type === "text") {
    try {
      value = JSON.parse(part.output.value);
    } catch {
      return [];
    }
  } else {
    return [];
  }

  const images = (value as Record<string, unknown> | null)?.[TOOL_IMAGES_FIELD];
  if (!Array.isArray(images)) {
    return [];
  }
  return images.filter(
    (img): img is ToolImage => typeof img?.url === "string" && HTTP_URL.test(img.url) && typeof img?.label === "string"
  );
};

interface ToolImageRef extends ToolImage {
  toolName: string;
  /** 产出这张图的 tool 消息在 prompt 里的下标 */
  messageIndex: number;
}

/** 收集 prompt 里所有工具图，只保留最近 {@link MAX_TOOL_IMAGES} 张 */
const collectRecentToolImages = (prompt: Prompt): ToolImageRef[] => {
  const all: ToolImageRef[] = [];
  prompt.forEach((message, messageIndex) => {
    if (message.role !== "tool") {
      return;
    }
    for (const part of message.content) {
      if (part.type === "tool-result") {
        all.push(...parseToolImages(part).map((img) => ({ ...img, toolName: part.toolName, messageIndex })));
      }
    }
  });
  return all.slice(-MAX_TOOL_IMAGES);
};

/** 发给模型的工具图长边上限：模型每张图的 token 封顶，超出的分辨率只会白白撑大请求体 */
const MODEL_IMAGE_MAX_EDGE = 1280;
/** 小于它的图不动：已经够小，重编码一次只会白白损失画质 */
const SHRINK_THRESHOLD_BYTES = 300 * 1024;

/**
 * 生图结果常是 3~4MB 的大 PNG，每一步都 base64 重发、最多 3 张，很快逼近请求体上限。
 * 本系统的大图先缩到长边 ≤1280 再给模型；缩不了（解码失败）就原样给，别因此丢图。
 */
const shrinkForModel = async (data: Uint8Array, mime: string): Promise<{ data: Uint8Array; mime: string }> => {
  if (data.length <= SHRINK_THRESHOLD_BYTES) {
    return { data, mime };
  }
  try {
    return { data: new Uint8Array(await shrinkToJpeg(data, MODEL_IMAGE_MAX_EDGE)), mime: "image/jpeg" };
  } catch (error) {
    console.warn("[image-middleware] 工具图缩小失败，原样发送:", error);
    return { data, mime };
  }
};

const buildToolImageMessage = async (refs: ToolImageRef[], read: ImageReader): Promise<Message> => {
  const lines = refs.map((ref, i) => `[${i + 1}] ${ref.label}（来自工具 ${ref.toolName}）`);
  const content: UserContent = [
    { type: "text", text: `〔以下图片由上面的工具调用返回，不是用户发言〕\n${lines.join("\n")}` }
  ];
  for (const ref of refs) {
    const loaded = await loadImage(ref.url, read);
    if (!loaded) {
      content.push({ type: "text", text: `〔图片读取失败：${ref.url}〕` });
    } else if (loaded.mime === null) {
      content.push({ type: "file", mediaType: "image/png", data: loaded.data });
    } else {
      const shrunk = await shrinkForModel(loaded.data, loaded.mime);
      content.push({ type: "file", mediaType: shrunk.mime, data: shrunk.data });
    }
  }
  return { role: "user", content };
};

/**
 * 处理整份 prompt。工具图消息插在**一整串连续 tool 消息之后**：Chat Completions 要求 assistant 的
 * tool_calls 后面紧跟全部对应的 tool 消息，中间夹一条 user 会 400。
 */
export const inlineImages = async (prompt: Prompt, read: ImageReader): Promise<Prompt> => {
  const toolImages = collectRecentToolImages(prompt);
  const result: Prompt = [];
  let pending: ToolImageRef[] = [];

  for (let i = 0; i < prompt.length; i++) {
    const message = prompt[i];
    if (message.role === "user") {
      result.push({ ...message, content: await inlineUserImages(message.content, read) });
    } else {
      result.push(message);
    }

    if (message.role !== "tool") {
      continue;
    }
    pending.push(...toolImages.filter((img) => img.messageIndex === i));
    const runEnds = prompt[i + 1]?.role !== "tool";
    if (runEnds && pending.length > 0) {
      result.push(await buildToolImageMessage(pending, read));
      pending = [];
    }
  }
  return result;
};

export const createInlineImagesMiddleware = (read: ImageReader = readStoredImage): LanguageModelMiddleware => ({
  specificationVersion: "v3",
  transformParams: async ({ params }) => ({ ...params, prompt: await inlineImages(params.prompt, read) })
});

export const inlineImagesMiddleware: LanguageModelMiddleware = createInlineImagesMiddleware();
