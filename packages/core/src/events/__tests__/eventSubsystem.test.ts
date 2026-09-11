import type { Action, ComponentType, Condition, Event } from "@screenwright/types";
import { ActionTypeEnum, ConditionTypeEnum, EventTypeEnum } from "@screenwright/types";
import { describe, expect, it, vi } from "vitest";

import { checkConditionSatisfied } from "../../selectors/conditionChecking";
import {
  filterActionsOnConditionNotSatisfied,
  planEventActions,
  selectMatchingEvents
} from "../../selectors/eventPolicy";
import { CallbackArguments } from "../CallbackArguments";
import { CallbackEventManager } from "../CallbackEventManager";
import { EventCallbackRegistry } from "../EventCallbackRegistry";

describe("conditionChecking", () => {
  const cond = (over: Record<string, unknown>): Condition => ({ type: ConditionTypeEnum.Field, ...over }) as Condition;

  it("空条件视为满足", () => {
    expect(checkConditionSatisfied({ conditionType: "all", conditions: [], curInfo: {} })).toBe(true);
  });

  it("字段相等条件", () => {
    const c = cond({ field: "v", compare: "==", expected: "1" });
    expect(checkConditionSatisfied({ conditionType: "all", conditions: [c], curInfo: { v: 1 } })).toBe(true);
    expect(checkConditionSatisfied({ conditionType: "all", conditions: [c], curInfo: { v: 2 } })).toBe(false);
  });

  it("include 比较: 字段值(转字符串)包含 expected", () => {
    const c = cond({ field: "v", compare: "include", expected: "1" });
    expect(checkConditionSatisfied({ conditionType: "all", conditions: [c], curInfo: { v: [1, 2, 3] } })).toBe(true);
    expect(checkConditionSatisfied({ conditionType: "all", conditions: [c], curInfo: { v: 9 } })).toBe(false);
  });

  it("exclude 比较: 字段值(转字符串)不包含 expected", () => {
    const c = cond({ field: "v", compare: "exclude", expected: "1" });
    expect(checkConditionSatisfied({ conditionType: "all", conditions: [c], curInfo: { v: 9 } })).toBe(true);
    expect(checkConditionSatisfied({ conditionType: "all", conditions: [c], curInfo: { v: [1, 2, 3] } })).toBe(false);
  });

  it("all=与, 非all=或", () => {
    const c1 = cond({ field: "a", compare: "==", expected: "1" });
    const c2 = cond({ field: "b", compare: "==", expected: "2" });
    const curInfo = { a: 1, b: 99 };
    expect(checkConditionSatisfied({ conditionType: "all", conditions: [c1, c2], curInfo })).toBe(false);
    expect(checkConditionSatisfied({ conditionType: "any", conditions: [c1, c2], curInfo })).toBe(true);
  });
});

describe("eventPolicy", () => {
  it("selectMatchingEvents 按 trigger 过滤", () => {
    const events = [{ trigger: EventTypeEnum.Click }, { trigger: EventTypeEnum.Change }] as unknown as Event[];
    expect(selectMatchingEvents(events, EventTypeEnum.Click)).toHaveLength(1);
  });

  it("filterActionsOnConditionNotSatisfied: 满足时原样返回; 不满足时仅留 show/hide 的 component 动作", () => {
    const actions = [
      { action: ActionTypeEnum.Show, customActionType: "component" },
      { action: ActionTypeEnum.UpdateConfig, customActionType: "component" }
    ] as unknown as Action[];
    expect(filterActionsOnConditionNotSatisfied(actions, true)).toHaveLength(2);
    const filtered = filterActionsOnConditionNotSatisfied(actions, false);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].action).toBe(ActionTypeEnum.Show);
  });

  describe("planEventActions", () => {
    const matchEvent = (over: Partial<Event>): Event =>
      ({
        trigger: EventTypeEnum.Click,
        actions: [{ action: ActionTypeEnum.Show, customActionType: "component" }],
        conditions: [],
        conditionType: "all",
        ...over
      }) as unknown as Event;

    it("只规划 trigger 匹配的事件, 顺序与匹配事件一一对应", () => {
      const events = [matchEvent({}), matchEvent({ trigger: EventTypeEnum.Change })];
      const plan = planEventActions({
        events,
        triggerType: EventTypeEnum.Click,
        curInfo: {},
        isExecuteOnlyConditionSatisfied: true
      });
      expect(plan).toHaveLength(1);
      expect(plan[0].isConditionSatisfied).toBe(true);
      expect(plan[0].actions).toHaveLength(1);
    });

    it("isExecuteOnlyConditionSatisfied=true: 条件不满足时动作清空", () => {
      const events = [
        matchEvent({
          conditions: [{ type: ConditionTypeEnum.Field, field: "v", compare: "==", expected: "1" }] as Condition[]
        })
      ];
      const plan = planEventActions({
        events,
        triggerType: EventTypeEnum.Click,
        curInfo: { v: 2 },
        isExecuteOnlyConditionSatisfied: true
      });
      expect(plan[0].isConditionSatisfied).toBe(false);
      expect(plan[0].actions).toHaveLength(0);
    });

    it("isExecuteOnlyConditionSatisfied=false: 条件不满足时按 filter 规则保留 show/hide", () => {
      const events = [
        matchEvent({
          actions: [
            { action: ActionTypeEnum.Show, customActionType: "component" },
            { action: ActionTypeEnum.UpdateConfig, customActionType: "component" }
          ] as Action[],
          conditions: [{ type: ConditionTypeEnum.Field, field: "v", compare: "==", expected: "1" }] as Condition[]
        })
      ];
      const plan = planEventActions({
        events,
        triggerType: EventTypeEnum.Click,
        curInfo: { v: 2 },
        isExecuteOnlyConditionSatisfied: false
      });
      expect(plan[0].isConditionSatisfied).toBe(false);
      expect(plan[0].actions).toHaveLength(1);
      expect(plan[0].actions[0].action).toBe(ActionTypeEnum.Show);
    });
  });
});

describe("CallbackEventManager", () => {
  it("on/emit/off 回调字段触发", async () => {
    const bus = new CallbackEventManager();
    const handler = vi.fn(async () => "r");
    bus.onCallbackFieldTrigger("k", handler);
    const res = await bus.emitCallbackFieldTrigger("k");
    expect(res).toEqual(["r"]);
    expect(handler).toHaveBeenCalledTimes(1);

    bus.clearAll();
    const res2 = await bus.emitCallbackFieldTrigger("k");
    expect(res2).toEqual([]);
  });
});

describe("EventCallbackRegistry", () => {
  it("注册/执行/计数/注销", async () => {
    const reg = new EventCallbackRegistry();
    const cb = vi.fn();
    const off = reg.registerCallback(cb);
    expect(reg.getCallbackCount()).toBe(1);

    await reg.executeCallbacks({ throwValue: { a: 1 }, triggerType: EventTypeEnum.Click });
    expect(cb).toHaveBeenCalledWith({ throwValue: { a: 1 }, triggerType: EventTypeEnum.Click });

    off();
    expect(reg.getCallbackCount()).toBe(0);
  });
});

describe("CallbackArguments（按大屏一个实例）", () => {
  // 每个用例各建一个实例：本类已不是单例，用例之间天然隔离，不再需要 beforeEach 清场

  it("从组件列表构建 source/target 回调关系", () => {
    const ca = new CallbackArguments();
    const source = {
      id: 1,
      name: "src",
      cbArgs: [{ id: "cb1", value: { origin: { value: "price" }, target: { value: "priceCb" } } }]
    };
    const target = {
      id: 2,
      name: "tgt",
      openFilter: true,
      listenArgs: [{ filterName: "f", callbackFields: ["priceCb"] }]
    };
    ca.initCallbackArguments([source, target] as unknown as ComponentType[]);

    const manager = ca.getCallbackArgumentsManager();
    expect(manager["priceCb"]?.source.map((s) => s.id)).toEqual([1]);
    expect(manager["priceCb"]?.target.map((t) => t.id)).toEqual([2]);
  });

  it("重复添加同一组件列表时，source/target 回调关系保持唯一", () => {
    const ca = new CallbackArguments();
    const source = {
      id: 1,
      name: "src",
      cbArgs: [{ id: "cb1", value: { origin: { value: "price" }, target: { value: "priceCb" } } }]
    };
    const target = {
      id: 2,
      name: "tgt",
      openFilter: true,
      listenArgs: [{ filterName: "f", callbackFields: ["priceCb"] }]
    };
    const componentList = [source, target] as unknown as ComponentType[];

    ca.addCallbackArgumentsFromComponentList(componentList);
    ca.addCallbackArgumentsFromComponentList(componentList);

    const relation = ca.getCallbackArgumentsManager()["priceCb"];
    expect(relation?.source).toHaveLength(1);
    expect(relation?.target).toHaveLength(1);
  });

  it("handleCallback 按 cbArgs 把抛出值写入 callbackArgs", () => {
    const ca = new CallbackArguments();
    const source = {
      id: 1,
      name: "src",
      cbArgs: [{ id: "cb1", value: { origin: { value: "price" }, target: { value: "priceCb" } } }]
    };
    ca.handleCallback({ sourceComponent: source as unknown as ComponentType, throwValue: { price: 99 } });
    expect(ca.getCallbackArgs()["priceCb"]).toBe(99);
  });
});
