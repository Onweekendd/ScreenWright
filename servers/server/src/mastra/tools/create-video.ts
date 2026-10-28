import { createTool } from "@mastra/core/tools";
import { ResourceTypeEnum } from "@screenwright/types";
import { z } from "zod";

import { defaultAssetName, saveGeneratedAsset } from "@/mastra/services/ai-assets/save-generated-asset";
import { trackGeneration } from "@/mastra/services/ai-generation/generation-progress";
import { videoInputShape, videoModeError } from "@/mastra/services/ai-generation/video/video-input";
import { VIDEO_RATIOS, VIDEO_RESOLUTIONS } from "@/mastra/services/ai-generation/video/video-provider";
import { generateVideo } from "@/queue/video/video-client";

import { selectedModelConfigId } from "../types/thread-model";

export const createVideoInputSchema = z
  .object({
    screenId: z
      .string()
      .describe(
        '当前大屏，格式 "{screenId}_{versionCode}"（如 "29445_1"），从 editor-context 取；生成的视频记在这个大屏的所有者名下'
      ),
    name: z.string().optional().describe("素材名，如「科技感流光背景」；在素材库里显示用，不传则取提示词开头"),
    prompt: videoInputShape.prompt.describe("视频生成的提示词，必填：描述画面和运动；图生视频时重点描述运动"),
    firstFrameImage: videoInputShape.firstFrameUrl.describe(
      "可选，第一帧图片的 url（须是本系统 assetStore 里的资源：之前生成的图、用户上传的图、capture_canvas 截图）"
    ),
    lastFrameImage: videoInputShape.lastFrameUrl.describe(
      "可选，尾帧图片的内部 assetStore URL；可单独使用，或与 firstFrameImage 组合控制首尾帧"
    ),
    referenceImages: videoInputShape.referenceImageUrls.describe(
      "多模态参考图片的内部 assetStore URL 数组；可与参考视频、音频组合，不能与首帧或尾帧混用"
    ),
    referenceVideos: videoInputShape.referenceVideoUrls.describe(
      "多模态参考视频 URL 数组；须是服务商可直接下载的公网 HTTP/HTTPS 地址，或已配置公网访问的内部存储 URL"
    ),
    referenceAudios: videoInputShape.referenceAudioUrls.describe(
      "多模态参考音频 URL 数组；须是服务商可直接下载的公网 HTTP/HTTPS 地址，或已配置公网访问的内部存储 URL"
    ),
    durationSec: z.number().int().min(4).max(15).default(5).describe("时长（秒），4~15，默认 5；越长越贵越慢"),
    resolution: z
      .enum(VIDEO_RESOLUTIONS)
      .default("768P")
      .describe("分辨率默认 768P；MiniMax-H3 支持 768P/2K，MiniMax-H3-Max 支持 480P/768P"),
    ratio: z
      .enum(VIDEO_RATIOS)
      .default("16:9")
      .describe("文生/参考生视频画幅，大屏背景用 16:9；首尾帧模式自动适配图片比例")
  })
  .superRefine((input, context) => {
    const message = videoModeError({
      firstFrameUrl: input.firstFrameImage,
      lastFrameUrl: input.lastFrameImage,
      referenceImageUrls: input.referenceImages,
      referenceVideoUrls: input.referenceVideos,
      referenceAudioUrls: input.referenceAudios
    });
    if (message) {
      context.addIssue({ code: "custom", message });
    }
  });

export const createVideoTool = createTool({
  id: "createVideoTool",
  description:
    "生成视频，支持文生视频、首帧图生视频、尾帧图生视频、首尾帧图生视频，以及图片/视频/音频组合的多模态参考生视频。" +
    "firstFrameImage/lastFrameImage 与 referenceImages/referenceVideos/referenceAudios 互斥，不得混用；所有模式都必须提供非空 prompt。" +
    "落库并返回可直接引用的 url，同时放进用户素材库的「AI 生成」分组。" +
    "不要给本工具传 _background:{enabled:false}：默认就是后台执行，多张同时调用会并发生成（几段视频一起生成）；改成前台，同一步里的调用会被排成一队一张一张地生成（6 张要 4 分钟以上），还会卡住整轮对话。后台完成后系统会自动把结果（url、素材 id）送回给你，不用为了拿 url 去开前台。" +
    "视频生成很慢（几秒的片段要 1~3 分钟）也要花钱，调用前先和用户确认内容和时长，不要拿来试探；多段视频可以同时调用。" +
    "让生成的图动起来时，把那张图的 url（createImageTool 返回的 images[].url）放进 firstFrameImage，提示词只写「怎么动」" +
    "（如「云层缓缓流动，光斑轻微闪烁，镜头不动」），不要再描述画面内容。" +
    "做大屏动态背景时写明「循环感、镜头固定、无文字、无人物」，动作幅度小一点，不抢前景组件的注意力。" +
    "返回的是 mp4，用视频组件或背景视频引用；你看不到视频内容，生成后不要描述画面细节。",
  inputSchema: createVideoInputSchema,
  outputSchema: z.object({
    id: z.string().describe("视频记录 id"),
    url: z.string().describe("生成视频（mp4）的可访问 url"),
    reused: z.boolean().describe("是否命中了已有的同款结果（未重新生成）"),
    libraryFileId: z.number().optional().describe("放进素材库后的素材 id；没放进去时为空，原因见 note"),
    note: z.string().optional()
  }),
  // 视频要等服务商出片，必须后台跑，不然会卡住整个 agentic loop。不重试：重跑同一份输入虽然会命中幂等，
  // 但失败的原因（审核没过、参数不对）重试也一样，让模型看到错误自己决定
  background: { enabled: true, timeoutMs: 13 * 60_000, maxRetries: 0 },
  execute: async (
    {
      screenId,
      name,
      prompt,
      firstFrameImage,
      lastFrameImage,
      referenceImages,
      referenceVideos,
      referenceAudios,
      durationSec,
      resolution,
      ratio
    },
    context
  ) => {
    // 进度按 toolCallId 登记，前端按它轮询；前台 / 后台执行走的都是这个函数
    const result = await trackGeneration("video", context?.agent?.toolCallId, (onProgress) =>
      generateVideo(
        {
          prompt,
          durationSec,
          resolution,
          ratio,
          firstFrameUrl: firstFrameImage,
          lastFrameUrl: lastFrameImage,
          referenceImageUrls: referenceImages,
          referenceVideoUrls: referenceVideos,
          referenceAudioUrls: referenceAudios,
          modelConfigId: selectedModelConfigId(context?.requestContext, "video")
        },
        { onProgress }
      )
    );
    const referenceUrls = [
      firstFrameImage,
      lastFrameImage,
      ...(referenceImages ?? []),
      ...(referenceVideos ?? []),
      ...(referenceAudios ?? [])
    ].filter((url): url is string => Boolean(url));
    const library = await saveGeneratedAsset({
      screenId,
      name: name?.trim() || defaultAssetName(prompt),
      url: result.url,
      resourceType: ResourceTypeEnum.video,
      referenceUrls: referenceUrls.length ? referenceUrls : undefined
    });
    return { id: result.id, url: result.url, reused: result.reused, ...library };
  }
});
