import { describe, expect, it } from "vitest";

import { chartThemePatch, distinctSeriesNames } from "@/mastra/workflows/screen-from-effect-image/steps/chart-theme";

const rows = (...names: string[]) => names.map((seriesName, i) => ({ seriesName, name: `x${i}`, value: i }));

describe("chartThemePatch", () => {
  it("按 data 里的系列重写 dataSeriesName / seriesName / seriesTabsName，图例名不再是模板的「系列一」", () => {
    const patch = chartThemePatch("echartline", rows("火电", "水电", "火电"), undefined);
    expect(distinctSeriesNames(rows("火电", "水电", "火电"))).toEqual(["火电", "水电"]);
    expect(patch.dataSeriesName).toEqual(["火电", "水电"]);
    expect(patch.seriesName).toEqual(["火电", "水电"]);
    expect(patch.seriesTabsName).toEqual([
      { name: "系列1", value: "火电" },
      { name: "系列2", value: "水电" }
    ]);
    expect(patch.legendShow).toBe(true);
  });

  it("单系列关掉图例；data 为空时不动系列名", () => {
    expect(chartThemePatch("echartstripBar", rows("负载率"), undefined).legendShow).toBe(false);
    expect(chartThemePatch("echartline", [], ["#00ffcc"])).not.toHaveProperty("seriesTabsName");
  });

  it("有 palette 时折线图写 seriesLineColor/seriesItemColor + 渐变对象与 picker 字符串成对", () => {
    const patch = chartThemePatch("echartline", rows("a", "b", "c"), ["#00c8ff", "#ffb400"]);
    expect(patch.seriesLineColor).toEqual(["#00c8ff", "#ffb400", "#00c8ff"]);
    expect(patch.seriesItemColor).toEqual(patch.seriesLineColor);
    const colors = patch.seriesColor as Array<{
      type: string;
      angle: string;
      colors: Array<{ color: string; per: number }>;
    }>;
    expect(colors).toHaveLength(3);
    expect(colors[0].type).toBe("linear-gradient");
    expect(colors[0].angle).toBe("0");
    expect(colors[0].colors[0]).toEqual({ color: "rgba(0,200,255,1)", per: 0 });
    expect(colors[0].colors[1].per).toBe(100);
    const pickers = patch.seriesColorpicker as string[];
    expect(pickers[0]).toMatch(/^linear-gradient\(0\.0deg,#00c8ff 0\.0,#[0-9a-f]{6} 100\.0%\)$/);
  });

  it("条形图渐变 angle 是 90，柱状图是 0；饼图按行给纯色", () => {
    const strip = chartThemePatch("echartstripBar", rows("a"), ["#00c8ff"]);
    expect((strip.seriesColor as Array<{ angle: string }>)[0].angle).toBe("90");
    const bar = chartThemePatch("echartbar", rows("a"), ["#00c8ff"]);
    expect((bar.seriesColor as Array<{ angle: string }>)[0].angle).toBe("0");
    const pie = chartThemePatch("echartpie", rows("a", "b", "c"), ["#111111", "#222222"]);
    expect(pie.seriesColor).toEqual(["#111111", "#222222", "#111111"]);
  });

  it("翻牌器：清掉自带标题、数字用主色；没 palette 也要清标题", () => {
    expect(chartThemePatch("swFlopPerformance", [{ value: 1 }], undefined)).toEqual({ prefixText: "" });
    const themed = chartThemePatch("swFlopPerformance", [{ value: 1 }], ["#00c8ff"]);
    expect(themed.color).toBe("rgba(0,200,255,1)");
    expect(themed.suffixColor).toBe("rgba(0,200,255,1)");
    expect(themed.prefixText).toBe("");
  });

  it("不认识的 prop 只做系列名对齐，不写颜色", () => {
    const patch = chartThemePatch("swScroll", rows("a"), ["#00c8ff"]);
    expect(Object.keys(patch).some((k) => /color/i.test(k))).toBe(false);
  });

  it("ChartSpec：平滑/数值标签按系列数铺成布尔数组，showLegend 明说时覆盖「单系列关图例」", () => {
    const patch = chartThemePatch("echartline", rows("a", "b", "a"), undefined, {
      variant: "line",
      smooth: true,
      showLabel: false,
      showLegend: false
    });
    expect(patch.seriesSmoothShow).toEqual([true, true]);
    expect(patch.seriesLabelShow).toEqual([false, false]);
    expect(patch.legendShow).toBe(false);
    // 没给的开关不动
    expect(chartThemePatch("echartline", rows("a"), undefined, { variant: "line" })).not.toHaveProperty(
      "seriesSmoothShow"
    );
    // 柱状图没有这两个数组
    expect(chartThemePatch("echartbar", rows("a"), undefined, { variant: "bar", smooth: true })).not.toHaveProperty(
      "seriesSmoothShow"
    );
  });

  it("面积折线图：写线/点/面积填充色，不碰形状不同的 seriesColor", () => {
    const patch = chartThemePatch("echartareaLine", rows("a", "b"), ["#00c8ff", "#ffb400"]);
    expect(patch.seriesLineColor).toEqual(["#00c8ff", "#ffb400"]);
    expect(patch.seriesItemColor).toEqual(["#00c8ff", "#ffb400"]);
    expect((patch.seriesAreaColor as Array<{ type: string }>)[0].type).toBe("linear-gradient");
    expect(patch).not.toHaveProperty("seriesColor");
  });

  it("雷达图面积色带 0.2 透明度；漏斗按行给色", () => {
    const radar = chartThemePatch("echartradar", rows("a"), ["#00c8ff"]);
    expect(radar.seriesAreaColor).toEqual(["rgba(0,200,255,0.2)"]);
    const funnel = chartThemePatch("echartfunnel", rows("a", "b", "c"), ["#111111", "#222222"]);
    expect(funnel.seriesColor).toEqual(["#111111", "#222222", "#111111"]);
  });
});
