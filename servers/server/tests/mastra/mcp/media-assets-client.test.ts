import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ Client: vi.fn(), listTools: vi.fn(), disconnect: vi.fn() }));
vi.mock("@mastra/mcp", () => ({ MCPClient: mocks.Client }));

import {
  callMediaAssetsTool,
  closeMediaAssetsMcp,
  getMediaAssetsTools,
  unpackMediaAssetsResult
} from "@/mastra/mcp/media-assets/client";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("MEDIA_ASSETS_MCP_URL", "http://127.0.0.1:8766/mcp");
  vi.stubEnv("MEDIA_ASSETS_MCP_TOKEN", "test-service-token");
  mocks.disconnect.mockResolvedValue(undefined);
  mocks.Client.mockImplementation(function () {
    return { listTools: mocks.listTools, disconnect: mocks.disconnect };
  });
});
afterEach(async () => {
  await closeMediaAssetsMcp();
  vi.unstubAllEnvs();
});

describe("Mastra 素材 MCP 客户端", () => {
  it("按需连接，配置鉴权，并发调用共用同一次发现", async () => {
    mocks.listTools.mockResolvedValue({});
    expect(mocks.Client).not.toHaveBeenCalled();
    await Promise.all([getMediaAssetsTools(), getMediaAssetsTools()]);
    expect(mocks.Client).toHaveBeenCalledTimes(1);
    expect(mocks.listTools).toHaveBeenCalledTimes(1);
    expect(mocks.Client.mock.calls[0][0].servers.mediaAssets.requestInit.headers).toEqual({
      Authorization: "Bearer test-service-token"
    });
  });

  it("通过发现到的 Mastra 工具执行调用，并解析结构化结果", async () => {
    const execute = vi.fn().mockResolvedValue({ structuredContent: { task_id: "task-1", status: "completed" } });
    mocks.listTools.mockResolvedValue({ mediaAssets_get_asset_task: { execute } });
    expect(await callMediaAssetsTool("get_asset_task", { task_id: "task-1" })).toEqual({
      task_id: "task-1",
      status: "completed"
    });
    expect(execute).toHaveBeenCalledWith({ task_id: "task-1" }, {});
  });

  it("连接失败后下次允许重新连接", async () => {
    mocks.listTools.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({});
    await expect(getMediaAssetsTools()).rejects.toThrow("offline");
    await expect(getMediaAssetsTools()).resolves.toEqual({});
    expect(mocks.listTools).toHaveBeenCalledTimes(2);
  });

  it("未配置时明确提示，JSON 文本与 MCP 错误响应正确处理", () => {
    vi.stubEnv("MEDIA_ASSETS_MCP_TOKEN", "");
    expect(() => getMediaAssetsTools()).toThrow("MEDIA_ASSETS_MCP_TOKEN");
    expect(unpackMediaAssetsResult({ content: [{ type: "text", text: '{"task_id":"1"}' }] })).toEqual({ task_id: "1" });
    expect(() => unpackMediaAssetsResult({ isError: true, content: [{ type: "text", text: "not found" }] })).toThrow(
      "not found"
    );
  });
});
