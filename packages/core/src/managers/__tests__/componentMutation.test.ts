import type { ComponentType } from "@screenwright/types";
import { describe, expect, it } from "vitest";

import { CallbackArguments } from "../../events/CallbackArguments";
import { createInitialState } from "../../state/createInitialState";
import { MemoryEditorState } from "../../state/MemoryEditorState";
import { ComponentManager } from "../ComponentManager";

/**
 * ComponentManager 写入 API：断言式树操作，同步、无注入、就地变更。
 * 全程不引入任何 UI 框架——core 能在 Node 侧独立驱动，正是后端复用同一份逻辑的前提。
 */

// left/top 必须给：分组包围盒直接读这两个字段，缺了会静默算出 NaN
const leaf = (id: number, extra: Record<string, unknown> = {}) =>
  ({
    id,
    component: { prop: "text", width: 100, height: 50 },
    name: `c${id}`,
    left: 0,
    top: 0,
    zIndex: 0,
    ...extra
  }) as unknown as ComponentType;

// 宽高与 left/top 刻意给一个跟成员对不上的值：用来验证 core 不采信调用方传进来的包围盒
const group = (id: number, children: ComponentType[]) =>
  ({
    id,
    component: { prop: "sw-folder", width: 999, height: 999 },
    name: `g${id}`,
    left: 999,
    top: 999,
    zIndex: 0,
    children
  }) as unknown as ComponentType;

const panel = (id: number, states: Array<{ id: string; config: ComponentType[] }>) =>
  ({
    id,
    component: { prop: "sw-panel", width: 300, height: 200 },
    name: `p${id}`,
    left: 0,
    top: 0,
    zIndex: 0,
    panelData: states
  }) as unknown as ComponentType;

/** 造一个管理器，layers 直接就地持有传入数组，便于断言引用是否被换掉。 */
function makeManager(layers: ComponentType[]) {
  const state = new MemoryEditorState({ ...createInitialState(), layers });
  const callbackArguments = new CallbackArguments();
  return { manager: new ComponentManager(state, callbackArguments), state, callbackArguments };
}

/** 抛出方：把值写进回调字段 field */
const source = (id: number, field: string) =>
  leaf(id, { cbArgs: [{ id: `cb-${id}`, value: { origin: { value: "x" }, target: { value: field } } }] });

/** 接收方：监听回调字段 field（openFilter 必须为 true，否则 registerTargetComponents 直接跳过） */
const listener = (id: number, field: string) =>
  leaf(id, {
    openFilter: true,
    listenArgs: [{ callbackFields: [field], filterName: `f-${id}` }]
  });

const ids = (list: ComponentType[] | undefined) => (list ?? []).map((item) => item.id);

const statesOf = (component: ComponentType) =>
  (component as unknown as { panelData: Array<{ id: string; config: ComponentType[] }> }).panelData;

describe("ComponentManager 写入 API", () => {
  describe("find / remove", () => {
    it("能穿过分组与面板状态找到深层组件", () => {
      const { manager } = makeManager([group(1, [leaf(11)]), panel(2, [{ id: "s1", config: [leaf(21)] }])]);

      expect(manager.find(11)?.id).toBe(11);
      expect(manager.find(21)?.id).toBe(21);
      // 协议里 id 常以字符串出现，两种形态都要认
      expect(manager.find("21")?.id).toBe(21);
      expect(manager.find(999)).toBeNull();
    });

    it("delete 摘掉嵌在分组里的节点并把它交还给调用方", () => {
      const layers = [group(1, [leaf(11), leaf(12)])];
      const { manager } = makeManager(layers);

      expect(manager.delete(11)?.id).toBe(11);
      expect(ids(layers[0].children)).toEqual([12]);
    });

    it("delete 一个本来就不在树上的 id 是 no-op，不报错", () => {
      const layers = [leaf(1)];
      const { manager } = makeManager(layers);

      expect(manager.delete(999)).toBeNull();
      expect(ids(layers)).toEqual([1]);
    });

    it("连续 delete 两次结果一致（断言式而非命令式）", () => {
      const layers = [leaf(1), leaf(2)];
      const { manager } = makeManager(layers);

      manager.delete(1);
      const after = ids(layers);
      manager.delete(1);

      expect(ids(layers)).toEqual(after);
    });
  });

  describe("upsert", () => {
    it("不传 placement 时原地整节点替换，且不改变次序", () => {
      const layers = [leaf(1), leaf(2), leaf(3)];
      const { manager } = makeManager(layers);

      manager.upsert(leaf(2, { name: "renamed" }));

      expect(ids(layers)).toEqual([1, 2, 3]);
      expect(layers[1].name).toBe("renamed");
    });

    it("不传 placement 且树上没有该 id 时落到根级", () => {
      const layers = [leaf(1)];
      const { manager } = makeManager(layers);

      manager.upsert(leaf(9));

      expect(ids(layers)).toEqual([1, 9]);
    });

    it("传 placement 时把节点挂到分组下，并记账 parent", () => {
      const layers = [group(1, []), leaf(9)];
      const { manager } = makeManager(layers);

      manager.upsert(manager.find(9)!, { parentId: 1, parentType: "group" });

      expect(ids(layers)).toEqual([1]);
      expect(ids(layers[0].children)).toEqual([9]);
      expect(layers[0].children?.[0].parent).toBe(1);
    });

    it("挂进动态面板状态时不带 parent（与前端 moveComponents 同口径）", () => {
      const layers = [panel(2, [{ id: "s1", config: [] }]), leaf(9, { parent: 1 })];
      const { manager } = makeManager(layers);

      manager.upsert(manager.find(9)!, { parentId: 2, parentType: "dynamicPanel", stateId: "s1" });

      const state = statesOf(layers[0])[0];
      expect(ids(state.config)).toEqual([9]);
      expect(state.config[0].parent).toBeUndefined();
    });

    it("先摘再放：子树里的 id 会被从树上其他位置清掉", () => {
      // 分组节点已带成员，成员的旧副本还留在根级——upsert 应当把旧副本带走
      const layers = [leaf(11), leaf(12), leaf(99)];
      const { manager } = makeManager(layers);

      manager.upsert(group(1, [leaf(11), leaf(12)]), undefined);

      expect(ids(layers)).toEqual([99, 1]);
      expect(ids(layers[1].children)).toEqual([11, 12]);
    });

    it("目标容器不存在时报错，不静默兜底", () => {
      const { manager } = makeManager([leaf(9)]);

      expect(() => manager.upsert(leaf(9), { parentId: 404, parentType: "group" })).toThrow(/404/);
    });

    it("目标不是分组时报错——不给叶子组件凭空挂 children", () => {
      const layers = [leaf(1), leaf(9)];
      const { manager } = makeManager(layers);

      expect(() => manager.upsert(leaf(9), { parentId: 1, parentType: "group" })).toThrow(/不是分组/);
      expect(layers[0].children).toBeUndefined();
    });
  });

  describe("move", () => {
    it("把组件从根级移进面板状态", () => {
      const layers = [panel(2, [{ id: "s1", config: [] }]), leaf(9)];
      const { manager } = makeManager(layers);

      manager.move([9], { parentId: 2, parentType: "dynamicPanel", stateId: "s1" });

      expect(ids(layers)).toEqual([2]);
      expect(ids(statesOf(layers[0])[0].config)).toEqual([9]);
    });

    it("已经在目标容器里的原样不动，不因重排改变次序", () => {
      const layers = [group(1, [leaf(11), leaf(12)])];
      const { manager } = makeManager(layers);

      manager.move([11], { parentId: 1, parentType: "group" });

      expect(ids(layers[0].children)).toEqual([11, 12]);
    });

    it("连续应用两次结果深等于一次", () => {
      const build = () => [panel(2, [{ id: "s1", config: [] }]), leaf(8), leaf(9)];
      const once = build();
      const twice = build();
      const target = { parentId: 2, parentType: "dynamicPanel" as const, stateId: "s1" };

      makeManager(once).manager.move([8, 9], target);
      const twiceManager = makeManager(twice).manager;
      twiceManager.move([8, 9], target);
      twiceManager.move([8, 9], target);

      expect(twice).toEqual(once);
    });

    it("组件不在树上时报错", () => {
      const { manager } = makeManager([leaf(1)]);

      expect(() => manager.move([404])).toThrow(/404/);
    });

    it("搬迁时把组件顶到目标容器最上层（与前端 moveComponents 同口径）", () => {
      const layers = [group(1, [leaf(11, { zIndex: 3 }), leaf(12, { zIndex: 7 })]), leaf(9, { zIndex: 0 })];
      const { manager } = makeManager(layers);

      manager.move([9], { parentId: 1, parentType: "group" });

      expect(manager.find(9)?.zIndex).toBe(8);
    });

    it("多个组件依次置顶，保持传入次序", () => {
      const layers = [group(1, [leaf(11, { zIndex: 5 })]), leaf(8, { zIndex: 0 }), leaf(9, { zIndex: 0 })];
      const { manager } = makeManager(layers);

      manager.move([8, 9], { parentId: 1, parentType: "group" });

      expect(ids(layers[0].children)).toEqual([11, 8, 9]);
      expect((layers[0].children ?? []).map((item) => item.zIndex)).toEqual([5, 6, 7]);
    });

    it("已在目标容器时不重算 zIndex——否则重复 resume 会让它一路涨", () => {
      const layers = [group(1, [leaf(11, { zIndex: 3 })]), leaf(9, { zIndex: 0 })];
      const { manager } = makeManager(layers);
      const target = { parentId: 1, parentType: "group" as const };

      manager.move([9], target);
      const afterFirst = manager.find(9)!.zIndex;
      manager.move([9], target);

      expect(manager.find(9)?.zIndex).toBe(afterFirst);
    });

    it("upsert 不重算 zIndex：回执里的值就是画布上的真实值", () => {
      const layers = [group(1, [leaf(11, { zIndex: 9 })]), leaf(9, { zIndex: 2 })];
      const { manager } = makeManager(layers);

      manager.upsert(manager.find(9)!, { parentId: 1, parentType: "group" });

      expect(manager.find(9)?.zIndex).toBe(2);
    });
  });

  describe("group / ungroup", () => {
    it("children 已填好时直接采用，成员旧副本被带走", () => {
      const layers = [leaf(11), leaf(12), leaf(99)];
      const { manager } = makeManager(layers);

      manager.group(group(1, [leaf(11), leaf(12)]), [11, 12]);

      expect(ids(layers)).toEqual([99, 1]);
      expect(ids(layers[1].children)).toEqual([11, 12]);
      expect(layers[1].children?.every((child) => child.parent === 1)).toBe(true);
    });

    it("children 为空时从树上把成员摘进来", () => {
      const layers = [leaf(11), leaf(12), leaf(99)];
      const { manager } = makeManager(layers);

      manager.group(group(1, []), [11, 12]);

      expect(ids(layers)).toEqual([99, 1]);
      expect(ids(layers[1].children)).toEqual([11, 12]);
    });

    it("ungroup 把子组件提升到分组原来的位置，并清掉 parent", () => {
      const layers = [leaf(1), group(5, [leaf(51, { parent: 5 }), leaf(52, { parent: 5 })]), leaf(9)];
      const { manager } = makeManager(layers);

      const promoted = manager.ungroup(5);

      expect(ids(layers)).toEqual([1, 51, 52, 9]);
      expect(promoted.map((item) => item.parent)).toEqual([undefined, undefined]);
    });

    it("ungroup 一个不存在的分组是 no-op", () => {
      const layers = [leaf(1)];
      const { manager } = makeManager(layers);

      expect(manager.ungroup(404)).toEqual([]);
      expect(ids(layers)).toEqual([1]);
    });

    it("group 的成员不在树上时报错", () => {
      const { manager } = makeManager([leaf(11)]);

      expect(() => manager.group(group(1, []), [11, 404])).toThrow(/404/);
    });
  });

  describe("placementOfList（反查当前画布）", () => {
    it("传 layers 本身返回 undefined（大屏根级）", () => {
      const layers = [leaf(1)];
      const { manager } = makeManager(layers);

      expect(manager.placementOfList(layers)).toBeUndefined();
    });

    it("传分组的 children 返回该分组的 placement", () => {
      const layers = [group(1, [leaf(11)])];
      const { manager } = makeManager(layers);

      expect(manager.placementOfList(layers[0].children!)).toEqual({ parentId: 1, parentType: "group" });
    });

    it("传面板状态的 config 返回带 stateId 的 placement", () => {
      const layers = [
        panel(2, [
          { id: "s1", config: [] },
          { id: "s2", config: [leaf(21)] }
        ])
      ];
      const { manager } = makeManager(layers);

      expect(manager.placementOfList(statesOf(layers[0])[1].config)).toEqual({
        parentId: 2,
        parentType: "dynamicPanel",
        stateId: "s2"
      });
    });

    it("嵌套容器也能反查到", () => {
      const inner = group(3, [leaf(31)]);
      const layers = [panel(2, [{ id: "s1", config: [inner] }])];
      const { manager } = makeManager(layers);

      expect(manager.placementOfList(inner.children!)).toEqual({ parentId: 3, parentType: "group" });
    });

    it("不属于本树的数组返回 null", () => {
      const { manager } = makeManager([leaf(1)]);

      expect(manager.placementOfList([leaf(99)])).toBeNull();
    });
  });

  describe("就地变更", () => {
    it("不替换 layers 数组引用（前端 allComponentMap 与 Vue 绑定都跟着引用走）", () => {
      const layers = [leaf(1)];
      const { manager, state } = makeManager(layers);

      manager.upsert(leaf(2));
      manager.delete(1);

      expect(state.getState().layers).toBe(layers);
    });
  });
});

describe("delete / releaseCallbackRelations", () => {
  it("delete 摘下树，并把该组件在回调关系图里的登记注销掉", () => {
    const src = source(1, "fieldA");
    const dst = listener(2, "fieldA");
    const { manager, callbackArguments } = makeManager([src, dst]);
    callbackArguments.initCallbackArguments([src, dst]);

    const removed = manager.delete(1);

    expect(removed?.id).toBe(1);
    expect(ids(manager.getLayers())).toEqual([2]);
    // 抛出方没了，接收方还在，关系条目保留但 source 已空
    expect(callbackArguments.getCallbackArgumentsManager().fieldA?.source).toEqual([]);
    expect(callbackArguments.getCallbackArgumentsManager().fieldA?.target.map((item) => item.id)).toEqual([2]);
  });

  it("source 与 target 都空之后，整条回调关系被删掉", () => {
    const src = source(1, "fieldA");
    const dst = listener(2, "fieldA");
    const { manager, callbackArguments } = makeManager([src, dst]);
    callbackArguments.initCallbackArguments([src, dst]);

    manager.delete(1);
    manager.delete(2);

    expect(callbackArguments.getCallbackArgumentsManager().fieldA).toBeUndefined();
  });

  it("delete 连整棵子树一起注销：分组成员与面板状态里的组件都算", () => {
    const inGroup = source(11, "fieldA");
    const inPanel = listener(21, "fieldA");
    const g = group(10, [inGroup]);
    const p = panel(20, [{ id: "s1", config: [inPanel] }]);
    const { manager, callbackArguments } = makeManager([g, p]);
    callbackArguments.initCallbackArguments([g, p]);
    expect(callbackArguments.getCallbackArgumentsManager().fieldA).toBeDefined();

    manager.delete(10);
    manager.delete(20);

    // 两侧都被子树注销带走了，关系条目随之消失
    expect(callbackArguments.getCallbackArgumentsManager().fieldA).toBeUndefined();
  });

  it("成组不会注销回调关系——group 内部要把成员从画布摘走，那是搬运不是删除", () => {
    const src = source(1, "fieldA");
    const { manager, callbackArguments } = makeManager([src]);
    callbackArguments.initCallbackArguments([src]);

    // children 留空，逼 group 走「从树上把成员摘进来」那条路
    manager.group(group(10, []), [1]);

    expect(manager.find(1)?.parent).toBe(10);
    expect(callbackArguments.getCallbackArgumentsManager().fieldA?.source.map((item) => item.id)).toEqual([1]);
  });

  it("move 到别的容器不会注销回调关系", () => {
    const src = source(1, "fieldA");
    const g = group(10, []);
    const { manager, callbackArguments } = makeManager([src, g]);
    callbackArguments.initCallbackArguments([src, g]);

    manager.move([1], { parentId: 10, parentType: "group" });

    expect(callbackArguments.getCallbackArgumentsManager().fieldA?.source.map((item) => item.id)).toEqual([1]);
  });

  it("delete 一个不在树上的 id 时返回 null，且不碰关系图", () => {
    const src = source(1, "fieldA");
    const { manager, callbackArguments } = makeManager([src]);
    callbackArguments.initCallbackArguments([src]);

    expect(manager.delete(404)).toBeNull();
    expect(callbackArguments.getCallbackArgumentsManager().fieldA?.source.map((item) => item.id)).toEqual([1]);
  });

  it("releaseCallbackRelations 按组件对象工作：已脱离树的组件照样注销得掉", () => {
    const src = source(1, "fieldA");
    const dst = listener(2, "fieldA");
    const layers = [src, dst];
    const { manager, callbackArguments } = makeManager(layers);
    callbackArguments.initCallbackArguments(layers);
    // 手工摘走（此时关系还在），模拟「组件已判定删除、但树上已经摘不到」那几条出口
    layers.splice(0, 1);
    expect(manager.find(1)).toBeNull();

    manager.releaseCallbackRelations(src);

    expect(callbackArguments.getCallbackArgumentsManager().fieldA?.source).toEqual([]);
  });

  it("重复注销是幂等的", () => {
    const src = source(1, "fieldA");
    const dst = listener(2, "fieldA");
    const { manager, callbackArguments } = makeManager([src, dst]);
    callbackArguments.initCallbackArguments([src, dst]);

    manager.releaseCallbackRelations(src);
    manager.releaseCallbackRelations(src);

    expect(callbackArguments.getCallbackArgumentsManager().fieldA?.source).toEqual([]);
    expect(callbackArguments.getCallbackArgumentsManager().fieldA?.target.map((item) => item.id)).toEqual([2]);
  });
});

describe("分组包围盒（reflowGroup）", () => {
  /** 分组的 left/top + 宽高，摊平成一个好断言的形状 */
  const boxOf = (component: ComponentType | null) => ({
    left: component?.left,
    top: component?.top,
    width: component?.component.width,
    height: component?.component.height
  });

  it("group：包围盒按成员算，调用方传进来的那份不采信", () => {
    const { manager } = makeManager([leaf(11, { left: 10, top: 20 }), leaf(12, { left: 60, top: 100 })]);

    // fixture 的分组自带 999 的假包围盒
    manager.group(group(1, []), [11, 12]);

    expect(boxOf(manager.find(1))).toEqual({ left: 10, top: 20, width: 150, height: 130 });
  });

  it("group：children 已装配好时同样重算——前端算过一遍，core 不能因此就跳过", () => {
    const { manager } = makeManager([]);

    manager.group(group(1, [leaf(11, { left: 5, top: 5 }), leaf(12, { left: 5, top: 45 })]), [11, 12]);

    expect(boxOf(manager.find(1))).toEqual({ left: 5, top: 5, width: 100, height: 90 });
  });

  it("delete：删掉一个成员后分组收紧", () => {
    const { manager } = makeManager([
      group(1, [leaf(11, { left: 0, top: 0, parent: 1 }), leaf(12, { left: 400, top: 300, parent: 1 })])
    ]);
    manager.reflowGroup(manager.find(1)!);
    expect(boxOf(manager.find(1))).toEqual({ left: 0, top: 0, width: 500, height: 350 });

    manager.delete(12);

    expect(boxOf(manager.find(1))).toEqual({ left: 0, top: 0, width: 100, height: 50 });
  });

  it("move：搬出的一头收紧、搬入的一头撑开", () => {
    const { manager } = makeManager([
      group(1, [leaf(11, { left: 0, top: 0, parent: 1 }), leaf(12, { left: 400, top: 300, parent: 1 })]),
      group(2, [leaf(21, { left: 0, top: 0, parent: 2 })])
    ]);
    manager.reflowGroup(manager.find(1)!);
    manager.reflowGroup(manager.find(2)!);

    manager.move([12], { parentId: 2, parentType: "group" });

    expect(boxOf(manager.find(1))).toEqual({ left: 0, top: 0, width: 100, height: 50 });
    expect(boxOf(manager.find(2))).toEqual({ left: 0, top: 0, width: 500, height: 350 });
  });

  it("upsert：分组自身的包围盒按 children 重算", () => {
    const { manager } = makeManager([]);

    // 传进来的 999 是旧值（成员被挪过位置了），落位时必须被算掉
    manager.upsert(group(1, [leaf(11, { left: 30, top: 40 })]));

    expect(boxOf(manager.find(1))).toEqual({ left: 30, top: 40, width: 100, height: 50 });
  });

  it("upsert：组件挂进分组时，那个分组跟着撑开", () => {
    const { manager } = makeManager([group(1, [leaf(11, { left: 0, top: 0, parent: 1 })]), leaf(9)]);
    manager.reflowGroup(manager.find(1)!);

    manager.upsert(leaf(9, { left: 200, top: 150 }), { parentId: 1, parentType: "group" });

    expect(boxOf(manager.find(1))).toEqual({ left: 0, top: 0, width: 300, height: 200 });
  });

  it("动态面板不算：它的尺寸是用户设的属性，不由内容决定", () => {
    const { manager } = makeManager([panel(2, [{ id: "s1", config: [] }]), leaf(9)]);

    manager.move([9], { parentId: 2, parentType: "dynamicPanel", stateId: "s1" });

    expect(boxOf(manager.find(2))).toEqual({ left: 0, top: 0, width: 300, height: 200 });
  });

  it("成员被删空时归零——与 app 侧 calculateGroupDimensions 同行为", () => {
    const { manager } = makeManager([group(1, [leaf(11, { left: 10, top: 20, parent: 1 })])]);

    manager.delete(11);

    expect(boxOf(manager.find(1))).toEqual({ left: 0, top: 0, width: 0, height: 0 });
  });

  it("reflowGroup 幂等，且对非分组是 no-op", () => {
    const g = group(1, [leaf(11, { left: 10, top: 20 })]);
    const { manager } = makeManager([g, panel(2, [{ id: "s1", config: [leaf(21, { left: 0, top: 0 })] }])]);

    manager.reflowGroup(g);
    const once = boxOf(g);
    manager.reflowGroup(g);
    expect(boxOf(g)).toEqual(once);

    const p = manager.find(2)!;
    manager.reflowGroup(p);
    expect(boxOf(p)).toEqual({ left: 0, top: 0, width: 300, height: 200 });
  });
});

describe("reorder / dissolveIfUnderfilled", () => {
  const zOf = (list: ComponentType[] | undefined) => (list ?? []).map((item) => item.zIndex);

  it("reorder：按数组次序重排 zIndex，第 0 项在最上层", () => {
    const layers = [leaf(1, { zIndex: 5 }), leaf(2, { zIndex: 9 }), leaf(3, { zIndex: 1 })];
    const { manager } = makeManager(layers);

    manager.reorder([layers[2], layers[0], layers[1]]);

    expect(ids(manager.getLayers())).toEqual([3, 1, 2]);
    expect(zOf(manager.getLayers())).toEqual([3, 2, 1]);
  });

  it("reorder：就地换内容，不替换容器数组引用", () => {
    const layers = [leaf(1), leaf(2)];
    const { manager } = makeManager(layers);

    manager.reorder([layers[1], layers[0]]);

    expect(manager.getLayers()).toBe(layers);
  });

  it("reorder 进分组：记 parent、重排 zIndex，并重算分组包围盒", () => {
    const a = leaf(11, { left: 0, top: 0 });
    const b = leaf(12, { left: 400, top: 300 });
    const { manager } = makeManager([group(1, [a]), b]);

    manager.reorder([b, a], { parentId: 1, parentType: "group" });

    const g = manager.find(1)!;
    expect(ids(g.children)).toEqual([12, 11]);
    expect(zOf(g.children)).toEqual([2, 1]);
    expect(g.children!.map((c) => c.parent)).toEqual([1, 1]);
    expect({ left: g.left, top: g.top, width: g.component.width, height: g.component.height }).toEqual({
      left: 0,
      top: 0,
      width: 500,
      height: 350
    });
  });

  it("reorder 到根级：清掉 parent", () => {
    const inGroup = leaf(11, { parent: 1 });
    const { manager } = makeManager([group(1, [inGroup])]);

    manager.reorder([inGroup]);

    expect(manager.getLayers()[0].parent).toBeUndefined();
  });

  it("reorder 到面板状态：不记 parent（与根级同口径）", () => {
    const { manager } = makeManager([panel(2, [{ id: "s1", config: [] }]), leaf(9, { parent: 5 })]);
    const moved = manager.find(9)!;

    manager.reorder([moved], { parentId: 2, parentType: "dynamicPanel", stateId: "s1" });

    expect(moved.parent).toBeUndefined();
    expect(ids(statesOf(manager.find(2)!)[0].config)).toEqual([9]);
  });

  it("dissolveIfUnderfilled：只剩一个成员时解散，成员塞回分组原来的位置并继承其层级", () => {
    const { manager } = makeManager([leaf(8), group(5, [leaf(51, { parent: 5, zIndex: 1 })]), leaf(9)]);
    manager.find(5)!.zIndex = 7;

    const promoted = manager.dissolveIfUnderfilled(5);

    expect(ids(promoted ?? [])).toEqual([51]);
    // 下标：分组原来在中间，成员就落在中间
    expect(ids(manager.getLayers())).toEqual([8, 51, 9]);
    expect(manager.find(51)!.zIndex).toBe(7);
    expect(manager.find(51)!.parent).toBeUndefined();
    expect(manager.find(5)).toBeNull();
  });

  it("dissolveIfUnderfilled：空分组也摘掉（返回空数组，不是 null）", () => {
    const { manager } = makeManager([group(5, [])]);

    expect(manager.dissolveIfUnderfilled(5)).toEqual([]);
    expect(manager.find(5)).toBeNull();
  });

  it("dissolveIfUnderfilled：成员够数时原样不动，返回 null", () => {
    const { manager } = makeManager([group(5, [leaf(51, { parent: 5 }), leaf(52, { parent: 5 })])]);

    expect(manager.dissolveIfUnderfilled(5)).toBeNull();
    expect(ids(manager.find(5)!.children)).toEqual([51, 52]);
  });

  it("dissolveIfUnderfilled：不在树上、或不是分组时返回 null（不误伤动态面板）", () => {
    const { manager } = makeManager([panel(2, [{ id: "s1", config: [] }])]);

    expect(manager.dissolveIfUnderfilled(404)).toBeNull();
    expect(manager.dissolveIfUnderfilled(2)).toBeNull();
    expect(manager.find(2)).not.toBeNull();
  });
});
