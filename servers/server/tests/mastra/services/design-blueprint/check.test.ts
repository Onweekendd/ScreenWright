import { afterEach, describe, expect, it, vi } from "vitest";

import { checkBlueprint, effectivePrompt } from "@/mastra/services/design-blueprint/check";
import type { BlueprintInput, BlueprintNode } from "@/mastra/services/design-blueprint/schema";

/** 一块 1920×1080 的大屏：背景 + 一张卡片（底板 + 标题 + 图标），底板和图标是素材 */
const node = (key: string, partial: Partial<BlueprintNode>): BlueprintNode => ({
  key,
  name: key,
  kind: "component",
  component: "文本",
  region: { x: 0, y: 0, width: 100, height: 100 },
  ...partial
});

const baseInput = (): BlueprintInput => ({
  screenKey: "screen_1_1",
  sourceImage: { url: "http://x/effect.png", width: 3840, height: 2160 },
  canvas: { width: 1920, height: 1080 },
  style: "深色科技风，青色发光描边",
  nodes: [
    node("bg", { kind: "asset", component: undefined, asset: "bg", region: { x: 0, y: 0, width: 1920, height: 1080 } }),
    node("card-load", { kind: "group", component: undefined, region: { x: 80, y: 120, width: 460, height: 260 } }),
    node("card-load-title", { parent: "card-load", region: { x: 100, y: 130, width: 200, height: 30 } }),
    node("card-load-icon", {
      parent: "card-load",
      kind: "asset",
      component: undefined,
      asset: "icon-power",
      region: { x: 480, y: 130, width: 40, height: 40 }
    }),
    node("card-load-frame", {
      parent: "card-load",
      kind: "asset",
      component: undefined,
      asset: "card-frame",
      region: { x: 80, y: 120, width: 460, height: 260 }
    })
  ],
  assets: [
    { key: "bg", name: "背景", source: "generate", prompt: "深蓝渐变背景，带细网格" },
    { key: "card-frame", name: "卡片底板", source: "crop" },
    { key: "icon-power", name: "电力图标", source: "generate", prompt: "闪电图标" }
  ]
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("checkBlueprint 结构校验", () => {
  it("合法蓝图通过，节点按父在前、同级从下到上排序，z 补成名次", () => {
    const { errors, blueprint } = checkBlueprint(baseInput());

    expect(errors).toEqual([]);
    expect(blueprint!.nodes.map((n) => [n.key, n.z])).toEqual([
      ["bg", 0],
      ["card-load", 1],
      // 卡内：面积最大的底板在最下，标题（6000）在图标（1600）之下
      ["card-load-frame", 0],
      ["card-load-title", 1],
      ["card-load-icon", 2]
    ]);
  });

  it("显式 z 优先于面积：小的装饰可以压在大元素下面", () => {
    const input = baseInput();
    input.nodes.find((n) => n.key === "card-load-icon")!.z = -1;

    const { blueprint } = checkBlueprint(input);

    const card = blueprint!.nodes.filter((n) => n.parent === "card-load").map((n) => n.key);
    expect(card).toEqual(["card-load-icon", "card-load-frame", "card-load-title"]);
  });

  it("key 重复、父节点不存在、成环都报错，不产出蓝图", () => {
    const input = baseInput();
    input.nodes.push(node("card-load-title", { parent: "card-load" }));
    input.nodes.push(node("orphan", { parent: "nowhere" }));
    input.nodes.push(node("loop-a", { parent: "loop-b" }), node("loop-b", { parent: "loop-a" }));

    const { errors, blueprint } = checkBlueprint(input);

    expect(blueprint).toBeUndefined();
    expect(errors).toEqual(
      expect.arrayContaining([
        "节点 key 重复：card-load-title",
        "节点 orphan 的父节点 nowhere 不存在",
        expect.stringMatching(/成环.*loop-a、loop-b/)
      ])
    );
  });

  it("asset 节点必须引用清单里的素材，非 asset 节点不能引用素材", () => {
    const input = baseInput();
    input.nodes.push(node("ghost", { kind: "asset", component: undefined, asset: "missing" }));
    input.nodes.push(node("bare", { kind: "asset", component: undefined }));
    input.nodes.push(node("text-with-img", { asset: "bg" }));

    const { errors } = checkBlueprint(input);

    expect(errors).toEqual(
      expect.arrayContaining([
        "节点 ghost 引用的素材 missing 不在素材清单里",
        "节点 bare 是 asset 节点，但没有填 asset（素材 key）",
        expect.stringContaining("节点 text-with-img 是 component 节点，只有 kind=asset 的节点能引用素材")
      ])
    );
  });

  it("完全在画布外报错；略微越界或超出父节点只提醒", () => {
    const input = baseInput();
    input.nodes.push(node("far", { region: { x: 3000, y: 0, width: 10, height: 10 } }));
    input.nodes.push(node("spill", { parent: "card-load", region: { x: 70, y: 130, width: 50, height: 20 } }));
    input.nodes.push(node("edge", { region: { x: 1900, y: 0, width: 30, height: 10 } }));

    const { errors, warnings } = checkBlueprint(input);

    expect(errors).toEqual([expect.stringContaining("节点 far 的位置 (3000, 0, 10×10) 完全在画布 1920×1080 之外")]);
    expect(warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("节点 spill 超出父节点 card-load 的范围 10 像素"),
        expect.stringContaining("节点 edge 的位置 (1900, 0, 30×10) 超出画布 10 像素")
      ])
    );
  });
});

describe("checkBlueprint 素材清单", () => {
  it("推导使用方与目标尺寸：多处共用取最大的那处，裁切默认裁第一个使用节点的区域", () => {
    const input = baseInput();
    input.nodes.push(
      node("card-2", { kind: "group", component: undefined, region: { x: 600, y: 120, width: 500, height: 300 } }),
      node("card-2-frame", {
        parent: "card-2",
        kind: "asset",
        component: undefined,
        asset: "card-frame",
        region: { x: 600, y: 120, width: 500, height: 300 }
      }),
      node("card-2-icon", {
        parent: "card-2",
        kind: "asset",
        component: undefined,
        asset: "icon-power",
        region: { x: 1040, y: 130, width: 48, height: 48 }
      })
    );

    const { blueprint } = checkBlueprint(input);

    const icon = blueprint!.assets.find((a) => a.key === "icon-power")!;
    expect(icon.usedBy).toEqual(["card-load-icon", "card-2-icon"]);
    expect(icon.target).toEqual({ width: 48, height: 48 });
    const frame = blueprint!.assets.find((a) => a.key === "card-frame")!;
    expect(frame.cropRegion).toEqual({ x: 80, y: 120, width: 460, height: 260 });
    expect(frame.target).toEqual({ width: 460, height: 260 });
    expect(frame.status).toBe("pending");
  });

  it("按来源检查必填项：生图要 prompt、裁切要效果图、复用要 url；没人用的素材报错", () => {
    const input = baseInput();
    delete input.sourceImage;
    input.assets[0].prompt = " ";
    input.nodes.push(node("old-logo", { kind: "asset", component: undefined, asset: "logo" }));
    input.assets.push({ key: "logo", name: "Logo", source: "reuse" });
    input.assets.push({ key: "unused", name: "多余的", source: "generate", prompt: "x" });

    const { errors } = checkBlueprint(input);

    expect(errors).toEqual(
      expect.arrayContaining([
        "素材 bg 是生图素材，但没有 prompt",
        "素材 card-frame 要从效果图裁切，但蓝图没填 sourceImage",
        "素材 logo 是复用素材，但没有 url",
        expect.stringContaining("素材 unused 没有任何节点使用")
      ])
    );
  });

  it("提示词连同统一风格超过生图服务上限时报错", () => {
    vi.stubEnv("IMAGE_PROMPT_MAX_CHARS", "20");
    const input = baseInput();

    const { errors } = checkBlueprint(input);

    expect(errors).toContainEqual(
      expect.stringMatching(/素材 bg 的提示词连同统一风格共 \d+ 字，超过生图服务上限 20 字/)
    );
  });

  it("条状生图素材宽高比太极端时提醒改用裁切", () => {
    const input = baseInput();
    input.nodes.push(
      node("title-bar", {
        kind: "asset",
        component: undefined,
        asset: "title-bar",
        region: { x: 0, y: 0, width: 1920, height: 80 }
      })
    );
    input.assets.push({ key: "title-bar", name: "标题栏", source: "generate", prompt: "标题栏装饰" });

    const { warnings } = checkBlueprint(input);

    expect(warnings).toContainEqual(expect.stringContaining("素材 title-bar 的宽高比 24.0:1 太极端"));
  });

  it("效果图与画布宽高比不一致时提醒裁切会变形", () => {
    const input = baseInput();
    input.sourceImage = { url: "http://x/e.png", width: 2000, height: 2000 };

    const { warnings } = checkBlueprint(input);

    expect(warnings).toContainEqual(expect.stringContaining("宽高比不同，裁切出的素材会变形"));
  });

  it("重新保存时规格没变的素材沿用上次结果，改了提示词的回到 pending", () => {
    const first = checkBlueprint(baseInput()).blueprint!;
    const prepared = {
      ...first,
      assets: first.assets.map((a) => ({
        ...a,
        status: "ready" as const,
        resultUrl: `http://x/${a.key}.png`,
        resultSize: { width: 1024, height: 1024 }
      }))
    };

    const edited = baseInput();
    edited.nodes[1].name = "实时负荷卡片"; // 只改名，不影响素材
    edited.assets.find((a) => a.key === "icon-power")!.prompt = "闪电图标，带外发光";
    const { blueprint } = checkBlueprint(edited, prepared);

    const status = Object.fromEntries(blueprint!.assets.map((a) => [a.key, [a.status, a.resultUrl]]));
    expect(status).toEqual({
      bg: ["ready", "http://x/bg.png"],
      "card-frame": ["ready", "http://x/card-frame.png"],
      "icon-power": ["pending", undefined]
    });
  });

  it("改了统一风格，所有生图素材都要重做，裁切素材不受影响", () => {
    const first = checkBlueprint(baseInput()).blueprint!;
    const prepared = { ...first, assets: first.assets.map((a) => ({ ...a, status: "ready" as const })) };

    const edited = baseInput();
    edited.style = "浅色商务风";
    const { blueprint } = checkBlueprint(edited, prepared);

    expect(blueprint!.assets.map((a) => [a.key, a.status])).toEqual([
      ["bg", "pending"],
      ["card-frame", "ready"],
      ["icon-power", "pending"]
    ]);
  });
});

describe("effectivePrompt", () => {
  it("统一风格拼在素材提示词前面；没有风格时原样返回", () => {
    expect(effectivePrompt("深色科技风", "闪电图标")).toBe("深色科技风。闪电图标");
    expect(effectivePrompt(undefined, " 闪电图标 ")).toBe("闪电图标");
  });
});
