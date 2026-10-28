import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { effectScope, nextTick, ref } from "vue";

import {
  type FetchGenerationProgress,
  type GenerationProgress,
  imageSlotsOf,
  isGenerationRunning,
  requestedImageCount,
  resultUrlsOf,
  useGenerationProgress
} from "@/views/build/components/agentBI/hooks/message/useGenerationProgress";

vi.mock("@screenwright/server/rpc", () => ({ apiClient: {} }));

const running = (percent: number, elapsedSec = 1): GenerationProgress => ({
  kind: "image",
  status: "running",
  percent,
  stage: "生成中",
  elapsedSec
});
const done: GenerationProgress = { kind: "image", status: "done", percent: 100, stage: "已完成", elapsedSec: 90 };
const failed: GenerationProgress = {
  kind: "video",
  status: "failed",
  percent: 40,
  stage: "失败",
  elapsedSec: 30,
  error: "内容审核未通过"
};
const unknown: GenerationProgress = { status: "unknown" };

/** 在独立作用域里跑，结束时能像组件卸载一样销毁 */
const mount = (
  fetchProgress: FetchGenerationProgress,
  { id = "call_1", active = true }: { id?: string; active?: boolean } = {}
) => {
  const toolCallId = ref<string | undefined>(id);
  const isActive = ref(active);
  const scope = effectScope();
  const state = scope.run(() => useGenerationProgress(toolCallId, isActive, fetchProgress))!;
  return { ...state, toolCallId, isActive, scope };
};

/** 让已经发出的 await 链走完，再推进定时器 */
const flush = async (ms = 0) => {
  await vi.advanceTimersByTimeAsync(ms);
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("isGenerationRunning", () => {
  it("前台执行：生图 / 生视频已调用、还没结果 → 在跑", () => {
    expect(isGenerationRunning("createImageTool", "input-available", undefined)).toBe(true);
    expect(isGenerationRunning("createVideoTool", "input-available", undefined)).toBe(true);
  });

  it("后台执行：工具立刻返回了占位文字 → 仍然在跑", () => {
    const placeholder = "Background task started. Task ID: a481909d. The tool is running in the background.";

    expect(isGenerationRunning("createImageTool", "output-available", placeholder)).toBe(true);
  });

  it("真结果回来了（对象）→ 不在跑", () => {
    expect(isGenerationRunning("createImageTool", "output-available", { url: "http://x/a.png" })).toBe(false);
  });

  it("失败或还在流式拼入参时 → 不在跑", () => {
    expect(isGenerationRunning("createImageTool", "output-error", undefined)).toBe(false);
    expect(isGenerationRunning("createImageTool", "input-streaming", undefined)).toBe(false);
  });

  it("其他工具一律不算，哪怕结果也是那句占位", () => {
    expect(isGenerationRunning("editFilesTool", "input-available", undefined)).toBe(false);
    expect(isGenerationRunning("captureCanvasTool", "output-available", "Background task started. Task ID: x")).toBe(
      false
    );
  });
});

describe("useGenerationProgress", () => {
  it("激活时立刻查一次，之后每 1.5 秒一次，进度随之更新", async () => {
    const fetchProgress = vi
      .fn<[string], Promise<GenerationProgress>>()
      .mockResolvedValueOnce(running(10))
      .mockResolvedValueOnce(running(40))
      .mockResolvedValue(running(75));
    const { progress, percent } = mount(fetchProgress);

    await flush(0);
    expect(fetchProgress).toHaveBeenCalledTimes(1);
    expect(percent.value).toBe(10);

    await flush(1500);
    expect(percent.value).toBe(40);

    await flush(1500);
    expect(percent.value).toBe(75);
    expect(progress.value).toMatchObject({ status: "running", stage: "生成中" });
  });

  it("完成就停：不再继续查", async () => {
    const fetchProgress = vi
      .fn<[string], Promise<GenerationProgress>>()
      .mockResolvedValueOnce(running(50))
      .mockResolvedValue(done);
    const { progress } = mount(fetchProgress);

    await flush(0);
    await flush(1500);
    await flush(10_000);

    expect(progress.value).toMatchObject({ status: "done" });
    expect(fetchProgress).toHaveBeenCalledTimes(2);
  });

  it("失败也停，并保留失败原因", async () => {
    const fetchProgress = vi.fn<[string], Promise<GenerationProgress>>().mockResolvedValue(failed);
    const { progress } = mount(fetchProgress);

    await flush(0);
    await flush(10_000);

    expect(progress.value).toMatchObject({ status: "failed", error: "内容审核未通过" });
    expect(fetchProgress).toHaveBeenCalledTimes(1);
  });

  it("没激活时一次都不查；之后激活才开始", async () => {
    const fetchProgress = vi.fn<[string], Promise<GenerationProgress>>().mockResolvedValue(running(10));
    const { isActive } = mount(fetchProgress, { active: false });

    await flush(5000);
    expect(fetchProgress).not.toHaveBeenCalled();

    isActive.value = true;
    await nextTick();
    await flush(0);
    expect(fetchProgress).toHaveBeenCalledTimes(1);
  });

  it("没有 toolCallId 时不查", async () => {
    const fetchProgress = vi.fn<[string], Promise<GenerationProgress>>().mockResolvedValue(running(10));
    const { toolCallId } = mount(fetchProgress, { id: "" });

    await flush(5000);

    expect(toolCallId.value).toBe("");
    expect(fetchProgress).not.toHaveBeenCalled();
  });

  it("中途变成不激活（工具结果回来了）就停止轮询", async () => {
    const fetchProgress = vi.fn<[string], Promise<GenerationProgress>>().mockResolvedValue(running(10));
    const { isActive } = mount(fetchProgress);
    await flush(0);

    isActive.value = false;
    await nextTick();
    await flush(10_000);

    expect(fetchProgress).toHaveBeenCalledTimes(1);
  });

  it("组件卸载（作用域销毁）后不再查", async () => {
    const fetchProgress = vi.fn<[string], Promise<GenerationProgress>>().mockResolvedValue(running(10));
    const { scope } = mount(fetchProgress);
    await flush(0);

    scope.stop();
    await flush(10_000);

    expect(fetchProgress).toHaveBeenCalledTimes(1);
  });

  it("还在路上的请求在停止之后才回来，结果作废，不覆盖", async () => {
    let resolveLate!: (value: GenerationProgress) => void;
    const fetchProgress = vi.fn<[string], Promise<GenerationProgress>>().mockReturnValue(
      new Promise((resolve) => {
        resolveLate = resolve;
      })
    );
    const { progress, scope } = mount(fetchProgress);

    scope.stop();
    resolveLate(running(90));
    await flush(0);

    expect(progress.value).toBeNull();
  });

  it("查不到（unknown）不覆盖已有进度；连续 20 次都查不到就放弃", async () => {
    const fetchProgress = vi
      .fn<[string], Promise<GenerationProgress>>()
      .mockResolvedValueOnce(running(30))
      .mockResolvedValue(unknown);
    const { progress } = mount(fetchProgress);

    await flush(0);
    await flush(60_000);

    expect(progress.value).toMatchObject({ status: "running", percent: 30 });
    // 1 次有进度 + 20 次 unknown 后停
    expect(fetchProgress).toHaveBeenCalledTimes(21);
  });

  it("请求偶尔出错（网络抖动）不中断，继续查", async () => {
    const fetchProgress = vi
      .fn<[string], Promise<GenerationProgress>>()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue(running(60));
    const { percent } = mount(fetchProgress);

    await flush(0);
    await flush(1500);

    expect(percent.value).toBe(60);
  });

  it("连续 5 次请求出错才放弃", async () => {
    const fetchProgress = vi.fn<[string], Promise<GenerationProgress>>().mockRejectedValue(new Error("network"));
    mount(fetchProgress);

    await flush(0);
    await flush(60_000);

    expect(fetchProgress).toHaveBeenCalledTimes(5);
  });

  it("换了 toolCallId 就重新开始，旧的不再查", async () => {
    const fetchProgress = vi.fn<[string], Promise<GenerationProgress>>().mockResolvedValue(running(10));
    const { toolCallId } = mount(fetchProgress, { id: "call_1" });
    await flush(0);

    toolCallId.value = "call_2";
    await nextTick();
    await flush(0);

    expect(fetchProgress.mock.calls.map(([id]) => id)).toEqual(["call_1", "call_2"]);
  });
});

describe("resultUrlsOf", () => {
  const doneWithUrls: GenerationProgress = { ...done, urls: ["http://x/from-progress.png"] };

  it("工具结果里有 url（截图、生视频，或前台执行）就用它", () => {
    expect(resultUrlsOf({ url: "http://x/a.png" }, doneWithUrls)).toEqual(["http://x/a.png"]);
  });

  it("生图一批：按顺序取每张的 url，失败的那几张（没有 url）跳过", () => {
    const output = { images: [{ url: "http://x/a.png" }, { error: "审核未通过" }, { url: "http://x/c.png" }] };

    expect(resultUrlsOf(output, null)).toEqual(["http://x/a.png", "http://x/c.png"]);
  });

  it("后台任务完成后卡片结果还是占位文字，用进度里带回来的地址——这就是「完成了但没图」的修复", () => {
    expect(resultUrlsOf("Background task started. Task ID: x", doneWithUrls)).toEqual(["http://x/from-progress.png"]);
  });

  it("还在跑、失败、或没查到进度时没有地址", () => {
    expect(resultUrlsOf("Background task started.", running(50))).toEqual([]);
    expect(resultUrlsOf("Background task started.", failed)).toEqual([]);
    expect(resultUrlsOf("Background task started.", null)).toEqual([]);
    expect(resultUrlsOf(undefined, unknown)).toEqual([]);
  });

  it("完成了但没带地址（别的形态的结果）也是空", () => {
    expect(resultUrlsOf("占位", done)).toEqual([]);
  });
});

describe("前台串行执行时的卡片（图已生成，但卡片还停在 input-available）", () => {
  it("进度里已经有地址，就能出图，不必等卡片变成 output-available", () => {
    const doneWithUrls: GenerationProgress = { ...done, urls: ["http://x/a.png", "http://x/b.png"] };

    // ToolCallPart 在 state 不是 output-available 时把 output 当作 undefined 传进来
    expect(resultUrlsOf(undefined, doneWithUrls)).toEqual(["http://x/a.png", "http://x/b.png"]);
  });
});

describe("requestedImageCount", () => {
  it("取入参 images 的张数；没有 / 还没拼完整时是 0", () => {
    expect(requestedImageCount({ images: [{}, {}, {}] })).toBe(3);
    expect(requestedImageCount({})).toBe(0);
    expect(requestedImageCount(undefined)).toBe(0);
    expect(requestedImageCount({ images: "x" })).toBe(0);
  });
});

describe("imageSlotsOf", () => {
  const pending = { kind: "pending" };

  it("生成中：入参要几张就放几个呼吸占位", () => {
    expect(imageSlotsOf(undefined, running(10), 4, true)).toEqual([pending, pending, pending, pending]);
  });

  it("生成中但不知道张数（单图工具、入参还没拼完）：至少放一个占位", () => {
    expect(imageSlotsOf(undefined, null, 0, true)).toEqual([pending]);
  });

  it("没在生成、也没有结果：不显示任何东西", () => {
    expect(imageSlotsOf(undefined, null, 4, false)).toEqual([]);
  });

  it("结果回来了：按入参顺序，成功的出图，失败的写原因", () => {
    const output = { images: [{ url: "http://x/a.png" }, { error: "审核未通过" }, { url: "http://x/c.png" }] };

    expect(imageSlotsOf(output, null, 3, false)).toEqual([
      { kind: "image", url: "http://x/a.png" },
      { kind: "failed", error: "审核未通过" },
      { kind: "image", url: "http://x/c.png" }
    ]);
  });

  it("后台完成、卡片结果还是占位文字：用进度里的地址出图，没出的那几张记为没生成出来", () => {
    const progress: GenerationProgress = { ...done, urls: ["http://x/a.png", "http://x/b.png"] };

    expect(imageSlotsOf("Background task started.", progress, 3, true)).toEqual([
      { kind: "image", url: "http://x/a.png" },
      { kind: "image", url: "http://x/b.png" },
      { kind: "failed", error: "没有生成出来" }
    ]);
  });

  it("截图工具这类单图结果只有一个位置", () => {
    expect(imageSlotsOf({ url: "http://x/shot.png" }, null, 0, false)).toEqual([
      { kind: "image", url: "http://x/shot.png" }
    ]);
  });
});
