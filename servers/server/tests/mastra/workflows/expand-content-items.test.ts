import { describe, expect, it } from "vitest";

import { type ContentItem, expandContentItems } from "@/mastra/workflows/requirement-to-bi/types";

/**
 * `expandContentItems` 只做一件事：把多度量的 KPI 项摊成多项单度量。
 * 摊错的后果是「统计卡片区」塌成一个孤零零的翻牌器，见函数注释。
 */
describe("expandContentItems", () => {
  it("多度量 kpi 按度量拆成单度量多项，id 派生自原 id、name 用度量名", () => {
    const items: ContentItem[] = [
      { id: "rain", name: "雨情水位统计卡片", kind: "kpi", measures: ["累计雨量", "实时水位", "超警戒站数"], unit: "mm" }
    ];

    const out = expandContentItems(items);

    expect(out).toEqual([
      { id: "rain__m0", name: "累计雨量", kind: "kpi", measures: ["累计雨量"], unit: "mm" },
      { id: "rain__m1", name: "实时水位", kind: "kpi", measures: ["实时水位"], unit: "mm" },
      { id: "rain__m2", name: "超警戒站数", kind: "kpi", measures: ["超警戒站数"], unit: "mm" }
    ]);
  });

  it("单度量 / 无度量 kpi 原样透传", () => {
    const items: ContentItem[] = [
      { id: "a", name: "实时水位", kind: "kpi", measures: ["水位"], unit: "m" },
      { id: "b", name: "在线站数", kind: "kpi" }
    ];
    expect(expandContentItems(items)).toEqual(items);
  });

  it("rank / share 带多度量不拆——那是合法的分组柱 / 多环", () => {
    const items: ContentItem[] = [
      { id: "r", name: "各站流量对比", kind: "rank", dims: ["站点"], measures: ["入库", "出库"] },
      { id: "s", name: "水源构成", kind: "share", dims: ["水源"], measures: ["占比", "同比"] }
    ];
    expect(expandContentItems(items)).toEqual(items);
  });

  it("带多视图的 kpi 不拆——那是动态面板，拆开会破坏状态语义", () => {
    const items: ContentItem[] = [
      { id: "k", name: "雨量", kind: "kpi", measures: ["日雨量", "月雨量"], views: ["日", "月"] }
    ];
    expect(expandContentItems(items)).toEqual(items);
  });

  it("混合清单只动多度量 kpi，其余保持顺序与内容", () => {
    const items: ContentItem[] = [
      { id: "title", name: "水利防汛态势大屏", kind: "title" },
      { id: "kpi", name: "统计卡片", kind: "kpi", measures: ["雨量", "水位"] },
      { id: "trend", name: "水位趋势", kind: "trend", dims: ["时间"], measures: ["水位"] }
    ];

    const out = expandContentItems(items);

    expect(out.map((i) => i.id)).toEqual(["title", "kpi__m0", "kpi__m1", "trend"]);
    expect(out[0]).toEqual(items[0]);
    expect(out[3]).toEqual(items[2]);
  });
});
