import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as AiAssetLibrary from "@/mastra/services/ai-asset-library";

const mocks = vi.hoisted(() => ({ generateImage: vi.fn(), generateVideo: vi.fn(), addAiAsset: vi.fn() }));

vi.mock("@/queue/image-client", () => ({ generateImage: mocks.generateImage }));
vi.mock("@/queue/video-client", () => ({ generateVideo: mocks.generateVideo }));
vi.mock("@/mastra/services/ai-asset-library", async (importOriginal) => ({
  ...(await importOriginal<typeof AiAssetLibrary>()),
  addAiAsset: mocks.addAiAsset
}));

import { getGenerationProgress, resetProgressForTest } from "@/mastra/services/generation-progress";
import { createImageTool } from "@/mastra/tools/create-image";
import { createVideoTool } from "@/mastra/tools/create-video";

type Execute = (input: Record<string, unknown>, context?: unknown) => Promise<unknown>;
const runImage = createImageTool.execute as unknown as Execute;
const runVideo = createVideoTool.execute as unknown as Execute;

const imageInput = { screenId: "5_1", images: [{ prompt: "背景", width: 1920, height: 1080 }] };
const batchInput = {
  screenId: "5_1",
  images: [
    { prompt: "a", width: 1920, height: 1080 },
    { prompt: "b", width: 1920, height: 1080 }
  ]
};
const videoInput = { screenId: "5_1", prompt: "云流动", durationSec: 5, resolution: "768P", ratio: "16:9" };
const withToolCall = (toolCallId: string) => ({ agent: { toolCallId } });

const imageRecord = { id: "img-1", url: "http://x/a.png", width: 1920, height: 1080, reused: false };
const videoRecord = { id: "vid-1", url: "http://x/a.mp4", reused: false };

beforeEach(() => {
  vi.clearAllMocks();
  resetProgressForTest();
  mocks.addAiAsset.mockResolvedValue({ id: 1, reused: false });
});

/**
 * 进度按 toolCallId 登记，前端据此轮询。前台执行和 Mastra 后台任务执行的是同一个 execute，
 * 所以只要 execute 里接好，两条路径一次就都有进度——这里钉住这件事。
 */
describe("createImageTool 的进度", () => {
  it("执行期间能按 toolCallId 查到生成服务上报的进度，成功后记为完成", async () => {
    let during: ReturnType<typeof getGenerationProgress> = null;
    mocks.generateImage.mockImplementation(async (_input, options) => {
      options.onProgress(75);
      during = getGenerationProgress("call_img");
      return imageRecord;
    });

    await runImage(imageInput, withToolCall("call_img"));

    expect(during).toMatchObject({ kind: "image", status: "running", percent: 75, stage: "转存中" });
    expect(getGenerationProgress("call_img")).toMatchObject({ status: "done", percent: 100 });
  });

  it("生成失败时记为失败并带上原因，错误照样抛给 agent", async () => {
    mocks.generateImage.mockRejectedValue(new Error("请求失败 503"));

    await expect(runImage(imageInput, withToolCall("call_img"))).rejects.toThrow("请求失败 503");

    expect(getGenerationProgress("call_img")).toMatchObject({ status: "failed", error: "请求失败 503" });
  });

  it("一批图的进度取各张的平均值：一张还在排队，整批就不会显示成快完了", async () => {
    const seen: number[] = [];
    mocks.generateImage.mockImplementation(async (input, options) => {
      options.onProgress(input.prompt === "a" ? 80 : 20);
      seen.push(getGenerationProgress("call_img")!.percent);
      return imageRecord;
    });

    await runImage(batchInput, withToolCall("call_img"));

    // a 报 80、b 还是 0 → 40；b 再报 20 → (80+20)/2 = 50
    expect(seen).toEqual([40, 50]);
  });

  it("完成后进度带上整批图的地址，卡片靠它出图", async () => {
    mocks.generateImage.mockImplementation(async (input) => ({ ...imageRecord, url: `http://x/${input.prompt}.png` }));

    await runImage(batchInput, withToolCall("call_img"));

    expect(getGenerationProgress("call_img")).toMatchObject({
      status: "done",
      urls: ["http://x/a.png", "http://x/b.png"]
    });
  });

  it("没有 toolCallId（直接调用）时照常生成，不登记进度", async () => {
    mocks.generateImage.mockResolvedValue(imageRecord);

    await expect(runImage(imageInput)).resolves.toMatchObject({ images: [{ id: "img-1" }] });
    expect(getGenerationProgress("undefined")).toBeNull();
  });
});

describe("createVideoTool 的进度", () => {
  it("执行期间能按 toolCallId 查到进度，成功后记为完成", async () => {
    let during: ReturnType<typeof getGenerationProgress> = null;
    mocks.generateVideo.mockImplementation(async (_input, options) => {
      options.onProgress(40);
      during = getGenerationProgress("call_vid");
      return videoRecord;
    });

    await runVideo(videoInput, withToolCall("call_vid"));

    expect(during).toMatchObject({ kind: "video", status: "running", percent: 40, stage: "生成中" });
    expect(getGenerationProgress("call_vid")).toMatchObject({ status: "done" });
  });

  it("生成失败时记为失败并带上原因", async () => {
    mocks.generateVideo.mockRejectedValue(new Error("内容审核未通过"));

    await expect(runVideo(videoInput, withToolCall("call_vid"))).rejects.toThrow("内容审核未通过");

    expect(getGenerationProgress("call_vid")).toMatchObject({ status: "failed", error: "内容审核未通过" });
  });
});
