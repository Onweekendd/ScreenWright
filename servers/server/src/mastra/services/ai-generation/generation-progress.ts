/**
 * 生图 / 生视频的进度，按工具调用 id（toolCallId）记在内存里，前端轮询 `/customApi/jobs/progress/:toolCallId`。
 *
 * 为什么不借 Mastra 的流：后台任务的输出要先被映射成子 agent 的 UI chunk，自定义的进度帧会被丢掉；
 * 前台执行又是另一条路。进度只跟「这次工具调用」有关，所以单独走一条通道，前台 / 后台执行同一个工具函数，
 * 行为天然一致，页面刷新、断线重连后也能接着查。
 *
 * 限制：存在 ai 进程内存里。工具执行和路由同在 ai 进程（worker 只跑队列任务，进度由队列事件带回来），
 * 多实例部署时需要换成 Redis——到那时只改这个文件。
 */

export type GenerationKind = "image" | "video";
export type GenerationStatus = "running" | "done" | "failed";

export interface GenerationProgress {
  kind: GenerationKind;
  status: GenerationStatus;
  /** 0~100。服务商不给真实进度，这是按阶段 / 已等时间估的，只增不减 */
  percent: number;
  /** 当前阶段的一句话，直接给用户看 */
  stage: string;
  /** 已用秒数：运行中是到现在，结束后是总耗时 */
  elapsedSec: number;
  error?: string;
  /**
   * 完成后的产物地址（图片 / 视频；一次生一批图时是多个，按入参顺序）。后台任务完成时，工具卡片拿到的结果
   * 仍是「Background task started」那句占位，没有地址；把它们放在进度里一并给前端，卡片才能出图 / 放视频。
   */
  urls?: string[];
}

interface Entry {
  kind: GenerationKind;
  status: GenerationStatus;
  percent: number;
  startedAt: number;
  endedAt?: number;
  error?: string;
  urls?: string[];
  touchedAt: number;
}

/** 结束后保留多久：前端最后一次轮询要能读到「完成 / 失败」 */
const FINISHED_TTL_MS = 5 * 60_000;
/** 运行中的条目超过这么久没更新就当它是残留（进程里任务异常没走到结束），清掉 */
const STALE_RUNNING_MS = 30 * 60_000;

const entries = new Map<string, Entry>();

/** 阶段文案：阈值和两个生成服务上报的阶段值对齐（图 10/75/90，视频 5/20/75/90） */
export const stageOf = (kind: GenerationKind, percent: number): string => {
  if (kind === "image") {
    if (percent < 10) {
      return "排队中";
    }
    return percent < 75 ? "生成中" : percent < 90 ? "转存中" : "收尾中";
  }
  if (percent < 20) {
    return "提交任务";
  }
  return percent < 75 ? "生成中" : percent < 90 ? "转存中" : "收尾中";
};

const prune = (now: number) => {
  for (const [id, entry] of entries) {
    const idleSince = entry.endedAt ?? entry.touchedAt;
    if (now - idleSince > (entry.endedAt ? FINISHED_TTL_MS : STALE_RUNNING_MS)) {
      entries.delete(id);
    }
  }
};

export const startProgress = (toolCallId: string, kind: GenerationKind, now = Date.now()): void => {
  prune(now);
  entries.set(toolCallId, { kind, status: "running", percent: 0, startedAt: now, touchedAt: now });
};

export const reportProgress = (toolCallId: string, percent: number, now = Date.now()): void => {
  const entry = entries.get(toolCallId);
  if (!entry || entry.status !== "running") {
    return;
  }
  // 只增不减：队列重试、幂等命中都可能让上报值回落，进度条倒退比停住更糟
  entry.percent = Math.max(entry.percent, Math.min(99, Math.round(percent)));
  entry.touchedAt = now;
};

export const finishProgress = (toolCallId: string, error?: string, now = Date.now(), urls?: string[]): void => {
  const entry = entries.get(toolCallId);
  if (!entry) {
    return;
  }
  entry.status = error === undefined ? "done" : "failed";
  entry.percent = error === undefined ? 100 : entry.percent;
  entry.error = error;
  entry.urls = urls;
  entry.endedAt = now;
  entry.touchedAt = now;
};

export const getGenerationProgress = (toolCallId: string, now = Date.now()): GenerationProgress | null => {
  const entry = entries.get(toolCallId);
  if (!entry) {
    return null;
  }
  return {
    kind: entry.kind,
    status: entry.status,
    percent: entry.percent,
    stage: entry.status === "done" ? "已完成" : entry.status === "failed" ? "失败" : stageOf(entry.kind, entry.percent),
    elapsedSec: Math.round(((entry.endedAt ?? now) - entry.startedAt) / 1000),
    ...(entry.error === undefined ? {} : { error: entry.error }),
    ...(entry.urls === undefined ? {} : { urls: entry.urls })
  };
};

/** 仅供测试清空 */
export const resetProgressForTest = (): void => entries.clear();

/**
 * 生成结果里的产物地址。约定两种形态：带 `url` 字段的对象（视频记录），
 * 或带 `images` 数组、每项可能有 `url` 的对象（一批图，失败的那几项没有 url）。别的形态就没有。
 */
const urlsOf = (result: unknown): string[] | undefined => {
  const { url, images } = (result ?? {}) as { url?: unknown; images?: unknown };
  if (typeof url === "string") {
    return [url];
  }
  if (!Array.isArray(images)) {
    return undefined;
  }
  const urls = images.flatMap((item) => {
    const itemUrl = (item as { url?: unknown } | null)?.url;
    return typeof itemUrl === "string" ? [itemUrl] : [];
  });
  return urls.length > 0 ? urls : undefined;
};

/**
 * 包一次生成：开始登记、过程中上报、结束时记成功 / 失败（错误原样再抛）。
 * 没有 toolCallId（工作流等非工具调用方）时只透传，不登记。
 */
export async function trackGeneration<T>(
  kind: GenerationKind,
  toolCallId: string | undefined,
  run: (onProgress: (percent: number) => void) => Promise<T>
): Promise<T> {
  if (!toolCallId) {
    return run(() => undefined);
  }
  startProgress(toolCallId, kind);
  try {
    const result = await run((percent) => reportProgress(toolCallId, percent));
    finishProgress(toolCallId, undefined, Date.now(), urlsOf(result));
    return result;
  } catch (error) {
    finishProgress(toolCallId, error instanceof Error ? error.message : String(error));
    throw error;
  }
}
