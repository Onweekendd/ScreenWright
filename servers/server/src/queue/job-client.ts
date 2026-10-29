import { type JobsOptions, Queue, QueueEvents } from "bullmq";

import { getQueueMode, getQueuePrefix } from "./config";
import { createRedisConnection } from "./connection";
import { type GenerateOptions, waitWithProgress } from "./wait-with-progress";

/** 结果在 Redis 里保留多久：期间同一份输入再来直接复用，不必再进 worker */
const RETENTION_SECONDS = 3600;

export interface JobClientConfig<Data, Result> {
  /** 队列名。producer（ai 进程）与 consumer（worker 进程）必须一致 */
  queueName: string;
  jobName: string;
  /** 同一份输入必须算出同一个 id：BullMQ 靠它把重复入队合并成一条，不重复烧额度 */
  jobId: (data: Data) => string;
  /** 失败后队列层要不要重试；按秒计费、可能重复提交的任务应设为 1 次 */
  retry: Pick<JobsOptions, "attempts" | "backoff">;
  /**
   * 调用方最多等多久。超时只是调用方不再等，任务本身仍在 worker 里跑，
   * 结果落库后重放即命中幂等。
   */
  waitTimeoutMs: number;
  /** inline 模式（没有 Redis 的本地开发）下在当前进程直接执行 */
  runInline: (data: Data, onProgress?: (percent: number) => void) => Promise<Result>;
}

export interface JobInfo<Result> {
  id: string;
  state: string;
  progress: number | object | string | boolean;
  result?: Result;
  failedReason?: string;
}

export interface JobClient<Data, Result> {
  /**
   * 生成统一入口：redis 模式入队并等 worker 出结果，inline 模式当前进程直接执行。
   * 对调用方是同一个 Promise，执行位置对它透明。
   */
  run: (data: Data, options?: GenerateOptions) => Promise<Result>;
  /** 查询任务状态；任务不存在（已过保留期或 id 不对）返回 null */
  getJobInfo: (jobId: string) => Promise<JobInfo<Result> | null>;
  /** 进程退出时释放 Redis 连接 */
  close: () => Promise<void>;
}

/**
 * 生成类任务（生图、生视频）的队列客户端。各媒体只需给出 {@link JobClientConfig} 里不同的那几项，
 * 连接管理、失败任务清理、进度转发都在这里。
 */
export function createJobClient<Data, Result extends { reused: boolean }>(
  config: JobClientConfig<Data, Result>
): JobClient<Data, Result> {
  // Queue 不带泛型：BullMQ 的 Extract* 泛型在这种通用函数里推不回 Data / Result，
  // 类型约束放在对外的 JobClient 接口上
  let queue: Queue | undefined;
  let events: QueueEvents | undefined;

  const getQueue = () =>
    (queue ??= new Queue(config.queueName, { connection: createRedisConnection(), prefix: getQueuePrefix() }));

  const getQueueEvents = async () => {
    events ??= new QueueEvents(config.queueName, { connection: createRedisConnection(), prefix: getQueuePrefix() });
    await events.waitUntilReady();
    return events;
  };

  const runViaQueue = async (data: Data, options: GenerateOptions): Promise<Result> => {
    const q = getQueue();
    const jobId = config.jobId(data);

    // BullMQ 对同 id 的重复入队直接忽略——包括保留期内「已失败」的旧任务，
    // 不清掉它的话，用户重试永远拿到上次的失败结果。
    const existing = await q.getJob(jobId);
    const alreadyDone = existing ? await existing.isCompleted() : false;
    if (existing && (await existing.isFailed())) {
      await existing.remove();
    }

    const job = await q.add(config.jobName, data, {
      jobId,
      ...config.retry,
      removeOnComplete: { age: RETENTION_SECONDS },
      removeOnFail: { age: RETENTION_SECONDS }
    });

    const result = await waitWithProgress<Result>(job, await getQueueEvents(), {
      timeoutMs: config.waitTimeoutMs,
      onProgress: options.onProgress
    });
    return { ...result, reused: result.reused || alreadyDone };
  };

  return {
    run: async (data, options = {}) =>
      getQueueMode() === "inline" ? config.runInline(data, options.onProgress) : runViaQueue(data, options),

    getJobInfo: async (jobId) => {
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
    },

    close: async () => {
      await Promise.all([queue?.close(), events?.close()]);
      queue = undefined;
      events = undefined;
    }
  };
}
