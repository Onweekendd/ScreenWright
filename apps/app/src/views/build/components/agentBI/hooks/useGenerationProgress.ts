import { computed, type MaybeRefOrGetter, onScopeDispose, ref, toValue, watch } from "vue";

import { apiClient } from "@screenwright/server/rpc";

/** 后端 `/customApi/jobs/progress/:toolCallId` 的返回；unknown = 还没开始 / 已过期 / 不是生成类工具 */
export type GenerationProgress =
  | { status: "unknown" }
  | {
      kind: "image" | "video";
      status: "running" | "done" | "failed";
      percent: number;
      stage: string;
      elapsedSec: number;
      error?: string;
      /** 完成后的产物地址（一批图时有多个）：后台任务的工具结果停在占位文字上，卡片靠它出图 / 放视频 */
      urls?: string[];
    };

export type FetchGenerationProgress = (toolCallId: string) => Promise<GenerationProgress>;

/** 有进度可查的生成类工具：生图、生视频 */
export const GENERATION_TOOLS = new Set(["createImageTool", "createVideoTool"]);

/** Mastra 后台任务刚派发时，工具结果是这样一段占位文字，真正的结果等任务完成后才替换进来 */
const BACKGROUND_PLACEHOLDER = /^Background task started/;

/**
 * 这张工具卡片现在是不是「正在生成」：
 * - 前台执行：工具已调用、还没有结果（input-available）；
 * - 后台执行：工具立刻返回了占位文字（output-available），真结果在任务完成后才到。
 * 两种都要显示进度，所以占位文字也算「还在跑」。
 */
export const isGenerationRunning = (toolName: string, state: string | undefined, output: unknown): boolean => {
  if (!GENERATION_TOOLS.has(toolName)) {
    return false;
  }
  if (state === "input-available") {
    return true;
  }
  return state === "output-available" && typeof output === "string" && BACKGROUND_PLACEHOLDER.test(output);
};

/**
 * 卡片上图片 / 视频的地址（一批图时有多个）：优先用工具结果里的（前台执行，或后台结果已回填）；
 * 后台任务完成后卡片的结果往往还是占位文字，这时用进度接口带回来的地址。
 * 工具结果有三种形态：截图工具的 `url`、生视频的 `url`、生图的 `images: [{url}]`（失败的那几项没有 url）。
 */
export const resultUrlsOf = (output: unknown, progress: GenerationProgress | null): string[] => {
  const { url, images } = (output ?? {}) as { url?: unknown; images?: unknown };
  if (typeof url === "string" && url) {
    return [url];
  }
  if (Array.isArray(images)) {
    const urls = images.flatMap((item) => {
      const itemUrl = (item as { url?: unknown } | null)?.url;
      return typeof itemUrl === "string" && itemUrl ? [itemUrl] : [];
    });
    if (urls.length > 0) {
      return urls;
    }
  }
  return progress && progress.status === "done" && progress.urls ? progress.urls : [];
};

/** 卡片上一张图的位置：还在生成（呼吸占位）、已出图、或这张没生成出来 */
export type ImageSlot = { kind: "pending" } | { kind: "image"; url: string } | { kind: "failed"; error: string };

/** 这次生图调用要生成几张：看入参里的 images 数组；入参还没拼完整或不是批量形态时为 0 */
export const requestedImageCount = (input: unknown): number => {
  const images = (input as { images?: unknown } | null | undefined)?.images;
  return Array.isArray(images) ? images.length : 0;
};

/**
 * 卡片上图片区域的每个位置，按入参顺序：
 * - 工具结果已经回来（`images` 数组）：每张按结果显示出图或失败原因；
 * - 进度里已有地址（后台完成、或前台串行时图先出）：先出这些图，没出的那几张记为没生成出来；
 * - 还在生成：每张一个呼吸占位，让用户一眼看到一共要几张。
 * 截图工具这类单图结果（`url`）只有一个位置。
 */
export const imageSlotsOf = (
  output: unknown,
  progress: GenerationProgress | null,
  requested: number,
  running: boolean
): ImageSlot[] => {
  const images = (output as { images?: unknown } | null | undefined)?.images;
  if (Array.isArray(images) && images.length > 0) {
    return images.map((item): ImageSlot => {
      const { url, error } = (item ?? {}) as { url?: unknown; error?: unknown };
      return typeof url === "string" && url
        ? { kind: "image", url }
        : { kind: "failed", error: typeof error === "string" && error ? error : "没有生成出来" };
    });
  }
  const urls = resultUrlsOf(output, progress);
  if (urls.length > 0) {
    const finished = progress?.status === "done" || !running;
    const missing = finished ? Math.max(0, requested - urls.length) : 0;
    const pending = !finished ? Math.max(0, requested - urls.length) : 0;
    return [
      ...urls.map((url): ImageSlot => ({ kind: "image", url })),
      ...Array.from({ length: missing }, (): ImageSlot => ({ kind: "failed", error: "没有生成出来" })),
      ...Array.from({ length: pending }, (): ImageSlot => ({ kind: "pending" }))
    ];
  }
  return running ? Array.from({ length: Math.max(1, requested) }, (): ImageSlot => ({ kind: "pending" })) : [];
};

const POLL_INTERVAL_MS = 1500;
/** 连续这么多次查不到（≈30 秒）就不再轮询：任务不会凭空出现，别一直打后端 */
const MAX_UNKNOWN_POLLS = 20;
/** 连续这么多次请求出错才放弃：一次网络抖动不该让进度条停住 */
const MAX_FAILED_POLLS = 5;

const defaultFetch: FetchGenerationProgress = async (toolCallId) => {
  const res = await apiClient.customApi.jobs.progress[":toolCallId"].$get({ param: { toolCallId } });
  return (await res.json()) as GenerationProgress;
};

/**
 * 按 toolCallId 轮询生成进度。`active` 为 true 时开始（立刻查一次，之后每 1.5 秒一次），
 * 为 false、任务结束（完成 / 失败）、或作用域销毁时停止。
 */
export function useGenerationProgress(
  toolCallId: MaybeRefOrGetter<string | undefined>,
  active: MaybeRefOrGetter<boolean>,
  fetchProgress: FetchGenerationProgress = defaultFetch
) {
  const progress = ref<GenerationProgress | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let polling = 0;

  const stop = () => {
    polling += 1; // 让还在路上的那次请求回来时作废
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  const start = (id: string) => {
    stop();
    const session = polling;
    let unknown = 0;
    let failed = 0;

    const tick = async () => {
      let next: GenerationProgress | undefined;
      try {
        next = await fetchProgress(id);
        failed = 0;
      } catch {
        failed += 1;
      }
      if (session !== polling) {
        return;
      }
      if (next) {
        if (next.status === "unknown") {
          unknown += 1;
        } else {
          unknown = 0;
          progress.value = next;
        }
        if (next.status === "done" || next.status === "failed") {
          return;
        }
      }
      if (unknown >= MAX_UNKNOWN_POLLS || failed >= MAX_FAILED_POLLS) {
        return;
      }
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    };

    void tick();
  };

  watch(
    () => [toValue(toolCallId), toValue(active)] as const,
    ([id, isActive]) => {
      if (id && isActive) {
        start(id);
      } else {
        stop();
      }
    },
    { immediate: true }
  );

  onScopeDispose(stop);

  /** 进度条上的百分比，没有数据时是 0 */
  const percent = computed(() => (progress.value && "percent" in progress.value ? progress.value.percent : 0));

  return { progress, percent };
}
