/**
 * <attached-images> 还原工具
 *
 * ImagePartSanitizer 会把用户上传的图片 file part 清掉、以 XML hint 合并进 text，
 * 导致 DB 中不再保留 file part。历史回读时这里负责把它们解析回 file part，并从 text 中剥离。
 */

import type { UIMessage } from "ai";

// 从 filename 后缀粗略推断 image MIME，仅用于展示，模型不依赖它
const inferImageMime = (filename: string | undefined): string => {
  const ext = filename?.toLowerCase().match(/\.(png|jpe?g|gif|webp|bmp|svg)$/)?.[1];
  if (!ext) {
    return "image/png";
  }
  if (ext === "jpg") {
    return "image/jpeg";
  }
  if (ext === "svg") {
    return "image/svg+xml";
  }
  return `image/${ext}`;
};

/**
 * 用户消息历史回读时，把 ImagePartSanitizer 注入的 <attached-images> 文本块反向解析回 file part。
 * sanitizer 会把上传的图片 file part 清掉并以 XML hint 形式合并进 text，导致 DB 中不再保留 file part；
 * 前端历史浮层需要展示缩略图，这里负责还原。同时从 text 中剥离该块，避免文案污染气泡内容。
 */
export const restoreFilePartsFromAttachedImages = (messages: UIMessage[]): void => {
  const blockRe = /\n*<attached-images>([\s\S]*?)<\/attached-images>\n*/g;
  const imageRe = /<image\b[^>]*?\burl="([^"]+)"(?:[^>]*?\bfilename="([^"]+)")?[^>]*\/>/g;

  for (const msg of messages) {
    if (msg.role !== "user" || !Array.isArray(msg.parts)) {
      continue;
    }
    const restoredFiles: Array<{ type: "file"; mediaType: string; url: string; filename?: string }> = [];

    const rewrittenParts = (msg.parts as Array<{ type: string; text?: string; [k: string]: unknown }>).map((part) => {
      if (part.type !== "text" || typeof part.text !== "string" || !part.text.includes("<attached-images>")) {
        return part;
      }
      let cleaned = part.text;
      cleaned = cleaned.replace(blockRe, (_, inner: string) => {
        let m: RegExpExecArray | null;
        imageRe.lastIndex = 0;
        while ((m = imageRe.exec(inner)) !== null) {
          restoredFiles.push({
            type: "file",
            mediaType: inferImageMime(m[2]),
            url: m[1],
            ...(m[2] ? { filename: m[2] } : {})
          });
        }
        return "";
      });
      return { ...part, text: cleaned };
    });

    if (restoredFiles.length === 0) {
      continue;
    }
    (msg.parts as unknown[]).length = 0;
    (msg.parts as unknown[]).push(...rewrittenParts, ...restoredFiles);
  }
};
