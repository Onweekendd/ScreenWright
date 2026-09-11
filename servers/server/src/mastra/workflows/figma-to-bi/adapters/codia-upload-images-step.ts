import { randomUUID } from "node:crypto";

import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { assetStore } from "@/lib/storage";
import { StepEnum } from "@/mastra/types";
import type { Data, VisualElement } from "@/mastra/types/codia";

const PREFIX = "codia-images";

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg"
};

/** 一个待转存的图片位置：当前 Codia CDN url + 就地写回新 url 的 setter。 */
interface ImageSlot {
  url: string;
  set: (next: string) => void;
}

/**
 * 迭代遍历 visualElement 树（显式栈，非递归），收集所有引用 Codia CDN 图片的位置：
 * - styleConfig.backgroundConfig（type=IMAGE）的 imageUrl
 * - contentData.imageSource（Image 节点）
 * 用 setter 记录写回入口，避免后面还要再遍历一次定位。
 */
const collectImageSlots = (root: VisualElement): ImageSlot[] => {
  const slots: ImageSlot[] = [];
  const stack: VisualElement[] = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) {
      continue;
    }

    const bg = node.styleConfig?.backgroundConfig;
    if (bg?.type === "IMAGE" && bg.imageUrl) {
      slots.push({
        url: bg.imageUrl,
        set: (next) => {
          bg.imageUrl = next;
        }
      });
    }

    const content = node.contentData;
    if (content?.imageSource) {
      slots.push({
        url: content.imageSource,
        set: (next) => {
          content.imageSource = next;
        }
      });
    }

    for (const child of node.childElements ?? []) {
      stack.push(child);
    }
  }

  return slots;
};

/** 下载单张 Codia CDN 图并转存到对象存储，返回可公开访问的 URL。 */
const mirrorToStore = async (sourceUrl: string): Promise<string> => {
  const res = await fetch(sourceUrl);
  if (!res.ok) {
    throw new Error(`下载失败 HTTP ${res.status} ${res.statusText}`);
  }
  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
  const ext = EXT_BY_MIME[contentType] ?? "png";
  const buffer = Buffer.from(await res.arrayBuffer());
  const objectKey = `${PREFIX}/${randomUUID()}.${ext}`;
  const { url } = await assetStore().put(objectKey, buffer, { contentType });
  return url;
};

const ioSchema = z.object({
  fileKey: z.string().optional().describe("来源标识，透传给下游"),
  data: z.custom<Data>().describe("Codia image_to_design 响应的 data 部分")
});

/**
 * 把 Codia 返回的 CDN 图片转存到我们自己的 MinIO，再就地把 data 里的 URL 换成 MinIO URL。
 * Codia CDN 可能有时效 / 跨域限制，落到自家 MinIO 后下游组件才能稳定引用。
 *
 * 实现刻意避免异步递归：先用显式栈同步遍历收集所有图片位置，再对去重后的 URL 批量并发转存，
 * 最后统一回写。
 */
export const codiaUploadImagesStep = createStep({
  id: StepEnum.CODIA_UPLOAD_IMAGES,
  description: "把 Codia data 引用的 CDN 图片转存到 MinIO，并就地替换成 MinIO URL",
  inputSchema: ioSchema,
  outputSchema: ioSchema,
  execute: async ({ inputData }) => {
    const { data } = inputData;
    const slots = collectImageSlots(data.visualElement);
    if (slots.length === 0) {
      return inputData;
    }

    // 同一张图可能被多个节点引用，按 url 去重只转存一次
    const uniqueUrls = [...new Set(slots.map((s) => s.url))];
    const urlMap = new Map<string, string>();
    await Promise.all(
      uniqueUrls.map(async (sourceUrl) => {
        try {
          urlMap.set(sourceUrl, await mirrorToStore(sourceUrl));
        } catch (error) {
          // 单张失败不阻断整个转换：保留原 CDN URL 作降级，仅记录告警
          console.warn(`[CodiaUploadImages] 转存失败，保留原 URL: ${sourceUrl}`, error);
        }
      })
    );

    for (const slot of slots) {
      const mapped = urlMap.get(slot.url);
      if (mapped) {
        slot.set(mapped);
      }
    }

    return inputData;
  }
});
