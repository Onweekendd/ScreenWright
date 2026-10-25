import { beforeEach, describe, expect, it } from "vitest";

import {
  finishProgress,
  getGenerationProgress,
  reportProgress,
  resetProgressForTest,
  stageOf,
  startProgress,
  trackGeneration
} from "@/mastra/services/ai-generation/generation-progress";

beforeEach(resetProgressForTest);

describe("stageOf", () => {
  it.each([
    ["image", 0, "排队中"],
    ["image", 10, "生成中"],
    ["image", 74, "生成中"],
    ["image", 75, "转存中"],
    ["image", 90, "收尾中"],
    ["video", 5, "提交任务"],
    ["video", 20, "生成中"],
    ["video", 70, "生成中"],
    ["video", 75, "转存中"],
    ["video", 90, "收尾中"]
  ] as const)("%s 进度 %i%% → %s", (kind, percent, stage) => {
    expect(stageOf(kind, percent)).toBe(stage);
  });
});

describe("进度记录", () => {
  it("没登记过的 toolCallId 查不到", () => {
    expect(getGenerationProgress("nope")).toBeNull();
  });

  it("开始后是运行中、0%，已用时间按当前时间算", () => {
    startProgress("c1", "image", 1_000);

    expect(getGenerationProgress("c1", 13_000)).toEqual({
      kind: "image",
      status: "running",
      percent: 0,
      stage: "排队中",
      elapsedSec: 12
    });
  });

  it("进度只增不减：队列重试让上报值回落时，进度条不倒退", () => {
    startProgress("c1", "image");

    reportProgress("c1", 75);
    reportProgress("c1", 10);

    expect(getGenerationProgress("c1")?.percent).toBe(75);
  });

  it("运行中最多到 99%，100% 只留给「完成」", () => {
    startProgress("c1", "video");

    reportProgress("c1", 150);

    expect(getGenerationProgress("c1")?.percent).toBe(99);
  });

  it("完成：100%、阶段「已完成」，总耗时固定下来不再增长", () => {
    startProgress("c1", "image", 0);
    finishProgress("c1", undefined, 30_000);

    expect(getGenerationProgress("c1", 999_000)).toMatchObject({
      status: "done",
      percent: 100,
      stage: "已完成",
      elapsedSec: 30
    });
  });

  it("失败：保留失败时的进度和原因", () => {
    startProgress("c1", "video", 0);
    reportProgress("c1", 40);
    finishProgress("c1", "内容审核未通过", 5_000);

    expect(getGenerationProgress("c1")).toMatchObject({
      status: "failed",
      percent: 40,
      stage: "失败",
      error: "内容审核未通过"
    });
  });

  it("结束之后的上报不改结果（迟到的队列事件）", () => {
    startProgress("c1", "image");
    finishProgress("c1");

    reportProgress("c1", 50);

    expect(getGenerationProgress("c1")).toMatchObject({ status: "done", percent: 100 });
  });

  it("同一个 toolCallId 重新开始（工具重试）就从 0 起", () => {
    startProgress("c1", "image");
    reportProgress("c1", 80);

    startProgress("c1", "image");

    expect(getGenerationProgress("c1")?.percent).toBe(0);
  });

  it("结束超过 5 分钟的记录在下一次开始时被清掉；运行中的不会", () => {
    startProgress("old", "image", 0);
    finishProgress("old", undefined, 1_000);
    startProgress("running", "image", 0);

    startProgress("new", "image", 6 * 60_000);

    expect(getGenerationProgress("old", 6 * 60_000)).toBeNull();
    expect(getGenerationProgress("running", 6 * 60_000)).not.toBeNull();
  });
});

describe("trackGeneration", () => {
  it("包住一次生成：期间能查到进度，成功后记为完成并返回结果", async () => {
    let seen: ReturnType<typeof getGenerationProgress> = null;

    const result = await trackGeneration("image", "c1", async (onProgress) => {
      onProgress(75);
      seen = getGenerationProgress("c1");
      return "图";
    });

    expect(result).toBe("图");
    expect(seen).toMatchObject({ status: "running", percent: 75, stage: "转存中" });
    expect(getGenerationProgress("c1")).toMatchObject({ status: "done" });
  });

  it("成功时把结果里的产物地址一并记下，给前端卡片出图用", async () => {
    await trackGeneration("video", "c1", async () => ({ id: "vid-1", url: "http://x/a.mp4" }));

    expect(getGenerationProgress("c1")).toMatchObject({ status: "done", urls: ["http://x/a.mp4"] });
  });

  it("一批图：按顺序记下每张的地址，失败的那几张（没有 url）跳过", async () => {
    await trackGeneration("image", "c1", async () => ({
      images: [{ url: "http://x/a.png" }, { error: "审核未通过" }, { url: "http://x/c.png" }]
    }));

    expect(getGenerationProgress("c1")).toMatchObject({ urls: ["http://x/a.png", "http://x/c.png"] });
  });

  it("结果里没有 url（别的形态）就不带地址；失败时也没有", async () => {
    await trackGeneration("image", "c1", async () => "没有地址");
    await trackGeneration("image", "c2", async () => {
      throw new Error("x");
    }).catch(() => undefined);

    expect(getGenerationProgress("c1")).not.toHaveProperty("urls");
    expect(getGenerationProgress("c2")).not.toHaveProperty("urls");
  });

  it("失败时记下原因并把错误原样抛出", async () => {
    await expect(
      trackGeneration("video", "c1", async () => {
        throw new Error("网关 503");
      })
    ).rejects.toThrow("网关 503");

    expect(getGenerationProgress("c1")).toMatchObject({ status: "failed", error: "网关 503" });
  });

  it("没有 toolCallId（工作流等非工具调用）时只透传，不登记", async () => {
    const result = await trackGeneration("image", undefined, async (onProgress) => {
      onProgress(50);
      return 1;
    });

    expect(result).toBe(1);
  });
});
