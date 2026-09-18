import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/storage", () => ({ assetStore: () => ({}) }));
vi.mock("@/mastra/storage/prisma", () => ({ prismaClient: {} }));
vi.mock("@/mastra/agents/effect-image-analyzer-agent", () => ({ effectImageAnalyzerAgent: {} }));
vi.mock("@/mastra/services/image-generation.server", () => ({ generateAndStoreImage: vi.fn() }));

import {
  ensureCardTitleBars,
  groupRegionsIntoCards,
  normalizeEffectImageRegions
} from "@/mastra/workflows/screen-from-effect-image/steps/analyze-effect-image-step";
import type { EffectImageRegion } from "@/mastra/workflows/screen-from-effect-image/types";

const region = (partial: Partial<EffectImageRegion> & Pick<EffectImageRegion, "id" | "kind">): EffectImageRegion => ({
  role: "r",
  bounds: [0, 0, 100, 100],
  confidence: 0.9,
  ...partial
});

describe("normalizeEffectImageRegions", () => {
  it("丢低置信度、太小、倒置的框和模型自作主张的 background", () => {
    const out = normalizeEffectImageRegions([
      region({ id: "ok", kind: "asset" }),
      region({ id: "low", kind: "asset", confidence: 0.3 }),
      region({ id: "tiny", kind: "asset", bounds: [0, 0, 10, 10] }),
      region({ id: "flip", kind: "asset", bounds: [100, 100, 0, 0] }),
      region({ id: "background", kind: "asset", role: "background", bounds: [0, 0, 1000, 1000] })
    ]);
    expect(out.map((r) => r.id)).toEqual(["ok"]);
  });

  it("铺满画布的素材（整屏 outer-frame）当背景丢掉：生成图不透明，落上去会把底图盖住", () => {
    const out = normalizeEffectImageRegions([
      region({ id: "whole", kind: "asset", role: "outer-frame", bounds: [2, 2, 996, 998] }),
      region({ id: "top", kind: "asset", role: "title-bar", bounds: [0, 0, 1000, 80] }),
      region({ id: "big-chart", kind: "component", bounds: [0, 0, 1000, 900] })
    ]);
    expect(out.map((r) => r.id).sort()).toEqual(["big-chart", "top"]);
  });

  it("component 之间去包含：大框吞掉小框就丢大框，但 asset 包含 component 不受影响", () => {
    const out = normalizeEffectImageRegions([
      region({ id: "card", kind: "asset", role: "card-frame", bounds: [0, 0, 500, 500] }),
      region({ id: "chart", kind: "component", bounds: [50, 100, 450, 450] }),
      region({ id: "whole-card-as-chart", kind: "component", bounds: [0, 0, 500, 500] })
    ]);
    expect(out.map((r) => r.id).sort()).toEqual(["card", "chart"]);
  });

  it("输出按 asset → component → text 排序（即画布 z 序）", () => {
    const out = normalizeEffectImageRegions([
      region({ id: "t", kind: "text" }),
      region({ id: "c", kind: "component", bounds: [200, 200, 300, 300] }),
      region({ id: "a", kind: "asset" })
    ]);
    expect(out.map((r) => r.kind)).toEqual(["asset", "component", "text"]);
  });
});

describe("groupRegionsIntoCards", () => {
  it("卡片框里的页签条、标题、图表归进同一组，组内顺序 框 → 页签条 → 文字 → 图表", () => {
    const groups = groupRegionsIntoCards([
      region({ id: "bg", kind: "asset", role: "background", bounds: [0, 0, 1000, 1000] }),
      region({ id: "chart", kind: "component", bounds: [20, 60, 480, 480], contentKind: "trend" }),
      region({ id: "frame", kind: "asset", role: "card-frame", bounds: [0, 0, 500, 500] }),
      region({ id: "tab", kind: "asset", role: "card-title-bar", bounds: [10, 10, 200, 40] }),
      region({ id: "title", kind: "text", role: "card-title", bounds: [20, 12, 150, 38], text: "t" }),
      region({ id: "screen-title", kind: "text", role: "screen-title", bounds: [600, 0, 900, 40] })
    ]);
    expect(groups.map((g) => g.map((r) => r.id))).toEqual([
      ["bg"],
      ["frame", "tab", "title", "chart"],
      ["screen-title"]
    ]);
  });

  it("嵌套框时归到最贴身的小框；只搭了一点边的不算在卡片里", () => {
    const groups = groupRegionsIntoCards([
      region({ id: "outer", kind: "asset", role: "card-frame", bounds: [0, 0, 1000, 1000] }),
      region({ id: "inner", kind: "asset", role: "card-frame", bounds: [0, 0, 500, 500] }),
      region({ id: "c1", kind: "component", bounds: [10, 10, 100, 100] }),
      region({ id: "c2", kind: "component", bounds: [450, 450, 700, 700] })
    ]);
    const byHead = Object.fromEntries(groups.map((g) => [g[0].id, g.slice(1).map((r) => r.id)]));
    expect(byHead.inner).toEqual(["c1"]);
    expect(byHead.outer).toEqual(["c2"]);
  });
});

describe("ensureCardTitleBars", () => {
  it("卡片有标题没页签条时按标题框合成一条，贴到卡片框左内沿、向右向下各扩一点", () => {
    const out = ensureCardTitleBars([
      region({ id: "frame", kind: "asset", role: "card-frame", bounds: [100, 100, 500, 500] }),
      region({ id: "title", kind: "text", role: "card-title", bounds: [120, 110, 250, 130], text: "t" })
    ]);
    const bar = out.find((r) => r.role === "card-title-bar")!;
    expect(bar.id).toBe("frame-title-bar");
    expect(bar.bounds).toEqual([104, 104, 280, 136]);
    expect(bar.hasBakedText).toBe(true);
  });

  it("vision 已经给了页签条的卡片不重复合成；没有标题的卡片也不合成", () => {
    const out = ensureCardTitleBars([
      region({ id: "f1", kind: "asset", role: "card-frame", bounds: [0, 0, 500, 500] }),
      region({ id: "bar1", kind: "asset", role: "card-title-bar", bounds: [10, 10, 200, 40] }),
      region({ id: "t1", kind: "text", role: "card-title", bounds: [20, 12, 150, 38] }),
      region({ id: "f2", kind: "asset", role: "card-frame", bounds: [600, 0, 1000, 500] })
    ]);
    expect(out.filter((r) => r.role === "card-title-bar").map((r) => r.id)).toEqual(["bar1"]);
  });
});
