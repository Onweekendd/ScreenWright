import type { ComponentType, PanelState } from "@screenwright/types";
import { describe, expect, it } from "vitest";

import { CallbackArguments } from "../../events/CallbackArguments";
import { createInitialState } from "../../state/createInitialState";
import { MemoryEditorState } from "../../state/MemoryEditorState";
import { ComponentManager } from "../ComponentManager";
import { PanelManager } from "../PanelManager";

/**
 * PanelManager：panelData 数组本身的增删改序。
 * 「往状态里放组件」不归它管——那是 ComponentManager.move 带 placement.stateId。
 */

const leaf = (id: number) =>
  ({ id, component: { prop: "text", width: 100, height: 50 }, name: `c${id}`, zIndex: 0 }) as unknown as ComponentType;

const state = (id: string, config: ComponentType[] = []): PanelState =>
  ({
    id,
    title: id,
    name: id,
    config,
    backgroundColor: "rgba(24,27,36,0)",
    showBackgroundImage: false,
    backgroundImage: "",
    showScreenAdaptation: false,
    adaptationNorm: "default",
    adaptationType: 2
  }) as PanelState;

const panel = (id: number, states: PanelState[]) =>
  ({
    id,
    component: { prop: "sw-panel", width: 300, height: 200 },
    name: `p${id}`,
    zIndex: 0,
    panelData: states
  }) as unknown as ComponentType;

function makeManagers(layers: ComponentType[]) {
  const editorState = new MemoryEditorState({ ...createInitialState(), layers });
  const component = new ComponentManager(editorState, new CallbackArguments());
  return { panel: new PanelManager({ editorState, componentManager: component }), component };
}

const stateIds = (list: PanelState[]) => list.map((item) => item.id);

describe("PanelManager", () => {
  describe("createState", () => {
    it("按已有状态数量生成默认名，字段与 app 侧 createLocalPanelStatus 一致", () => {
      const { panel: manager } = makeManagers([]);

      const created = manager.createState(2);

      expect(created.name).toBe("状态3");
      expect(created.title).toBe("状态3");
      expect(created.config).toEqual([]);
      expect(created.backgroundColor).toBe("rgba(24,27,36,0)");
      expect(created.adaptationNorm).toBe("default");
      expect(created.adaptationType).toBe(2);
    });

    it("每次生成不同的状态 id（状态 id 由 core 自己生成，不经服务端）", () => {
      const { panel: manager } = makeManagers([]);

      expect(manager.createState(0).id).not.toBe(manager.createState(0).id);
    });
  });

  describe("addState / removeState", () => {
    it("默认追加到末尾", () => {
      const layers = [panel(1, [state("a")])];
      const { panel: manager } = makeManagers(layers);

      manager.addState(1, state("b"));

      expect(stateIds(manager.getStates(1))).toEqual(["a", "b"]);
    });

    it("指定下标时插到该位置", () => {
      const layers = [panel(1, [state("a"), state("c")])];
      const { panel: manager } = makeManagers(layers);

      manager.addState(1, state("b"), 1);

      expect(stateIds(manager.getStates(1))).toEqual(["a", "b", "c"]);
    });

    it("同 id 已存在时整条替换而非重复插入（断言式）", () => {
      const layers = [panel(1, [state("a"), state("b")])];
      const { panel: manager } = makeManagers(layers);

      const replaced = state("b");
      replaced.name = "renamed";
      manager.addState(1, replaced);

      expect(stateIds(manager.getStates(1))).toEqual(["a", "b"]);
      expect(manager.findState(1, "b")?.name).toBe("renamed");
    });

    it("removeState 摘掉并交还；重复调用是 no-op", () => {
      const layers = [panel(1, [state("a"), state("b")])];
      const { panel: manager } = makeManagers(layers);

      expect(manager.removeState(1, "a")?.id).toBe("a");
      expect(manager.removeState(1, "a")).toBeNull();
      expect(stateIds(manager.getStates(1))).toEqual(["b"]);
    });
  });

  describe("reorderState / renameState", () => {
    it("把状态挪到指定下标", () => {
      const layers = [panel(1, [state("a"), state("b"), state("c")])];
      const { panel: manager } = makeManagers(layers);

      manager.reorderState(1, "c", 0);

      expect(stateIds(manager.getStates(1))).toEqual(["c", "a", "b"]);
    });

    it("下标越界时报错", () => {
      const layers = [panel(1, [state("a")])];
      const { panel: manager } = makeManagers(layers);

      expect(() => manager.reorderState(1, "a", 5)).toThrow(/越界/);
    });

    it("renameState 只改 name，title 是不变量", () => {
      const layers = [panel(1, [state("a")])];
      const { panel: manager } = makeManagers(layers);

      manager.renameState(1, "a", "新名字");

      expect(manager.findState(1, "a")?.name).toBe("新名字");
      expect(manager.findState(1, "a")?.title).toBe("a");
    });
  });

  describe("copyState / duplicateState", () => {
    it("copyState 只造副本不落位，名字加「-副本」、样式沿用、id 换新", () => {
      const layers = [panel(1, [state("a", [leaf(11)])])];
      const { panel: manager } = makeManagers(layers);

      const copy = manager.copyState(manager.findState(1, "a")!, [leaf(999)]);

      expect(copy.name).toBe("a-副本");
      expect(copy.id).not.toBe("a");
      expect(copy.backgroundColor).toBe("rgba(24,27,36,0)");
      // config 必须是调用方传进来的（带真实 id 的那批），core 不自己克隆造假 id
      expect(copy.config.map((item) => item.id)).toEqual([999]);
      // 没落位：panelData 不该变
      expect(stateIds(manager.getStates(1))).toEqual(["a"]);
      expect(manager.findState(1, "a")?.config.map((item) => item.id)).toEqual([11]);
    });

    it("duplicateState 追加到末尾（与前端 onStatusCopy 的既有表现对齐）", () => {
      const layers = [panel(1, [state("a", [leaf(11)]), state("b")])];
      const { panel: manager } = makeManagers(layers);

      const copied = manager.duplicateState(1, "a", [leaf(999)]);

      expect(stateIds(manager.getStates(1))).toEqual(["a", "b", copied.id]);
      expect(copied.name).toBe("a-副本");
      expect(copied.config.map((item) => item.id)).toEqual([999]);
      expect(manager.findState(1, "a")?.config.map((item) => item.id)).toEqual([11]);
    });

    it("源状态不存在时报错", () => {
      const layers = [panel(1, [state("a")])];
      const { panel: manager } = makeManagers(layers);

      expect(() => manager.duplicateState(1, "zzz", [])).toThrow(/zzz/);
    });
  });

  describe("边界", () => {
    it("面板不在树上时报错", () => {
      const { panel: manager } = makeManagers([]);

      expect(() => manager.getStates(404)).toThrow(/404/);
    });

    it("组件没有 panelData 时报错", () => {
      const { panel: manager } = makeManagers([leaf(7)]);

      expect(() => manager.getStates(7)).toThrow(/不是面板/);
    });

    it("能找到嵌在分组里的面板", () => {
      const nested = panel(2, [state("s1")]);
      const wrapper = {
        id: 1,
        component: { prop: "sw-folder" },
        name: "g1",
        zIndex: 0,
        children: [nested]
      } as unknown as ComponentType;
      const { panel: manager } = makeManagers([wrapper]);

      expect(stateIds(manager.getStates(2))).toEqual(["s1"]);
    });
  });
});
