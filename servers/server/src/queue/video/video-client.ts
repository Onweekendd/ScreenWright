import {
  generateAndStoreVideo,
  type GeneratedVideoRecord,
  type GenerateVideoInput
} from "@/mastra/services/ai-generation/video/video-generation.server";
import { VideoGenerationInputSchema } from "@/mastra/services/ai-generation/video/video-input";
import { getVideoConfig } from "@/mastra/services/ai-generation/video/video-provider";

import { createJobClient } from "../job-client";
import type { GenerateOptions } from "../wait-with-progress";
import { VIDEO_JOB_NAME, VIDEO_QUEUE, type VideoJobData, videoJobId } from "./video-jobs";

const videoJobs = createJobClient<VideoJobData, GeneratedVideoRecord>({
  queueName: VIDEO_QUEUE,
  jobName: VIDEO_JOB_NAME,
  // 幂等键要用这次实际会用的模型：对话选了别的生视频配置，就不能复用默认模型出的片
  jobId: (input) => videoJobId(input, getVideoConfig(input.modelConfigId).modelId),
  // 不重试：视频按秒计费，提交请求可能已被服务商收下只是响应丢了，重试就是重复计费。失败让用户/模型决定要不要再来
  retry: { attempts: 1 },
  // worker 里单个任务最多等 10 分钟，这里再留 2 分钟排队余量
  waitTimeoutMs: Number(process.env.VIDEO_JOB_WAIT_MS) || 12 * 60_000,
  runInline: (input, onProgress) => generateAndStoreVideo(input, { onProgress })
});

/**
 * 视频生成统一入口（工具走这里），执行位置（worker 还是当前进程）对调用方透明。
 * 入队前先校验：首尾帧和多模态参考互斥这类错误，不该等到 worker 里才发现。
 */
export async function generateVideo(
  input: GenerateVideoInput,
  options: GenerateOptions = {}
): Promise<GeneratedVideoRecord> {
  return videoJobs.run(VideoGenerationInputSchema.parse(input), options);
}

/** 进程退出时释放 Redis 连接 */
export const closeVideoQueueClient = videoJobs.close;
