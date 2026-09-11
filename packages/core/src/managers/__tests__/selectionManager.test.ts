import type { ComponentType, LargeScreeInfo } from "@screenwright/types";
import { beforeEach, describe, expect, it } from "vitest";

import { CallbackArguments } from "../../events/CallbackArguments";
import { MemoryEditorState } from "../../state/MemoryEditorState";
import { ComponentManager } from "../ComponentManager";
import { SelectionManager } from "../SelectionManager";

/**
 * 不引入任何 Vue/UI 框架：MemoryEditorState 同时驱动 ComponentManager 与 SelectionManager。
 * 选区派生依赖 ComponentManager 的组件映射（由 layers 派生），故二者共享同一 state。
 */
function makeLayers(): ComponentType[] {
  const child = { id: 11, component: { prop: "text" }, name: "child" };
  const group = { id: 1, component: { prop: "sw-folder" }, name: "group", children: [child] };
  const single = { id: 2, component: { prop: "text" }, name: "single" };
  return [group, single] as unknown as ComponentType[];
}

function makeRaw(layers: unknown): LargeScreeInfo {
  return { layers } as unknown as LargeScreeInfo;
}

describe("SelectionManager（框架无关）", () => {
  let state: MemoryEditorState;
  let component: ComponentManager;
  let selection: SelectionManager;

  beforeEach(() => {
    state = new MemoryEditorState();
    component = new ComponentManager(state, new CallbackArguments());
    selection = new SelectionManager(state, component);
    component.setLayers(makeRaw(makeLayers()));
    selection.syncFromLayers();
  });

  it("syncFromLayers 把组件树同步到 componentList", () => {
    expect(selection.getComponentList().map((c) => c.id)).toEqual([1, 2]);
  });

  it("setTargetSelectChart 字符串设置选中；重复选中不变", () => {
    selection.setTargetSelectChart("1");
    expect(selection.getTargetChart().selectId).toEqual(["1"]);

    selection.setTargetSelectChart("1"); // 重复
    expect(selection.getTargetChart().selectId).toEqual(["1"]);
  });

  it("setTargetSelectChart push 追加，数组（非 push）整体替换，空值清空", () => {
    selection.setTargetSelectChart("1");
    selection.setTargetSelectChart("2", true);
    expect(selection.getTargetChart().selectId).toEqual(["1", "2"]);

    selection.setTargetSelectChart(["3", "4"]);
    expect(selection.getTargetChart().selectId).toEqual(["3", "4"]);

    selection.setTargetSelectChart(undefined);
    expect(selection.getTargetChart().selectId).toEqual([]);
  });

  it("setTargetHoverChart 设置/清空 hover", () => {
    selection.setTargetHoverChart("9");
    expect(selection.getTargetChart().hoverId).toBe("9");
    selection.setTargetHoverChart();
    expect(selection.getTargetChart().hoverId).toBeUndefined();
  });

  it("selectTargetData 由选中 id 经组件映射派生", () => {
    selection.setTargetSelectChart(["1", "11"]);
    expect(selection.selectTargetData().map((c) => c.id)).toEqual([1, 11]);

    // 不存在的 id 被过滤
    selection.setTargetSelectChart(["1", "999"]);
    expect(selection.selectTargetData().map((c) => c.id)).toEqual([1]);
  });

  it("selectTargetDataId 含选中组件及其子组件 id", () => {
    selection.setTargetSelectChart("1");
    // group(1) 含子 child(11)
    expect(selection.selectTargetDataId().sort()).toEqual(["1", "11"]);
  });

  it("fetchTargetById 递归查找；id 为空时回退到首个选中", () => {
    expect(selection.fetchTargetById("11")?.id).toBe(11);
    expect(selection.fetchTargetById("999")).toBeNull();

    selection.setTargetSelectChart("2");
    expect(selection.fetchTargetById("")?.id).toBe(2);
  });

  it("selectTargetDataInitial 对每个选中 id 递归取数", () => {
    selection.setTargetSelectChart(["1", "11"]);
    expect(selection.selectTargetDataInitial().map((c) => c?.id)).toEqual([1, 11]);
  });

  it("setComponentList / resetComponentList", () => {
    selection.setComponentList([{ id: 99 }] as unknown as ComponentType[]);
    expect(selection.getComponentList().map((c) => c.id)).toEqual([99]);
    selection.resetComponentList();
    expect(selection.getComponentList()).toEqual([]);
  });
});
