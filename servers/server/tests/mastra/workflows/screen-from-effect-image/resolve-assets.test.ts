import { beforeEach, describe, expect, it, vi } from "vitest";

const storeMocks = vi.hoisted(() => ({ put: vi.fn(), keyFromUrl: vi.fn(), get: vi.fn() }));
vi.mock("@/lib/storage", () => ({
  assetStore: () => storeMocks
}));

const genMocks = vi.hoisted(() => ({ generateAndStoreImage: vi.fn() }));
vi.mock("@/mastra/services/image-generation.server", () => ({
  generateAndStoreImage: genMocks.generateAndStoreImage
}));

import sharp from "sharp";

import {
  boundsToPixelBox,
  fitGenerationSize,
  groupAssetRegions,
  produceRepresentativeAsset
} from "@/mastra/workflows/screen-from-effect-image/steps/resolve-assets";
import type { EffectImageRegion } from "@/mastra/workflows/screen-from-effect-image/types";

const asset = (id: string, role: string, bounds: EffectImageRegion["bounds"]): EffectImageRegion => ({
  id,
  kind: "asset",
  role,
  bounds,
  confidence: 0.9,
  hasBakedText: false
});

describe("groupAssetRegions", () => {
  it("card-frame 不管宽高比一律一组，代表取宽高比居中的那个（拉伸失真最小）", () => {
    const groups = groupAssetRegions([
      asset("wide", "card-frame", [0, 0, 600, 200]),
      asset("mid", "card-frame", [0, 0, 300, 200]),
      asset("tall", "card-frame", [0, 0, 200, 400]),
      asset("t", "title-bar", [0, 0, 1000, 80])
    ]);
    expect(groups).toHaveLength(2);
    const cards = groups.find((g) => g.role === "card-frame")!;
    expect(cards.representative.id).toBe("mid");
    expect(cards.members.map((m) => m.id).sort()).toEqual(["mid", "tall", "wide"]);
  });

  it("decoration 按宽高比细分（横光带 vs 竖分隔线不是同一个东西）", () => {
    const groups = groupAssetRegions([
      asset("h", "decoration", [0, 0, 400, 20]),
      asset("v", "decoration", [0, 0, 20, 400])
    ]);
    expect(groups).toHaveLength(2);
  });

  it("不认识的 role 归到 decoration", () => {
    const [g] = groupAssetRegions([asset("x", "whatever", [0, 0, 100, 100])]);
    expect(g.role).toBe("decoration");
  });
});

describe("fitGenerationSize", () => {
  it("任何宽高比都满足服务商最小面积，且边长是 8 的倍数", () => {
    for (const aspect of [0.02, 0.2, 0.5, 1, 1.78, 4, 12.5, 40]) {
      const { width, height } = fitGenerationSize(aspect);
      expect(width * height).toBeGreaterThanOrEqual(921_600);
      expect(width % 8).toBe(0);
      expect(height % 8).toBe(0);
      expect(Math.max(width, height)).toBeLessThanOrEqual(4096);
    }
  });
});

describe("boundsToPixelBox", () => {
  it("左上向下取整、右下向上取整，且不出图", () => {
    expect(boundsToPixelBox([1, 1, 999, 999], 1920, 1080)).toEqual([1, 1, 1919, 1079]);
    expect(boundsToPixelBox([0, 0, 1000, 1000], 1920, 1080)).toEqual([0, 0, 1920, 1080]);
  });
});

describe("produceRepresentativeAsset", () => {
  let image: Buffer;
  beforeEach(async () => {
    vi.clearAllMocks();
    image = await sharp({ create: { width: 200, height: 100, channels: 3, background: "#123456" } })
      .png()
      .toBuffer();
    storeMocks.put.mockImplementation(async (key: string) => ({ url: `http://x/blobs/${key}` }));
  });

  const group = {
    role: "card-frame" as const,
    representative: asset("c1", "card-frame", [0, 0, 500, 500]),
    members: []
  };

  it("先把代表裁进 assetStore 当参考图，再 img2img 生成，返回生成结果", async () => {
    genMocks.generateAndStoreImage.mockResolvedValue({ url: "http://x/blobs/generated-images/abc.png" });
    const result = await produceRepresentativeAsset({
      imageId: "img1",
      imageBuffer: image,
      imageWidth: 200,
      imageHeight: 100,
      group,
      groupIndex: 0
    });
    expect(storeMocks.put).toHaveBeenCalledWith(
      expect.stringMatching(/^effect-image-assets\/img1\/card-frame-0-[0-9a-f]{12}\.jpg$/),
      expect.any(Buffer),
      { contentType: "image/jpeg" }
    );
    const call = genMocks.generateAndStoreImage.mock.calls[0][0];
    expect(call.seedImageUrl).toBe(`http://x/blobs/${storeMocks.put.mock.calls[0][0]}`);
    expect(call.width * call.height).toBeGreaterThanOrEqual(921_600);
    expect(result).toEqual({ url: "http://x/blobs/generated-images/abc.png", generated: true });
  });

  it("生图失败时降级为参考图本身，链路不断", async () => {
    genMocks.generateAndStoreImage.mockRejectedValue(new Error("没配生图模型"));
    const result = await produceRepresentativeAsset({
      imageId: "img1",
      imageBuffer: image,
      imageWidth: 200,
      imageHeight: 100,
      group,
      groupIndex: 2
    });
    expect(result).toEqual({ url: `http://x/blobs/${storeMocks.put.mock.calls[0][0]}`, generated: false });
    expect(storeMocks.put.mock.calls[0][0]).toMatch(/card-frame-2-[0-9a-f]{12}\.jpg$/);
  });

  it("参考图宽高比超过 16:1 时把裁切框向外扩到 16:1，而不是原样送去被拒", async () => {
    genMocks.generateAndStoreImage.mockResolvedValue({ url: "u" });
    const wide = await sharp({ create: { width: 2000, height: 1000, channels: 3, background: "#000" } })
      .png()
      .toBuffer();
    await produceRepresentativeAsset({
      imageId: "img1",
      imageBuffer: wide,
      imageWidth: 2000,
      imageHeight: 1000,
      group: { role: "title-bar", representative: asset("t", "title-bar", [0, 0, 1000, 40]), members: [] },
      groupIndex: 0
    });
    const crop = await sharp(storeMocks.put.mock.calls[0][1] as Buffer).metadata();
    expect(crop.width! / crop.height!).toBeLessThanOrEqual(16);
    // 长边压到 1280 上传，比例保留
    expect(crop.width).toBe(1280);
  });

  it("background 的参考图先糊掉（卡片、文字消失），其它 role 保留原图细节", async () => {
    genMocks.generateAndStoreImage.mockResolvedValue({ url: "u" });
    // 左半黑右半白的图：糊过之后中缝不再是硬边
    const halves = await sharp({
      create: { width: 400, height: 200, channels: 3, background: "#000" }
    })
      .composite([
        { input: { create: { width: 200, height: 200, channels: 3, background: "#fff" } }, left: 200, top: 0 }
      ])
      .png()
      .toBuffer();
    const bgGroup = {
      role: "background" as const,
      representative: asset("bg", "background", [0, 0, 1000, 1000]),
      members: []
    };
    await produceRepresentativeAsset({
      imageId: "img1",
      imageBuffer: halves,
      imageWidth: 400,
      imageHeight: 200,
      group: bgGroup,
      groupIndex: 0
    });
    const ref = sharp(storeMocks.put.mock.calls[0][1] as Buffer);
    const { width, height } = await ref.metadata();
    expect([width, height]).toEqual([400, 200]);
    const { data: raw, info } = await ref.raw().toBuffer({ resolveWithObject: true });
    const at = (x: number) => raw[(100 * 400 + x) * info.channels];
    expect(at(198)).toBeGreaterThan(30);
    expect(at(202)).toBeLessThan(225);

    vi.clearAllMocks();
    storeMocks.put.mockImplementation(async (key: string) => ({ url: `http://x/blobs/${key}` }));
    await produceRepresentativeAsset({
      imageId: "img1",
      imageBuffer: halves,
      imageWidth: 400,
      imageHeight: 200,
      group: { ...group, representative: asset("c", "card-frame", [0, 0, 1000, 1000]) },
      groupIndex: 0
    });
    const { data: sharpRaw, info: sharpInfo } = await sharp(storeMocks.put.mock.calls[0][1] as Buffer)
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(sharpRaw[(100 * 400 + 198) * sharpInfo.channels]).toBe(0);
    expect(sharpRaw[(100 * 400 + 202) * sharpInfo.channels]).toBe(255);
  });

  it("seed 落在 int32 正数范围内（方舟与 Prisma Int 的上限）", async () => {
    genMocks.generateAndStoreImage.mockResolvedValue({ url: "u" });
    await produceRepresentativeAsset({
      imageId: "img1",
      imageBuffer: image,
      imageWidth: 200,
      imageHeight: 100,
      group,
      groupIndex: 0
    });
    const seed = genMocks.generateAndStoreImage.mock.calls[0][0].seed;
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(2147483647);
  });

  it("同一张图同一组的 seed 稳定，重跑命中幂等", async () => {
    genMocks.generateAndStoreImage.mockResolvedValue({ url: "u" });
    const input = { imageId: "img1", imageBuffer: image, imageWidth: 200, imageHeight: 100, group, groupIndex: 0 };
    await produceRepresentativeAsset(input);
    await produceRepresentativeAsset(input);
    const [a, b] = genMocks.generateAndStoreImage.mock.calls.map((c) => c[0].seed);
    expect(a).toBe(b);
  });
});
