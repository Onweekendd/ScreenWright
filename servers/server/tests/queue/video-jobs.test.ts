import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as VideoGeneration from "@/mastra/services/video-generation.server";

const mocks = vi.hoisted(() => ({ warmModelConfigs: vi.fn(), generateAndStoreVideo: vi.fn() }));

vi.mock("@/mastra/storage/prisma", () => ({ prismaClient: {} }));
vi.mock("@/lib/storage", () => ({ assetStore: () => ({}) }));
vi.mock("@/mastra/provider/model-registry", () => ({
  getModelConfigSync: () => ({ baseUrl: "https://gw.example/v1", apiKey: "k", modelId: "m" }),
  warmModelConfigs: mocks.warmModelConfigs
}));
vi.mock("@/mastra/services/video-generation.server", async (importOriginal) => ({
  ...(await importOriginal<typeof VideoGeneration>()),
  generateAndStoreVideo: mocks.generateAndStoreVideo
}));

import { toVideoRecord, VideoJobDataSchema, videoJobId } from "@/queue/video-jobs";
import { processVideoJob } from "@/queue/video-worker";

const base = { prompt: "云层流动", durationSec: 5, resolution: "768P", ratio: "16:9" } as const;
const record = {
  id: "v1",
  promptHash: "hash",
  prompt: "云层流动",
  model: "m",
  durationSec: 5,
  resolution: "768P",
  ratio: "16:9",
  url: "http://x/a.mp4",
  firstFrameUrl: null,
  reused: false,
  createdTime: new Date(),
  taskId: "task_1"
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.generateAndStoreVideo.mockResolvedValue(record);
});

describe("videoJobId", () => {
  it("同一份输入 + 同一个模型 → 同一个 id（队列据此合并重复任务，不重复提交给服务商）", () => {
    expect(videoJobId(base, "seedance")).toBe(videoJobId({ ...base }, "seedance"));
  });

  it.each([
    ["提示词", { prompt: "别的" }],
    ["时长", { durationSec: 6 }],
    ["分辨率", { resolution: "480P" as const }],
    ["首帧", { firstFrameUrl: "http://x/a.png" }]
  ])("%s 变了 id 就变", (_label, patch) => {
    expect(videoJobId({ ...base, ...patch }, "seedance")).not.toBe(videoJobId(base, "seedance"));
  });

  it("id 与服务落库用的 promptHash 是同一个口径", async () => {
    const { computeVideoHash } = await import("@/mastra/services/video-generation.server");
    expect(videoJobId(base, "m")).toBe(computeVideoHash(base, "m"));
  });
});

describe("VideoJobDataSchema", () => {
  it("接受合法数据（首帧可选）", () => {
    expect(VideoJobDataSchema.parse(base)).toEqual(base);
    expect(VideoJobDataSchema.parse({ ...base, firstFrameUrl: "u" }).firstFrameUrl).toBe("u");
  });

  it.each([
    ["空提示词", { prompt: "" }],
    ["小数时长", { durationSec: 4.5 }],
    ["不认识的分辨率", { resolution: "8k" }],
    ["不认识的比例", { ratio: "5:7" }]
  ])("拒绝非法数据：%s", (_label, patch) => {
    expect(() => VideoJobDataSchema.parse({ ...base, ...patch })).toThrow();
  });
});

describe("toVideoRecord", () => {
  it("只保留声明字段，Prisma 行里的 Date、taskId 不带进队列返回值", () => {
    const result = toVideoRecord(record);

    expect(result).not.toHaveProperty("createdTime");
    expect(result).not.toHaveProperty("taskId");
    expect(result).toMatchObject({ id: "v1", url: "http://x/a.mp4", firstFrameUrl: null, reused: false });
  });
});

describe("processVideoJob", () => {
  it("先重读模型配置再生成（worker 进程的缓存不会随「设置」页更新）", async () => {
    const order: string[] = [];
    mocks.warmModelConfigs.mockImplementation(async () => void order.push("warm"));
    mocks.generateAndStoreVideo.mockImplementation(async () => {
      order.push("generate");
      return record;
    });

    await processVideoJob({ data: base, updateProgress: vi.fn() });

    expect(order).toEqual(["warm", "generate"]);
  });

  it("把生成服务的阶段进度转发给队列任务，返回精简后的记录", async () => {
    const updateProgress = vi.fn();
    mocks.generateAndStoreVideo.mockImplementation(async (_input, options) => {
      await options.onProgress(20);
      await options.onProgress(90);
      return record;
    });

    const result = await processVideoJob({ data: base, updateProgress });

    expect(updateProgress.mock.calls.map(([percent]) => percent)).toEqual([1, 20, 90]);
    expect(result).toEqual(toVideoRecord(record));
  });

  it("任务数据不合法时在调服务商之前就拒绝", async () => {
    await expect(processVideoJob({ data: { ...base, prompt: "" }, updateProgress: vi.fn() })).rejects.toThrow();
    expect(mocks.generateAndStoreVideo).not.toHaveBeenCalled();
  });
});
