/**
 * 「触发 A 的事件 → 动作执行 → 抛出回调 → B 重算过滤器」在 Node 里的完整链路。
 *
 * 这是 core 下沉的最终验收：没有 Vue、没有 DOM、没有浏览器，一次 dispatch
 * 就把事件系统与过滤器系统串起来跑完，并且两端都能断言——
 * 动作那端靠注入的记录型执行器，数据那端靠返回的过滤结果。
 *
 * eval 要的正是这个形状：DOM 类动作在 Node 里执行不了，但「被触发了、目标对、条件判断对」
 * 是可以断言的，这已经覆盖了「agent 把事件配没配对」的绝大部分。
 */
import type { Action, ComponentType, LargeScreeInfo } from "@screenwright/types";
import { ComponentScopeEnum, DataType, EventTypeEnum } from "@screenwright/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  type ActionContext,
  registerActionContextEnricher,
  registerCustomAction,
  resetEventPorts,
  setActionExecutor
} from "../../events/eventPorts";
import { setCallbackArgsSource } from "../../filter/CallbackArgsSource";
import { getCompiledFunctionCache } from "../../filter/CompiledFunctionCache";
import { MemoryFilterResultSink, setFilterResultSink } from "../../filter/FilterResultSink";
import { ScreenEditor } from "../../ScreenEditor";
import { MemoryEditorState } from "../../state/MemoryEditorState";
import { ActionExecutionMode, EventDispatcher } from "../EventDispatcher";

/** 记录型动作执行器：DOM 类动作在 Node 里跑不了，但「被触发了」本身就是断言材料 */
interface RecordedAction {
  action: Action;
  context: ActionContext;
  componentIds: number[];
  isConditionSatisfied: boolean;
  scopeSize: number;
}

let recorded: RecordedAction[];
let customCalls: string[];
let editor: ScreenEditor;
let source: ComponentType;

/** A：点击时执行一个显隐动作（作用于 B），同时抛出「城市」映射为回调参数 cityCb */
const makeSource = (): ComponentType =>
  ({
    id: 4151,
    name: "城市筛选器",
    dataType: DataType.STATIC,
    data: [],
    openFilter: false,
    listenArgs: [],
    dataRemark: [],
    cbArgs: [{ id: "cb-1", value: { origin: { value: "城市" }, target: { value: "cityCb" } } }],
    events: [
      {
        id: "evt-1",
        trigger: EventTypeEnum.Click,
        conditions: [],
        actions: [{ action: "Hide", component: [4152], componentScope: ComponentScopeEnum.All }]
      }
    ]
  }) as unknown as ComponentType;

/** B：消费 cityCb 过滤自己的静态数据 */
const makeTarget = (): ComponentType =>
  ({
    id: 4152,
    name: "销售额柱图",
    dataType: DataType.STATIC,
    data: [
      { 城市: "深圳", 销售额: 100 },
      { 城市: "广州", 销售额: 200 }
    ],
    openFilter: true,
    listenArgs: [{ filterName: "byCity", usageStatus: true, callbackFields: ["cityCb"] }],
    dataRemark: [],
    cbArgs: [],
    events: []
  }) as unknown as ComponentType;

const makeScreen = (layers: ComponentType[]): LargeScreeInfo =>
  ({
    id: 9001,
    versionCode: "1",
    name: "eval 起点",
    detail: {},
    layers,
    dataFilterArr: {
      byCity: {
        name: "byCity",
        dataFormatter: "(data, args) => (args.cityCb ? data.filter((i) => i.城市 === args.cityCb) : data)"
      }
    }
  }) as unknown as LargeScreeInfo;

beforeEach(() => {
  getCompiledFunctionCache().clear();
  recorded = [];
  customCalls = [];

  source = makeSource();
  editor = ScreenEditor.create(new MemoryEditorState());
  setFilterResultSink(new MemoryFilterResultSink());
  setCallbackArgsSource({ getCallbackArgs: () => editor.event.callbackArguments.getCallbackArgs() });

  setActionExecutor((action: Action, ctx: ActionContext) => {
    recorded.push({
      action,
      context: ctx,
      componentIds: ctx.componentIds,
      isConditionSatisfied: ctx.isConditionSatisfied,
      scopeSize: ctx.globalComponentMap.size
    });
  });

  editor.init(makeScreen([source, makeTarget()]));
  editor.dataFilter.registerAllFilters();
});

afterEach(() => resetEventPorts());

describe("EventDispatcher · 事件到数据流的完整链路", () => {
  it("一次触发同时做成两件事：动作被执行，回调驱动 B 重算", async () => {
    const result = await editor.eventDispatcher.dispatch({
      events: source.events,
      triggerType: EventTypeEnum.Click,
      throwValue: { 城市: "广州" },
      id: 4151
    });

    // 动作那端
    expect(recorded).toHaveLength(1);
    expect(recorded[0].action.action).toBe("Hide");
    expect(recorded[0].componentIds).toEqual([4152]);
    expect(recorded[0].isConditionSatisfied).toBe(true);

    // 数据那端：B 按 cityCb 过滤后的输出
    expect((result.cityCb["4152"] as unknown[])[0]).toEqual([{ 城市: "广州", 销售额: 200 }]);
  });

  it("action 原样交给执行器：core 只补自己算得出的上下文，不拆动作也不查 DOM", async () => {
    await editor.eventDispatcher.dispatch({
      events: source.events,
      triggerType: EventTypeEnum.Click,
      throwValue: { 城市: "广州" },
      id: 4151
    });

    // 执行器拿到的是完整 action，自己决定怎么落地——「元素」这个概念不出现在 core 里
    expect(recorded[0].action).toMatchObject({
      action: "Hide",
      component: [4152],
      componentScope: ComponentScopeEnum.All
    });
    // core 补的是它算得出的：作用域范围、触发值
    expect(recorded[0].scopeSize).toBeGreaterThan(0);
  });

  it("triggerType 不匹配的事件不执行", async () => {
    const result = await editor.eventDispatcher.dispatch({
      events: source.events,
      triggerType: EventTypeEnum.Change, // 事件注册的是 Click
      throwValue: { 城市: "广州" },
      id: 4151
    });

    expect(recorded).toHaveLength(0);
    expect(result).toEqual({});
  });

  it("throwCallback 为 false 时只执行动作，不抛回调", async () => {
    const result = await editor.eventDispatcher.dispatch({
      events: source.events,
      triggerType: EventTypeEnum.Click,
      throwValue: { 城市: "广州" },
      id: 4151,
      throwCallback: false
    });

    expect(recorded).toHaveLength(1);
    expect(result).toEqual({});
  });

  it("上下文补充器把宿主要的东西挂上去：core 不认识「元素」这种概念", async () => {
    registerActionContextEnricher(async (action) => ({
      componentRootDoms: [`dom-${(action.component ?? [])[0]}`]
    }));
    registerActionContextEnricher(() => ({ eventList: { panel: 1 } }));

    await editor.eventDispatcher.dispatch({
      events: source.events,
      triggerType: EventTypeEnum.Click,
      throwValue: { 城市: "广州" },
      id: 4151
    });

    const ctx = recorded[0].context as ActionContext & Record<string, unknown>;
    expect(ctx.componentRootDoms).toEqual(["dom-4152"]);
    expect(ctx.eventList).toEqual({ panel: 1 });
    // core 自己算的那部分照旧
    expect(ctx.componentIds).toEqual([4152]);
  });

  it("自定义动作按 customActionType 分发；没注册的那类什么都不发生", async () => {
    registerCustomAction("statusAnimation", (action, ctx) => {
      customCalls.push(`${action.customActionType}:${ctx.isConditionSatisfied}`);
    });

    const custom = [
      { customActionType: "statusAnimation", panelStatusAnimationId: "a1", panelStatusId: "s1" },
      { customActionType: "message", tcpudpConfig: {} }
    ] as unknown as ComponentType["events"][number]["actions"];

    await editor.eventDispatcher.dispatch({
      events: [
        { id: "e2", trigger: EventTypeEnum.Click, conditions: [], actions: custom }
      ] as unknown as ComponentType["events"],
      triggerType: EventTypeEnum.Click,
      throwValue: {},
      id: 4151
    });

    // message 没注册：落回标准执行器，但它没有 action 也没有目标组件，于是被跳过
    expect(customCalls).toEqual(["statusAnimation:true"]);
    expect(recorded).toHaveLength(0);
  });

  it("带 customActionType 但没注册处理器的，按标准动作走——组件动作就是这一类", async () => {
    // 前端的标准组件动作也带 customActionType: "component"，判据是「认不认识这个类型」
    const events = [
      {
        id: "e4",
        trigger: EventTypeEnum.Click,
        conditions: [],
        actions: [
          {
            action: "Show",
            component: ["$component(4152)"],
            componentScope: ComponentScopeEnum.All,
            customActionType: "component"
          }
        ]
      }
    ] as unknown as ComponentType["events"];

    await editor.eventDispatcher.dispatch({
      events,
      triggerType: EventTypeEnum.Click,
      throwValue: {},
      id: 4151
    });

    expect(recorded).toHaveLength(1);
    expect(recorded[0].action.action).toBe("Show");
    expect(recorded[0].componentIds).toEqual([4152]);
    expect(customCalls).toEqual([]);
  });

  it("抛出值带函数也不炸：structuredClone 会抛，core 用的是按引用透传的深拷贝", async () => {
    const throwValue = { 城市: "广州", onDone: () => undefined, node: { nested: [1, 2] } };

    const result = await editor.eventDispatcher.dispatch({
      events: source.events,
      triggerType: EventTypeEnum.Click,
      throwValue,
      id: 4151
    });

    expect(recorded).toHaveLength(1);
    expect((result.cityCb["4152"] as unknown[])[0]).toEqual([{ 城市: "广州", 销售额: 200 }]);
  });

  it("多个动作默认逐个 await，PARALLEL 下并发发起", async () => {
    const order: string[] = [];
    setActionExecutor(async (action) => {
      order.push(`start-${action.action}`);
      await new Promise((resolve) => setTimeout(resolve, String(action.action) === "Hide" ? 20 : 0));
      order.push(`end-${action.action}`);
    });

    const events = [
      {
        id: "e3",
        trigger: EventTypeEnum.Click,
        conditions: [],
        actions: [
          { action: "Hide", component: [4152], componentScope: ComponentScopeEnum.All },
          { action: "Show", component: [4152], componentScope: ComponentScopeEnum.All }
        ]
      }
    ] as unknown as ComponentType["events"];

    await editor.eventDispatcher.dispatch({
      events,
      triggerType: EventTypeEnum.Click,
      throwValue: {},
      id: 4151
    });
    expect(order).toEqual(["start-Hide", "end-Hide", "start-Show", "end-Show"]);

    order.length = 0;
    await editor.eventDispatcher.dispatch({
      events,
      triggerType: EventTypeEnum.Click,
      throwValue: {},
      id: 4151,
      actionMode: ActionExecutionMode.PARALLEL
    });
    // 慢的先发起、后结束——两个动作真的重叠了
    expect(order).toEqual(["start-Hide", "start-Show", "end-Show", "end-Hide"]);
  });

  it("不注入执行器也能跑完编排，只是碰环境的部分不发生", async () => {
    resetEventPorts();

    const result = await editor.eventDispatcher.dispatch({
      events: source.events,
      triggerType: EventTypeEnum.Click,
      throwValue: { 城市: "广州" },
      id: 4151
    });

    // 动作执行器是默认 no-op，但回调链路照常
    expect(recorded).toHaveLength(0);
    expect((result.cityCb["4152"] as unknown[])[0]).toEqual([{ 城市: "广州", 销售额: 200 }]);
  });

  it("可以脱离 ScreenEditor 单独持有：只要给齐三个管理器就能派发", async () => {
    const dispatcher = new EventDispatcher({
      componentManager: editor.component,
      dataFilterManager: editor.dataFilter,
      eventCallbacks: editor.event.eventCallbacks
    });

    const result = await dispatcher.dispatch({
      events: source.events,
      triggerType: EventTypeEnum.Click,
      throwValue: { 城市: "深圳" },
      id: 4151
    });

    expect(recorded).toHaveLength(1);
    expect((result.cityCb["4152"] as unknown[])[0]).toEqual([{ 城市: "深圳", 销售额: 100 }]);
  });
});
