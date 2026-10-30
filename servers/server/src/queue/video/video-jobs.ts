import { z } from "zod";

import {
  computeVideoHash,
  type GeneratedVideoRecord
} from "@/mastra/services/ai-generation/video/video-generation.server";
import { VideoGenerationInputSchema } from "@/mastra/services/ai-generation/video/video-input";

/** 视频队列名。producer（ai 进程）与 consumer（worker 进程）必须一致。 */
export const VIDEO_QUEUE = "video-generation";
export const VIDEO_JOB_NAME = "generate";

/**
 * 队列里的任务数据：生成入参，外加 worker 运行中写回的检查点；worker 入口用它做运行时校验。
 * 入参带 superRefine，zod 4 里要用 safeExtend 才能在保留校验的同时加字段。
 */
export const VideoJobDataSchema = VideoGenerationInputSchema.safeExtend({
  /**
   * 检查点：已经提交给服务商的任务 id。提交成功后由 worker 写回任务数据；
   * 任务被卡死回收、重新执行时据此接着轮询，不再重复提交（视频按秒计费）。不参与任务 id。
   */
  providerTaskId: z.string().min(1).optional()
});
export type VideoJobData = z.infer<typeof VideoJobDataSchema>;

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
