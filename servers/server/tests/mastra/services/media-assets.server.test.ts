import { createHash } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type * as AssetLibrary from "@/mastra/services/ai-asset-library";

const mocks = vi.hoisted(() => ({ call: vi.fn(), save: vi.fn(), fetch: vi.fn() }));
vi.mock("@/mastra/mcp/media-assets/client", () => ({ callMediaAssetsTool: mocks.call }));
vi.mock("@/mastra/services/ai-asset-library", async (original) => ({
  ...(await original<typeof AssetLibrary>()),
  addWorkspaceAsset: mocks.save
}));

import { importMediaAssets, searchMediaAssets } from "@/mastra/services/media-assets.server";

const bytes = Buffer.from("downloaded-video");
const asset = {
  asset_id: "asset-1",
  type: "video",
  url: "http://127.0.0.1:9002/creative-assets/a.mp4?signature=fresh",
  content_type: "video/mp4",
  title: "草原",
  author: "作者",
  source_url: "https://example.com/source",
  sha256: createHash("sha256").update(bytes).digest("hex"),
  width: 1080,
  height: 1920,
  duration_ms: 13813
};
const task = { task_id: "task-1", status: "completed", stage: "completed", assets: [asset] };
const input = {
  screenId: "10_1",
  query: "草原约13秒",
  kind: "video" as const,
  count: 1,
  minShortSide: 1080,
  maxDurationSeconds: 30
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.call.mockResolvedValue(task);
  mocks.fetch.mockImplementation(async () => new Response(bytes, { headers: { "content-type": "video/mp4" } }));
  mocks.save.mockResolvedValue({ id: 123, url: "http://platform/blobs/stable.mp4", size: bytes.length, reused: false });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("联网素材转存", () => {
  it("刷新任务下载地址，校验内容，转存并加入联网素材分组，保留来源信息", async () => {
    const result = await importMediaAssets("task-1", "10_1");
    expect(mocks.call).toHaveBeenCalledWith("get_asset_task", { task_id: "task-1" });
    expect(mocks.fetch.mock.calls[0][1]).not.toHaveProperty("headers");
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        largeId: 10,
        name: "草原",
        bytes,
        groupName: "联网素材",
        resourceType: 2,
        extension: ".mp4"
      })
    );
    expect(result.assets[0]).toMatchObject({
      url: "http://platform/blobs/stable.mp4",
      libraryFileId: 123,
      sourceUrl: asset.source_url,
      author: "作者",
      durationMs: 13813
    });
    expect(JSON.stringify(result)).not.toContain("signature=fresh");
  });

  it("搜索通过 MCP 创建任务，等待结束后自动导入", async () => {
    vi.useFakeTimers();
    mocks.call.mockResolvedValueOnce({ task_id: "task-1", status: "queued", assets: null }).mockResolvedValueOnce(task);
    const result = searchMediaAssets(input, "request-1");
    await vi.advanceTimersByTimeAsync(4000);
    expect((await result).assets).toHaveLength(1);
    expect(mocks.call.mock.calls[0]).toEqual([
      "create_asset_task",
      expect.objectContaining({
        project_id: "screen_10_1",
        request_id: "request-1",
        query: input.query,
        kind: "video",
        max_duration_seconds: 30
      })
    ]);
  });

  it("哈希不匹配时不入库，并提供同任务重试提示", async () => {
    mocks.fetch.mockResolvedValueOnce(new Response("wrong bytes"));
    const result = await importMediaAssets("task-1", "10_1");
    expect(result.assets).toEqual([]);
    expect(result.errors[0]).toContain("SHA256");
    expect(mocks.save).not.toHaveBeenCalled();
    expect(result.note).toContain("重试");
  });

  it("超限文件不下载；部分失败保留成功素材", async () => {
    mocks.call.mockResolvedValueOnce({
      ...task,
      status: "partial",
      assets: [{ ...asset, asset_id: "large", bytes: 51 * 1024 * 1024 }, asset]
    });
    const result = await importMediaAssets("task-1", "10_1");
    expect(result.assets).toHaveLength(1);
    expect(result.errors[0]).toContain("50 MB");
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });

  it("需要人工验证时明确返回，不冒充成功或重新搜索", async () => {
    mocks.call.mockResolvedValueOnce({ task_id: "task-1", status: "input_required", assets: [] });
    const result = await importMediaAssets("task-1", "10_1");
    expect(result.status).toBe("input_required");
    expect(result.note).toContain("登录");
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("图片转存后附 imagesForModel，使主模型能看图", async () => {
    mocks.call.mockResolvedValueOnce({ ...task, assets: [{ ...asset, type: "image", content_type: "image/png" }] });
    mocks.save.mockResolvedValueOnce({ id: 124, url: "http://platform/blobs/stable.png", reused: false });
    const result = await importMediaAssets("task-1", "10_1");
    expect(result.imagesForModel).toEqual([{ url: "http://platform/blobs/stable.png", label: "草原" }]);
  });
});
