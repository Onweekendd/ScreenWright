import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 模块加载时读取：轮询间隔压到 1ms，不然每个用例要等 5 秒
vi.hoisted(() => {
  process.env.VIDEO_POLL_INTERVAL_MS = "1";
  process.env.VIDEO_MAX_WAIT_MS = "200";
});

const prismaMocks = vi.hoisted(() => ({ findUnique: vi.fn(), create: vi.fn() }));
vi.mock("@/mastra/storage/prisma", () => ({
  prismaClient: { generatedVideo: { findUnique: prismaMocks.findUnique, create: prismaMocks.create } }
}));

vi.mock("@/mastra/provider/model-registry", () => ({
  // cfg_v / cfg_runlive 模拟对话选的另一条生视频配置，其余（含不传）都是默认配置
  resolveModelConfig: (_role: string, configId?: string) =>
    configId === "cfg_v"
      ? { baseUrl: "https://picked.example/minimax/v2", apiKey: "k2", modelId: "picked-video-model" }
      : configId === "cfg_runlive"
        ? { provider: "runlive", baseUrl: "https://www.runlive.top/mnmx", apiKey: "sk_card", modelId: "MiniMax-H3" }
        : { baseUrl: "https://gw.example/minimax/v2", apiKey: "k", modelId: "video-model" },
  DEFAULT_VIDEO_MODEL: "MiniMax-H3"
}));

const storeMocks = vi.hoisted(() => ({
  put: vi.fn(),
  keyFromUrl: vi.fn(),
  get: vi.fn(),
  head: vi.fn(),
  signedUrl: vi.fn(),
  publicUrl: vi.fn()
}));
vi.mock("@/lib/storage", () => ({
  assetStore: () => storeMocks
}));

const imageMocks = vi.hoisted(() => ({ prepareReference: vi.fn(), imageSize: vi.fn() }));
vi.mock("@/mastra/services/ai-generation/image/image-generation.server", () => ({
  prepareReference: imageMocks.prepareReference
}));
vi.mock("@/mastra/services/ai-assets/shrink-image", () => ({ imageSize: imageMocks.imageSize }));

import { computeVideoHash, generateAndStoreVideo } from "@/mastra/services/ai-generation/video/video-generation.server";

const input = { prompt: "云层流动", durationSec: 5, resolution: "768P", ratio: "16:9" } as const;
const TASKS = "https://gw.example/minimax/v2/video_generation";
const QUERY = "https://gw.example/minimax/v2/query/video_generation/";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const mp4 = () => new Response(Buffer.from([0, 0, 0, 1]), { status: 200, headers: { "Content-Type": "video/mp4" } });
const succeeded = () => json({ task: { status: "succeeded", content: { url: "https://tos.example/v.mp4?sig=1" } } });
const running = () => json({ task: { status: "running" } });
const badGateway = () => json({ error: "bad gateway" }, 502);

let fetchMock: ReturnType<typeof spyFetch>;
const spyFetch = () => vi.spyOn(globalThis, "fetch");

/** 提交 / 轮询 / 下载三类请求各自的响应；轮询按调用顺序依次返回 */
const respondTo = (handlers: { submit?: () => Response; poll: Array<() => Response>; download?: () => Response }) => {
  const polls = [...handlers.poll];
  fetchMock.mockImplementation(async (url, init) => {
    const target = String(url);
    if (target === TASKS && init?.method === "POST") {
      return (handlers.submit ?? (() => json({ task_id: "task_1" })))();
    }
    if (target.startsWith(QUERY)) {
      return polls.shift()!();
    }
    return (handlers.download ?? mp4)();
  });
};
const submitCalls = () =>
  fetchMock.mock.calls.filter(([url, init]) => String(url) === TASKS && init?.method === "POST");

beforeEach(() => {
  vi.clearAllMocks();
  storeMocks.keyFromUrl.mockReturnValue(null);
  storeMocks.publicUrl.mockImplementation((key: string) => `http://store/blobs/${key}`);
  storeMocks.head.mockResolvedValue({ size: 4 });
  storeMocks.signedUrl.mockResolvedValue("http://117.72.206.37/blobs/ref.mp4?sig=1");
  fetchMock = spyFetch();
  prismaMocks.findUnique.mockResolvedValue(null);
  imageMocks.imageSize.mockResolvedValue({ width: 1672, height: 940 });
  prismaMocks.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({ id: "vid-1", createdTime: new Date(), ...data })
  );
  storeMocks.put.mockResolvedValue({ key: "generated-videos/h.mp4", url: "https://blobs/h.mp4", size: 4 });
});

afterEach(() => fetchMock.mockRestore());

describe("computeVideoHash", () => {
  it("同一份输入同一个 hash；提示词、时长、分辨率、比例、首帧、模型任何一个变了都不同", () => {
    const base = computeVideoHash(input, "m");
    expect(computeVideoHash({ ...input }, "m")).toBe(base);
    for (const patch of [
      { prompt: "别的" },
      { durationSec: 6 },
      { resolution: "480P" as const },
      { ratio: "9:16" as const },
      { firstFrameUrl: "http://store/a.png" },
      { lastFrameUrl: "http://store/last.png" },
      { referenceImageUrls: ["http://store/ref.png"] },
      { referenceVideoUrls: ["http://store/ref.mp4"] },
      { referenceAudioUrls: ["http://store/ref.mp3"] }
    ]) {
      expect(computeVideoHash({ ...input, ...patch }, "m")).not.toBe(base);
    }
    expect(computeVideoHash(input, "other")).not.toBe(base);
    expect(
      computeVideoHash({ ...input, referenceImageUrls: [], referenceVideoUrls: [], referenceAudioUrls: [] }, "m")
    ).toBe(base);
  });
});

describe("generateAndStoreVideo", () => {
  it("外部 URL 即使能被存储的 keyFromUrl 解析，也不应被当成本地对象签名", async () => {
    storeMocks.keyFromUrl.mockReturnValue("ref.mp4");
    respondTo({ poll: [succeeded] });
    await generateAndStoreVideo({ ...input, referenceVideoUrls: ["http://117.72.206.37/videos/ref.mp4"] });
    expect(JSON.parse(submitCalls()[0][1]!.body as string).content[1].video_url.url).toBe(
      "http://117.72.206.37/videos/ref.mp4"
    );
    expect(storeMocks.head).not.toHaveBeenCalled();
    expect(storeMocks.signedUrl).not.toHaveBeenCalled();
  });
  it("尾帧同样读取内部图片并转为 data URL，保存原始尾帧地址", async () => {
    storeMocks.keyFromUrl.mockReturnValue("last.png");
    storeMocks.get.mockResolvedValue(Buffer.from("png"));
    imageMocks.prepareReference.mockResolvedValue(Buffer.from([0xff, 0xd8, 0xff, 1]));
    respondTo({ poll: [succeeded] });
    await generateAndStoreVideo({ ...input, lastFrameUrl: "http://store/blobs/last.png" });
    expect(JSON.parse(submitCalls()[0][1]!.body as string).content[1]).toMatchObject({
      role: "last_frame",
      image_url: { url: expect.stringMatching(/^data:image\/jpeg;base64,/) }
    });
    expect(prismaMocks.create.mock.calls[0][0].data.lastFrameUrl).toBe("http://store/blobs/last.png");
  });

  it("参考组合：图片转 data URL，内部视频签名，公网音频原样传递，落库保留原始地址", async () => {
    storeMocks.keyFromUrl.mockImplementation((url: string) =>
      url.includes("/blobs/") ? url.split("/blobs/")[1] : null
    );
    storeMocks.get.mockResolvedValue(Buffer.from("png"));
    imageMocks.prepareReference.mockResolvedValue(Buffer.from([0xff, 0xd8, 0xff, 1]));
    respondTo({ poll: [succeeded] });
    const references = {
      referenceImageUrls: ["http://store/blobs/ref.png"],
      referenceVideoUrls: ["http://store/blobs/ref.mp4"],
      referenceAudioUrls: ["https://audio.example/ref.mp3"]
    };
    await generateAndStoreVideo({ ...input, ...references });
    const content = JSON.parse(submitCalls()[0][1]!.body as string).content;
    expect(content[1].image_url.url).toMatch(/^data:image\/jpeg;base64,/);
    expect(content[2]).toMatchObject({
      role: "reference_video",
      video_url: { url: "http://117.72.206.37/blobs/ref.mp4?sig=1" }
    });
    expect(content[3]).toMatchObject({ role: "reference_audio", audio_url: { url: references.referenceAudioUrls[0] } });
    expect(storeMocks.signedUrl).toHaveBeenCalledWith("ref.mp4", 3600);
    expect(prismaMocks.create.mock.calls[0][0].data).toMatchObject(references);
  });

  it.each(["http://localhost:4111/a.mp4", "http://192.168.1.2/a.mp4", "http://127.0.0.1/a.mp4"])(
    "参考视频为内网地址时提交前拒绝：%s",
    async (url) => {
      await expect(generateAndStoreVideo({ ...input, referenceVideoUrls: [url] })).rejects.toThrow("公网 HTTP/HTTPS");
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it("内部素材签名后仍指向 localhost 时拒绝，素材不存在时也拒绝", async () => {
    storeMocks.keyFromUrl.mockReturnValue("ref.mp4");
    storeMocks.signedUrl.mockResolvedValue("http://localhost:4111/blobs/ref.mp4");
    await expect(
      generateAndStoreVideo({ ...input, referenceVideoUrls: ["http://store/blobs/ref.mp4"] })
    ).rejects.toThrow("ASSET_PUBLIC_BASE_URL");
    storeMocks.head.mockResolvedValue(null);
    await expect(
      generateAndStoreVideo({ ...input, referenceVideoUrls: ["http://store/blobs/ref.mp4"] })
    ).rejects.toThrow("不存在");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("互斥组合在读素材、查询缓存及提交任务前被拒绝", async () => {
    await expect(
      generateAndStoreVideo({
        ...input,
        lastFrameUrl: "http://store/last.png",
        referenceAudioUrls: ["https://audio.example/ref.mp3"]
      })
    ).rejects.toThrow("互斥");
    expect(prismaMocks.findUnique).not.toHaveBeenCalled();
    expect(storeMocks.get).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("提交 → 轮询到成功 → 下载转存到 assetStore → 记库，返回的是我们自己的 url", async () => {
    respondTo({ poll: [running, running, succeeded] });

    const record = await generateAndStoreVideo(input);

    expect(record).toMatchObject({ id: "vid-1", url: "https://blobs/h.mp4", reused: false });
    expect(storeMocks.put.mock.calls[0][0]).toMatch(/^generated-videos\/[0-9a-f]{64}\.mp4$/);
    expect(storeMocks.put.mock.calls[0][2]).toEqual({ contentType: "video/mp4" });
    expect(prismaMocks.create.mock.calls[0][0].data).toMatchObject({
      model: "video-model",
      durationSec: 5,
      resolution: "768P",
      ratio: "16:9",
      url: "https://blobs/h.mp4",
      firstFrameUrl: null,
      taskId: "task_1"
    });
  });

  it("提交与轮询分别走 MiniMax V2 的正确路径，带 Bearer 密钥", async () => {
    respondTo({ poll: [succeeded] });

    await generateAndStoreVideo(input);

    const [url, init] = submitCalls()[0];
    expect(String(url)).toBe(TASKS);
    expect((init!.headers as Record<string, string>).Authorization).toBe("Bearer k");
    expect(fetchMock.mock.calls[1][0]).toBe(`${QUERY}task_1`);
  });

  it("命中已有记录直接返回，不提交任务", async () => {
    prismaMocks.findUnique.mockResolvedValue({ id: "old", url: "https://blobs/old.mp4", prompt: "p" });

    const record = await generateAndStoreVideo(input);

    expect(record).toMatchObject({ id: "old", reused: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("图生视频：首帧从 assetStore 读出来压成 JPEG，以 data URL 放进请求", async () => {
    storeMocks.keyFromUrl.mockReturnValue("generated-images/a.png");
    storeMocks.get.mockResolvedValue(Buffer.from("png-bytes"));
    imageMocks.prepareReference.mockResolvedValue(Buffer.from([0xff, 0xd8, 0xff, 1]));
    respondTo({ poll: [succeeded] });

    await generateAndStoreVideo({ ...input, firstFrameUrl: "http://store/blobs/generated-images/a.png" });

    const content = JSON.parse(submitCalls()[0][1]!.body as string).content;
    expect(content[1]).toMatchObject({ role: "first_frame" });
    expect(content[1].image_url.url).toMatch(/^data:image\/jpeg;base64,/);
    expect(prismaMocks.create.mock.calls[0][0].data.firstFrameUrl).toBe("http://store/blobs/generated-images/a.png");
  });

  it.each([
    ["横幅 2138×735", { width: 2138, height: 735 }],
    ["竖条 300×1200", { width: 300, height: 1200 }]
  ])("首帧宽高比超出视频模型限制（%s）时提交前就拒绝，说清楚原因", async (_label, size) => {
    storeMocks.keyFromUrl.mockReturnValue("generated-images/a.png");
    storeMocks.get.mockResolvedValue(Buffer.from("png-bytes"));
    imageMocks.imageSize.mockResolvedValue(size);

    await expect(generateAndStoreVideo({ ...input, firstFrameUrl: "http://store/a.png" })).rejects.toThrow(
      "超出视频模型的限制"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("读不出首帧尺寸时不拦（交给服务商判断）", async () => {
    storeMocks.keyFromUrl.mockReturnValue("generated-images/a.png");
    storeMocks.get.mockResolvedValue(Buffer.from("x"));
    imageMocks.imageSize.mockResolvedValue(undefined);
    imageMocks.prepareReference.mockResolvedValue(Buffer.from([0xff, 0xd8, 0xff, 1]));
    respondTo({ poll: [succeeded] });

    await expect(generateAndStoreVideo({ ...input, firstFrameUrl: "http://store/a.png" })).resolves.toMatchObject({
      reused: false
    });
  });

  it("首帧不是 assetStore 里的资源时直接报错，不提交（不去下载外部地址、也不白花钱）", async () => {
    storeMocks.keyFromUrl.mockReturnValue(null);

    await expect(generateAndStoreVideo({ ...input, firstFrameUrl: "http://evil.example/a.png" })).rejects.toThrow(
      "不是内部 assetStore 的资源"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("提交失败不重试（可能已被服务商收下，重试会重复计费），原因带出来", async () => {
    respondTo({
      submit: () => json({ error: { code: "model_not_found", message: "No available channel" } }, 503),
      poll: []
    });

    await expect(generateAndStoreVideo(input)).rejects.toThrow("提交视频生成任务失败 503");
    expect(submitCalls()).toHaveLength(1);
    expect(prismaMocks.create).not.toHaveBeenCalled();
  });

  it("任务失败：带服务商原因，不转存、不记库，也不被轮询容错吞掉", async () => {
    respondTo({ poll: [running, () => json({ task: { status: "failed", error: { message: "内容审核未通过" } } })] });

    await expect(generateAndStoreVideo(input)).rejects.toThrow("内容审核未通过");
    expect(storeMocks.put).not.toHaveBeenCalled();
    expect(prismaMocks.create).not.toHaveBeenCalled();
  });

  it("轮询偶尔失败不算任务失败，继续等", async () => {
    respondTo({ poll: [badGateway, running, succeeded] });

    await expect(generateAndStoreVideo(input)).resolves.toMatchObject({ reused: false });
  });

  it("轮询连续失败 5 次才放弃", async () => {
    respondTo({ poll: [badGateway, badGateway, badGateway, badGateway, badGateway] });

    await expect(generateAndStoreVideo(input)).rejects.toThrow("查询任务失败 502");
  });

  it("HTTP 200 错误响应也计入连续查询失败，不会一直轮询到总超时", async () => {
    const apiError = () => json({ error: { message: "invalid task_id" } });
    respondTo({ poll: Array(5).fill(apiError) });

    await expect(generateAndStoreVideo(input)).rejects.toThrow("invalid task_id");
    expect(fetchMock.mock.calls.filter(([url]) => String(url).startsWith(QUERY))).toHaveLength(5);
    expect(submitCalls()).toHaveLength(1);
    expect(prismaMocks.create).not.toHaveBeenCalled();
  });

  it("一直在跑超过总时限，报超时并带上服务商任务 id", async () => {
    fetchMock.mockImplementation(async (url, init) => {
      if (init?.method === "POST") {
        return json({ task_id: "task_slow" });
      }
      return String(url).startsWith(QUERY) ? running() : mp4();
    });

    await expect(generateAndStoreVideo(input)).rejects.toThrow(/视频生成超时.*task_slow/);
  });

  it("下载失败会重试，几次后成功就照常落库", async () => {
    let downloads = 0;
    respondTo({
      poll: [succeeded],
      download: () => (++downloads < 2 ? new Response("", { status: 500 }) : mp4())
    });

    await expect(generateAndStoreVideo(input)).resolves.toMatchObject({ url: "https://blobs/h.mp4" });
    expect(downloads).toBe(2);
  });

  it("按阶段上报进度，只增不减", async () => {
    respondTo({ poll: [running, succeeded] });
    const seen: number[] = [];

    await generateAndStoreVideo(input, {
      onProgress: (percent) => {
        seen.push(percent);
      }
    });

    expect(seen[0]).toBe(5);
    expect(seen.at(-1)).toBe(90);
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
  });
});

describe("按对话选择的生视频配置", () => {
  const PICKED_TASKS = "https://picked.example/minimax/v2/video_generation";

  it("传了 modelConfigId 时按这份配置提交，记录与幂等键记它的模型；id 本身不进幂等键", async () => {
    fetchMock.mockImplementation(async (url, init) => {
      const target = String(url);
      if (target === PICKED_TASKS && init?.method === "POST") {
        return json({ task_id: "task_1" });
      }
      return target.includes("/query/video_generation/") ? succeeded() : mp4();
    });

    await generateAndStoreVideo({ ...input, modelConfigId: "cfg_v" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(PICKED_TASKS);
    expect((init!.headers as Record<string, string>).Authorization).toBe("Bearer k2");
    expect(prismaMocks.create.mock.calls[0][0].data).toMatchObject({
      model: "picked-video-model",
      promptHash: computeVideoHash(input, "picked-video-model")
    });
  });

  it("runlive：轮询到 completed 后另取下载地址，取链 404（云端未同步）时下一轮再取", async () => {
    const RUNLIVE_TASKS = "https://www.runlive.top/mnmx/api/v1/tasks";
    const fileUrls = [() => json({ success: false, message: "任务未完成" }, 404)];
    fetchMock.mockImplementation(async (url, init) => {
      const target = String(url);
      if (target === RUNLIVE_TASKS && init?.method === "POST") {
        return json({ success: true, data: { task_id: "rl_1", status: "queued" } }, 202);
      }
      if (target === `${RUNLIVE_TASKS}/rl_1`) {
        return json({ success: true, data: { status: "completed" } });
      }
      if (target === `${RUNLIVE_TASKS}/rl_1/file-url`) {
        return (
          fileUrls.shift() ?? (() => json({ success: true, data: { url: "https://dl.example/rl_1?token=t" } }))
        )();
      }
      return mp4();
    });

    const result = await generateAndStoreVideo({ ...input, modelConfigId: "cfg_runlive" });

    const [, submitInit] = fetchMock.mock.calls[0];
    expect((submitInit!.headers as Record<string, string>)["X-Card-Key"]).toBe("sk_card");
    expect(submitInit!.body).toBeInstanceOf(FormData);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/file-url"))).toHaveLength(2);
    expect(String(fetchMock.mock.calls.at(-1)![0])).toBe("https://dl.example/rl_1?token=t");
    expect(prismaMocks.create.mock.calls[0][0].data).toMatchObject({
      model: "runlive:MiniMax-H3",
      taskId: "rl_1",
      promptHash: computeVideoHash(input, "runlive:MiniMax-H3")
    });
    expect(result.url).toBe("https://blobs/h.mp4");
  });
});
