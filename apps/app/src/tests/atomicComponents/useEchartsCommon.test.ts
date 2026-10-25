import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ref } from "vue";

// 不挂载组件，直接调用 hook；仅拦截 vue 生命周期，computed/ref/watch 保留真实行为
vi.mock("vue", async () => ({
  ...((await vi.importActual("vue")) as any),
  onMounted: vi.fn(),
  onBeforeUnmount: vi.fn()
}));

// useEchartsCommon 把取数/option 读取委托给 useBaseData，这里 mock 掉，
// 直接控制 dataChart / option，聚焦验证 useEchartsCommon 如何把数据转换为最终 echarts option。
const mockOption = ref<Record<string, any>>({});
const mockDataChart = ref<any>([]);

vi.mock("@/hooks/useBaseData", () => ({
  useBaseData: vi.fn(() => ({
    dataChart: mockDataChart,
    option: mockOption,
    styleSizeName: ref({})
  }))
}));

// @screenwright/material/chart 是包含图表编辑器 UI 的重量级 barrel，useEchartsCommon 仅用到
// echartsCore（挂到 window.echarts，与本文件断言逻辑无关），mock 掉避免加载整个图表编辑器依赖树。
vi.mock("@screenwright/material/chart", () => ({
  echartsCore: {}
}));

import { useEchartsCommon } from "@/components/ScreenwrightThirdPartComponent/echartcommon/useEchartsCommon";

describe("useEchartsCommon", () => {
  beforeEach(() => {
    mockOption.value = {};
    mockDataChart.value = [];
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getEchartsOptions，仅有 echartFormatter 无 echartsOption，单参数调用且返回值即最终 option", () => {
    mockDataChart.value = [{ name: "a", value: 1 }];
    mockOption.value = {
      echartFormatter: "(dataChart) => ({ series: [{ data: dataChart }] })"
    };

    const { getEchartsOptions } = useEchartsCommon({} as any);
    const result = getEchartsOptions();

    expect(result).toEqual({ series: [{ data: [{ name: "a", value: 1 }] }] });
    expect(result.dataset, "旧链路不应注入 dataset").toBeUndefined();
  });

  it("getEchartsOptions，仅有 echartsOption 且 dataChart 为扁平记录数组，dataset.source 等于原数组", () => {
    mockDataChart.value = [
      { name: "Mon", value: 10 },
      { name: "Tue", value: 20 }
    ];
    mockOption.value = {
      echartsOption: { series: [{ type: "bar", encode: { x: "name", y: "value" } }] }
    };

    const { getEchartsOptions } = useEchartsCommon({} as any);
    const result = getEchartsOptions();

    expect(result.dataset).toEqual({
      source: [
        { name: "Mon", value: 10 },
        { name: "Tue", value: 20 }
      ]
    });
    expect(result.series, "原 echartsOption 字段应保留").toEqual([
      { type: "bar", encode: { x: "name", y: "value" } }
    ]);
  });

  it("getEchartsOptions，仅有 echartsOption 且 dataChart 为 {categories, series}[] 形状，dataset.source 转换为按类目展开的行表", () => {
    mockDataChart.value = [
      {
        categories: ["Mon", "Tue"],
        series: [
          { name: "系列一", data: [10, 20] },
          { name: "系列二", data: [30, 40] }
        ]
      }
    ];
    mockOption.value = {
      echartsOption: { series: [{ type: "line" }] }
    };

    const { getEchartsOptions } = useEchartsCommon({} as any);
    const result = getEchartsOptions();

    expect(result.dataset).toEqual({
      source: [
        { name: "Mon", 系列一: 10, 系列二: 30 },
        { name: "Tue", 系列一: 20, 系列二: 40 }
      ]
    });
  });

  it("getEchartsOptions，echartsOption 与 echartFormatter 同时存在，formatter 以 (dataChart, 注入dataset后的option) 两参数被调用且返回值即最终 option", () => {
    mockDataChart.value = [{ name: "a", value: 1 }];
    mockOption.value = {
      echartsOption: { title: { text: "base" } },
      echartFormatter:
        "(dataChart, option) => ({ title: option.title, dataset: option.dataset, extra: dataChart.length })"
    };

    const { getEchartsOptions } = useEchartsCommon({} as any);
    const result = getEchartsOptions();

    expect(result).toEqual({
      title: { text: "base" },
      dataset: { source: [{ name: "a", value: 1 }] },
      extra: 1
    });
  });

  it("getEchartsOptions，新链路 echartFormatter 执行抛出异常，不崩溃且保留调用前的 option", () => {
    mockDataChart.value = [{ name: "a", value: 1 }];
    mockOption.value = {
      echartsOption: { title: { text: "base" } }
    };

    const { getEchartsOptions } = useEchartsCommon({} as any);
    const firstResult = getEchartsOptions();

    mockOption.value = {
      echartsOption: { title: { text: "base" } },
      echartFormatter: "(dataChart, option) => { throw new Error('boom') }"
    };
    const secondResult = getEchartsOptions();

    // 注：本仓库当前 vitest(0.32) + jsdom 环境下 vi.spyOn(console, "error") 的调用计数不可靠
    // （直接调用 console.error 后 spy.mock.calls 仍为空，已排查确认非本文件代码问题），
    // 因此这里以“保留调用前的 option 引用”作为出错未崩溃、且未被异常值覆盖的可验证信号。
    expect(secondResult, "抛出异常后应保留上一次的 option 引用").toBe(firstResult);
  });
});
