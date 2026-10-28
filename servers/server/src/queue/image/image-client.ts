import { resolveModelConfig } from "@/mastra/provider/model-registry";
import {
  generateAndStoreImage,
  type GeneratedImageRecord
} from "@/mastra/services/ai-generation/image/image-generation.server";

import { createJobClient, type JobInfo } from "../job-client";
import { IMAGE_JOB_NAME, IMAGE_QUEUE, type ImageJobData, imageJobId } from "./image-jobs";

const imageJobs = createJobClient<ImageJobData, GeneratedImageRecord>({
  queueName: IMAGE_QUEUE,
  jobName: IMAGE_JOB_NAME,
  // 幂等键要用这次实际会用的模型：对话选了别的生图配置，就不能复用默认模型出的图
  jobId: (input) => imageJobId(input, resolveModelConfig("image", input.modelConfigId).modelId),
  retry: { attempts: 2, backoff: { type: "exponential", delay: 5000 } },
  // 生图单次请求 180s、内部最多重试 3 次、队列再重试 1 次，理论最坏远超这个数
  waitTimeoutMs: Number(process.env.IMAGE_JOB_WAIT_MS) || 10 * 60_000,
  runInline: (input, onProgress) => generateAndStoreImage(input, { onProgress })
});

/** 生图统一入口（工具 / 工作流都走这里），执行位置（worker 还是当前进程）对调用方透明 */
export const generateImage = imageJobs.run;

export type ImageJobInfo = JobInfo<GeneratedImageRecord>;

/** 查询生图任务状态；任务不存在（已过保留期或 id 不对）返回 null */
export const getImageJobInfo = imageJobs.getJobInfo;

/** 进程退出时释放 Redis 连接 */
export const closeImageQueueClient = imageJobs.close;
