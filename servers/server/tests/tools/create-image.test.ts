import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as AiAssetLibrary from "@/mastra/services/ai-asset-library";

const mocks = vi.hoisted(() => ({ generateImage: vi.fn(), addAiAsset: vi.fn() }));

vi.mock("@/queue/image-client", () => ({ generateImage: mocks.generateImage }));
vi.mock("@/mastra/services/ai-asset-library", async (importOriginal) => ({
  ...(await importOriginal<typeof AiAssetLibrary>()),
  addAiAsset: mocks.addAiAsset
}));

import { TOOL_IMAGES_FIELD } from "@/mastra/provider/image-middleware";
import { createImageTool } from "@/mastra/tools/create-image";

const execute = createImageTool.execute as unknown as (
  input: Record<string, unknown>
) => Promise<Record<string, unknown>>;

const run = (input: Record<string, unknown> = {}) =>
  execute({ screenId: "5_1", prompt: "画一张大屏背景", width: 1920, height: 1080, ...input });

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
  it("带 imagesForModel，url 与返回的图一致，label 写明尺寸", async () => {
    const result = await run();

    expect(result).toMatchObject({ id: "img-1", url: record().url, reused: false });
    expect(result[TOOL_IMAGES_FIELD]).toEqual([{ url: record().url, label: "生成的图片 1920×1080" }]);
  });

  it("命中缓存的旧图在 label 里标明", async () => {
    mocks.generateImage.mockResolvedValue(record({ reused: true }));

    const result = await run();

    expect((result[TOOL_IMAGES_FIELD] as Array<{ label: string }>)[0].label).toContain("命中缓存");
  });

  it("前端预览用的顶层 url 保持不变", async () => {
    const result = await run();

    expect(result.url).toBe(record().url);
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
    expect(result).toMatchObject({ url: record().url, libraryFileId: 100 });
  });

  it("没给素材名时取提示词开头", async () => {
    await run({ prompt: "深蓝色卡片底板，无文字" });

    expect(mocks.addAiAsset.mock.calls[0][0].name).toBe("深蓝色卡片底板，无文字");
  });

  it("放进素材库失败时图照样返回，原因写进 note", async () => {
    mocks.addAiAsset.mockRejectedValue(new Error("大屏 5 不存在，生成的图没有放进素材库"));

    const result = await run();

    expect(result).toMatchObject({ url: record().url, note: expect.stringContaining("大屏 5 不存在") });
    expect(result).not.toHaveProperty("libraryFileId");
  });

  it("screenId 格式不对时不去查库，直接说明", async () => {
    const result = await run({ screenId: "abc" });

    expect(mocks.addAiAsset).not.toHaveBeenCalled();
    expect(result.note).toContain("screenId 格式不对");
  });
});
