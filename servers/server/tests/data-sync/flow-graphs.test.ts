import { describe, expect, it } from "vitest";

import { buildCallbackFlowGraph, buildEventFlowGraph } from "../../src/mastra/services/bi-data-sync/flow-graphs";
import { comp, filters } from "./factories";

describe("buildEventFlowGraph", () => {
  it("按 sourceId 聚合事件，$component 引用解析为目标名称", () => {
    const target = comp({ id: 200, name: "目标组件" });
    const src = comp({
      id: 100,
      name: "源组件",
      events: [
        {
          trigger: "click",
          conditions: [{ field: "status", compare: "eq", expected: "on" }],
          actions: [{ action: "show", component: ["$component(200)"] }]
        }
      ]
    });
    const graph = buildEventFlowGraph([src, target]);
    expect(graph.get("100")).toEqual([
      {
        sourceId: "100",
        sourceName: "源组件",
        trigger: "click",
        conditions: [{ field: "status", compare: "eq", expected: "on" }],
        targets: [{ id: "200", name: "目标组件", actionType: "show" }]
      }
    ]);
  });

  it("condition 中缺省的字段被剔除", () => {
    const src = comp({
      id: 1,
      events: [{ trigger: "click", conditions: [{ field: "onlyField" }], actions: [] }]
    });
    expect(buildEventFlowGraph([src]).get("1")?.[0].conditions).toEqual([{ field: "onlyField" }]);
  });

  it("无事件的组件不进入图", () => {
    expect(buildEventFlowGraph([comp({ id: 1 })]).has("1")).toBe(false);
  });
});

describe("buildCallbackFlowGraph", () => {
  it("emittedBy 来自 cbArgs，consumedBy 来自 listenArgs+openFilter", () => {
    const emitter = comp({
      id: 1,
      name: "发射",
      events: [{ trigger: "dataChange" }],
      cbArgs: [{ value: { origin: { value: "city" }, target: { value: "cityArg" } } }]
    });
    const consumer = comp({
      id: 2,
      name: "消费",
      openFilter: true,
      listenArgs: [{ filterName: "过滤器A", callbackFields: [] }]
    });
    const graph = buildCallbackFlowGraph([emitter, consumer], filters({ 过滤器A: { callBack: ["cityArg"] } }));
    expect(graph.cityArg.emittedBy).toEqual([{ id: "1", name: "发射", originField: "city", onEvents: ["dataChange"] }]);
    expect(graph.cityArg.consumedBy).toEqual([{ filterName: "过滤器A", boundTo: [{ id: "2", name: "消费" }] }]);
  });

  it("ft-dataContainer 无事件时自动补 dataChange", () => {
    const container = comp({
      id: 1,
      prop: "sw-dataContainer",
      cbArgs: [{ value: { origin: { value: "x" }, target: { value: "arg" } } }]
    });
    expect(buildCallbackFlowGraph([container], filters({})).arg.emittedBy[0].onEvents).toEqual(["dataChange"]);
  });

  it("openFilter 为 false 时不产生 consumedBy", () => {
    const consumer = comp({
      id: 2,
      name: "消费",
      openFilter: false,
      listenArgs: [{ filterName: "过滤器A", callbackFields: [] }]
    });
    const graph = buildCallbackFlowGraph([consumer], filters({ 过滤器A: { callBack: ["arg"] } }));
    // 无发射方、消费方被跳过 → 该 arg 不出现在图中
    expect(graph.arg).toBeUndefined();
  });

  it("同一过滤器被多个组件监听时，boundTo 聚合", () => {
    const c2 = comp({ id: 2, name: "A", openFilter: true, listenArgs: [{ filterName: "F", callbackFields: [] }] });
    const c3 = comp({ id: 3, name: "B", openFilter: true, listenArgs: [{ filterName: "F", callbackFields: [] }] });
    const graph = buildCallbackFlowGraph([c2, c3], filters({ F: { callBack: ["arg"] } }));
    expect(graph.arg.consumedBy).toEqual([
      {
        filterName: "F",
        boundTo: [
          { id: "2", name: "A" },
          { id: "3", name: "B" }
        ]
      }
    ]);
  });
});
