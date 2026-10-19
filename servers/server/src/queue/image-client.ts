import { Queue, QueueEvents } from "bullmq";

import { getModelConfigSync } from "@/mastra/provider/model-registry";
import {
  generateAndStoreImage,
  type GeneratedImageRecord,
  type GenerateImageInput
} from "@/mastra/services/image-generation.server";

import { getQueueMode, getQueuePrefix } from "./config";
import { createRedisConnection } from "./connection";
import { IMAGE_JOB_NAME, IMAGE_QUEUE, type ImageJobData, imageJobId } from "./image-jobs";

/**
 * 等任务出结果的上限。生图单次请求 180s、内部最多重试 3 次、队列再重试 1 次，
 * 理论最坏远超这个数；超时只是调用方不再等，任务本身仍在 worker 里跑，结果落库后重放即命中幂等。
 */
const WAIT_TIMEOUT_MS = Number(process.env.IMAGE_JOB_WAIT_MS) || 10 * 60_000;
/** 结果在 Redis 里保留多久：期间同一份输入再来直接复用，不必再进 worker */
const RETENTION_SECONDS = 3600;

let queue: Queue<ImageJobData, GeneratedImageRecord> | undefined;
let events: QueueEvents | undefined;

const getQueue = () =>
  (queue ??= new Queue(IMAGE_QUEUE, { connection: createRedisConnection(), prefix: getQueuePrefix() }));

const getEvents = async () => {
  if (!events) {
    events = new QueueEvents(IMAGE_QUEUE, { connection: createRedisConnection(), prefix: getQueuePrefix() });
  }
  await events.waitUntilReady();
  return events;
};

/** 进程退出时释放 Redis 连接 */
export async function closeImageQueueClient(): Promise<void> {
  await Promise.all([queue?.close(), events?.close()]);
  queue = undefined;
  events = undefined;
}

async function generateImageViaQueue(input: ImageJobData): Promise<GeneratedImageRecord> {
  const q = getQueue();
  const jobId = imageJobId(input, getModelConfigSync("image").modelId);

  // BullMQ 对同 id 的重复入队直接忽略——包括保留期内「已失败」的旧任务，
  // 不清掉它的话，用户重试永远拿到上次的失败结果。
  const existing = await q.getJob(jobId);
  const alreadyDone = existing ? await existing.isCompleted() : false;
  if (existing && (await existing.isFailed())) {
    await existing.remove();
  }

  const job = await q.add(IMAGE_JOB_NAME, input, {
    jobId,
    attempts: 2,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: RETENTION_SECONDS },
    removeOnFail: { age: RETENTION_SECONDS }
  });

  const result = await job.waitUntilFinished(await getEvents(), WAIT_TIMEOUT_MS);
  return { ...result, reused: result.reused || alreadyDone };
}

/**
 * 生图统一入口（工具 / 工作流都走这里）：
 * - redis 模式：入队，由 worker 进程执行，这里等结果；
 * - inline 模式：当前进程直接执行（没有 Redis 的本地开发）。
 * 对调用方是同一个 `Promise<GeneratedImageRecord>`，执行位置对它透明。
 */
export async function generateImage(input: GenerateImageInput): Promise<GeneratedImageRecord> {
  if (getQueueMode() === "inline") {
    return generateAndStoreImage(input);
  }
  return generateImageViaQueue(input);
}

export interface ImageJobInfo {
  id: string;
  state: string;
  progress: number | object | string | boolean;
  result?: GeneratedImageRecord;
  failedReason?: string;
}

/** 查询生图任务状态；任务不存在（已过保留期或 id 不对）返回 null */
export async function getImageJobInfo(jobId: string): Promise<ImageJobInfo | null> {
  const job = await getQueue().getJob(jobId);
  if (!job) {
    return null;
  }
  const state = await job.getState();
  return {
    id: jobId,
    state,
    progress: job.progress,
    ...(state === "completed" ? { result: job.returnvalue } : {}),
    ...(state === "failed" ? { failedReason: job.failedReason } : {})
  };
}
