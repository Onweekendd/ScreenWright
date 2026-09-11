import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ComputedRef } from "vue";
import { toRef } from "vue";

import dayjs from "dayjs";

import { getLargeScreenInfo } from "@/api/build";
import { useProgressiveRender } from "@/components/SystemComponent/DynamicPanel/components/useProgressiveRender";
import type { ScheduledTask, Scheduler } from "@/components/SystemComponent/DynamicPanel/components/utils";
import { useStateManagement } from "@/components/SystemComponent/DynamicPanel/hooks";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import type { PanelIdAndStatusIdToAnimationMap } from "@/views/build/components/buildConfig/attrsRender/components/customAnimation/useCustomAnimationData";
import type { DynamicPanelProps } from "@/views/build/components/buildRender/core/SystemComponent/panel/DynamicPanel";
import { DynamicPanel } from "@/views/build/components/buildRender/core/SystemComponent/panel/DynamicPanel";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import type { ComponentType } from "@/views/build/components/buildRender/type";
import { usePanelInfo } from "@/views/build/components/panelEditor/usePanelInfo";
import { useCacheData } from "@/views/build/useCacheData";
import { useCacheTime } from "@/views/build/useCacheTime";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { useDataFilter } from "../../views/build/useDataFilter";
import { useLargeScreenInfo } from "../../views/build/useLargeScreenInfo";
/**
 * 一个动态面板(2019412 )
 * 前五个状态是 每个状态9个条形图
 * 第六个状态含一个动态面板(2019458) 包含两个状态 每个状态9个条形图
 *
 */
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
  uuid: vi.fn(() => "mock-uuid-1234")
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
  updateLayersAgg: vi.fn().mockResolvedValue({ success: true }),

  delLayersAgg: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock("@/api/visual", () => ({
  getScreenMeta: vi.fn().mockResolvedValue({
    result: {
      updatedTime: "2025-08-26 10:00:00"
    }
  })
}));

vi.mock("@/utils/service", () => ({
  createRequest: vi.fn()
}));

vi.mock("@/utils/cacheService", () => ({
  createRequest: vi.fn()
}));

vi.mock("@/utils/config", () => ({
  BaseName: {
    Online: "online",
    System: "system"
  }
}));

// 在这里 mock 一个可以检查调用次数的函数
// 使用 Vitest 的 vi.fn() 实现，并导出以便测试中使用
export const mockFnWithCallCount = vi.fn();
export const mockFnWithCallCount2 = vi.fn();

describe("组件渐进式渲染测试", () => {
  beforeEach(async () => {
    const { resetNavInfo, setNavInfo } = useLargeScreenInfo();
    const { setGroupData, groupData, resetGroupData } = useGlobalComponentData();
    const { initCallbackArguments, onClear } = useCallbackArguments();
    const { setDetail2Config, resetEditStore } = useEditStore();
    const { resetDataFilter, cloneDataFilterOnInit } = useDataFilter();
    const { lastCacheTime } = useCacheTime();
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
    lastCacheTime.value = dayjs("2025-08-26 10:00:00").valueOf();
  });

  afterEach(() => {
    const { buildWorkerCacheInput } = useCacheData();

    const workerCacheInput = buildWorkerCacheInput(Date.now());

    structuredClone(workerCacheInput);

    // 重置 mockFnWithCallCount
    mockFnWithCallCount.mockReset();
  });

  it("动态面板初始化成功", async () => {
    const { panelInfo, activeStatus, initPanelDataFromLocalData } = usePanelInfo();
    const { groupData, panelChildComponentMap, allComponentMap } = useGlobalComponentData();

    // 未初始化
    expect(panelInfo.value.config, "面板信息").toEqual({});
    expect(activeStatus.value, "面板内组件").toBeUndefined();

    const dynamicPanel = await initPanelDataFromLocalData(groupData.value[0].id);
    expect(dynamicPanel, "动态面板").toBeDefined();

    const dynamicPanelChildComponentMap = panelChildComponentMap.value.get(`${dynamicPanel!.id}`);

    expect(dynamicPanelChildComponentMap, "动态面板组件").toBeDefined();

    // 1 + 9 * 5 + 1 + 9 * 2
    expect(allComponentMap.value.size, "组件数量").toBe(65);

    // 9 * 5 + 1 + 9 * 2
    expect(dynamicPanelChildComponentMap!.size, "动态面板组件数量").toBe(64);

    expect(panelInfo.value.config, "面板信息").toBeDefined();
    expect(activeStatus.value?.config.length, "面板内组件").toBe(9);
  });

  it("渐进式加载动态面板", async () => {
    const { panelInfo, activeStatus, initPanelDataFromLocalData } = usePanelInfo();
    const { groupData, panelChildComponentMap, allComponentMap } = useGlobalComponentData();

    const dynamicPanel = await initPanelDataFromLocalData(groupData.value[0].id);
    expect(dynamicPanel, "动态面板").toBeDefined();

    class MockScheduler implements Scheduler<ComponentType[]> {
      schedule(callback: () => ComponentType[], delay: number): ScheduledTask {
        const res = callback();

        mockFnWithCallCount();
        return { cancel: vi.fn() };
      }
      cancelAll(): void {
        mockFnWithCallCount2();
      }
    }

    const priorityStatusIndex = 0;

    const {
      renderedStatusData,
      renderProgress,
      processedStatusData,
      renderQueue,
      isRendering,
      initializeRenderData,
      renderPriorityStatus,
      createInitialRenderQueue,
      setRenderQueue,
      startProgressiveRender
    } = useProgressiveRender(dynamicPanel!, {
      batchSize: 5,
      priorityIndex: priorityStatusIndex,
      renderInterval: 100,
      scheduler: new MockScheduler()
    });

    expect(processedStatusData.value.length, "渲染状态数据").toBe(dynamicPanel!.panelData.length);

    initializeRenderData();
    expect(renderedStatusData.value.length, "渲染状态数据").toBe(dynamicPanel!.panelData.length);

    const priorityStatus = renderPriorityStatus(priorityStatusIndex);
    const { sortedComponent, renderedComponent, ...rest } = priorityStatus!;
    expect(rest, "优先状态").toEqual(dynamicPanel?.panelData[priorityStatusIndex]);
    expect(sortedComponent, "优先状态").toEqual(dynamicPanel?.panelData[priorityStatusIndex].config);
    expect(renderedComponent, "优先状态").toEqual([]);

    setRenderQueue(createInitialRenderQueue(processedStatusData.value, priorityStatusIndex));
    expect(renderQueue.value.length, "渲染队列").toBe(dynamicPanel!.panelData.length - 1);

    // 修复：渲染队列应为一维数组，且每个对象为 { statusIndex, componentIndex }
    // 这里动态面板的 panelData 长度为 6，优先渲染索引为 0，队列应为 1~5
    // 期望渲染队列为 dynamicPanel?.panelData 去掉优先渲染索引项后的映射
    expect(renderQueue.value, "渲染队列").toEqual(
      dynamicPanel?.panelData
        .map((_, idx) => idx)
        .filter((idx) => idx !== priorityStatusIndex)
        .map((idx) => ({
          statusIndex: idx,
          componentIndex: 0
        }))
    );

    startProgressiveRender(100);

    /**
     * 64 - 9 - 18 = 37
     * (5 + 4) * 4 + 1 +1(启动)
     * */
    expect(mockFnWithCallCount.mock.calls.length).toBe(10);
    expect(renderQueue.value.length).toBe(0);
    expect(isRendering.value).toBe(false);
    expect(renderProgress.value).toBe(100);
  });

  it("切换状态初始化", async () => {
    const { groupData, panelChildComponentMap, allComponentMap } = useGlobalComponentData();
    const panel = groupData.value[0] as DynamicPanelProps;

    const panelInstance = new DynamicPanel();
    panelInstance.init(panel);

    const { changeStatus, clonedPanelStates, initStateManagement } = useStateManagement({
      dynamicPanel: panel,
      instance: toRef(panelInstance),
      triggerRegistry: new Map(),
      panelIdAndStatusIdToAnimationMap: toRef(new Map()) as ComputedRef<PanelIdAndStatusIdToAnimationMap>,
      isExitAnimationPlaying: toRef(false),
      refreshKey: toRef(0)
    });

    expect(clonedPanelStates.value, "克隆面板初始为空数组").toEqual([]);

    expect(panel.option.isSwitchStatusReload).toBeUndefined();
    initStateManagement();

    expect(clonedPanelStates.value.length).toBe(0);
    expect(clonedPanelStates.value).toEqual([]);

    panel.option.isSwitchStatusReload = true;
    initStateManagement();
    expect(clonedPanelStates.value.length).toBe(1);
    expect(clonedPanelStates.value).toEqual([{ ...panel.panelData[0] }]);

    const firstStatusId = panel.panelData[0].id;
    const secondStatusId = panel.panelData[1].id;

    await changeStatus(secondStatusId);
    expect(clonedPanelStates.value.length).toBe(2);
    expect(clonedPanelStates.value).toEqual([{ ...panel.panelData[0] }, { ...panel.panelData[1] }]);

    /**
     * 第二个状态的第一个组件
     */
    const secondStatusFirstComponent = panel.panelData[1].config[0];

    const rawLeft = secondStatusFirstComponent.left;
    const rawTop = secondStatusFirstComponent.top;
    const rawWidth = secondStatusFirstComponent.component.width;
    const rawHeight = secondStatusFirstComponent.component.height;

    secondStatusFirstComponent.left += 100;
    secondStatusFirstComponent.top += 100;
    secondStatusFirstComponent.component.width += 100;
    secondStatusFirstComponent.component.height += 100;
    expect(clonedPanelStates.value).not.toEqual([{ ...panel.panelData[0] }, { ...panel.panelData[1] }]);

    const secondStatusFirstComponentInClone = clonedPanelStates.value[1].config[0];
    expect(secondStatusFirstComponentInClone.left).toBe(rawLeft);
    expect(secondStatusFirstComponentInClone.top).toBe(rawTop);
    expect(secondStatusFirstComponentInClone.component.width).toBe(rawWidth);
    expect(secondStatusFirstComponentInClone.component.height).toBe(rawHeight);

    await changeStatus(firstStatusId);
    await changeStatus(secondStatusId);

    expect(clonedPanelStates.value.length).toBe(2);
    expect(clonedPanelStates.value).toEqual([{ ...panel.panelData[0] }, { ...panel.panelData[1] }]);
    expect(panel.panelData[1]).toEqual(clonedPanelStates.value[1]);

    const fifthStatusId = panel.panelData[4].id;
    await changeStatus(fifthStatusId);
    expect(clonedPanelStates.value.length).toBe(3);
    expect(clonedPanelStates.value).toEqual([
      { ...panel.panelData[0] },
      { ...panel.panelData[1] },
      { ...panel.panelData[4] }
    ]);
  });
});
