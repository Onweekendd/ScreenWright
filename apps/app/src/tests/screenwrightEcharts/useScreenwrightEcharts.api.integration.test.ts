import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { flushPromises } from "@vue/test-utils";

import { useScreenwrightEcharts } from "@material/components/ScreenwrightEcharts/useScreenwrightEcharts";
import { initFilterDataApi } from "@screenwright/composables";
import { isNumber, isString } from "lodash-es";

import { getLargeScreenInfo } from "@/api/build";
import { queryAPIData } from "@/api/dataSource";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import type { ComponentType } from "@/views/build/components/buildRender/type";
import { useCacheData } from "@/views/build/useCacheData";
import { useDataFilter } from "@/views/build/useDataFilter";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import mockDetail from "../callback/componentData5.mock.json";

// ============================================================
// MOCK 配置（复用 callback/apiFilter.test.ts 的基础设施）
// ============================================================

const mockOnBeforeMount = vi.fn();
const mockOnUnmounted = vi.fn();
const mockInject = vi.fn();

// 收集所有 onMounted 回调，但不立即执行。
// useScreenwrightEcharts 把取数藏在 useBaseFilter 的 onMounted 里、且不暴露 initData，
// 因此在调用 useScreenwrightEcharts 之后，手动执行它新注册的那批 onMounted 来触发取数。
// store 初始化链上的 onMounted（如 useCustomAnimation）保持不执行，避免模块 TDZ。
const mountedCallbacks: Function[] = [];

vi.mock("vue", async () => ({
  ...((await vi.importActual("vue")) as any),
  onBeforeMount: (fn: Function) => mockOnBeforeMount(fn),
  onMounted: (fn: Function) => {
    mountedCallbacks.push(fn);
    return undefined;
  },
  onBeforeUnmount: vi.fn(),
  onUnmounted: (fn: Function) => mockOnUnmounted(fn),
  inject: (key: any, defaultValue?: any) => mockInject(key, defaultValue)
}));

vi.mock("@/utils/utils", () => ({
  uuid: vi.fn(() => "mock-uuid-1234"),
  extractComponentId: vi.fn((component: string | number): number => {
    if (isNumber(component)) {
      return component;
    }
    if (isString(component)) {
      if (!component.includes("$component")) {
        return Number(component);
      }
      const match = component.match(/\$component\((\d+)\)/);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }
    return Number(component);
  })
}));

vi.mock("@/api/build", () => ({
  getLargeScreenInfo: vi
    .fn()
    .mockImplementation(() => Promise.resolve({ result: JSON.parse(JSON.stringify(mockDetail)) }))
}));

vi.mock("@/api/library", () => ({
  updateLargeScreen: vi.fn(),
  updateLayersAgg: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock("@/utils/service", () => ({ createRequest: vi.fn() }));
vi.mock("@/utils/cacheService", () => ({ createRequest: vi.fn() }));

vi.mock("element-plus", () => ({
  ElMessage: { error: vi.fn() }
}));

vi.mock("@/api/dataSource", () => ({
  queryAPIData: vi.fn()
}));

// 注入 api 数据源端口：apiFilter 通过它调用 mock 后的 queryAPIData
initFilterDataApi({ executeSql: vi.fn(), queryAPIData, getCsvData: vi.fn() });

// ============================================================
// 辅助
// ============================================================

/** 异步链路：onMounted 取数 → inputData 更新 → watch 重跑 → init → options */
const flushAll = async () => {
  await flushPromises();
  await flushPromises();
  await flushPromises();
  await flushPromises();
  await flushPromises();
};

/** 执行自给定起点起新注册的 onMounted（即 useScreenwrightEcharts 内 useBaseFilter 注册的那个），触发取数 */
const runMountedSince = async (since: number) => {
  for (const fn of mountedCallbacks.slice(since)) {
    await fn();
  }
};

const collectSeriesValues = (options: any): any[] =>
  (options?.series ?? []).flatMap((s: any) => (s.data || []).map((d: any) => d.value));

// ============================================================
// 测试套件
// ============================================================

describe("useScreenwrightEcharts - api 端到端：queryAPIData → useBaseFilter → option", () => {
  let groupData: any;

  beforeEach(async () => {
    mountedCallbacks.length = 0;
    (queryAPIData as any).mockClear();

    const { resetNavInfo, setNavInfo } = useLargeScreenInfo();
    const { setGroupData, groupData: gd, resetGroupData } = useGlobalComponentData();
    const { initCallbackArguments, onClear } = useCallbackArguments();
    const { setDetail2Config, resetEditStore } = useEditStore();
    const { resetDataFilter, cloneDataFilterOnInit } = useDataFilter();
    onClear();
    resetEditStore();
    resetNavInfo();
    resetGroupData();
    resetDataFilter();

    const res = await getLargeScreenInfo(30495);
    setNavInfo(res.result);
    setGroupData(res.result);
    setDetail2Config(res.result);
    groupData = gd;
    initCallbackArguments(groupData.value);
    cloneDataFilterOnInit();
  });

  afterEach(() => {
    const { buildWorkerCacheInput } = useCacheData();
    structuredClone(buildWorkerCacheInput(Date.now()));
  });

  /** 取 mock 屏幕中的柱状图（dataType=2 API 数据源） */
  const getEchartBar = (): ComponentType => groupData.value.find((c: any) => c.id === 3224201);

  it("api 图表初始化，queryAPIData 返回 admin 用户，options.series 反映全局 dataFormatter 转换后的用户信息数据", async () => {
    // 3224201 绑定的全局 dataFormatter（见 componentData5.mock.json 的 dataFilterArr）
    // 将用户对象转为「用户信息」系列：ID=42、姓名长度=2、邮箱长度=6、角色码 admin→100
    (queryAPIData as any).mockResolvedValue({
      status: 200,
      data: { id: 42, name: "ab", email: "a@b.co", role: "admin" }
    });

    const element = getEchartBar();
    const before = mountedCallbacks.length;
    const { options } = useScreenwrightEcharts(element);
    await runMountedSince(before);
    await flushAll();

    expect(queryAPIData, "应通过 api 数据源发起请求").toHaveBeenCalled();
    expect(options.value.series.length, "应有系列数据").toBeGreaterThan(0);
    expect(collectSeriesValues(options.value), "应包含经 dataFormatter 转换后的全部值").toEqual(
      expect.arrayContaining([42, 2, 6, 100])
    );
  });

  it("api 图表初始化，queryAPIData 请求参数使用 dataQuery 模板默认值", async () => {
    (queryAPIData as any).mockResolvedValue({
      status: 200,
      data: { id: 1, name: "admin", email: "admin@test.com", role: "admin" }
    });

    const element = getEchartBar();
    const before = mountedCallbacks.length;
    useScreenwrightEcharts(element);
    await runMountedSince(before);
    await flushAll();

    expect(queryAPIData).toHaveBeenCalled();
    const callArgs = (queryAPIData as any).mock.calls[0][0];
    expect(callArgs.method, "请求方法应为 get").toBe("get");
    expect(callArgs.url, "URL 应含 dataQuery 模板默认值 keyword=all").toContain("keyword=all");
    expect(callArgs.url, "URL 应含静态参数 page=1").toContain("page=1");
  });

  it("queryAPIData 返回 role=user 的用户，角色码系列值为 50（非 admin 分支）", async () => {
    (queryAPIData as any).mockResolvedValue({
      status: 200,
      data: { id: 1, name: "u", email: "u@x.co", role: "user" }
    });

    const element = getEchartBar();
    const before = mountedCallbacks.length;
    const { options } = useScreenwrightEcharts(element);
    await runMountedSince(before);
    await flushAll();

    const values = collectSeriesValues(options.value);
    expect(values, "user 角色码应为 50").toContain(50);
    expect(values, "不应出现 admin 分支的 100").not.toContain(100);
  });
});
