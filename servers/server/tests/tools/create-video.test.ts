import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as AiAssetLibrary from "@/mastra/services/ai-assets/ai-asset-library";

const mocks = vi.hoisted(() => ({ generateVideo: vi.fn(), addAiAsset: vi.fn() }));

vi.mock("@/queue/video-client", () => ({ generateVideo: mocks.generateVideo }));
vi.mock("@/mastra/services/ai-assets/ai-asset-library", async (importOriginal) => ({
  ...(await importOriginal<typeof AiAssetLibrary>()),
  addAiAsset: mocks.addAiAsset
}));

import { createVideoInputSchema, createVideoTool } from "@/mastra/tools/create-video";

const execute = createVideoTool.execute as unknown as (
  input: Record<string, unknown>
) => Promise<Record<string, unknown>>;
const run = (input: Record<string, unknown> = {}) =>
  execute({
    screenId: "5_1",
    prompt: "云层缓缓流动，镜头固定",
    durationSec: 5,
    resolution: "768P",
    ratio: "16:9",
    ...input
  });

const record = (overrides: Record<string, unknown> = {}) => ({
  id: "vid-1",
  url: "http://localhost:4111/blobs/generated-videos/h.mp4",
  reused: false,
  ...overrides
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.generateVideo.mockResolvedValue(record());
  mocks.addAiAsset.mockResolvedValue({ id: 200, reused: false });
});

describe("createVideoTool 的入参", () => {
  it("支持尾帧、首尾帧和多模态参考，拒绝混用及空白提示词", () => {
    const base = { screenId: "5_1", prompt: "p" };
    expect(createVideoInputSchema.safeParse({ ...base, lastFrameImage: "http://store/last.png" }).success).toBe(true);
    expect(
      createVideoInputSchema.safeParse({
        ...base,
        firstFrameImage: "http://store/first.png",
        lastFrameImage: "http://store/last.png"
      }).success
    ).toBe(true);
    expect(
      createVideoInputSchema.safeParse({
        ...base,
        referenceImages: ["http://store/ref.png"],
        referenceVideos: ["http://public.example/ref.mp4"],
        referenceAudios: ["http://public.example/ref.mp3"]
      }).success
    ).toBe(true);
    for (const field of ["referenceImages", "referenceVideos", "referenceAudios"]) {
      expect(
        createVideoInputSchema.safeParse({
          ...base,
          lastFrameImage: "http://store/last.png",
          [field]: ["http://public.example/ref"]
        }).success
      ).toBe(false);
    }
    expect(createVideoInputSchema.safeParse({ ...base, prompt: "  " }).success).toBe(false);
  });
  const schema = createVideoInputSchema;

  it("时长、分辨率、画幅有默认值：5 秒 768P 16:9", () => {
    expect(schema.parse({ screenId: "5_1", prompt: "p" })).toMatchObject({
      durationSec: 5,
      resolution: "768P",
      ratio: "16:9"
    });
  });

  it.each([
    ["时长太短", { durationSec: 2 }],
    ["时长太长", { durationSec: 30 }],
    ["不认识的分辨率", { resolution: "4k" }]
  ])("拒绝：%s", (_label, patch) => {
    expect(schema.safeParse({ screenId: "5_1", prompt: "p", ...patch }).success).toBe(false);
  });
});

describe("createVideoTool 的执行", () => {
  it("多模态参考完整传给生成服务，并记录素材库引用", async () => {
    await run({
      referenceImages: ["http://store/ref.png"],
      referenceVideos: ["http://public.example/ref.mp4"],
      referenceAudios: ["http://public.example/ref.mp3"]
    });
    expect(mocks.generateVideo.mock.calls[0][0]).toMatchObject({
      referenceImageUrls: ["http://store/ref.png"],
      referenceVideoUrls: ["http://public.example/ref.mp4"],
      referenceAudioUrls: ["http://public.example/ref.mp3"]
    });
    expect(mocks.addAiAsset.mock.calls[0][0].referenceUrls).toEqual([
      "http://store/ref.png",
      "http://public.example/ref.mp4",
      "http://public.example/ref.mp3"
    ]);
  });
  it("把参数交给视频生成，首帧图带过去", async () => {
    await run({ firstFrameImage: "http://store/a.png" });

    expect(mocks.generateVideo).toHaveBeenCalledWith(
      {
        prompt: "云层缓缓流动，镜头固定",
        durationSec: 5,
        resolution: "768P",
        ratio: "16:9",
        firstFrameUrl: "http://store/a.png"
      },
      { onProgress: expect.any(Function) }
    );
  });

  it("文生视频不带首帧", async () => {
    await run();

    expect(mocks.generateVideo.mock.calls[0][0].firstFrameUrl).toBeUndefined();
  });

  it("视频按「视频」类型、带着首帧作为参考，放进素材库，返回素材 id", async () => {
    const result = await run({ name: "流光背景", firstFrameImage: "http://store/a.png" });

    expect(mocks.addAiAsset).toHaveBeenCalledWith({
      largeId: 5,
      name: "流光背景",
      url: record().url,
      resourceType: 2,
      referenceUrls: ["http://store/a.png"]
    });
    expect(result).toEqual({ id: "vid-1", url: record().url, reused: false, libraryFileId: 200 });
  });

  it("没给素材名时取提示词开头；文生视频没有参考图", async () => {
    await run({ prompt: "深蓝科技感流光背景，循环" });

    const asset = mocks.addAiAsset.mock.calls[0][0];
    expect(asset.name).toBe("深蓝科技感流光背景，循环");
    expect(asset.referenceUrls).toBeUndefined();
  });

  it("放进素材库失败时视频照样返回，原因写进 note", async () => {
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

  it("生成失败时错误原样抛出，不写素材库", async () => {
    mocks.generateVideo.mockRejectedValue(new Error("视频生成任务failed：内容审核未通过"));

    await expect(run()).rejects.toThrow("内容审核未通过");
    expect(mocks.addAiAsset).not.toHaveBeenCalled();
  });
});
