import { beforeEach, describe, expect, it, vi } from "vitest";

// image-jobs 只用 computePromptHash 这个纯函数；其余依赖（prisma / storage / 模型注册表）整体 mock 掉
vi.mock("@/mastra/storage/prisma", () => ({ prismaClient: {} }));
vi.mock("@/lib/storage", () => ({ assetStore: () => ({}) }));
vi.mock("@/mastra/provider/model-registry", () => ({
  getModelConfigSync: () => ({ modelId: "m" }),
  warmModelConfigs: vi.fn()
}));

import { ImageJobDataSchema, imageJobId, toImageRecord } from "@/queue/image-jobs";

const base = { prompt: "一张大屏效果图", seed: 42, width: 1920, height: 1080 };

describe("imageJobId", () => {
  it("同一份输入 + 同一个模型 → 同一个 id（队列据此合并重复任务）", () => {
    expect(imageJobId(base, "seedream")).toBe(imageJobId({ ...base }, "seedream"));
  });

  it.each([
    ["prompt", { prompt: "另一张" }],
    ["seed", { seed: 43 }],
    ["参考图", { seedImageUrls: ["http://x/blobs/a.png"] }]
  ])("%s 变了 id 就变（不能把不同的图合并成一个任务）", (_label, patch) => {
    expect(imageJobId({ ...base, ...patch }, "seedream")).not.toBe(imageJobId(base, "seedream"));
  });

  it("换模型 id 就变：改了生图模型后不会命中旧模型的结果", () => {
    expect(imageJobId(base, "model-a")).not.toBe(imageJobId(base, "model-b"));
  });

  it("id 与生图服务落库用的 promptHash 一致，两边的幂等口径是同一个", async () => {
    const { computePromptHash } = await import("@/mastra/services/image-generation.server");
    expect(imageJobId(base, "m")).toBe(computePromptHash(base.prompt, base.seed, "m", undefined));
  });
});

describe("ImageJobDataSchema", () => {
  beforeEach(() => vi.clearAllMocks());

  it("接受合法数据（参考图可选）", () => {
    expect(ImageJobDataSchema.parse(base)).toEqual(base);
    expect(ImageJobDataSchema.parse({ ...base, seedImageUrls: ["u"] }).seedImageUrls).toEqual(["u"]);
  });

  it.each([
    ["空 prompt", { prompt: "" }],
    ["非整数 seed", { seed: 1.5 }],
    ["负宽度", { width: -1 }],
    ["缺高度", { height: undefined }]
  ])("拒绝非法数据：%s", (_label, patch) => {
    expect(() => ImageJobDataSchema.parse({ ...base, ...patch })).toThrow();
  });
});

describe("toImageRecord", () => {
  it("只保留声明字段，Prisma 行里多出来的 Date 不会带进队列返回值", () => {
    const row = {
      id: "1",
      promptHash: "h",
      prompt: "p",
      model: "m",
      seed: 1,
      width: 10,
      height: 20,
      url: "u",
      reused: false,
      createdTime: new Date()
    };
    const out = toImageRecord(row);
    expect(out).not.toHaveProperty("createdTime");
    expect(Object.keys(out).sort()).toEqual(
      ["height", "id", "model", "prompt", "promptHash", "reused", "seed", "url", "width"].sort()
    );
  });
});
