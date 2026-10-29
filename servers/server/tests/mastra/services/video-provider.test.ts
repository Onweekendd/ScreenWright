import { describe, expect, it, vi } from "vitest";

vi.mock("@/mastra/provider/model-registry", () => ({
  resolveModelConfig: vi.fn(),
  DEFAULT_VIDEO_MODEL: "MiniMax-H3"
}));

import { resolveModelConfig } from "@/mastra/provider/model-registry";
import {
  buildSubmitRequest,
  parseSubmitResponse,
  parseTaskResponse,
  tasksEndpoint,
  taskUrl
} from "@/mastra/services/ai-generation/video/providers/minimax-v2";
import {
  DEFAULT_VIDEO_MODEL,
  getVideoConfig,
  resolveVideoConfig,
  videoAdapter,
  videoModelKey
} from "@/mastra/services/ai-generation/video/video-provider";

const config = {
  provider: "minimax-v2",
  baseUrl: "https://llm-api.net/minimax/v2",
  apiKey: "k",
  modelId: "MiniMax-H3"
} as const;
const params = { prompt: "云层流动", durationSec: 5, resolution: "768P", ratio: "16:9" } as const;
const jpeg = (tag: string) => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.from(tag)]);
const dataUrl = (bytes: Buffer) => `data:image/jpeg;base64,${bytes.toString("base64")}`;

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
    vi.mocked(resolveModelConfig).mockReturnValue({
      id: "video-1",
      role: "video",
      ...config,
      contextLength: null,
      dimensions: null
    });
    expect(getVideoConfig()).toEqual(config);
    expect(resolveModelConfig).toHaveBeenCalledWith("video", undefined);
    expect(resolveModelConfig).not.toHaveBeenCalledWith("image", expect.anything());
  });

  it("传了对话选的配置 id 时按 id 取 video 配置", () => {
    vi.mocked(resolveModelConfig).mockReturnValue({
      id: "cfg_v",
      role: "video",
      ...config,
      contextLength: null,
      dimensions: null
    });
    getVideoConfig("cfg_v");
    expect(resolveModelConfig).toHaveBeenCalledWith("video", "cfg_v");
  });

  it("provider 留空时用 minimax-v2，填了就按填的选适配器，未知值直接报错", () => {
    expect(resolveVideoConfig({ ...config, provider: " " }).provider).toBe("minimax-v2");
    const runlive = resolveVideoConfig({ ...config, provider: "runlive", baseUrl: "https://www.runlive.top/mnmx/" });
    expect(runlive).toMatchObject({ provider: "runlive", baseUrl: "https://www.runlive.top/mnmx" });
    expect(videoAdapter(runlive).resultUrl).toBeDefined();
    expect(() => resolveVideoConfig({ ...config, provider: "kling" })).toThrow("不支持的视频服务商「kling」");
  });

  it("幂等用的模型标识：默认服务商只用模型 id（旧记录 hash 不变），其余带服务商前缀", () => {
    expect(videoModelKey(config)).toBe("MiniMax-H3");
    expect(videoModelKey({ provider: "runlive", modelId: "MiniMax-H3" })).toBe("runlive:MiniMax-H3");
  });

  it("视频没配地址 / 密钥时引导用户配置生视频模型", () => {
    expect(() => resolveVideoConfig({ ...config, baseUrl: " " })).toThrow("生视频模型的 Base URL");
    expect(() => resolveVideoConfig({ ...config, apiKey: " " })).toThrow("生视频模型的 API Key");
  });
});

describe("buildSubmitRequest", () => {
  it.each([false, true])("尾帧和首尾帧模式（包含首帧=%s）", (withFirst) => {
    const body = JSON.parse(
      buildSubmitRequest(config, {
        ...params,
        lastFrame: jpeg("LAST"),
        ...(withFirst ? { firstFrame: jpeg("FIRST") } : {})
      }).body as string
    );
    expect(body.content.map((item: { role?: string }) => item.role)).toEqual(
      withFirst ? [undefined, "first_frame", "last_frame"] : [undefined, "last_frame"]
    );
    expect(body.ratio).toBe("adaptive");
  });

  it("图片、视频、音频参考组合编码为各自的类型和 role，保留指定画幅", () => {
    const body = JSON.parse(
      buildSubmitRequest(config, {
        ...params,
        referenceImages: [jpeg("REF")],
        referenceVideos: ["http://117.72.206.37/videos/ref.mp4"],
        referenceAudios: ["https://assets.example/ref.mp3"]
      }).body as string
    );
    expect(body.content).toEqual([
      { type: "text", text: params.prompt },
      { type: "image_url", image_url: { url: dataUrl(jpeg("REF")) }, role: "reference_image" },
      { type: "video_url", video_url: { url: "http://117.72.206.37/videos/ref.mp4" }, role: "reference_video" },
      { type: "audio_url", audio_url: { url: "https://assets.example/ref.mp3" }, role: "reference_audio" }
    ]);
    expect(body.ratio).toBe("16:9");
  });

  it.each(["referenceImages", "referenceVideos", "referenceAudios"] as const)("拒绝首尾帧与 %s 混用", (field) => {
    const reference = field === "referenceImages" ? jpeg("REF") : "https://assets.example/ref";
    for (const frame of ["firstFrame", "lastFrame"]) {
      expect(() => buildSubmitRequest(config, { ...params, [frame]: jpeg("F"), [field]: [reference] })).toThrow("互斥");
    }
  });

  it("拒绝仅空白的提示词", () => {
    expect(() => buildSubmitRequest(config, { ...params, prompt: "  " })).toThrow("不能为空");
  });
  it("文生视频：只有一段文本；时长、分辨率、比例用 JSON 字段，不拼在提示词后面", () => {
    const request = buildSubmitRequest(config, params);
    const body = JSON.parse(request.body as string);

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
    const body = JSON.parse(buildSubmitRequest(config, { ...params, firstFrame: jpeg("AAA") }).body as string);

    expect(body.content).toEqual([
      { type: "text", text: "云层流动" },
      { type: "image_url", image_url: { url: dataUrl(jpeg("AAA")) }, role: "first_frame" }
    ]);
    expect(body.ratio).toBe("adaptive");
  });

  it("发送前校验 H3 和 H3-Max 各自支持的分辨率与时长", () => {
    expect(() => buildSubmitRequest(config, { ...params, resolution: "480P" })).toThrow("不支持 480P");
    const max = { ...config, modelId: "MiniMax-H3-Max" };
    expect(() => buildSubmitRequest(max, { ...params, resolution: "2K" })).toThrow("不支持 2K");
    expect(() => buildSubmitRequest(max, { ...params, durationSec: 4 })).toThrow("5~15");
    expect(() => buildSubmitRequest(config, { ...params, resolution: "1080P" })).toThrow("不支持 1080P");
    expect(JSON.parse(buildSubmitRequest(max, { ...params, resolution: "480P" }).body as string).resolution).toBe(
      "480P"
    );
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
