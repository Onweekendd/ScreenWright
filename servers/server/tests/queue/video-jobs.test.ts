import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as VideoGeneration from "@/mastra/services/ai-generation/video/video-generation.server";

const mocks = vi.hoisted(() => ({ warmModelConfigs: vi.fn(), generateAndStoreVideo: vi.fn() }));

vi.mock("@/mastra/storage/prisma", () => ({ prismaClient: {} }));
vi.mock("@/lib/storage", () => ({ assetStore: () => ({}) }));
vi.mock("@/mastra/provider/model-registry", () => ({
  resolveModelConfig: () => ({ baseUrl: "https://gw.example/v1", apiKey: "k", modelId: "m" }),
  warmModelConfigs: mocks.warmModelConfigs
}));
vi.mock("@/mastra/services/ai-generation/video/video-generation.server", async (importOriginal) => ({
  ...(await importOriginal<typeof VideoGeneration>()),
  generateAndStoreVideo: mocks.generateAndStoreVideo
}));

import { toVideoRecord, type VideoJobData, VideoJobDataSchema, videoJobId } from "@/queue/video/video-jobs";
import { processVideoJob } from "@/queue/video/video-worker";

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
  lastFrameUrl: null,
  referenceImageUrls: [],
  referenceVideoUrls: [],
  referenceAudioUrls: [],
  reused: false,
  createdTime: new Date(),
  taskId: "task_1"
};

/** BullMQ Job 的替身：只用到 id / data / updateProgress / updateData */
const fakeJob = (data: unknown = base) => ({
  id: "job-1",
  data: data as VideoJobData,
  updateProgress: vi.fn(),
  updateData: vi.fn()
});

/** 取出 worker 交给生成服务的 options */
const generateOptions = () => mocks.generateAndStoreVideo.mock.calls[0][1];

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
    const { computeVideoHash } = await import("@/mastra/services/ai-generation/video/video-generation.server");
    expect(videoJobId(base, "m")).toBe(computeVideoHash(base, "m"));
  });
});

describe("VideoJobDataSchema", () => {
  it("接受合法数据（首帧可选）", () => {
    expect(VideoJobDataSchema.parse(base)).toEqual(base);
    expect(VideoJobDataSchema.parse({ ...base, firstFrameUrl: "http://store/u" }).firstFrameUrl).toBe("http://store/u");
  });

  it("新增素材字段不会在入队校验时被丢弃，且参与任务去重", () => {
    for (const patch of [
      { lastFrameUrl: "http://store/last.png" },
      { referenceImageUrls: ["http://store/ref.png"] },
      { referenceVideoUrls: ["http://public.example/ref.mp4"] },
      { referenceAudioUrls: ["http://public.example/ref.mp3"] }
    ]) {
      const data = VideoJobDataSchema.parse({ ...base, ...patch });
      expect(data).toMatchObject(patch);
      expect(videoJobId(data, "m")).not.toBe(videoJobId(base, "m"));
    }
    expect(
      VideoJobDataSchema.safeParse({
        ...base,
        firstFrameUrl: "http://store/first.png",
        referenceVideoUrls: ["http://public.example/ref.mp4"]
      }).success
    ).toBe(false);
  });

  it("保留检查点 providerTaskId；它不参与任务 id，写回前后还是同一个任务", () => {
    const resumed = VideoJobDataSchema.parse({ ...base, providerTaskId: "task_7" });

    expect(resumed.providerTaskId).toBe("task_7");
    expect(videoJobId(resumed, "m")).toBe(videoJobId(base, "m"));
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

    await processVideoJob(fakeJob());

    expect(order).toEqual(["warm", "generate"]);
  });

  it("把生成服务的阶段进度转发给队列任务，返回精简后的记录", async () => {
    const updateProgress = vi.fn();
    mocks.generateAndStoreVideo.mockImplementation(async (_input, options) => {
      await options.onProgress(20);
      await options.onProgress(90);
      return record;
    });

    const result = await processVideoJob({ ...fakeJob(), updateProgress });

    expect(updateProgress.mock.calls.map(([percent]) => percent)).toEqual([1, 20, 90]);
    expect(result).toEqual(toVideoRecord(record));
  });

  it("任务数据不合法时在调服务商之前就拒绝", async () => {
    await expect(processVideoJob(fakeJob({ ...base, prompt: "" }))).rejects.toThrow();
    expect(mocks.generateAndStoreVideo).not.toHaveBeenCalled();
  });
});

describe("processVideoJob 检查点", () => {
  it("第一次执行：任务数据里没有 providerTaskId，不带 resumeTaskId", async () => {
    await processVideoJob(fakeJob());

    expect(generateOptions().resumeTaskId).toBeUndefined();
  });

  it("被卡死回收后重新执行：任务数据里的 providerTaskId 作为 resumeTaskId 交给生成服务", async () => {
    await processVideoJob(fakeJob({ ...base, providerTaskId: "task_7" }));

    expect(generateOptions().resumeTaskId).toBe("task_7");
  });

  it("提交成功后把服务商任务 id 写回任务数据，原有入参一个不少", async () => {
    const job = fakeJob();
    mocks.generateAndStoreVideo.mockImplementation(async (_input, options) => {
      await options.onSubmitted("task_9");
      return record;
    });

    await processVideoJob(job);

    expect(job.updateData).toHaveBeenCalledWith({ ...base, providerTaskId: "task_9" });
  });

  it("写检查点失败不打断生成：视频已经提交计费，宁可没有检查点也要把结果拿回来", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const job = fakeJob();
    job.updateData.mockRejectedValue(new Error("Redis 连接断了"));
    mocks.generateAndStoreVideo.mockImplementation(async (_input, options) => {
      await options.onSubmitted("task_9");
      return record;
    });

    // 写检查点带退避重试（间隔 1s、2s），用假时钟跳过等待
    vi.useFakeTimers();
    const result = processVideoJob(job);
    await vi.runAllTimersAsync();

    await expect(result).resolves.toEqual(toVideoRecord(record));
    expect(job.updateData).toHaveBeenCalledTimes(3);
    expect(warn).toHaveBeenCalled();
    vi.useRealTimers();
    warn.mockRestore();
  });
});
