import { describe, expect, it, vi } from "vitest";

vi.mock("@/mastra/provider/model-registry", () => ({
  getModelConfigSync: vi.fn(),
  DEFAULT_VIDEO_MODEL: "MiniMax-H3"
}));

import { getModelConfigSync } from "@/mastra/provider/model-registry";
import {
  buildSubmitRequest,
  DEFAULT_VIDEO_MODEL,
  getVideoConfig,
  parseSubmitResponse,
  parseTaskResponse,
  resolveVideoConfig,
  tasksEndpoint,
  taskUrl
} from "@/mastra/services/video-provider";

const config = { baseUrl: "https://llm-api.net/minimax/v2", apiKey: "k", modelId: "MiniMax-H3" };
const params = { prompt: "云层流动", durationSec: 5, resolution: "768P", ratio: "16:9" } as const;

describe("resolveVideoConfig", () => {
  it("视频模型 ID 留空时使用默认型号", () => {
    expect(resolveVideoConfig({ ...config, modelId: " " })).toEqual({
      ...config,
      modelId: DEFAULT_VIDEO_MODEL
    });
  });

  it("保留独立视频地址的端口和路径，只去掉首尾空格与结尾斜杠", () => {
    expect(resolveVideoConfig({ ...config, baseUrl: " http://gw.local:8080/api/v3/ " }).baseUrl).toBe(
      "http://gw.local:8080/api/v3"
    );
  });

  it("运行时只读取 video 角色，使用独立地址、密钥和型号", () => {
    vi.mocked(getModelConfigSync).mockReturnValue({
      role: "video",
      ...config,
      contextLength: null,
      dimensions: null
    });
    expect(getVideoConfig()).toEqual(config);
    expect(getModelConfigSync).toHaveBeenCalledWith("video");
    expect(getModelConfigSync).not.toHaveBeenCalledWith("image");
  });

  it("视频没配地址 / 密钥时引导用户配置生视频模型", () => {
    expect(() => resolveVideoConfig({ ...config, baseUrl: " " })).toThrow("生视频模型的 Base URL");
    expect(() => resolveVideoConfig({ ...config, apiKey: " " })).toThrow("生视频模型的 API Key");
  });
});

describe("buildSubmitRequest", () => {
  it("文生视频：只有一段文本；时长、分辨率、比例用 JSON 字段，不拼在提示词后面", () => {
    const request = buildSubmitRequest(config, params);
    const body = JSON.parse(request.body);

    expect(request.url).toBe("https://llm-api.net/minimax/v2/video_generation");
    expect(request.headers.Authorization).toBe("Bearer k");
    expect(body).toEqual({
      model: "MiniMax-H3",
      content: [{ type: "text", text: "云层流动" }],
      resolution: "768P",
      ratio: "16:9",
      duration: 5,
      aigc_watermark: false
    });
  });

  it("图生视频：首帧作为 role=first_frame 的 image_url 跟在文本后面", () => {
    const body = JSON.parse(buildSubmitRequest(config, { ...params, firstFrame: "data:image/jpeg;base64,AAA" }).body);

    expect(body.content).toEqual([
      { type: "text", text: "云层流动" },
      { type: "image_url", image_url: { url: "data:image/jpeg;base64,AAA" }, role: "first_frame" }
    ]);
    expect(body.ratio).toBe("adaptive");
  });

  it("发送前校验 H3 和 H3-Max 各自支持的分辨率与时长", () => {
    expect(() => buildSubmitRequest(config, { ...params, resolution: "480P" })).toThrow("不支持 480P");
    const max = { ...config, modelId: "MiniMax-H3-Max" };
    expect(() => buildSubmitRequest(max, { ...params, resolution: "2K" })).toThrow("不支持 2K");
    expect(() => buildSubmitRequest(max, { ...params, durationSec: 4 })).toThrow("5~15");
    expect(JSON.parse(buildSubmitRequest(max, { ...params, resolution: "480P" }).body).resolution).toBe("480P");
  });
});

describe("接口地址", () => {
  it("任务地址去掉多余斜杠，任务 id 做转义", () => {
    expect(tasksEndpoint("https://x/minimax/v2/")).toBe("https://x/minimax/v2/video_generation");
    expect(taskUrl(config, "task_a/b")).toBe("https://llm-api.net/minimax/v2/query/video_generation/task_a%2Fb");
  });

  it("接受用户提供的完整地址与双斜杠，提交和查询不重复拼路径", () => {
    const full = "https://llm-api.net//minimax/v2/video_generation";
    expect(tasksEndpoint(full)).toBe("https://llm-api.net/minimax/v2/video_generation");
    expect(taskUrl({ ...config, baseUrl: full }, "123")).toBe(
      "https://llm-api.net/minimax/v2/query/video_generation/123"
    );
    expect(resolveVideoConfig({ ...config, baseUrl: full }).baseUrl).toBe("https://llm-api.net/minimax/v2");
  });
});

describe("parseSubmitResponse", () => {
  it("取 MiniMax V2 返回的 task_id", () => {
    expect(parseSubmitResponse({ task_id: "task_abc" })).toBe("task_abc");
  });

  it("网关报错（如模型没开通）时带出 code 和 message", () => {
    expect(() => parseSubmitResponse({ error: { code: "model_not_found", message: "No available channel" } })).toThrow(
      "model_not_found：No available channel"
    );
  });

  it("既没有 id 也没有 error 时把整个响应带出来", () => {
    expect(() => parseSubmitResponse({ foo: 1 })).toThrow('{"foo":1}');
  });
});

describe("parseTaskResponse", () => {
  it.each(["pending", "queued", "running", "something-new"])("%s 都当作还在跑", (status) => {
    expect(parseTaskResponse({ task: { status } })).toEqual({ status: "running" });
  });

  it("成功时取 task.content.url", () => {
    expect(parseTaskResponse({ task: { status: "succeeded", content: { url: "https://v/a.mp4" } } })).toEqual({
      status: "succeeded",
      videoUrl: "https://v/a.mp4"
    });
  });

  it("成功了却没有视频地址，当失败处理", () => {
    expect(parseTaskResponse({ task: { status: "succeeded" } })).toMatchObject({ status: "failed" });
  });

  it.each(["failed", "cancelled", "expired"])("%s 是失败，带上服务商给的原因", (status) => {
    expect(parseTaskResponse({ task: { status, error: { message: "内容审核未通过" } } })).toEqual({
      status: "failed",
      reason: `视频生成任务${status}：内容审核未通过`
    });
  });

  it("HTTP 200 内的错误响应不能当成任务还在运行", () => {
    expect(() => parseTaskResponse({ error: { message: "invalid task_id" } })).toThrow("invalid task_id");
    expect(() => parseTaskResponse({})).toThrow("task.status");
  });
});
