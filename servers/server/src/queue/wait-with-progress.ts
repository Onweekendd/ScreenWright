import type { QueueEvents } from "bullmq";

export interface GenerateOptions {
  /** 阶段进度（0~100）：inline 模式来自生成服务的回调，redis 模式来自 worker 上报的队列事件 */
  onProgress?: (percent: number) => void;
}

export interface WaitOptions extends GenerateOptions {
  /** 最多等多久。超时只是调用方不再等，任务本身仍在 worker 里跑 */
  timeoutMs: number;
}

interface WaitableJob<T> {
  id?: string;
  waitUntilFinished: (events: QueueEvents, ttl?: number) => Promise<T>;
}

/**
 * 等队列任务出结果，同时把 worker 上报的进度转给 onProgress。
 * 只认自己这个 jobId 的事件：同一个队列里同时有别的任务在跑，它们的进度不能混进来。
 */
export async function waitWithProgress<T>(
  job: WaitableJob<T>,
  events: QueueEvents,
  { timeoutMs, onProgress }: WaitOptions
): Promise<T> {
  if (!onProgress) {
    return job.waitUntilFinished(events, timeoutMs);
  }

  const listener = ({ jobId, data }: { jobId: string; data: unknown }) => {
    if (jobId === job.id && typeof data === "number") {
      onProgress(data);
    }
  };
  events.on("progress", listener);

  try {
    return await job.waitUntilFinished(events, timeoutMs);
  } finally {
    events.off("progress", listener);
  }
}
