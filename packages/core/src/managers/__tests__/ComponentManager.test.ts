import type { ComponentType, LargeScreeInfo } from "@screenwright/types";
import { describe, expect, it } from "vitest";

import { CallbackArguments } from "../../events/CallbackArguments";
import { MemoryEditorState } from "../../state/MemoryEditorState";
import { ComponentManager } from "../ComponentManager";

/**
 * 不引入任何 Vue/UI 框架，直接用 MemoryEditorState 驱动 ComponentManager。
 */
function makeLayers(): ComponentType[] {
  const child = { id: 11, component: { prop: "text" }, name: "child" };
  const group = { id: 1, component: { prop: "sw-folder" }, name: "group", children: [child] };
  const panelChild = { id: 21, component: { prop: "text" }, name: "panelChild" };
  const panel = {
    id: 2,
    component: { prop: "sw-panel" },
    name: "panel",
    panelData: [{ id: "s1", config: [panelChild] }]
  };
  // 编码面板（terminal-control）属于系统面板，真实数据始终带 panelData
  const encode = { id: 3, component: { prop: "terminal-control" }, name: "encode", panelData: [] };
  return [group, panel, encode] as unknown as ComponentType[];
}

function makeRaw(layers: unknown): LargeScreeInfo {
  return { layers } as unknown as LargeScreeInfo;
}

function makeIframeWithNestedPanels(): ComponentType[] {
  const nestedPanelChild = { id: 301, component: { prop: "text" }, name: "nestedPanelChild" };
  const nestedPanel = {
    id: 300,
    component: { prop: "sw-panel" },
    name: "nestedPanel",
    panelData: [{ id: "nested-status", config: [nestedPanelChild] }]
  };
  const terminalChild = { id: 201, component: { prop: "text" }, name: "terminalChild" };
  const terminalPanel = {
    id: 200,
    component: { prop: "terminal-control" },
    name: "terminalPanel",
    panelData: [{ id: "terminal-status", config: [terminalChild, nestedPanel] }]
  };
  const iframe = {
    id: 100,
    component: { prop: "swiframe" },
    name: "iframe",
    option: {
      quoteInfo: {
        component: [terminalPanel]
      }
    }
  };

  return [iframe] as unknown as ComponentType[];
}

describe("ComponentManager", () => {
  it("setLayers 接受对象数组并原样存储", () => {
    const manager = new ComponentManager(new MemoryEditorState(), new CallbackArguments());
    manager.setLayers(makeRaw(makeLayers()));
    expect(manager.getLayers().map((c) => c.id)).toEqual([1, 2, 3]);
  });

  it("setLayers 接受 JSON 字符串数组并解析（transformGroupData）", () => {
    const manager = new ComponentManager(new MemoryEditorState(), new CallbackArguments());
    const strLayers = makeLayers().map((c) => JSON.stringify(c));
    manager.setLayers(makeRaw(strLayers));
    expect(manager.getLayers().map((c) => c.id)).toEqual([1, 2, 3]);
  });

  it("getAllComponentMap 含分组子组件与面板子组件", () => {
    const manager = new ComponentManager(new MemoryEditorState(), new CallbackArguments());
    manager.setLayers(makeRaw(makeLayers()));
    const all = manager.getAllComponentMap();
    expect([...all.keys()].sort()).toEqual(["1", "11", "2", "21", "3"]);
  });

  it("getGlobalComponentMap 排除编码面板；getEncodeComponentMap 仅含编码面板", () => {
    const manager = new ComponentManager(new MemoryEditorState(), new CallbackArguments());
    manager.setLayers(makeRaw(makeLayers()));

    const global = manager.getGlobalComponentMap();
    expect(global.has("3")).toBe(false);
    expect(global.has("1")).toBe(true);
    expect(global.has("21")).toBe(true);

    const encode = manager.getEncodeComponentMap();
    expect([...encode.keys()]).toEqual(["3"]);
  });

  it("getPanelChildComponentMapByStatus 按 面板ID->状态ID->子组件 组织", () => {
    const manager = new ComponentManager(new MemoryEditorState(), new CallbackArguments());
    manager.setLayers(makeRaw(makeLayers()));
    const byStatus = manager.getPanelChildComponentMapByStatus();
    expect(byStatus.get("2")?.get("s1")?.has("21")).toBe(true);
  });

  it("getPanelChildComponentMapByStatus 包含 iframe 终端面板及其嵌套动态面板", () => {
    const manager = new ComponentManager(new MemoryEditorState(), new CallbackArguments());
    manager.setLayers(makeRaw(makeIframeWithNestedPanels()));

    const byStatus = manager.getPanelChildComponentMapByStatus();

    expect([...byStatus.get("200")!.get("terminal-status")!.keys()]).toEqual(["201", "300", "301"]);
    expect([...byStatus.get("300")!.get("nested-status")!.keys()]).toEqual(["301"]);
    expect(byStatus.get("300")!.get("nested-status")!.get("301")?.parentDynamicPanelId).toEqual([200, 300]);
  });

  it("findTargetDynamicPanel 通过父级ID链定位", () => {
    const manager = new ComponentManager(new MemoryEditorState(), new CallbackArguments());
    manager.setLayers(makeRaw(makeLayers()));
    expect(manager.findTargetDynamicPanel([2])?.id).toBe(2);
    expect(manager.findTargetDynamicPanel([2, 21])?.id).toBe(21);
    expect(manager.findTargetDynamicPanel([999])).toBeNull();
  });

  it("resetLayers 清空", () => {
    const manager = new ComponentManager(new MemoryEditorState(), new CallbackArguments());
    manager.setLayers(makeRaw(makeLayers()));
    manager.resetLayers();
    expect(manager.getLayers()).toEqual([]);
  });
});
