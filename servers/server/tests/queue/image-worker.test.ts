import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  warmModelConfigs: vi.fn(),
  generateAndStoreImage: vi.fn()
}));

vi.mock("@/mastra/provider/model-registry", () => ({
  warmModelConfigs: mocks.warmModelConfigs,
  getModelConfigSync: () => ({ modelId: "m" })
}));
vi.mock("@/mastra/services/image-generation.server", () => ({
  generateAndStoreImage: mocks.generateAndStoreImage,
  computePromptHash: () => "hash"
}));

import { UnrecoverableError } from "bullmq";

import { processImageJob } from "@/queue/image-worker";

const data = { prompt: "p", seed: 1, width: 1920, height: 1080 };
const record = {
  id: "i1",
  promptHash: "hash",
  prompt: "p",
  model: "m",
  seed: 1,
  width: 1920,
  height: 1080,
  url: "http://x/a.png",
  reused: false,
  createdTime: new Date()
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.generateAndStoreImage.mockResolvedValue(record);
});

describe("processImageJob", () => {
  it("永久失败（参考图不存在）转成 UnrecoverableError：队列不再重试", async () => {
    mocks.generateAndStoreImage.mockRejectedValue(
      Object.assign(new Error("参考图不存在：http://x/a.png"), { permanent: true })
    );

    const failure = await processImageJob({ data, updateProgress: vi.fn() }).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(UnrecoverableError);
    expect((failure as Error).message).toBe("参考图不存在：http://x/a.png");
  });

  it("普通失败照常抛出，让队列重试", async () => {
    mocks.generateAndStoreImage.mockRejectedValue(new Error("请求失败 502"));

    const failure = await processImageJob({ data, updateProgress: vi.fn() }).catch((error: unknown) => error);

    expect(failure).not.toBeInstanceOf(UnrecoverableError);
  });

  it("先重读模型配置再生图（worker 进程的缓存不会随「设置」页更新）", async () => {
    const order: string[] = [];
    mocks.warmModelConfigs.mockImplementation(async () => void order.push("warm"));
    mocks.generateAndStoreImage.mockImplementation(async () => {
      order.push("generate");
      return record;
    });

    await processImageJob({ data, updateProgress: vi.fn() });

    expect(order).toEqual(["warm", "generate"]);
  });

  it("把生图服务的阶段进度转发给队列任务", async () => {
    const updateProgress = vi.fn();
    mocks.generateAndStoreImage.mockImplementation(async (_input, options) => {
      await options.onProgress(10);
      await options.onProgress(90);
      return record;
    });

    await processImageJob({ data, updateProgress });

    expect(updateProgress.mock.calls.map((c) => c[0])).toEqual([5, 10, 90]);
  });

  it("返回值剔除 Date 等不可序列化字段", async () => {
    const out = await processImageJob({ data, updateProgress: vi.fn() });
    expect(out).not.toHaveProperty("createdTime");
    expect(out.url).toBe("http://x/a.png");
  });

  it("任务数据不合法时直接失败，不会去调用生图模型", async () => {
    await expect(processImageJob({ data: { ...data, prompt: "" }, updateProgress: vi.fn() })).rejects.toThrow();
    expect(mocks.generateAndStoreImage).not.toHaveBeenCalled();
  });

  it("生图失败的错误原样抛出，交给 BullMQ 按 attempts 重试", async () => {
    mocks.generateAndStoreImage.mockRejectedValue(new Error("请求失败 502"));
    await expect(processImageJob({ data, updateProgress: vi.fn() })).rejects.toThrow("请求失败 502");
  });
});
