/**
 * 连真 Redis 的集成测试：producer（generateImage）→ BullMQ → worker → 结果。
 * 只在设置了 TEST_REDIS_URL 时运行，例如：
 *   TEST_REDIS_URL=redis://localhost:6380 pnpm --dir servers/server exec vitest --run tests/queue/image-queue.integration.test.ts
 * 每次运行用随机的 QUEUE_PREFIX，不会碰到别的数据，结束时清掉自己的 key。
 */
import IORedis from "ioredis";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type * as ImageGenerationModule from "@/mastra/services/image-generation.server";
import type * as ImageClientModule from "@/queue/image-client";
import type * as ImageJobsModule from "@/queue/image-jobs";

const mocks = vi.hoisted(() => ({ generateAndStoreImage: vi.fn() }));

vi.mock("@/mastra/storage/prisma", () => ({ prismaClient: {} }));
vi.mock("@/lib/storage", () => ({ assetStore: () => ({}) }));
vi.mock("@/mastra/provider/model-registry", () => ({
  warmModelConfigs: vi.fn(),
  getModelConfigSync: () => ({ modelId: "test-model" })
}));
vi.mock("@/mastra/services/image-generation.server", async (importOriginal) => ({
  ...(await importOriginal<typeof ImageGenerationModule>()),
  generateAndStoreImage: mocks.generateAndStoreImage
}));

const REDIS_URL = process.env.TEST_REDIS_URL;
const prefix = `test-${Math.random().toString(36).slice(2, 10)}`;

const input = (n: number) => ({ prompt: `prompt-${n}`, seed: n, width: 1920, height: 1080 });
const record = (n: number, reused = false) => ({
  id: `img-${n}`,
  promptHash: `hash-${n}`,
  prompt: `prompt-${n}`,
  model: "test-model",
  seed: n,
  width: 1920,
  height: 1080,
  url: `http://x/${n}.png`,
  reused
});

describe.skipIf(!REDIS_URL)("生图队列（真 Redis）", () => {
  let worker: { close(): Promise<void> };
  let generateImage: typeof ImageClientModule.generateImage;
  let getImageJobInfo: typeof ImageClientModule.getImageJobInfo;
  let closeClient: () => Promise<void>;
  let imageJobId: typeof ImageJobsModule.imageJobId;

  beforeAll(async () => {
    process.env.REDIS_URL = REDIS_URL;
    process.env.QUEUE_MODE = "redis";
    process.env.QUEUE_PREFIX = prefix;
    const client = await import("@/queue/image-client");
    ({ generateImage, getImageJobInfo } = client);
    closeClient = client.closeImageQueueClient;
    ({ imageJobId } = await import("@/queue/image-jobs"));
    const { createImageWorker } = await import("@/queue/image-worker");
    worker = createImageWorker();
  });

  beforeEach(() => {
    mocks.generateAndStoreImage.mockReset();
  });

  afterAll(async () => {
    await worker?.close();
    await closeClient?.();
    const redis = new IORedis(REDIS_URL!);
    const keys = await redis.keys(`${prefix}:*`);
    if (keys.length) {
      await redis.del(...keys);
    }
    await redis.quit();
  });

  it("入队 → worker 执行 → producer 拿到结果", async () => {
    mocks.generateAndStoreImage.mockResolvedValue(record(1));

    const result = await generateImage(input(1));

    expect(result).toMatchObject({ id: "img-1", url: "http://x/1.png", reused: false });
    expect(mocks.generateAndStoreImage).toHaveBeenCalledTimes(1);
  });

  it("同一份输入并发调用只执行一次（任务按 promptHash 合并）", async () => {
    mocks.generateAndStoreImage.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 300));
      return record(2);
    });

    const [a, b] = await Promise.all([generateImage(input(2)), generateImage(input(2))]);

    expect(a.id).toBe("img-2");
    expect(b.id).toBe("img-2");
    expect(mocks.generateAndStoreImage).toHaveBeenCalledTimes(1);
  });

  it("保留期内再次请求直接复用已完成的结果，并标记 reused", async () => {
    mocks.generateAndStoreImage.mockResolvedValue(record(3));
    await generateImage(input(3));

    const again = await generateImage(input(3));

    expect(again.reused).toBe(true);
    expect(mocks.generateAndStoreImage).toHaveBeenCalledTimes(1);
  });

  it("可以按任务 id 查到状态与结果", async () => {
    mocks.generateAndStoreImage.mockResolvedValue(record(4));
    await generateImage(input(4));

    const info = await getImageJobInfo(imageJobId(input(4), "test-model"));

    expect(info).toMatchObject({ state: "completed", result: { id: "img-4" } });
    expect(await getImageJobInfo("not-exists")).toBeNull();
  });

  it("失败会抛给调用方；同一份输入随后重试会重新执行，而不是一直拿到旧的失败", async () => {
    mocks.generateAndStoreImage.mockRejectedValue(new Error("上游 502"));
    await expect(generateImage(input(5))).rejects.toThrow("上游 502");
    const failedCalls = mocks.generateAndStoreImage.mock.calls.length;
    expect(failedCalls).toBe(2); // attempts: 2

    mocks.generateAndStoreImage.mockReset();
    mocks.generateAndStoreImage.mockResolvedValue(record(5));
    const retried = await generateImage(input(5));

    expect(retried.id).toBe("img-5");
    expect(mocks.generateAndStoreImage).toHaveBeenCalledTimes(1);
  }, 30_000);
});
