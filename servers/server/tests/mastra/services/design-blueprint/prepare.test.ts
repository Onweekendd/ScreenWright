import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** 内存版 assetStore：put 进去的图 readStoredImage 能读回来，总览图、裁切结果都落在这里 */
const stored = vi.hoisted(() => new Map<string, Buffer>());
const mocks = vi.hoisted(() => ({ generateImage: vi.fn(), put: vi.fn() }));

vi.mock("@/queue/image-client", () => ({ generateImage: mocks.generateImage }));
vi.mock("@/mastra/services/image-generation.server", () => ({ deriveSeed: (prompt: string) => prompt.length }));
vi.mock("@/lib/storage", () => ({ assetStore: () => ({ put: mocks.put }) }));
vi.mock("@/mastra/services/chat-image.server", () => ({
  readStoredImage: async (url: string) => {
    const buffer = stored.get(url);
    return buffer ? { buffer, mime: "image/png" } : null;
  }
}));

import { checkBlueprint } from "@/mastra/services/design-blueprint/check";
import { generationSize, mergePrepared, prepareAssets } from "@/mastra/services/design-blueprint/prepare";
import type { Blueprint, BlueprintInput } from "@/mastra/services/design-blueprint/schema";

const SOURCE_URL = "http://store/effect.png";

const png = (width: number, height: number, color = { r: 10, g: 20, b: 40 }) =>
  sharp({ create: { width, height, channels: 3, background: color } })
    .png()
    .toBuffer();

/** 效果图是画布的 2 倍大（3840×2160），卡片底板所在区域涂成红色，裁切时能验证取对了位置 */
const sourceImage = () =>
  sharp({ create: { width: 3840, height: 2160, channels: 3, background: { r: 0, g: 0, b: 0 } } })
    .composite([
      {
        input: { create: { width: 920, height: 520, channels: 3, background: { r: 255, g: 0, b: 0 } } },
        left: 160,
        top: 240
      }
    ])
    .png()
    .toBuffer();

const input = (): BlueprintInput => ({
  screenKey: "screen_1_1",
  sourceImage: { url: SOURCE_URL, width: 3840, height: 2160 },
  canvas: { width: 1920, height: 1080 },
  style: "深色科技风",
  nodes: [
    { key: "bg", name: "背景", kind: "asset", asset: "bg", region: { x: 0, y: 0, width: 1920, height: 1080 } },
    {
      key: "frame",
      name: "卡片底板",
      kind: "asset",
      asset: "card-frame",
      region: { x: 80, y: 120, width: 460, height: 260 }
    },
    {
      key: "icon",
      name: "图标",
      kind: "asset",
      asset: "icon-power",
      region: { x: 480, y: 130, width: 40, height: 40 }
    },
    { key: "logo", name: "Logo", kind: "asset", asset: "logo", region: { x: 20, y: 20, width: 120, height: 40 } }
  ],
  assets: [
    { key: "bg", name: "背景", source: "generate", prompt: "深蓝渐变背景" },
    { key: "card-frame", name: "卡片底板", source: "crop" },
    { key: "icon-power", name: "电力图标", source: "generate", prompt: "闪电图标" },
    { key: "logo", name: "Logo", source: "reuse", url: "http://store/logo.png" }
  ]
});

const blueprintOf = (value = input()): Blueprint => checkBlueprint(value).blueprint!;

const record = (url: string, width = 1024, height = 1024) => ({
  id: `img-${url}`,
  promptHash: "h",
  prompt: "p",
  model: "m",
  seed: 1,
  width,
  height,
  url,
  reused: false
});

beforeEach(async () => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  stored.clear();
  stored.set(SOURCE_URL, await sourceImage());
  stored.set("http://store/logo.png", await png(240, 80));
  mocks.put.mockImplementation(async (key: string, bytes: Buffer) => {
    const url = `http://store/${key}`;
    stored.set(url, bytes);
    return { url };
  });
  mocks.generateImage.mockImplementation(async ({ prompt }: { prompt: string }) => {
    const url = `http://store/generated/${prompt.length}.png`;
    stored.set(url, await png(1024, 1024));
    return record(url);
  });
});

describe("generationSize", () => {
  it("保持宽高比，长边落在 [1024, 2048]", () => {
    expect(generationSize({ width: 1920, height: 1080 })).toEqual({ width: 1920, height: 1080 });
    expect(generationSize({ width: 48, height: 48 })).toEqual({ width: 1024, height: 1024 });
    expect(generationSize({ width: 4000, height: 1000 })).toEqual({ width: 2048, height: 512 });
    expect(generationSize({ width: 100, height: 300 })).toEqual({ width: 341, height: 1024 });
  });

  it("极端宽高比夹到 4:1，交给 objectFit 拉伸", () => {
    expect(generationSize({ width: 1920, height: 80 })).toEqual({ width: 1920, height: 480 });
  });
});

describe("prepareAssets", () => {
  it("生图带上统一风格和按目标尺寸算出的请求尺寸，结果写回素材", async () => {
    const { blueprint, results } = await prepareAssets(blueprintOf());

    expect(mocks.generateImage).toHaveBeenCalledWith({
      prompt: "深色科技风。深蓝渐变背景",
      seed: "深色科技风。深蓝渐变背景".length,
      width: 1920,
      height: 1080
    });
    expect(mocks.generateImage).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: "深色科技风。闪电图标", width: 1024, height: 1024 })
    );
    const bg = blueprint.assets.find((a) => a.key === "bg")!;
    expect(bg).toMatchObject({ status: "ready", resultSize: { width: 1024, height: 1024 } });
    expect(bg.imageId).toBe(`img-${bg.resultUrl}`);
    expect(results.every((r) => r.status === "ready")).toBe(true);
  });

  it("cropRegion 按声明的效果图尺寸读，声明尺寸与真实像素不同时等比换到真实像素", async () => {
    // 模型以为效果图是 1920×1080（看到的是缩过的图），实际文件 3840×2160：红块在声明坐标里是 (80,120,460,260)
    const value = input();
    value.sourceImage = { url: SOURCE_URL, width: 1920, height: 1080 };
    value.assets[1].cropRegion = { x: 80, y: 120, width: 460, height: 260 };

    const { blueprint } = await prepareAssets(blueprintOf(value));

    const frame = blueprint.assets.find((a) => a.key === "card-frame")!;
    expect(frame.resultSize).toEqual({ width: 920, height: 520 });
    const { data, info } = await sharp(stored.get(frame.resultUrl!)!).raw().toBuffer({ resolveWithObject: true });
    expect([...data.subarray(0, 3)]).toEqual([255, 0, 0]);
    const last = (info.width * info.height - 1) * info.channels;
    expect([...data.subarray(last, last + 3)]).toEqual([255, 0, 0]);
  });

  it("同一版面不写 cropRegion 时按节点位置等比换算，取的正是那块区域", async () => {
    const { blueprint } = await prepareAssets(blueprintOf());

    const frame = blueprint.assets.find((a) => a.key === "card-frame")!;
    expect(frame.resultSize).toEqual({ width: 920, height: 520 });
    const { data, info } = await sharp(stored.get(frame.resultUrl!)!).raw().toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([920, 520]);
    // 四个角都是红的：没有多裁到黑底
    const at = (x: number, y: number) => [
      ...data.subarray((y * info.width + x) * info.channels, (y * info.width + x) * info.channels + 3)
    ];
    expect([at(0, 0), at(919, 0), at(0, 519), at(919, 519)]).toEqual(Array(4).fill([255, 0, 0]));
    expect(mocks.put).toHaveBeenCalledWith(
      expect.stringMatching(/^blueprint-assets\/screen_1_1\/card-frame-[0-9a-f]{16}\.png$/),
      expect.any(Buffer),
      { contentType: "image/png" }
    );
  });

  it("复用的图片读得到就直接用它的 url 和真实尺寸", async () => {
    const { blueprint } = await prepareAssets(blueprintOf());

    expect(blueprint.assets.find((a) => a.key === "logo")).toMatchObject({
      status: "ready",
      resultUrl: "http://store/logo.png",
      resultSize: { width: 240, height: 80 }
    });
  });

  it("单项失败只标记这一项并记下原因，其它项照常完成", async () => {
    mocks.generateImage.mockImplementation(async ({ prompt }: { prompt: string }) => {
      if (prompt.includes("闪电")) {
        throw new Error("生图服务 500");
      }
      const url = "http://store/generated/bg.png";
      stored.set(url, await png(1024, 1024));
      return record(url);
    });
    stored.delete("http://store/logo.png");

    const { results } = await prepareAssets(blueprintOf());

    expect(Object.fromEntries(results.map((r) => [r.key, [r.status, r.error]]))).toEqual({
      bg: ["ready", undefined],
      "card-frame": ["ready", undefined],
      "icon-power": ["failed", "生图服务 500"],
      logo: ["failed", "不是本系统里的图片，无法复用：http://store/logo.png"]
    });
  });

  it("默认只做没就绪的；传 keys 时只做指定的，未知 key 直接报错", async () => {
    const first = await prepareAssets(blueprintOf());
    mocks.generateImage.mockClear();

    const again = await prepareAssets(first.blueprint);
    expect(again.results).toEqual([]);
    expect(mocks.generateImage).not.toHaveBeenCalled();

    const only = await prepareAssets(first.blueprint, { keys: ["icon-power"] });
    expect(only.results.map((r) => r.key)).toEqual(["icon-power"]);
    await expect(prepareAssets(first.blueprint, { keys: ["nope"] })).rejects.toThrow("素材清单里没有这些 key：nope");
  });

  it("同时在途的生图请求不超过 IMAGE_BATCH_CONCURRENCY", async () => {
    vi.stubEnv("IMAGE_BATCH_CONCURRENCY", "2");
    const many = input();
    for (let i = 0; i < 6; i++) {
      many.nodes.push({
        key: `n${i}`,
        name: `n${i}`,
        kind: "asset",
        asset: `a${i}`,
        region: { x: i * 100, y: 500, width: 80, height: 80 }
      });
      many.assets.push({ key: `a${i}`, name: `a${i}`, source: "generate", prompt: `图标 ${i}` });
    }
    let inFlight = 0;
    let peak = 0;
    mocks.generateImage.mockImplementation(async ({ prompt }: { prompt: string }) => {
      peak = Math.max(peak, ++inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight--;
      return record(`http://store/generated/${prompt}.png`);
    });

    await prepareAssets(blueprintOf(many));

    expect(peak).toBe(2);
  });

  it("本次准备好的素材拼成一张总览图，keys 记下图里的顺序", async () => {
    const { sheet } = await prepareAssets(blueprintOf());

    expect(sheet!.keys).toEqual(["bg", "card-frame", "icon-power", "logo"]);
    const meta = await sharp(stored.get(sheet!.url)!).metadata();
    expect(meta.format).toBe("jpeg");
    // 4 张排成 2×2
    expect([meta.width, meta.height]).toEqual([16 + 2 * (360 + 16), 16 + 2 * (240 + 16)]);
  });
});

describe("mergePrepared", () => {
  it("准备期间蓝图被改写：规格没变的写回结果，规格改了的保持新蓝图里的 pending", async () => {
    const before = blueprintOf();
    const { blueprint: prepared, results } = await prepareAssets(before);

    const edited = input();
    edited.assets.find((a) => a.key === "icon-power")!.prompt = "闪电图标，换个造型";
    const latest = checkBlueprint(edited, before).blueprint!;

    const merged = mergePrepared(
      latest,
      prepared,
      results.map((r) => r.key)
    );

    expect(merged.assets.map((a) => [a.key, a.status])).toEqual([
      ["bg", "ready"],
      ["card-frame", "ready"],
      ["icon-power", "pending"],
      ["logo", "ready"]
    ]);
  });
});
