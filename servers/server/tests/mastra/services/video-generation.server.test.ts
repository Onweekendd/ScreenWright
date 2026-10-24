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
  getModelConfigSync: () => ({ baseUrl: "https://gw.example/minimax/v2", apiKey: "k", modelId: "video-model" }),
  DEFAULT_VIDEO_MODEL: "MiniMax-H3"
}));

const storeMocks = vi.hoisted(() => ({ put: vi.fn(), keyFromUrl: vi.fn(), get: vi.fn() }));
vi.mock("@/lib/storage", () => ({
  assetStore: () => ({ put: storeMocks.put, keyFromUrl: storeMocks.keyFromUrl, get: storeMocks.get })
}));

const imageMocks = vi.hoisted(() => ({ prepareReference: vi.fn(), imageSize: vi.fn() }));
vi.mock("@/mastra/services/image-generation.server", () => ({ prepareReference: imageMocks.prepareReference }));
vi.mock("@/mastra/services/shrink-image", () => ({ imageSize: imageMocks.imageSize }));

import { computeVideoHash, generateAndStoreVideo } from "@/mastra/services/video-generation.server";

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
      { firstFrameUrl: "http://store/a.png" }
    ]) {
      expect(computeVideoHash({ ...input, ...patch }, "m")).not.toBe(base);
    }
    expect(computeVideoHash(input, "other")).not.toBe(base);
  });
});

describe("generateAndStoreVideo", () => {
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
