import { Queue, QueueEvents } from "bullmq";

import {
  generateAndStoreVideo,
  type GeneratedVideoRecord,
  type GenerateVideoInput
} from "@/mastra/services/ai-generation/video-generation.server";
import { getVideoConfig } from "@/mastra/services/ai-generation/video-provider";

import { getQueueMode, getQueuePrefix } from "./config";
import { createRedisConnection } from "./connection";
import { VIDEO_JOB_NAME, VIDEO_QUEUE, type VideoJobData, videoJobId } from "./video-jobs";
import { type GenerateOptions, waitWithProgress } from "./wait-with-progress";

/**
 * 等视频出结果的上限。单个任务在 worker 里最多等 10 分钟，这里再留 2 分钟排队余量；
 * 超时只是调用方不再等，任务本身仍在 worker 里跑，结果落库后重放即命中幂等。
 */
const WAIT_TIMEOUT_MS = Number(process.env.VIDEO_JOB_WAIT_MS) || 12 * 60_000;
/** 结果在 Redis 里保留多久：期间同一份输入再来直接复用，不必再进 worker */
const RETENTION_SECONDS = 3600;

let queue: Queue<VideoJobData, GeneratedVideoRecord> | undefined;
let events: QueueEvents | undefined;

const getQueue = () =>
  (queue ??= new Queue(VIDEO_QUEUE, { connection: createRedisConnection(), prefix: getQueuePrefix() }));

const getEvents = async () => {
  if (!events) {
    events = new QueueEvents(VIDEO_QUEUE, { connection: createRedisConnection(), prefix: getQueuePrefix() });
  }
  await events.waitUntilReady();
  return events;
};

/** 进程退出时释放 Redis 连接 */
export async function closeVideoQueueClient(): Promise<void> {
  await Promise.all([queue?.close(), events?.close()]);
  queue = undefined;
  events = undefined;
}

async function generateVideoViaQueue(input: VideoJobData, options: GenerateOptions): Promise<GeneratedVideoRecord> {
  const q = getQueue();
  const jobId = videoJobId(input, getVideoConfig().modelId);

  // BullMQ 对同 id 的重复入队直接忽略——包括保留期内「已失败」的旧任务，
  // 不清掉它的话，用户重试永远拿到上次的失败结果。
  const existing = await q.getJob(jobId);
  const alreadyDone = existing ? await existing.isCompleted() : false;
  if (existing && (await existing.isFailed())) {
    await existing.remove();
  }

  const job = await q.add(VIDEO_JOB_NAME, input, {
    jobId,
    // 不重试：视频按秒计费，提交请求可能已被服务商收下只是响应丢了，重试就是重复计费。失败让用户/模型决定要不要再来
    attempts: 1,
    removeOnComplete: { age: RETENTION_SECONDS },
    removeOnFail: { age: RETENTION_SECONDS }
  });

  const result = await waitWithProgress(job, await getEvents(), WAIT_TIMEOUT_MS, options.onProgress);
  return { ...result, reused: result.reused || alreadyDone };
}

/**
 * 视频生成统一入口（工具走这里）：
 * - redis 模式：入队，由 worker 进程执行，这里等结果；
 * - inline 模式：当前进程直接执行（没有 Redis 的本地开发）。
 */
export async function generateVideo(
  input: GenerateVideoInput,
  options: GenerateOptions = {}
): Promise<GeneratedVideoRecord> {
  if (getQueueMode() === "inline") {
    return generateAndStoreVideo(input, { onProgress: options.onProgress });
  }
  return generateVideoViaQueue(input, options);
}
