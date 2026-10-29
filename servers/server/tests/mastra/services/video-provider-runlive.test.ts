import { describe, expect, it } from "vitest";

import {
  buildSubmitRequest,
  checkProbeResponse,
  parseFileUrlResponse,
  parseSubmitResponse,
  parseTaskResponse,
  runliveAdapter
} from "@/mastra/services/ai-generation/video/providers/runlive";

const config = {
  provider: "runlive",
  baseUrl: "https://www.runlive.top/mnmx",
  apiKey: "sk_card",
  modelId: "MiniMax-H3"
} as const;
const params = { prompt: "云层流动", durationSec: 5, resolution: "768P", ratio: "16:9" } as const;
const jpeg = (tag: string) => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.from(tag)]);

const formOf = (request: { body?: string | FormData }) => request.body as FormData;
const fieldsOf = (form: FormData) => {
  const fields: Record<string, string> = {};
  form.forEach((value, key) => {
    if (typeof value === "string") {
      fields[key] = value;
    }
  });
  return fields;
};

describe("buildSubmitRequest", () => {
  it("文生视频：multipart 提交到 /api/v1/tasks，卡密钥放 X-Card-Key，分辨率和画幅换成接口取值", () => {
    const request = buildSubmitRequest(config, params);

    expect(request).toMatchObject({ method: "POST", url: "https://www.runlive.top/mnmx/api/v1/tasks" });
    expect(request.headers).toEqual({ "X-Card-Key": "sk_card" });
    expect(fieldsOf(formOf(request))).toEqual({
      task_name: "minimax_h3_v2",
      prompt: "云层流动",
      resolution: "1",
      duration: "5",
      aspect_ratio: "16:9 (Widescreen)"
    });
  });

  it("首尾帧按文件上传，字段名 first_frame / last_frame，1080P 传 2", async () => {
    const form = formOf(
      buildSubmitRequest(config, {
        ...params,
        resolution: "1080P",
        ratio: "9:16",
        firstFrame: jpeg("FIRST"),
        lastFrame: jpeg("LAST")
      })
    );
    const first = form.get("first_frame") as File;

    expect(fieldsOf(form)).toMatchObject({
      task_name: "minimax_h3_v2",
      resolution: "2",
      aspect_ratio: "9:16 (Portrait Widescreen)"
    });
    expect(first.name).toBe("first_frame.jpeg");
    expect(first.type).toBe("image/jpeg");
    expect(Buffer.from(await first.arrayBuffer())).toEqual(jpeg("FIRST"));
    expect((form.get("last_frame") as File).name).toBe("last_frame.jpeg");
  });

  it("有参考图时切到 minimax_h3_multi_ref，按顺序传 ref_0、ref_1", () => {
    const form = formOf(buildSubmitRequest(config, { ...params, referenceImages: [jpeg("A"), jpeg("B")] }));

    expect(form.get("task_name")).toBe("minimax_h3_multi_ref");
    expect((form.get("ref_0") as File).name).toBe("ref_0.jpeg");
    expect((form.get("ref_1") as File).name).toBe("ref_1.jpeg");
    expect(form.has("ref_2")).toBe(false);
  });

  it("提交前拦下接口不支持的组合，不花积分", () => {
    const refs = (n: number) => Array.from({ length: n }, (_, i) => jpeg(String(i)));
    expect(() => buildSubmitRequest(config, { ...params, referenceVideos: ["https://a/v.mp4"] })).toThrow(
      "不支持参考视频或音频"
    );
    expect(() => buildSubmitRequest(config, { ...params, lastFrame: jpeg("L") })).toThrow("不支持只传尾帧");
    expect(() => buildSubmitRequest(config, { ...params, referenceImages: refs(7) })).toThrow("最多 6 张");
    expect(() => buildSubmitRequest(config, { ...params, resolution: "2K" })).toThrow("480P / 768P / 1080P");
    expect(() => buildSubmitRequest(config, { ...params, resolution: "1080P", referenceImages: refs(1) })).toThrow(
      "参考图生视频不支持 1080P"
    );
    expect(() =>
      buildSubmitRequest(config, {
        ...params,
        resolution: "1080P",
        durationSec: 11,
        firstFrame: jpeg("F"),
        lastFrame: jpeg("L")
      })
    ).toThrow("最长 10 秒");
    expect(() => buildSubmitRequest(config, { ...params, durationSec: 16 })).toThrow("4~15");
    expect(() => buildSubmitRequest(config, { ...params, firstFrame: jpeg("F"), referenceImages: refs(1) })).toThrow(
      "互斥"
    );
  });

  it("只有首帧时 1080P 可以超过 10 秒", () => {
    expect(() =>
      buildSubmitRequest(config, { ...params, resolution: "1080P", durationSec: 15, firstFrame: jpeg("F") })
    ).not.toThrow();
  });
});

describe("响应解析", () => {
  it("提交成功取 data.task_id；失败带出接口给的原因", () => {
    expect(parseSubmitResponse({ success: true, data: { task_id: "a1b2", status: "queued" } })).toBe("a1b2");
    expect(() => parseSubmitResponse({ success: false, message: "积分余额不足" })).toThrow("积分余额不足");
  });

  it.each(["queued", "processing", "something-new"])("%s 当作还在跑", (status) => {
    expect(parseTaskResponse({ success: true, data: { status } })).toEqual({ status: "running" });
  });

  it("completed 是成功但不带地址，地址要另外取", () => {
    expect(parseTaskResponse({ success: true, data: { status: "completed" } })).toEqual({ status: "succeeded" });
  });

  it("failed 带上 error 字段的原因；success=false 或缺 status 是查询失败", () => {
    expect(parseTaskResponse({ success: true, data: { status: "failed", error: "内容审核未通过" } })).toEqual({
      status: "failed",
      reason: "视频生成任务失败：内容审核未通过"
    });
    expect(() => parseTaskResponse({ success: false, error: "任务不存在" })).toThrow("任务不存在");
    expect(() => parseTaskResponse({ success: true, data: {} })).toThrow("data.status");
  });

  it("取链：404 是云端还没同步，返回 null 继续轮询；成功取 data.url", () => {
    expect(parseFileUrlResponse(404, '{"success":false}')).toBeNull();
    const url = "https://dl.example/api/download/a1b2?token=t&expires=1";
    expect(parseFileUrlResponse(200, JSON.stringify({ success: true, data: { url, filename: "a1b2.mp4" } }))).toBe(url);
    expect(() => parseFileUrlResponse(429, "too many")).toThrow("429");
    expect(() => parseFileUrlResponse(200, '{"success":true,"data":{}}')).toThrow("获取视频下载地址失败");
  });
});

describe("接口地址与测试", () => {
  it("Base URL 填到 /api/v1/tasks 也能用；查询和取链地址对任务 id 转义", () => {
    const normalized = runliveAdapter.normalizeBaseUrl("https://www.runlive.top//mnmx/api/v1/tasks/");
    expect(normalized).toBe("https://www.runlive.top/mnmx");
    expect(runliveAdapter.taskRequest(config, "a/b").url).toBe("https://www.runlive.top/mnmx/api/v1/tasks/a%2Fb");
    expect(runliveAdapter.resultUrl?.request(config, "a1b2").url).toBe(
      "https://www.runlive.top/mnmx/api/v1/tasks/a1b2/file-url"
    );
  });

  it("测试只查一个不存在的任务：JSON 404 表示密钥可用，403 提示放行，HTML 404 提示地址填错", () => {
    expect(runliveAdapter.probe.request(config)).toMatchObject({ method: "GET", headers: { "X-Card-Key": "sk_card" } });
    expect(() => checkProbeResponse(404, '{"success":false,"message":"任务不存在"}')).not.toThrow();
    expect(() => checkProbeResponse(403, '{"success":false,"message":"卡未放行"}')).toThrow("未被放行");
    expect(() => checkProbeResponse(404, "<html>Not Found</html>")).toThrow("请检查 Base URL");
  });
});
