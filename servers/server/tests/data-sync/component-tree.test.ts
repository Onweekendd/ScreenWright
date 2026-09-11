import { FolderEnum, PanelEnum } from "@screenwright/types";
import { describe, expect, it } from "vitest";

import {
  childConfigGroups,
  collectIncomingIds,
  flattenComponents,
  summarizeSubtree
} from "../../src/mastra/services/bi-data-sync/component-tree";
import { comp } from "./factories";

describe("childConfigGroups", () => {
  it("叶子组件返回空数组", () => {
    expect(childConfigGroups(comp({ id: 1 }))).toEqual([]);
  });

  it("分组组件返回 children 一组", () => {
    const child = comp({ id: 2 });
    const group = comp({ id: 1, prop: FolderEnum.group, children: [child] });
    expect(childConfigGroups(group)).toEqual([[child]]);
  });

  it("动态面板返回各状态 config，并过滤空状态", () => {
    const a = comp({ id: 2 });
    const b = comp({ id: 3 });
    const panel = comp({
      id: 1,
      prop: PanelEnum.dynamicPanel,
      panelData: [
        { id: "s1", name: "状态1", config: [a] },
        { id: "s2", name: "空状态", config: [] },
        { id: "s3", name: "状态3", config: [b] }
      ]
    });
    expect(childConfigGroups(panel)).toEqual([[a], [b]]);
  });
});

describe("flattenComponents", () => {
  it("按深度优先递归平铺分组与动态面板子组件", () => {
    const leaf = comp({ id: 3 });
    const group = comp({ id: 2, prop: FolderEnum.group, children: [leaf] });
    const panelChild = comp({ id: 5 });
    const panel = comp({
      id: 4,
      prop: PanelEnum.dynamicPanel,
      panelData: [{ id: "s", name: "s", config: [panelChild] }]
    });
    expect(flattenComponents([group, panel]).map((c) => c.id)).toEqual([2, 3, 4, 5]);
  });
});

describe("collectIncomingIds", () => {
  it("收集含嵌套子组件的全部 id", () => {
    const group = comp({ id: 2, prop: FolderEnum.group, children: [comp({ id: 3 })] });
    const panel = comp({
      id: 4,
      prop: PanelEnum.dynamicPanel,
      panelData: [{ id: "s", name: "s", config: [comp({ id: 5 })] }]
    });
    expect([...collectIncomingIds([group, panel])].sort((a, b) => a - b)).toEqual([2, 3, 4, 5]);
  });
});

describe("summarizeSubtree", () => {
  it("叶子组件返回 undefined", () => {
    expect(summarizeSubtree(comp({ id: 1 }))).toBeUndefined();
  });

  it("分组统计后代总数与按类型计数", () => {
    const group = comp({
      id: 1,
      prop: FolderEnum.group,
      children: [comp({ id: 2, title: "文本" }), comp({ id: 3, title: "文本" }), comp({ id: 4, title: "图表" })]
    });
    expect(summarizeSubtree(group)).toEqual({ descendants: 3, byType: { 文本: 2, 图表: 1 } });
  });

  it("动态面板每个状态计入「状态」键（含空状态）", () => {
    const panel = comp({
      id: 1,
      prop: PanelEnum.dynamicPanel,
      panelData: [
        { id: "s1", name: "a", config: [comp({ id: 2, title: "图表" })] },
        { id: "s2", name: "b", config: [] }
      ]
    });
    expect(summarizeSubtree(panel)).toEqual({ descendants: 3, byType: { 状态: 2, 图表: 1 } });
  });

  it("嵌套容器递归汇总子树", () => {
    const inner = comp({ id: 3, prop: FolderEnum.group, title: "内组", children: [comp({ id: 4, title: "文本" })] });
    const outer = comp({ id: 1, prop: FolderEnum.group, children: [inner] });
    expect(summarizeSubtree(outer)).toEqual({ descendants: 2, byType: { 内组: 1, 文本: 1 } });
  });
});
