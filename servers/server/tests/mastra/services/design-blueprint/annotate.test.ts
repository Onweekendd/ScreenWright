import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";

const stored = vi.hoisted(() => new Map<string, Buffer>());
const mocks = vi.hoisted(() => ({ put: vi.fn() }));

vi.mock("@/lib/storage", () => ({ assetStore: () => ({ put: mocks.put }) }));
vi.mock("@/mastra/services/chat-image.server", () => ({
  readStoredImage: async (url: string) => {
    const buffer = stored.get(url);
    return buffer ? { buffer, mime: "image/png" } : null;
  }
}));

import {
  annotateBlueprint,
  annotationSvg,
  KIND_COLORS,
  renderBlueprintAnnotations
} from "@/mastra/services/design-blueprint/annotate";
import { checkBlueprint } from "@/mastra/services/design-blueprint/check";
import type { Blueprint, BlueprintInput } from "@/mastra/services/design-blueprint/schema";

const SOURCE_URL = "http://store/effect.png";

const png = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } } })
    .png()
    .toBuffer();

/** 同一版面：效果图 3840×2160，画布 1920×1080 */
const input = (): BlueprintInput => ({
  screenKey: "screen_1_1",
  sourceImage: { url: SOURCE_URL, width: 3840, height: 2160 },
  canvas: { width: 1920, height: 1080 },
  nodes: [
    { key: "card", name: "实时负荷卡片", kind: "group", region: { x: 80, y: 120, width: 460, height: 260 } },
    {
      key: "frame",
      name: "卡片底板",
      kind: "asset",
      asset: "card-frame",
      parent: "card",
      region: { x: 80, y: 120, width: 460, height: 260 }
    },
    {
      key: "title",
      name: "标题",
      kind: "component",
      component: "文本",
      parent: "card",
      region: { x: 100, y: 140, width: 200, height: 40 }
    }
  ],
  assets: [{ key: "card-frame", name: "卡片底板", source: "crop" }]
});

const blueprintOf = (value = input()): Blueprint => checkBlueprint(value).blueprint!;

/** 解析 SVG 里的标签底块（有 fill、没有 stroke 的 rect） */
const tagRects = (svg: string) =>
  [...svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="#/g)].map((m) => ({
    x: Number(m[1]),
    y: Number(m[2]),
    width: Number(m[3]),
    height: Number(m[4])
  }));

beforeEach(async () => {
  vi.clearAllMocks();
  stored.clear();
  stored.set(SOURCE_URL, await png(3840, 2160));
  mocks.put.mockImplementation(async (key: string) => ({ url: `http://store/${key}` }));
});

describe("annotationSvg", () => {
  it("标签文字做 XML 转义，用 <text> 写出来", () => {
    const svg = annotationSvg({ width: 800, height: 600 }, [
      { region: { x: 100, y: 100, width: 200, height: 100 }, label: "a <b> & c", color: "#ff0000" }
    ]);

    expect(svg).toContain(">a &lt;b&gt; &amp; c</text>");
  });

  it("位置相同的两个框，标签错开不重叠，并且都贴在框附近", () => {
    const svg = annotationSvg({ width: 800, height: 600 }, [
      { region: { x: 100, y: 100, width: 300, height: 200 }, label: "card 卡片", color: "#ffcc00" },
      { region: { x: 100, y: 100, width: 300, height: 200 }, label: "frame 底板", color: "#ff2dd4" }
    ]);

    const [first, second] = tagRects(svg);
    const overlap =
      first.x < second.x + second.width &&
      second.x < first.x + first.width &&
      first.y < second.y + second.height &&
      second.y < first.y + first.height;
    expect(overlap).toBe(false);
    expect(second.x).toBeLessThan(400);
  });

  it("框贴着图片上沿时标签放进框内，不出图", () => {
    const svg = annotationSvg({ width: 800, height: 600 }, [
      { region: { x: 0, y: 0, width: 800, height: 600 }, label: "bg 背景", color: "#ffcc00" }
    ]);

    expect(tagRects(svg)[0]).toMatchObject({ x: 0, y: 0 });
  });
});

describe("renderBlueprintAnnotations", () => {
  it("同一版面：只出一张画在效果图上的节点标注图，按节点位置换算的裁切框不重复画", async () => {
    const images = await renderBlueprintAnnotations(blueprintOf(), stored.get(SOURCE_URL)!);

    expect(images).toHaveLength(1);
    expect(images[0].label).toContain("画在效果图上");
    expect(images[0].label).not.toContain("红框");
    const meta = await sharp(images[0].image).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(["jpeg", 1280, 720]);
  });

  it("同一版面但单独写了不同的 cropRegion：裁切框也画上，说明里提到红框", async () => {
    const value = input();
    value.assets[0].cropRegion = { x: 2000, y: 1000, width: 900, height: 500 };

    const images = await renderBlueprintAnnotations(blueprintOf(value), stored.get(SOURCE_URL)!);

    expect(images).toHaveLength(1);
    expect(images[0].label).toContain("红框");
  });

  it("重排版面：效果图上画裁切框，另出一张画布尺寸的线框图", async () => {
    const value = input();
    value.sourceImage = { url: SOURCE_URL, width: 1080, height: 1920 };
    value.assets[0].cropRegion = { x: 100, y: 200, width: 460, height: 260 };
    stored.set(SOURCE_URL, await png(1080, 1920));

    const images = await renderBlueprintAnnotations(blueprintOf(value), stored.get(SOURCE_URL)!);

    expect(images.map((image) => image.label.slice(0, 12))).toEqual([
      "设计蓝图裁切标注图（画在",
      "设计蓝图版面线框图（画布"
    ]);
    const meta = await sharp(images[0].image).metadata();
    expect([meta.width, meta.height]).toEqual([720, 1280]);
  });

  it("没有效果图：只出线框图，框线是节点类型对应的颜色", async () => {
    const value = input();
    delete value.sourceImage;
    value.assets = [{ key: "card-frame", name: "卡片底板", source: "generate", prompt: "卡片底板" }];

    const images = await renderBlueprintAnnotations(blueprintOf(value), null);

    expect(images).toHaveLength(1);
    expect(images[0].label).toContain("线框图");
    // 线框图 1920×1080 缩到 1280×720：title 框（100,140,200×40）的左边线在 x≈68，y 取靠下的 117 避开框内标签；
    // 是 component 的青色（JPEG 有色偏，只判断色相）
    expect(KIND_COLORS.component).toBe("#00e5ff");
    const { data, info } = await sharp(images[0].image).raw().toBuffer({ resolveWithObject: true });
    const i = (117 * info.width + 68) * info.channels;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    expect([r < 100, g > 150, b > 150]).toEqual([true, true, true]);
  });
});

describe("annotateBlueprint", () => {
  it("标注图存进素材目录，返回 url 和说明", async () => {
    const images = await annotateBlueprint(blueprintOf());

    expect(images).toHaveLength(1);
    expect(mocks.put).toHaveBeenCalledWith(
      expect.stringMatching(/^blueprint-assets\/screen_1_1\/annotated-0-[0-9a-f]{12}\.jpg$/),
      expect.any(Buffer),
      { contentType: "image/jpeg" }
    );
    expect(images[0].url).toMatch(/^http:\/\/store\/blueprint-assets\//);
  });

  it("效果图读不到时退回只出线框图", async () => {
    stored.delete(SOURCE_URL);

    const images = await annotateBlueprint(blueprintOf());

    expect(images.map((image) => image.label)).toEqual([expect.stringContaining("线框图")]);
  });
});
