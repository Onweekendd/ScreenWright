import { type Job, Worker } from "bullmq";

import { warmModelConfigs } from "@/mastra/provider/model-registry";
import { generateAndStoreVideo, type GeneratedVideoRecord } from "@/mastra/services/video-generation.server";

import { getQueuePrefix } from "./config";
import { createRedisConnection } from "./connection";
import { toVideoRecord, VIDEO_QUEUE, type VideoJobData, VideoJobDataSchema } from "./video-jobs";

/** 单个任务的处理逻辑，单独导出方便不连 Redis 直接测。 */
export async function processVideoJob(
  job: Pick<Job<VideoJobData>, "data" | "updateProgress">
): Promise<GeneratedVideoRecord> {
  const data = VideoJobDataSchema.parse(job.data);
  // 和生图 worker 一样，每个任务开始前重读配置，使设置页的 video 配置及时生效
  await warmModelConfigs();
  await job.updateProgress(1);
  const record = await generateAndStoreVideo(data, { onProgress: (percent) => job.updateProgress(percent) });
  return toVideoRecord(record);
}

/**
 * 启动视频 worker。并发度由 VIDEO_WORKER_CONCURRENCY 控制（默认 2）。
 * 一个任务要在 worker 里占一两分钟（提交后一直轮询），锁续期交给 BullMQ，这里把锁时长放宽到 2 分钟。
 */
export function createVideoWorker(): Worker<VideoJobData, GeneratedVideoRecord> {
  const worker = new Worker<VideoJobData, GeneratedVideoRecord>(VIDEO_QUEUE, (job) => processVideoJob(job), {
    connection: createRedisConnection(),
    prefix: getQueuePrefix(),
    concurrency: Number(process.env.VIDEO_WORKER_CONCURRENCY) || 2,
    lockDuration: 120_000
  });
  worker.on("completed", (job) => console.log(`[worker:video] 完成 ${job.id}`));
  worker.on("failed", (job, error) => console.error(`[worker:video] 失败 ${job?.id}：${error.message}`));
  worker.on("error", (error) => console.error("[worker:video] 运行错误：", error));
  return worker;
}
