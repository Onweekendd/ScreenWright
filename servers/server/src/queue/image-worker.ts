import { type Job, UnrecoverableError, Worker } from "bullmq";

import { warmModelConfigs } from "@/mastra/provider/model-registry";
import { generateAndStoreImage, type GeneratedImageRecord } from "@/mastra/services/ai-generation/image-generation.server";

import { getQueuePrefix } from "./config";
import { createRedisConnection } from "./connection";
import { IMAGE_QUEUE, type ImageJobData, ImageJobDataSchema, toImageRecord } from "./image-jobs";

/** 单个任务的处理逻辑，单独导出方便不连 Redis 直接测。 */
export async function processImageJob(
  job: Pick<Job<ImageJobData>, "data" | "updateProgress">
): Promise<GeneratedImageRecord> {
  const data = ImageJobDataSchema.parse(job.data);
  // 模型配置在进程内缓存，「设置」页改配置只会刷新 ai 进程的缓存；
  // worker 每个任务开始前重读一次（4 行小表），保证用的是最新的生图模型。
  await warmModelConfigs();
  await job.updateProgress(5);
  try {
    const record = await generateAndStoreImage(data, { onProgress: (percent) => job.updateProgress(percent) });
    return toImageRecord(record);
  } catch (error) {
    // 参考图不存在这类错重试不会好：直接判死，别让队列再跑一遍
    if ((error as { permanent?: unknown } | null)?.permanent === true) {
      throw new UnrecoverableError((error as Error).message);
    }
    throw error;
  }
}

/** 启动生图 worker。并发度由 IMAGE_WORKER_CONCURRENCY 控制（默认 2，受上游生图接口限流约束）。 */
export function createImageWorker(): Worker<ImageJobData, GeneratedImageRecord> {
  const worker = new Worker<ImageJobData, GeneratedImageRecord>(IMAGE_QUEUE, (job) => processImageJob(job), {
    connection: createRedisConnection(),
    prefix: getQueuePrefix(),
    concurrency: Number(process.env.IMAGE_WORKER_CONCURRENCY) || 2
  });
  worker.on("completed", (job) => console.log(`[worker:image] 完成 ${job.id}`));
  worker.on("failed", (job, error) => console.error(`[worker:image] 失败 ${job?.id}：${error.message}`));
  worker.on("error", (error) => console.error("[worker:image] 运行错误：", error));
  return worker;
}
