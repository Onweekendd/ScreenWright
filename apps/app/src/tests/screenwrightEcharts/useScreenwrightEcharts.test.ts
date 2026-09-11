import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { shallowRef } from "vue";
import { flushPromises } from "@vue/test-utils";

import { useScreenwrightEcharts } from "@material/components/ScreenwrightEcharts/useScreenwrightEcharts";
import { useBaseFilter } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import { DataType } from "@screenwright/types";

import mockData from "../callback/componentData5.mock.json";

// ============================================================
// MOCK 配置
// ============================================================

const mockOnBeforeMount = vi.fn();
const mockOnMounted = vi.fn();
const mockOnUnmounted = vi.fn();
const mockInject = vi.fn();

// 保留 computed / ref / watchEffect / nextTick 真实行为，仅拦截生命周期
vi.mock("vue", async () => ({
  ...((await vi.importActual("vue")) as any),
  onBeforeMount: (fn: Function) => mockOnBeforeMount(fn),
  onMounted: (fn: Function) => mockOnMounted(fn),
  onUnmounted: (fn: Function) => mockOnUnmounted(fn),
  inject: (key: any, defaultValue?: any) => mockInject(key, defaultValue)
}));

// useScreenwrightEcharts 把取数委托给 useBaseFilter；api 取数链路（apiFilter → queryAPIData）
// 已由 callback/apiFilter.test.ts 覆盖。这里 mock useBaseFilter，注入「api 取数完成后的数据」，
// 聚焦验证 useScreenwrightEcharts 如何把数据转换为 ECharts option。
vi.mock("@screenwright/composables", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    useBaseFilter: vi.fn()
  };
});

// ============================================================
// 辅助
// ============================================================

/** 取 mock 数据中的柱状图组件（dataType=2 API 数据源，option 字段完整可支撑 BaseComponent.init） */
const getEchartBarElement = (): ComponentType => {
  const rawData = JSON.parse(JSON.stringify(mockData)) as any;
  const layers: any[] = rawData?.layers ?? [];
  return layers.find((c: any) => c.id === 3224201) as ComponentType;
};

/** 注入指定的 inputData（模拟 api 取数完成），返回该 ref 以便测试中修改触发响应式 */
const setupUseBaseFilter = (data: any[]) => {
  const inputData = shallowRef<any[]>(data);
  vi.mocked(useBaseFilter).mockReturnValue({
    inputData,
    initData: vi.fn()
  } as any);
  return inputData;
};

/** 柱状图原始 data（即 api 返回经 dataRemark 映射后的数据格式） */
const barRawData = (): any[] => getEchartBarElement().data as any[];

/** 收集 options.series 下所有 data 项的 value，用于断言图表是否接收到数据 */
const collectSeriesValues = (options: any): any[] =>
  (options?.series ?? []).flatMap((s: any) => (s.data || []).map((d: any) => d.value));

// ============================================================
// 测试套件
// ============================================================

describe("useScreenwrightEcharts - api 数据源图表接收数据生成 option", () => {
  beforeEach(() => {
    vi.mocked(useBaseFilter).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("createRenderElement，传入 api 图表元素，强制 openFilter/autoRefresh 关闭且 dataType 重置为 STATIC", () => {
    const element = getEchartBarElement();
    setupUseBaseFilter(barRawData());
    const { element: renderElement } = useScreenwrightEcharts(element);

    expect(renderElement.value.openFilter, "渲染层不应再触发过滤").toBe(false);
    expect(renderElement.value.autoRefresh, "渲染层不应自动刷新").toBe(false);
    expect(renderElement.value.dataType, "dataType 应被强制为 STATIC").toBe(DataType.STATIC);
    expect(renderElement.value.dataRemark, "dataRemark 应被清空").toEqual([]);
  });

  it("useScreenwrightEcharts，注入 api 取数结果数据，options.series 包含全部数据值", async () => {
    const element = getEchartBarElement();
    setupUseBaseFilter(barRawData());
    const { options } = useScreenwrightEcharts(element);
    await flushPromises();
    await flushPromises();

    expect(Array.isArray(options.value.series), "series 应为数组").toBe(true);
    expect(options.value.series.length, "应有系列数据").toBeGreaterThan(0);

    expect(collectSeriesValues(options.value), "series 应包含全部 api 数据值").toEqual(
      expect.arrayContaining([2024, 2378, 1423, 1779, 1532, 1788, 1920, 2232])
    );
  });

  it("useScreenwrightEcharts，inputData 变化后 options 随之重新计算", async () => {
    const element = getEchartBarElement();
    const inputData = setupUseBaseFilter(barRawData());
    const { options } = useScreenwrightEcharts(element);
    await flushPromises();

    expect(collectSeriesValues(options.value), "初始应含原始值 2024").toContain(2024);

    // 模拟 api 返回全新数据
    inputData.value = [{ name: "Z", seriesName: "系列一", value: 999 }];
    await flushPromises();
    await flushPromises();

    const valuesAfter = collectSeriesValues(options.value);
    expect(valuesAfter, "options 应反映新数据 999").toContain(999);
    expect(valuesAfter, "旧数据应被替换").not.toContain(2024);
  });

  it("useScreenwrightEcharts，options.value 为普通对象可被解构（非 Promise）", async () => {
    const element = getEchartBarElement();
    setupUseBaseFilter(barRawData());
    const { options } = useScreenwrightEcharts(element);
    await flushPromises();

    expect(options.value, "不应是 Promise").not.toBeInstanceOf(Promise);
    const { series } = options.value;
    expect(series, "解构应拿到 series 字段").toBeDefined();
  });

  it("useScreenwrightEcharts，inputData 为空数组时 options.series 为空数组", async () => {
    const element = getEchartBarElement();
    setupUseBaseFilter([]);
    const { options } = useScreenwrightEcharts(element);
    await flushPromises();
    await flushPromises();

    expect(options.value.series, "空数据应得到空 series").toEqual([]);
  });
});
