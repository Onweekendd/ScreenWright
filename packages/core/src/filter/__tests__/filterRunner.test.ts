/**
 * FilterRunner 在 Node 里的端到端行为。
 *
 * 这批用例就是「过滤器执行已经能脱离浏览器」的可执行证明：没有 Vue、没有 DOM、没有真实 IO，
 * 静态数据源 + 注入的内存 sink 就能把 dataFormatter 真跑一遍并把结果读回来。
 * Screenwright 后端算过滤结果、eval 验 agent 写的 dataFormatter 对不对，走的都是这条路。
 */
import type { ChildComponent, ComponentType, Filter } from "@screenwright/types";
import { DataType } from "@screenwright/types";
import { beforeEach, describe, expect, it } from "vitest";

import { BaseFilter } from "../BaseFilter";
import { setCallbackArgsSource } from "../CallbackArgsSource";
import { getCompiledFunctionCache } from "../CompiledFunctionCache";
import { MemoryFilterResultSink, setFilterResultSink } from "../FilterResultSink";
import { FilterRunner, registeredFilterStrategies, registerFilterStrategy } from "../FilterRunner";

const makeFilter = (name: string, body: string): Filter => ({ name, dataFormatter: body }) as unknown as Filter;

const listen = (filterName: string) => ({ filterName, usageStatus: true, callbackFields: [] });

/** 一个最小可用的静态数据源组件；只填过滤链真正读的字段。 */
const makeComponent = (over: Partial<ComponentType> = {}): ComponentType =>
  ({
    id: 4152,
    dataType: DataType.STATIC,
    data: [{ 城市: "深圳", 销售额: 100 }],
    openFilter: true,
    listenArgs: [],
    dataRemark: [],
    ...over
  }) as unknown as ComponentType;

let sink: MemoryFilterResultSink;

beforeEach(() => {
  getCompiledFunctionCache().clear();
  sink = new MemoryFilterResultSink();
  setFilterResultSink(sink);
  setCallbackArgsSource({ getCallbackArgs: () => ({}) });
});

describe("FilterRunner · 静态数据源", () => {
  it("跑通过滤链：读组件自己的 data，经 dataFormatter 变换后返回", async () => {
    const target = makeComponent({
      data: [{ n: 1 }, { n: 2 }, { n: 3 }],
      listenArgs: [listen("keepBig")]
    } as Partial<ComponentType>);

    const result = await new FilterRunner().run({
      filterConfig: { keepBig: makeFilter("keepBig", "(data) => data.filter((i) => i.n >= 2)") },
      target
    });

    expect(result).toEqual([{ n: 2 }, { n: 3 }]);
  });

  it("结果写进 sink，能按组件读回 —— 默认 no-op sink 会把结果丢掉，这正是 Node 侧要注入内存实现的原因", async () => {
    const target = makeComponent({ data: [{ n: 1 }], listenArgs: [listen("double")] } as Partial<ComponentType>);

    await new FilterRunner().run({
      filterConfig: { double: makeFilter("double", "(data) => data.map((i) => ({ n: i.n * 2 }))") },
      target
    });

    const collected = sink.getResults(target);
    expect(collected).toHaveLength(1);
    expect(collected[0].filterName).toBe("double");
    expect(collected[0].outputData).toEqual([{ n: 2 }]);
  });

  it("openFilter 为 false 时不跑过滤器，原样返回", async () => {
    const target = makeComponent({
      openFilter: false,
      data: [{ n: 1 }],
      listenArgs: [listen("double")]
    } as Partial<ComponentType>);

    const result = await new FilterRunner().run({
      filterConfig: { double: makeFilter("double", "(data) => data.map((i) => ({ n: i.n * 2 }))") },
      target
    });

    expect(result).toEqual([{ n: 1 }]);
  });

  it("dataRemark 做字段映射", async () => {
    const target = makeComponent({
      data: [{ 原始名: "深圳" }],
      listenArgs: [],
      dataRemark: [{ key: "name", map: "原始名" }]
    } as unknown as Partial<ComponentType>);

    const result = await new FilterRunner().run({ filterConfig: {}, target });

    expect(result).toEqual([{ 原始名: "深圳", name: "深圳" }]);
  });
});

describe("FilterRunner · 回调参数注入", () => {
  it("dataFormatter 的第二个入参就是 CallbackArgsSource 提供的值", async () => {
    setCallbackArgsSource({ getCallbackArgs: () => ({ 城市: "广州" }) });

    const target = makeComponent({
      data: [{ 城市: "深圳" }, { 城市: "广州" }],
      listenArgs: [listen("byCity")]
    } as Partial<ComponentType>);

    const result = await new FilterRunner().run({
      filterConfig: {
        byCity: makeFilter("byCity", "(data, args) => data.filter((i) => i.城市 === args.城市)")
      },
      target
    });

    // 这条通了，「A 抛出回调参数 → B 按该值过滤」的下半程就成立了
    expect(result).toEqual([{ 城市: "广州" }]);
  });

  it("未注入来源时回调参数为空对象，不崩", async () => {
    setCallbackArgsSource({ getCallbackArgs: () => ({}) });

    const target = makeComponent({ data: [{ n: 1 }], listenArgs: [listen("safe")] } as Partial<ComponentType>);

    const result = await new FilterRunner().run({
      filterConfig: { safe: makeFilter("safe", "(data, args) => (args && args.x ? [] : data)") },
      target
    });

    expect(result).toEqual([{ n: 1 }]);
  });
});

describe("FilterRunner · 策略表", () => {
  it("STATIC 与 IOT 由 core 内置，无需注册", () => {
    expect(registeredFilterStrategies()).toEqual(expect.arrayContaining([DataType.STATIC, DataType.IOT]));
  });

  it("未注册的 dataType 退回静态数据源 —— 与下沉前 getDataTypeStrategy 的兜底一致", async () => {
    const target = makeComponent({
      dataType: DataType.SQL, // core 侧从未注册 SQL（实现留在 use）
      data: [{ n: 7 }],
      listenArgs: []
    } as Partial<ComponentType>);

    const result = await new FilterRunner().run({ filterConfig: {}, target });

    expect(result).toEqual([{ n: 7 }]);
  });

  it("注册的策略会被用上", async () => {
    class FixedFilter extends BaseFilter {
      async run(filterConfig: Record<string, Filter>, target: ComponentType | ChildComponent): Promise<any[]> {
        return await this.transformDataByFilter(filterConfig, target);
      }
      async getInputData(): Promise<any[]> {
        return [{ n: 999 }];
      }
    }
    registerFilterStrategy(DataType.CSV, () => new FixedFilter());

    const target = makeComponent({
      dataType: DataType.CSV,
      data: [{ n: 1 }],
      listenArgs: []
    } as Partial<ComponentType>);
    const result = await new FilterRunner().run({ filterConfig: {}, target });

    // 取的是策略的 getInputData，不是组件自己的 data
    expect(result).toEqual([{ n: 999 }]);
  });

  it("提供 setupSubscription 的策略会先建订阅 —— core 按形状判断，不认识 WebsocketFilter", async () => {
    const calls: string[] = [];
    class SubFilter extends BaseFilter {
      async setupSubscription(): Promise<void> {
        calls.push("subscribe");
      }
      async run(filterConfig: Record<string, Filter>, target: ComponentType | ChildComponent): Promise<any[]> {
        calls.push("run");
        return await this.transformDataByFilter(filterConfig, target);
      }
      async getInputData(target: ComponentType): Promise<any[]> {
        return target.data;
      }
    }
    registerFilterStrategy(DataType.WEBSOCKET, () => new SubFilter());

    const target = makeComponent({ dataType: DataType.WEBSOCKET, listenArgs: [] } as Partial<ComponentType>);
    await new FilterRunner().run({ filterConfig: {}, target });

    expect(calls).toEqual(["subscribe", "run"]);
  });
});
