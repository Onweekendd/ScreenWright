import { RequestContext } from "@mastra/core/request-context";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as AiAssetLibrary from "@/mastra/services/ai-assets/ai-asset-library";

const mocks = vi.hoisted(() => ({ generateImage: vi.fn(), addAiAsset: vi.fn() }));

vi.mock("@/queue/image/image-client", () => ({ generateImage: mocks.generateImage }));
vi.mock("@/mastra/services/ai-assets/ai-asset-library", async (importOriginal) => ({
  ...(await importOriginal<typeof AiAssetLibrary>()),
  addAiAsset: mocks.addAiAsset
}));

import { TOOL_IMAGES_FIELD } from "@/mastra/provider/image-middleware";
import { createImageInputSchema, createImageTool, MAX_BATCH_IMAGES } from "@/mastra/tools/create-image";

interface Result {
  images: Array<Record<string, unknown>>;
  [TOOL_IMAGES_FIELD]?: Array<{ url: string; label: string }>;
}

const execute = createImageTool.execute as unknown as (
  input: Record<string, unknown>,
  context?: { requestContext?: RequestContext }
) => Promise<Result>;

const item = (overrides: Record<string, unknown> = {}) => ({
  prompt: "画一张大屏背景",
  width: 1920,
  height: 1080,
  ...overrides
});

/** 单张就是 images 里只放一项 */
const run = (itemOverrides: Record<string, unknown> = {}, input: Record<string, unknown> = {}) =>
  execute({ screenId: "5_1", images: [item(itemOverrides)], ...input });

const record = (overrides: Record<string, unknown> = {}) => ({
  id: "img-1",
  promptHash: "h",
  prompt: "p",
  model: "m",
  seed: 1,
  width: 1920,
  height: 1080,
  url: "http://localhost:4111/blobs/generated-images/h.png",
  reused: false,
  ...overrides
});

/** 按提示词区分每张图的 id / url */
const recordByPrompt = (input: { prompt: string }) => record({ id: input.prompt, url: `http://x/${input.prompt}.png` });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.generateImage.mockResolvedValue(record());
  mocks.addAiAsset.mockResolvedValue({ id: 100, reused: false });
});

/**
 * 生图结果必须带 imagesForModel：tool 消息带不了图，只有写进这个约定字段，
 * inlineImagesMiddleware 才会在这批 tool 消息之后补一条 user 图片消息——否则模型只拿到一串 url，
 * 看不见自己刚生成的图，没法自检，也没法接着用它做下一步。
 */
describe("createImageTool 的结果", () => {
  it("每张一项，带 id / url / 素材 id；imagesForModel 里 label 写明序号、素材名和尺寸", async () => {
    const result = await run({ name: "背景" });

    expect(result.images).toEqual([
      { index: 0, name: "背景", id: "img-1", url: record().url, reused: false, libraryFileId: 100 }
    ]);
    expect(result[TOOL_IMAGES_FIELD]).toEqual([{ url: record().url, label: "[1] 背景：生成的图片 1920×1080" }]);
  });

  it("命中缓存的旧图在 label 里标明", async () => {
    mocks.generateImage.mockResolvedValue(record({ reused: true }));

    const result = await run();

    expect(result[TOOL_IMAGES_FIELD]![0].label).toContain("命中缓存");
  });
});

describe("createImageTool 一次生成一批", () => {
  it("对话选了生图配置时，同一批每张都带上这个配置 id；没选时不带", async () => {
    mocks.generateImage.mockImplementation(async (input) => recordByPrompt(input));
    const images = [item({ prompt: "a" }), item({ prompt: "b" })];

    await execute(
      { screenId: "5_1", images },
      { requestContext: new RequestContext([["models", { image: "cfg_i", video: "cfg_v" }]]) }
    );
    await execute({ screenId: "5_1", images: [item({ prompt: "c" })] });

    const ids = mocks.generateImage.mock.calls.map(([input]) => input.modelConfigId);
    expect(ids).toEqual(["cfg_i", "cfg_i", undefined]);
  });

  it("每张图各自的提示词、尺寸、参考图都带到生成服务", async () => {
    mocks.generateImage.mockImplementation(async (input) => recordByPrompt(input));

    await execute({
      screenId: "5_1",
      images: [
        item({ prompt: "背景", width: 2048, height: 1152 }),
        item({ prompt: "底板", width: 1408, height: 640, seedImages: ["http://store/ref.png"] })
      ]
    });

    expect(mocks.generateImage).toHaveBeenCalledTimes(2);
    expect(mocks.generateImage.mock.calls[0][0]).toMatchObject({ prompt: "背景", width: 2048, height: 1152 });
    expect(mocks.generateImage.mock.calls[1][0]).toMatchObject({
      prompt: "底板",
      width: 1408,
      height: 640,
      seedImageUrls: ["http://store/ref.png"]
    });
  });

  it("同时开始生成，不是一张等一张", async () => {
    let started = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    mocks.generateImage.mockImplementation(async () => {
      started += 1;
      await gate;
      return record();
    });

    const pending = execute({
      screenId: "5_1",
      images: [item({ prompt: "a" }), item({ prompt: "b" }), item({ prompt: "c" })]
    });
    await vi.waitFor(() => expect(started).toBe(3));
    release();

    await expect(pending).resolves.toBeDefined();
  });

  it("结果按入参顺序，每张的素材 id 各自对应", async () => {
    mocks.generateImage.mockImplementation(async (input) => recordByPrompt(input));
    mocks.addAiAsset.mockImplementation(async ({ generatedImageId }) => ({ id: generatedImageId === "a" ? 1 : 2 }));

    const result = await execute({ screenId: "5_1", images: [item({ prompt: "a" }), item({ prompt: "b" })] });

    expect(result.images.map((image) => [image.index, image.url, image.libraryFileId])).toEqual([
      [0, "http://x/a.png", 1],
      [1, "http://x/b.png", 2]
    ]);
    expect(result[TOOL_IMAGES_FIELD]!.map((image) => image.url)).toEqual(["http://x/a.png", "http://x/b.png"]);
  });

  it("部分失败：成功的照常返回，失败的那张写明原因，不连累其他张", async () => {
    mocks.generateImage.mockImplementation(async (input) => {
      if (input.prompt === "b") {
        throw new Error("内容审核未通过");
      }
      return recordByPrompt(input);
    });

    const result = await execute({
      screenId: "5_1",
      images: [item({ prompt: "a" }), item({ prompt: "b", name: "标题底图" }), item({ prompt: "c" })]
    });

    expect(result.images[1]).toEqual({ index: 1, name: "标题底图", error: "内容审核未通过" });
    expect(result.images[0].url).toBe("http://x/a.png");
    expect(result.images[2].url).toBe("http://x/c.png");
    expect(result[TOOL_IMAGES_FIELD]).toHaveLength(2);
  });

  it("全部失败才算工具失败，错误里写出每张的原因", async () => {
    mocks.generateImage.mockRejectedValue(new Error("网关 503"));

    await expect(
      execute({ screenId: "5_1", images: [item({ name: "背景" }), item({ name: "底板" })] })
    ).rejects.toThrow("2 张全部生成失败：[1] 背景：网关 503；[2] 底板：网关 503");
  });

  it("只有一张且失败时，错误原样抛出，不包「全部失败」", async () => {
    mocks.generateImage.mockRejectedValue(new Error("网关 503"));

    await expect(run()).rejects.toThrow(/^网关 503$/);
  });

  it(`入参最多 ${MAX_BATCH_IMAGES} 张、至少 1 张`, () => {
    const schema = createImageInputSchema;
    const many = (n: number) => ({ screenId: "5_1", images: Array.from({ length: n }, () => item()) });

    expect(schema.safeParse(many(MAX_BATCH_IMAGES)).success).toBe(true);
    expect(schema.safeParse(many(MAX_BATCH_IMAGES + 1)).success).toBe(false);
    expect(schema.safeParse(many(0)).success).toBe(false);
  });

  it("尺寸不写时默认 1920×1080", () => {
    const parsed = createImageInputSchema.parse({ screenId: "5_1", images: [{ prompt: "x" }] }) as {
      images: Array<{ width: number; height: number }>;
    };

    expect(parsed.images[0]).toMatchObject({ width: 1920, height: 1080 });
  });
});

describe("createImageTool 放进素材库", () => {
  it("生成的图带着大屏、素材名、生成记录和参考图放进素材库，返回素材 id", async () => {
    const result = await run({ name: "卡片底板", seedImages: ["http://store/ref.png"] });

    expect(mocks.addAiAsset).toHaveBeenCalledWith({
      largeId: 5,
      name: "卡片底板",
      url: record().url,
      generatedImageId: "img-1",
      referenceUrls: ["http://store/ref.png"]
    });
    expect(result.images[0]).toMatchObject({ url: record().url, libraryFileId: 100 });
  });

  it("没给素材名时取提示词开头", async () => {
    await run({ prompt: "深蓝色卡片底板，无文字" });

    expect(mocks.addAiAsset.mock.calls[0][0].name).toBe("深蓝色卡片底板，无文字");
  });

  it("放进素材库失败时图照样返回，原因写进 note", async () => {
    mocks.addAiAsset.mockRejectedValue(new Error("大屏 5 不存在，生成的图没有放进素材库"));

    const result = await run();

    expect(result.images[0]).toMatchObject({ url: record().url, note: expect.stringContaining("大屏 5 不存在") });
    expect(result.images[0]).not.toHaveProperty("libraryFileId");
  });

  it("screenId 格式不对时不去查库，直接说明", async () => {
    const result = await run({}, { screenId: "abc" });

    expect(mocks.addAiAsset).not.toHaveBeenCalled();
    expect(result.images[0].note).toContain("screenId 格式不对");
  });
});
