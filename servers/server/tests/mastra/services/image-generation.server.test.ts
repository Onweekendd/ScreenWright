import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn()
}));

vi.mock("@/mastra/storage/prisma", () => ({
  prismaClient: {
    generatedImage: {
      findUnique: prismaMocks.findUnique,
      create: prismaMocks.create
    }
  }
}));

const registryMocks = vi.hoisted(() => ({
  getModelConfigSync: vi.fn()
}));

vi.mock("@/mastra/provider/model-registry", () => ({
  getModelConfigSync: registryMocks.getModelConfigSync
}));

const storeMocks = vi.hoisted(() => ({ put: vi.fn(), keyFromUrl: vi.fn(), get: vi.fn() }));

vi.mock("@/lib/storage", () => ({
  assetStore: () => ({ put: storeMocks.put, keyFromUrl: storeMocks.keyFromUrl, get: storeMocks.get })
}));

import {
  computePromptHash,
  generateAndStoreImage,
  generateEffectImages
} from "@/mastra/services/image-generation.server";

let fetchMock: ReturnType<typeof spyFetch>;
const spyFetch = () => vi.spyOn(globalThis, "fetch");

const generationResponse = (item: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify({ data: [item] }), { status, headers: { "Content-Type": "application/json" } });
const imageResponse = () =>
  new Response(Buffer.from([1, 2, 3]), { status: 200, headers: { "Content-Type": "image/png" } });
const isGeneration = (url: unknown) => String(url).endsWith("/images/generations");
const generationCalls = () => fetchMock.mock.calls.filter(([url]) => isGeneration(url));
const generationBody = (i = 0) => JSON.parse(generationCalls()[i][1]!.body as string) as Record<string, unknown>;
const createReturnsInput = () =>
  prismaMocks.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({ id: `img-${String(data.seed)}`, ...data })
  );

beforeEach(() => {
  vi.clearAllMocks();
  registryMocks.getModelConfigSync.mockReturnValue({
    modelId: "test-image-model",
    baseUrl: "https://ark.example/api/v3/",
    apiKey: "k"
  });
  storeMocks.put.mockResolvedValue({ key: "generated-images/x.png", url: "https://blobs/x.png", size: 10 });
  // 默认：生图接口回一个直链，下载直链回 3 个字节的"图"
  fetchMock = spyFetch();
  fetchMock.mockImplementation(async (url) =>
    isGeneration(url) ? generationResponse({ url: "https://cdn.example/out.png" }) : imageResponse()
  );
});

afterEach(() => {
  fetchMock.mockRestore();
  vi.useRealTimers();
});

describe("computePromptHash", () => {
  it("同一份 prompt+seed+model 得到相同 hash", () => {
    expect(computePromptHash("a", 1, "m")).toBe(computePromptHash("a", 1, "m"));
  });

  it("seed 不同 hash 就不同——不能让不同的图撞同一个幂等键", () => {
    expect(computePromptHash("a", 1, "m")).not.toBe(computePromptHash("a", 2, "m"));
    expect(computePromptHash("a", 1, "m")).not.toBe(computePromptHash("a", 1, "n"));
    expect(computePromptHash("a", 1, "m")).not.toBe(computePromptHash("b", 1, "m"));
  });
});

describe("generateAndStoreImage", () => {
  it("命中已有 promptHash 时直接返回旧记录，不重新调用生图模型", async () => {
    prismaMocks.findUnique.mockResolvedValue({
      id: "img-1",
      promptHash: "h",
      prompt: "p",
      model: "test-image-model",
      seed: 1,
      width: 100,
      height: 100,
      url: "https://blobs/old.png"
    });

    const result = await generateAndStoreImage({ prompt: "p", seed: 1, width: 100, height: 100 });

    expect(result.reused).toBe(true);
    expect(result.url).toBe("https://blobs/old.png");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(prismaMocks.create).not.toHaveBeenCalled();
  });

  it("未命中时直连 /images/generations（response_format=url）→ 下载直链 → 落对象存储 → 写库，返回 reused:false", async () => {
    prismaMocks.findUnique.mockResolvedValue(null);
    createReturnsInput();

    const result = await generateAndStoreImage({ prompt: "画一只猫", seed: 7, width: 1024, height: 768 });

    expect(generationCalls()).toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://ark.example/api/v3/images/generations");
    expect(generationBody()).toMatchObject({
      model: "test-image-model",
      prompt: "画一只猫",
      seed: 7,
      size: "1024x768",
      response_format: "url"
    });
    expect(generationBody()).not.toHaveProperty("image");
    expect(fetchMock.mock.calls[1][0]).toBe("https://cdn.example/out.png");

    expect(storeMocks.put).toHaveBeenCalledTimes(1);
    const [key, buffer] = storeMocks.put.mock.calls[0];
    expect(key).toMatch(/^generated-images\/.+\.png$/);
    expect(Buffer.isBuffer(buffer)).toBe(true);

    expect(prismaMocks.create).toHaveBeenCalledTimes(1);
    expect(result.reused).toBe(false);
    expect(result.url).toBe("https://blobs/x.png");
  });

  it("生图模型没返回任何图片时报错，不落一条空记录", async () => {
    vi.useFakeTimers();
    prismaMocks.findUnique.mockResolvedValue(null);
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ data: [] }), { status: 200 }));

    const pending = generateAndStoreImage({ prompt: "p", seed: 1, width: 512, height: 512 });
    const assertion = expect(pending).rejects.toThrow("生图模型没有返回任何图片");
    await vi.runAllTimersAsync();
    await assertion;
    expect(prismaMocks.create).not.toHaveBeenCalled();
  });

  it("请求阶段被掐（fetch failed / other side closed）会重试，第二次成功就正常落库", async () => {
    vi.useFakeTimers();
    prismaMocks.findUnique.mockResolvedValue(null);
    createReturnsInput();
    let calls = 0;
    fetchMock.mockImplementation(async (url) => {
      if (isGeneration(url)) {
        calls += 1;
        if (calls === 1) {
          throw new TypeError("fetch failed", {
            cause: Object.assign(new Error("other side closed"), { code: "UND_ERR_SOCKET" })
          });
        }
        return generationResponse({ url: "https://cdn.example/out.png" });
      }
      return imageResponse();
    });

    const pending = generateAndStoreImage({ prompt: "p", seed: 1, width: 512, height: 512 });
    await vi.runAllTimersAsync();
    const result = await pending;
    expect(calls).toBe(2);
    expect(result.reused).toBe(false);
  });

  it("下载直链失败会单独重试，不用重新生图", async () => {
    vi.useFakeTimers();
    prismaMocks.findUnique.mockResolvedValue(null);
    createReturnsInput();
    let downloads = 0;
    fetchMock.mockImplementation(async (url) => {
      if (isGeneration(url)) {
        return generationResponse({ url: "https://cdn.example/out.png" });
      }
      downloads += 1;
      return downloads === 1 ? new Response("", { status: 502 }) : imageResponse();
    });

    const pending = generateAndStoreImage({ prompt: "p", seed: 1, width: 512, height: 512 });
    await vi.runAllTimersAsync();
    await pending;
    expect(generationCalls()).toHaveLength(1);
    expect(downloads).toBe(2);
  });

  it("4xx 不重试：参数错重试多少次都一样", async () => {
    prismaMocks.findUnique.mockResolvedValue(null);
    fetchMock.mockImplementation(async () => new Response("seed must be between -1 and 2147483647", { status: 400 }));

    await expect(generateAndStoreImage({ prompt: "p", seed: 1, width: 512, height: 512 })).rejects.toThrow(
      "请求失败 400"
    );
    expect(generationCalls()).toHaveLength(1);
  });

  it("seedImageUrl 能反查到 assetStore key 时，同一个 /images/generations 多带 image 字段做 img2img；服务商直接回 b64 也接", async () => {
    prismaMocks.findUnique.mockResolvedValue(null);
    createReturnsInput();
    storeMocks.keyFromUrl.mockReturnValue("generated-images/ref.png");
    storeMocks.get.mockResolvedValue(Buffer.from([9, 9, 9]));
    fetchMock.mockImplementation(async () =>
      generationResponse({ b64_json: Buffer.from([1, 2, 3]).toString("base64") })
    );

    const result = await generateAndStoreImage({
      prompt: "在这张图基础上改配色",
      seed: 1,
      width: 512,
      height: 512,
      seedImageUrl: "https://blobs/ref.png"
    });

    expect(storeMocks.keyFromUrl).toHaveBeenCalledWith("https://blobs/ref.png");
    expect(storeMocks.get).toHaveBeenCalledWith("generated-images/ref.png");
    // 回了 b64 就不需要再下载
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = generationBody();
    expect(body).toMatchObject({ model: "test-image-model", prompt: "在这张图基础上改配色", size: "512x512", seed: 1 });
    expect(body.image).toMatch(/^data:image\/png;base64,/);
    expect(result.reused).toBe(false);
  });

  it("seedImageUrl 不是 assetStore 里的资源时直接报错，不悄悄下载外部图片", async () => {
    prismaMocks.findUnique.mockResolvedValue(null);
    storeMocks.keyFromUrl.mockReturnValue(null);

    await expect(
      generateAndStoreImage({
        prompt: "p",
        seed: 1,
        width: 512,
        height: 512,
        seedImageUrl: "https://evil.example/x.png"
      })
    ).rejects.toThrow("种子图片不是内部 assetStore 的资源");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("同一份 prompt+seed，seedImageUrl 不同则 promptHash 不同——不会互相顶替对方的幂等结果", () => {
    expect(computePromptHash("p", 1, "m", "https://blobs/a.png")).not.toBe(
      computePromptHash("p", 1, "m", "https://blobs/b.png")
    );
    expect(computePromptHash("p", 1, "m")).not.toBe(computePromptHash("p", 1, "m", "https://blobs/a.png"));
  });
});

describe("generateEffectImages", () => {
  it("count 张图用连续 seed（baseSeed, baseSeed+1, ...），不是随机数", async () => {
    prismaMocks.findUnique.mockResolvedValue(null);
    createReturnsInput();

    await generateEffectImages({ prompt: "大屏效果图", baseSeed: 100, width: 1920, height: 1080, count: 2 });

    const seedsUsed = generationCalls()
      .map((_, i) => generationBody(i).seed as number)
      .sort((a, b) => a - b);
    expect(seedsUsed).toEqual([100, 101]);
  });

  it("默认生 2 张", async () => {
    prismaMocks.findUnique.mockResolvedValue(null);
    createReturnsInput();

    const results = await generateEffectImages({ prompt: "p", baseSeed: 0, width: 1920, height: 1080 });
    expect(results).toHaveLength(2);
  });
});
