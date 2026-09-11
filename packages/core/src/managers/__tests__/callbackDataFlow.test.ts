/**
 * 「A 点击抛出回调参数 → B 重算过滤器 → 拿到按该值过滤的数据」在 Node 里的完整链路。
 *
 * 这是 core 下沉的收官验收：没有 Vue、没有 DOM、没有浏览器，一份大屏数据 + 三行装配
 * （init / registerAllFilters / dispatchCallback）就能把这条数据流真跑一遍并断言输出。
 *
 * 链路上的每一环都可能沉默失败，所以每一环都单独有用例：
 *   关系图没建 → callbackRelation 恒 undefined，循环 continue，什么都不发生且不报错
 *   监听没注册 → emit 出去没人接，结果为 undefined
 *   sink 没注入 → 默认 no-op，结果写进黑洞
 *   回调值没注入 → 过滤器读到空对象，过滤条件恒不成立
 */
import type { ComponentType, LargeScreeInfo } from "@screenwright/types";
import { DataType } from "@screenwright/types";
import { beforeEach, describe, expect, it } from "vitest";

import { setCallbackArgsSource } from "../../filter/CallbackArgsSource";
import { getCompiledFunctionCache } from "../../filter/CompiledFunctionCache";
import { MemoryFilterResultSink, setFilterResultSink } from "../../filter/FilterResultSink";
import { ScreenEditor } from "../../ScreenEditor";
import { MemoryEditorState } from "../../state/MemoryEditorState";

/** 源组件：点击时抛出「城市」，映射为回调参数 cityCb */
const makeSource = (): ComponentType =>
  ({
    id: 4151,
    name: "城市筛选器",
    dataType: DataType.STATIC,
    data: [],
    openFilter: false,
    listenArgs: [],
    dataRemark: [],
    cbArgs: [{ id: "cb-1", value: { origin: { value: "城市" }, target: { value: "cityCb" } } }]
  }) as unknown as ComponentType;

/** 目标组件：消费 cityCb，按它过滤自己的静态数据 */
const makeTarget = (): ComponentType =>
  ({
    id: 4152,
    name: "销售额柱图",
    dataType: DataType.STATIC,
    data: [
      { 城市: "深圳", 销售额: 100 },
      { 城市: "广州", 销售额: 200 }
    ],
    // openFilter 必须为真，否则 registerTargetComponents 直接跳过，B 不会进关系图
    openFilter: true,
    listenArgs: [{ filterName: "byCity", usageStatus: true, callbackFields: ["cityCb"] }],
    dataRemark: [],
    cbArgs: []
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

/**
 * 取某个目标组件的过滤输出。
 *
 * emitCallbackFieldTrigger 返回的是**所有监听者**的结果数组（一个 key 理论上可挂多个监听），
 * 所以 result[回调参数][组件id] 本身是数组，[0] 才是那个组件的过滤结果。
 * 这一层与前端 useCallbackArguments.handleCallback 的返回形状一致，core 不擅自解包。
 */
const outputOf = (result: Record<string, Record<string, unknown>>, field: string, id: string): unknown => {
  const perListener = result[field]?.[id] as unknown[] | undefined;
  return perListener?.[0];
};

/** 监听者数量：重复注册会让它大于 1 */
const listenerCount = (result: Record<string, Record<string, unknown>>, field: string, id: string): number =>
  (result[field]?.[id] as unknown[] | undefined)?.length ?? 0;

let editor: ScreenEditor;
let sink: MemoryFilterResultSink;
let source: ComponentType;
let target: ComponentType;

/** 与真实宿主同样的装配顺序：建编辑器 → 注入两个运行时来源 → init → 注册监听 */
const setup = (options: { init?: boolean; register?: boolean } = {}) => {
  const { init = true, register = true } = options;
  getCompiledFunctionCache().clear();

  source = makeSource();
  target = makeTarget();
  editor = ScreenEditor.create(new MemoryEditorState());

  sink = new MemoryFilterResultSink();
  setFilterResultSink(sink);
  // 回调参数的运行时值来自**这个** editor —— CallbackArguments 是按大屏的，不是单例
  setCallbackArgsSource({ getCallbackArgs: () => editor.event.callbackArguments.getCallbackArgs() });

  if (init) {
    editor.init(makeScreen([source, target]));
  }
  if (register) {
    editor.dataFilter.registerAllFilters();
  }
};

beforeEach(() => setup());

describe("回调参数驱动的完整数据流", () => {
  it("A 抛出 → B 按该值过滤 → 输出收集回来", async () => {
    const result = await editor.dataFilter.dispatchCallback({
      sourceComponent: source,
      throwValue: { 城市: "广州" }
    });

    expect(outputOf(result, "cityCb", "4152")).toEqual([{ 城市: "广州", 销售额: 200 }]);
  });

  it("抛出值变了，B 跟着重算", async () => {
    await editor.dataFilter.dispatchCallback({ sourceComponent: source, throwValue: { 城市: "广州" } });
    const second = await editor.dataFilter.dispatchCallback({ sourceComponent: source, throwValue: { 城市: "深圳" } });

    expect(outputOf(second, "cityCb", "4152")).toEqual([{ 城市: "深圳", 销售额: 100 }]);
  });

  it("过滤结果同时进了 sink，可按组件读回", async () => {
    await editor.dataFilter.dispatchCallback({ sourceComponent: source, throwValue: { 城市: "广州" } });

    const collected = sink.getResults(target);
    expect(collected).toHaveLength(1);
    expect(collected[0].filterName).toBe("byCity");
    expect(collected[0].outputData).toEqual([{ 城市: "广州", 销售额: 200 }]);
  });

  it("throwValue 用的是源组件的 origin 字段名，不是回调参数名", async () => {
    // 传 cityCb（target 名）而不是「城市」（origin 名）：handleCallback 找不到值，callbackArgs 不更新，
    // 过滤器读到 undefined 走「无条件」分支，返回全量。错着写不会报错，只会静默拿到全量数据。
    const result = await editor.dataFilter.dispatchCallback({
      sourceComponent: source,
      throwValue: { cityCb: "广州" }
    });

    expect(outputOf(result, "cityCb", "4152")).toHaveLength(2);
  });

  it("源组件没有 cbArgs 时直接返回空结果", async () => {
    const result = await editor.dataFilter.dispatchCallback({
      sourceComponent: makeTarget(), // 目标组件本身没有 cbArgs
      throwValue: { 城市: "广州" }
    });

    expect(result).toEqual({});
  });
});

describe("链路缺环时的表现", () => {
  it("没 init（关系图为空）→ 没有任何组件被触发", async () => {
    setup({ init: false, register: false });
    // 手工把状态填上但不建关系图，模拟「后端 ScreenEditor.create 之后什么都没调」
    editor.component.setLayers(makeScreen([source, target]));

    const result = await editor.dataFilter.dispatchCallback({
      sourceComponent: source,
      throwValue: { 城市: "广州" }
    });

    // 这正是 init 存在的理由：关系图空着，dispatch 什么都不做且不报错
    expect(result).toEqual({});
  });

  it("没 registerAllFilters（监听未注册）→ 触发了但没人接，结果为空", async () => {
    setup({ register: false });

    const result = await editor.dataFilter.dispatchCallback({
      sourceComponent: source,
      throwValue: { 城市: "广州" }
    });

    // 关系图有，所以 B 被找到并 emit 了；但没监听者，emit 收不到任何返回
    expect(result.cityCb["4152"]).toEqual([]);
  });
});

describe("监听注册", () => {
  it("重复注册是 no-op，不会让同一次触发把过滤器跑多遍", async () => {
    editor.dataFilter.registerAllFilters();
    editor.dataFilter.registerAllFilters();

    const result = await editor.dataFilter.dispatchCallback({
      sourceComponent: source,
      throwValue: { 城市: "广州" }
    });

    // 重复注册会让同一 key 挂多个监听者、emit 返回多份；这里应当只有一份
    expect(listenerCount(result, "cityCb", "4152")).toBe(1);
    expect(outputOf(result, "cityCb", "4152")).toEqual([{ 城市: "广州", 销售额: 200 }]);
  });

  it("注销后不再响应", async () => {
    await editor.dataFilter.unregisterFilterListeners(target);

    const result = await editor.dataFilter.dispatchCallback({
      sourceComponent: source,
      throwValue: { 城市: "广州" }
    });

    expect(result.cityCb["4152"]).toEqual([]);
  });

  it("filter_trigger 可以绕过回调参数直接触发某个组件重算", async () => {
    const results = await editor.dataFilter.emitFilterTrigger("4152");

    expect(results[0]).toEqual([
      { 城市: "深圳", 销售额: 100 },
      { 城市: "广州", 销售额: 200 }
    ]);
  });
});
