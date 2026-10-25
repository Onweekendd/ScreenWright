import { computeVideoHash, type GeneratedVideoRecord } from "@/mastra/services/ai-generation/video-generation.server";
import { type GenerateVideoInput, VideoGenerationInputSchema } from "@/mastra/services/ai-generation/video-input";

/** 视频队列名。producer（ai 进程）与 consumer（worker 进程）必须一致。 */
export const VIDEO_QUEUE = "video-generation";
export const VIDEO_JOB_NAME = "generate";

/** 队列里的任务数据，和 `GenerateVideoInput` 同构；worker 入口用它做运行时校验。 */
export const VideoJobDataSchema = VideoGenerationInputSchema;
export type VideoJobData = GenerateVideoInput;

/**
 * 任务 id = promptHash：同一份输入天然是同一个任务，BullMQ 把重复入队合并成一条，
 * 重试 / 并发的同款请求不会重复提交给服务商（视频按秒计费）。
 */
export const videoJobId = (data: VideoJobData, modelId: string): string => computeVideoHash(data, modelId);

/** worker 返回值只保留可 JSON 序列化的声明字段（Prisma 行里的 Date 过一遍队列会变字符串） */
export const toVideoRecord = (row: GeneratedVideoRecord): GeneratedVideoRecord => ({
  id: row.id,
  promptHash: row.promptHash,
  prompt: row.prompt,
  model: row.model,
  durationSec: row.durationSec,
  resolution: row.resolution,
  ratio: row.ratio,
  url: row.url,
  firstFrameUrl: row.firstFrameUrl,
  lastFrameUrl: row.lastFrameUrl ?? null,
  referenceImageUrls: row.referenceImageUrls ?? [],
  referenceVideoUrls: row.referenceVideoUrls ?? [],
  referenceAudioUrls: row.referenceAudioUrls ?? [],
  reused: row.reused
});
