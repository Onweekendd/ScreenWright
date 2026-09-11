import { FolderEnum, PanelEnum } from "@screenwright/types";
import { describe, expect, it } from "vitest";

import { buildLayout, buildNestedLayout } from "../../src/mastra/services/bi-data-sync/layout";
import { comp, detail } from "./factories";

const SCREEN = detail({ width: 1920, height: 1080, backgroundColor: "#000" });

describe("buildLayout", () => {
  it("网格像素尺寸由 detail 宽高 24×12 等分；无组件时 ascii_map 为空", () => {
    const layout = buildLayout([], SCREEN);
    expect(layout.grid).toEqual({ cols: 24, rows: 12, colPx: 1920 / 24, rowPx: 1080 / 12 });
    expect(layout.ascii_map).toBe("");
    expect(layout.screen).toMatchObject({ id: 0, width: 1920, height: 1080, bg: "#000" });
  });

  it("组件坐标量化为 1-based 网格占位", () => {
    // colPx=80, rowPx=90 → 960px=12 列、540px=6 行
    const node = buildLayout([comp({ id: 1, left: 0, top: 0, width: 960, height: 540 })], SCREEN).components[0];
    expect(node.rectPx).toEqual({ x: 0, y: 0, w: 960, h: 540 });
    expect(node.grid).toEqual({ colStart: 1, colEnd: 12, rowStart: 1, rowEnd: 6 });
  });

  it("unitPavenType=percent 时按屏幕宽高换算成像素（避免全屏背景被量化成角落小窗）", () => {
    const node = buildLayout(
      [comp({ id: 1, left: 0, top: 0, width: 100, height: 100, unitPavenType: "percent" })],
      SCREEN
    ).components[0];
    expect(node.rectPx).toEqual({ x: 0, y: 0, w: 1920, h: 1080 });
    expect(node.grid).toEqual({ colStart: 1, colEnd: 24, rowStart: 1, rowEnd: 12 });
  });

  it("theme_hints 采样字体众数，颜色过滤掉背景色", () => {
    const layout = buildLayout(
      [
        comp({ id: 1, option: { fontFamily: "Arial", color: "#f00" } }),
        comp({ id: 2, option: { fontFamily: "Arial", color: "#f00" } }),
        comp({ id: 3, option: { fontFamily: "SimSun", color: "#000" } })
      ],
      SCREEN
    );
    expect(layout.theme_hints.fontFamily).toBe("Arial");
    // #000 == bg，被 isOpaqueColor 过滤；仅 #f00 作为 accent
    expect(layout.theme_hints.colors).toEqual({ bg: "#000", accent: "#f00", highlight: "" });
  });

  it("容器组件带 childrenSummary，叶子组件不带", () => {
    const group = comp({ id: 1, prop: FolderEnum.group, children: [comp({ id: 2, title: "文本" })] });
    const leaf = comp({ id: 3 });
    const nodes = buildLayout([group, leaf], SCREEN).components;
    expect(nodes[0].childrenSummary).toEqual({ descendants: 1, byType: { 文本: 1 } });
    expect(nodes[1].childrenSummary).toBeUndefined();
  });
});

describe("buildNestedLayout", () => {
  const container = comp({ id: 1, prop: PanelEnum.dynamicPanel, name: "面板", width: 1200, height: 600 });

  it("动态面板状态：container 含 stateId/stateName，子组件量化到容器网格", () => {
    const child = comp({ id: 2, left: 0, top: 0, width: 600, height: 300, title: "子" });
    const nested = buildNestedLayout(container, [child], { id: "s1", name: "状态一" }, "1_面板/s1_状态一");
    expect(nested.container).toEqual({
      id: 1,
      name: "面板",
      prop: "sw-panel",
      width: 1200,
      height: 600,
      dir: "1_面板/s1_状态一",
      stateId: "s1",
      stateName: "状态一"
    });
    // colPx=50, rowPx=50 → 600px=12 列、300px=6 行
    expect(nested.components[0].grid).toEqual({ colStart: 1, colEnd: 12, rowStart: 1, rowEnd: 6 });
  });

  it("分组场景（无 state）不写 stateId/stateName", () => {
    const group = comp({ id: 1, prop: FolderEnum.group, name: "组", width: 1200, height: 600 });
    const nested = buildNestedLayout(group, [], undefined, "1_组");
    expect(nested.container.stateId).toBeUndefined();
    expect(nested.container.stateName).toBeUndefined();
    expect(nested.container.dir).toBe("1_组");
  });
});
