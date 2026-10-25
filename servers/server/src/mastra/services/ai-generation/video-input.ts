import { z } from "zod";

export const VIDEO_RESOLUTIONS = ["480P", "768P", "2K"] as const;
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

export const VideoGenerationInputSchema = z.object(videoInputShape).superRefine((input, context) => {
  const message = videoModeError(input);
  if (message) {
    context.addIssue({ code: "custom", message });
  }
});

export type GenerateVideoInput = z.infer<typeof VideoGenerationInputSchema>;
