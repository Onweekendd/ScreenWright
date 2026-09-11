import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isNumber, isString } from "lodash-es";

import { getLargeScreenInfo } from "@/api/build";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useCacheData } from "@/views/build/useCacheData";
import { useDataFilter } from "@/views/build/useDataFilter";
import { useDataFilterBindingsFix } from "@/views/build/useDataFilterBindingsFix";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import mockDetail from "./componentData.mock.json";

// 模拟Vue的组件生命周期
const mockOnBeforeMount = vi.fn();
const mockOnMounted = vi.fn();
const mockOnUnmounted = vi.fn();
const mockInject = vi.fn();

vi.mock("vue", async () => ({
  ...((await vi.importActual("vue")) as any),
  onBeforeMount: (fn: Function) => mockOnBeforeMount(fn),
  onMounted: (fn: Function) => mockOnMounted(fn),
  onUnmounted: (fn: Function) => mockOnUnmounted(fn),
  inject: (key: any, defaultValue?: any) => mockInject(key, defaultValue)
}));

// 固定化 uuid，避免用例受随机值影响
vi.mock("@/utils/utils", () => ({
  uuid: vi.fn(() => "mock-uuid-1234"),
  extractComponentId: vi.fn((component: string | number): number => {
    // 如果是数字，直接返回
    if (isNumber(component)) {
      return component;
    }

    // 如果是字符串
    if (isString(component)) {
      // 如果不包含$component，直接返回
      if (!component.includes("$component")) {
        return Number(component);
      }

      // 如果包含$component，提取括号中的数字
      const match = component.match(/\$component\((\d+)\)/);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }

    // 其他情况，尝试转换为数字
    return Number(component);
  })
}));

// mock 获取大屏详情接口，每次返回 mockDetail 的深拷贝
vi.mock("@/api/build", () => ({
  getLargeScreenInfo: vi
    .fn()
    .mockImplementation(() => Promise.resolve({ result: JSON.parse(JSON.stringify(mockDetail)) }))
}));

vi.mock("@/api/library", () => ({
  updateLargeScreen: vi.fn(),

  // 更新组件数据接口 mock每次成功
  updateLayersAgg: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock("@/utils/service", () => ({
  createRequest: vi.fn()
}));

vi.mock("@/utils/cacheService", () => ({
  createRequest: vi.fn()
}));

describe("useDataFilter - 大屏组件基础数据过滤器操作测试", () => {
  beforeEach(async () => {
    const { resetNavInfo, setNavInfo } = useLargeScreenInfo();
    const { setGroupData, groupData, resetGroupData } = useGlobalComponentData();
    const { initCallbackArguments, onClear } = useCallbackArguments();
    const { setDetail2Config, resetEditStore } = useEditStore();
    const { resetDataFilter, cloneDataFilterOnInit } = useDataFilter();
    onClear();
    resetEditStore();
    resetNavInfo();
    resetGroupData();
    resetDataFilter();

    // 通过 mock 接口返回的数据进行初始化
    const res = await getLargeScreenInfo(23595);
    setNavInfo(res.result);
    setGroupData(res.result);
    setDetail2Config(res.result);
    initCallbackArguments(groupData.value);
    cloneDataFilterOnInit();
  });

  afterEach(() => {
    const { buildWorkerCacheInput } = useCacheData();

    const workerCacheInput = buildWorkerCacheInput(Date.now());

    structuredClone(workerCacheInput);
  });

  it("测试是否正确修复过滤器绑定", () => {
    const { allComponentMap } = useGlobalComponentData();
    const { syncComponentBindings, cleanupInvalidBindings } = useDataFilterBindingsFix();

    const { dataFilter } = useDataFilter();

    syncComponentBindings(dataFilter.value);

    Array.from(allComponentMap.value.values()).forEach((component) => {
      if (component.listenArgs && component.listenArgs.length > 0) {
        component.listenArgs.forEach((listenArg) => {
          const filter = dataFilter.value[listenArg.filterName];
          expect(filter.bindComponent.some((item) => item.id === component.id)).toBe(true);
        });
      }
    });

    cleanupInvalidBindings(dataFilter.value);
    Object.entries(dataFilter.value).forEach(([key, value]) => {
      value.bindComponent.forEach((item) => {
        expect(allComponentMap.value.has(`${item.id}`)).toBe(true);
      });
    });
  });
});
