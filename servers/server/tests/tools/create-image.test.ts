import { beforeEach, describe, expect, it, vi } from "vitest";

const queueMocks = vi.hoisted(() => ({ generateImage: vi.fn() }));

vi.mock("@/queue/image-client", () => ({ generateImage: queueMocks.generateImage }));

import { TOOL_IMAGES_FIELD } from "@/mastra/provider/image-middleware";
import { createImageTool } from "@/mastra/tools/create-image";

const execute = createImageTool.execute as unknown as (
  input: Record<string, unknown>
) => Promise<Record<string, unknown>>;

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

/**
 * 生图结果必须带 imagesForModel：tool 消息带不了图，只有写进这个约定字段，
 * inlineImagesMiddleware 才会在这批 tool 消息之后补一条 user 图片消息——否则模型只拿到一串 url，
 * 看不见自己刚生成的图，没法自检，也没法接着用它做下一步。
 */
describe("createImageTool 的结果", () => {
  beforeEach(() => {
    queueMocks.generateImage.mockReset();
  });

  it("带 imagesForModel，url 与返回的图一致，label 写明尺寸", async () => {
    queueMocks.generateImage.mockResolvedValue(record());

    const result = await execute({ prompt: "画一张大屏背景", width: 1920, height: 1080 });

    expect(result).toMatchObject({ id: "img-1", url: record().url, reused: false });
    expect(result[TOOL_IMAGES_FIELD]).toEqual([{ url: record().url, label: "生成的图片 1920×1080" }]);
  });

  it("命中缓存的旧图在 label 里标明", async () => {
    queueMocks.generateImage.mockResolvedValue(record({ reused: true }));

    const result = await execute({ prompt: "p", width: 1920, height: 1080 });

    expect((result[TOOL_IMAGES_FIELD] as Array<{ label: string }>)[0].label).toContain("命中缓存");
  });

  it("前端预览用的顶层 url 保持不变", async () => {
    queueMocks.generateImage.mockResolvedValue(record());

    const result = await execute({ prompt: "p", width: 1920, height: 1080 });

    expect(result.url).toBe(record().url);
  });
});
