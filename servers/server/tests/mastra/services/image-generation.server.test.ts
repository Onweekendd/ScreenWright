import { createHash } from "node:crypto";

import sharp from "sharp";
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
  generateEffectImages,
  imagesEndpoint,
  prepareReference
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

/**
 * 接入 gpt-image（中转网关）：请求格式与方舟不同，且实际出图尺寸以服务商为准。
 */
describe("gpt-image 网关", () => {
  const png = (width: number, height: number) =>
    sharp({ create: { width, height, channels: 3, background: "#123456" } })
      .png()
      .toBuffer();

  beforeEach(() => {
    registryMocks.getModelConfigSync.mockReturnValue({
      modelId: "gpt-image-2",
      baseUrl: "https://llm-api.net/v1",
      apiKey: "k"
    });
    prismaMocks.findUnique.mockResolvedValue(null);
    createReturnsInput();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("文生图：发到 /v1/images/generations，body 里没有 seed / watermark / response_format，size 换成它接受的 2048x1152", async () => {
    await generateAndStoreImage({ prompt: "大屏背景", seed: 3, width: 1920, height: 1080 });

    expect(fetchMock.mock.calls[0][0]).toBe("https://llm-api.net/v1/images/generations");
    expect(generationBody()).toEqual({ model: "gpt-image-2", prompt: "大屏背景", n: 1, size: "2048x1152" });
  });

  it("记录的宽高是实际出图的尺寸，而不是请求值", async () => {
    fetchMock.mockImplementation(async (url) =>
      isGeneration(url) ? generationResponse({ b64_json: (await png(2048, 1152)).toString("base64") }) : imageResponse()
    );

    const result = await generateAndStoreImage({ prompt: "p", seed: 1, width: 1920, height: 1080 });

    expect([result.width, result.height]).toEqual([2048, 1152]);
    expect(prismaMocks.create.mock.calls[0][0].data).toMatchObject({ width: 2048, height: 1152 });
  });

  it("图片不是标准图片、读不出尺寸时，退回请求的宽高", async () => {
    const result = await generateAndStoreImage({ prompt: "p", seed: 1, width: 1920, height: 1080 });

    expect([result.width, result.height]).toEqual([1920, 1080]);
  });

  it("网关把图按对话补全格式夹在文本里返回时也能取到", async () => {
    fetchMock.mockImplementation(async (url) =>
      isGeneration(url)
        ? new Response(
            JSON.stringify({
              choices: [{ message: { role: "assistant", content: "![img](https://cdn.example.com/o.png)" } }]
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        : imageResponse()
    );

    await generateAndStoreImage({ prompt: "p", seed: 1, width: 1024, height: 1024 });

    expect(fetchMock.mock.calls[1][0]).toBe("https://cdn.example.com/o.png");
    expect(storeMocks.put).toHaveBeenCalledTimes(1);
  });

  it("图生图：走 /images/edits，multipart 里带缩小后的参考图", async () => {
    const screenshot = await sharp({ create: { width: 1920, height: 1080, channels: 3, background: "#0b2a44" } })
      .jpeg()
      .toBuffer();
    storeMocks.keyFromUrl.mockReturnValue("chat-images/c/shot.jpg");
    storeMocks.get.mockResolvedValue(screenshot);
    // 图生图的端点是 /images/edits，默认的假 fetch 只认 /images/generations
    fetchMock.mockImplementation(async (url) =>
      String(url).endsWith("/images/edits")
        ? generationResponse({ b64_json: Buffer.from([1, 2, 3]).toString("base64") })
        : imageResponse()
    );

    await generateAndStoreImage({
      prompt: "按这张截图的色调出配套素材",
      seed: 1,
      width: 1920,
      height: 1080,
      seedImageUrls: ["https://blobs/chat-images/c/shot.jpg"]
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://llm-api.net/v1/images/edits");
    const form = (init as RequestInit).body as FormData;
    const sent = await sharp(Buffer.from(await (form.get("image") as File).arrayBuffer())).metadata();
    expect(sent.width).toBe(1280);
    expect((init as RequestInit).headers).not.toHaveProperty("Content-Type");
  });

  it("配了 IMAGE_PROMPT_MAX_CHARS 时，超长提示词在发请求前就拦下，并说明要精简到多少字", async () => {
    vi.stubEnv("IMAGE_PROMPT_MAX_CHARS", "1000");

    await expect(
      generateAndStoreImage({ prompt: "景".repeat(1200), seed: 1, width: 1024, height: 1024 })
    ).rejects.toThrow(/1200 字.*上限 1000 字/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("没配上限时不拦长提示词", async () => {
    await generateAndStoreImage({ prompt: "景".repeat(1200), seed: 1, width: 1024, height: 1024 });

    expect(generationCalls()).toHaveLength(1);
  });
});

describe("prepareReference", () => {
  const solid = (width: number, height: number) =>
    sharp({ create: { width, height, channels: 3, background: "#123456" } })
      .png()
      .toBuffer();

  it("长边超过 1280 时等比缩小并转 JPEG", async () => {
    const out = await prepareReference(await solid(2000, 1000));

    expect(await sharp(out).metadata()).toMatchObject({ format: "jpeg", width: 1280, height: 640 });
  });

  it("本来就小的图不放大", async () => {
    const out = await prepareReference(await solid(400, 300));

    expect(await sharp(out).metadata()).toMatchObject({ width: 400, height: 300 });
  });

  it("不是图片时原样放行，让服务商给出明确的 4xx，而不是在这里换一种报错", async () => {
    const garbage = Buffer.from([9, 9, 9]);

    expect(await prepareReference(garbage)).toBe(garbage);
  });
});

/**
 * baseUrl 填成完整的 `.../images/generations` 时，方舟对拼重复的路径回 500 InternalServiceError，
 * 看着像服务商故障，实际是配置问题——两种写法都得落到同一个地址上。
 */
describe("imagesEndpoint", () => {
  const expected = "https://ark.example/api/v3/images/generations";

  it.each([
    ["只写到 /api/v3", "https://ark.example/api/v3"],
    ["带结尾斜杠", "https://ark.example/api/v3/"],
    ["误填了完整路径", "https://ark.example/api/v3/images/generations"],
    ["完整路径 + 结尾斜杠", "https://ark.example/api/v3/images/generations/"]
  ])("%s：落到同一个地址", (_name, baseUrl) => {
    expect(imagesEndpoint(baseUrl)).toBe(expected);
  });

  it("请求真的发到去重后的地址，而不是 /images/generations/images/generations", async () => {
    registryMocks.getModelConfigSync.mockReturnValue({
      modelId: "test-image-model",
      baseUrl: "https://ark.example/api/v3/images/generations",
      apiKey: "k"
    });
    prismaMocks.findUnique.mockResolvedValue(null);
    createReturnsInput();

    await generateAndStoreImage({ prompt: "p", seed: 1, width: 1024, height: 768 });

    expect(fetchMock.mock.calls[0][0]).toBe(expected);
  });
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

  it("参考图能反查到 assetStore key 时，同一个 /images/generations 多带 image 字段做 img2img；服务商直接回 b64 也接", async () => {
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
      seedImageUrls: ["https://blobs/ref.png"]
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

  it("参考图（如 1920×1080 的画布截图）发出去前被缩到长边 ≤1280 的 JPEG，请求体里带的是缩小后的那份", async () => {
    const screenshot = await sharp({
      create: { width: 1920, height: 1080, channels: 3, background: "#0b2a44" }
    })
      .jpeg()
      .toBuffer();
    prismaMocks.findUnique.mockResolvedValue(null);
    createReturnsInput();
    storeMocks.keyFromUrl.mockReturnValue("chat-images/c1/shot.jpg");
    storeMocks.get.mockResolvedValue(screenshot);
    fetchMock.mockImplementation(async () =>
      generationResponse({ b64_json: Buffer.from([1, 2, 3]).toString("base64") })
    );

    await generateAndStoreImage({
      prompt: "按这张截图的色调出配套素材",
      seed: 1,
      width: 1280,
      height: 720,
      seedImageUrls: ["https://blobs/chat-images/c1/shot.jpg"]
    });

    const image = generationBody().image as string;
    expect(image).toMatch(/^data:image\/jpeg;base64,/);
    const sent = await sharp(Buffer.from(image.split(",")[1], "base64")).metadata();
    expect(sent).toMatchObject({ format: "jpeg", width: 1280, height: 720 });
  });

  it("参考图不是 assetStore 里的资源时直接报错，不悄悄下载外部图片", async () => {
    prismaMocks.findUnique.mockResolvedValue(null);
    storeMocks.keyFromUrl.mockReturnValue(null);

    await expect(
      generateAndStoreImage({
        prompt: "p",
        seed: 1,
        width: 512,
        height: 512,
        seedImageUrls: ["https://evil.example/x.png"]
      })
    ).rejects.toThrow("种子图片不是内部 assetStore 的资源");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("同一份 prompt+seed，参考图不同则 promptHash 不同——不会互相顶替对方的幂等结果", () => {
    expect(computePromptHash("p", 1, "m", ["https://blobs/a.png"])).not.toBe(
      computePromptHash("p", 1, "m", ["https://blobs/b.png"])
    );
    expect(computePromptHash("p", 1, "m")).not.toBe(computePromptHash("p", 1, "m", ["https://blobs/a.png"]));
  });

  it("没有参考图或只有一张时，hash 与改成多张之前的口径一致，已生成过的图照样命中", () => {
    const legacy = (seedImageUrl?: string) =>
      createHash("sha256")
        .update(JSON.stringify({ prompt: "p", seed: 1, model: "m", seedImageUrl }))
        .digest("hex");

    expect(computePromptHash("p", 1, "m")).toBe(legacy());
    expect(computePromptHash("p", 1, "m", [])).toBe(legacy());
    expect(computePromptHash("p", 1, "m", ["https://blobs/a.png"])).toBe(legacy("https://blobs/a.png"));
  });

  it("多张参考图：顺序也算在 hash 里（第 1 张定构图、第 2 张定风格，换了顺序是另一张图）", () => {
    const ab = computePromptHash("p", 1, "m", ["https://blobs/a.png", "https://blobs/b.png"]);

    expect(ab).not.toBe(computePromptHash("p", 1, "m", ["https://blobs/b.png", "https://blobs/a.png"]));
    expect(ab).not.toBe(computePromptHash("p", 1, "m", ["https://blobs/a.png"]));
  });

  it("多张参考图按顺序各自读出、缩小，一起发给服务商；任何一张不是内部资源都直接报错", async () => {
    prismaMocks.findUnique.mockResolvedValue(null);
    createReturnsInput();
    storeMocks.keyFromUrl.mockImplementation((url: string) =>
      url.startsWith("https://blobs/") ? url.slice("https://blobs/".length) : null
    );
    storeMocks.get.mockImplementation(async (key: string) =>
      sharp({ create: { width: key === "a.png" ? 2560 : 640, height: 720, channels: 3, background: "#123456" } })
        .png()
        .toBuffer()
    );
    fetchMock.mockImplementation(async () =>
      generationResponse({ b64_json: Buffer.from([1, 2, 3]).toString("base64") })
    );

    await generateAndStoreImage({
      prompt: "第 1 张定构图，第 2 张定风格",
      seed: 1,
      width: 1280,
      height: 720,
      seedImageUrls: ["https://blobs/a.png", "https://blobs/b.png"]
    });

    const images = generationBody().image as string[];
    expect(images).toHaveLength(2);
    // 生成记录存下参考图（按顺序），素材库的血缘从这里追
    expect(prismaMocks.create.mock.calls[0][0].data.referenceUrls).toEqual([
      "https://blobs/a.png",
      "https://blobs/b.png"
    ]);
    const sizes = await Promise.all(
      images.map((image) => sharp(Buffer.from(image.split(",")[1], "base64")).metadata())
    );
    // 第 1 张 2560×720 缩到长边 1280，第 2 张本来就小、原样；顺序不变
    expect(sizes.map(({ width, height }) => [width, height])).toEqual([
      [1280, 360],
      [640, 720]
    ]);

    fetchMock.mockClear();
    await expect(
      generateAndStoreImage({
        prompt: "p",
        seed: 2,
        width: 512,
        height: 512,
        seedImageUrls: ["https://blobs/a.png", "https://evil.example/x.png"]
      })
    ).rejects.toThrow("种子图片不是内部 assetStore 的资源，无法解析：https://evil.example/x.png");
    expect(fetchMock).not.toHaveBeenCalled();
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
