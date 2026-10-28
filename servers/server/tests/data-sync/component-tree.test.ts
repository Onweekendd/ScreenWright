import { FolderEnum, PanelEnum } from "@screenwright/types";
import { describe, expect, it } from "vitest";

import {
  childConfigGroups,
  collectIncomingIds,
  flattenComponents
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
