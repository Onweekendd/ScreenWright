import { z } from "zod";

/** 各服务商支持的子集不同，由适配器在提交前校验 */
export const VIDEO_RESOLUTIONS = ["480P", "768P", "1080P", "2K"] as const;
export const VIDEO_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"] as const;

const mediaUrl = z
  .string()
  .url()
  .refine((value) => /^https?:\/\//i.test(value), "素材地址必须使用 HTTP 或 HTTPS");

export const videoInputShape = {
  prompt: z.string().trim().min(1),
  durationSec: z.number().int().min(4).max(15),
  resolution: z.enum(VIDEO_RESOLUTIONS),
  ratio: z.enum(VIDEO_RATIOS),
  firstFrameUrl: mediaUrl.optional(),
  lastFrameUrl: mediaUrl.optional(),
  referenceImageUrls: z.array(mediaUrl).optional(),
  referenceVideoUrls: z.array(mediaUrl).optional(),
  referenceAudioUrls: z.array(mediaUrl).optional()
};

interface VideoModeInput {
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  referenceImageUrls?: string[];
  referenceVideoUrls?: string[];
  referenceAudioUrls?: string[];
}

export const videoModeError = (input: VideoModeInput): string | undefined => {
  const hasReferences = [input.referenceImageUrls, input.referenceVideoUrls, input.referenceAudioUrls].some(
    (urls) => urls && urls.length > 0
  );
  if ((input.firstFrameUrl || input.lastFrameUrl) && hasReferences) {
    return "首帧/尾帧图生视频与多模态参考生视频互斥，不能同时传入首尾帧和参考图片、视频或音频";
  }
  return undefined;
};

// modelConfigId 不放进 videoInputShape：那份字段会被工具拿去拼给模型看的入参，模型不该自己选配置
export const VideoGenerationInputSchema = z
  .object({
    ...videoInputShape,
    /** 对话选的生视频配置 id；为空用默认配置。只传 id 不传密钥：任务数据会进 Redis */
    modelConfigId: z.string().optional()
  })
  .superRefine((input, context) => {
    const message = videoModeError(input);
    if (message) {
      context.addIssue({ code: "custom", message });
    }
  });

export type GenerateVideoInput = z.infer<typeof VideoGenerationInputSchema>;
