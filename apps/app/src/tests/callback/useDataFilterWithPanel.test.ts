import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initDataFilterPersistence } from "@screenwright/composables";
import dayjs from "dayjs";

import { getLargeScreenInfo } from "@/api/build";
import { useRegisterFilter } from "@/components/componentEntry/useRegisterFilter";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useCallbackOption } from "@/views/build/components/buildConfig/attrsRender/components/callbackArgument/useCallbackOption";
import { UpdateHistoryTypeEnum, useAction } from "@/views/build/components/buildRender/hooks/useAction";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { usePanelInfo } from "@/views/build/components/panelEditor/usePanelInfo";
import { useCacheData } from "@/views/build/useCacheData";
import { useCacheTime } from "@/views/build/useCacheTime";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { useDataFilter } from "../../views/build/useDataFilter";
import { useLargeScreenInfo } from "../../views/build/useLargeScreenInfo";
// 面板外组件向面板内组件传递回调参数
import mockDetail from "./componentData2.mock.json";

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

describe("useDataFilter - 面板外组件向面板内组件传递回调参数", () => {
  beforeEach(async () => {
    // 注入 @screenwright/composables 的持久化端口（真实 app 由 main.ts 在启动时调用一次），
    // 否则内部保存动作会因未初始化而抛错
    initDataFilterPersistence({
      saveLayersByType: vi.fn(),
      updateLargeScreen: vi.fn()
    });

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

  afterEach(async () => {
    const { buildWorkerCacheInput } = useCacheData();

    const workerCacheInput = buildWorkerCacheInput(Date.now());

    structuredClone(workerCacheInput);

    // 重置 mockFnWithCallCount
    mockFnWithCallCount.mockReset();

    // 等待所有pending的微任务完成，确保Vue组件完全卸载
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it("动态面板初始化成功", () => {
    const { panelInfo, activeStatus, initPanelDataFromLocalData } = usePanelInfo();
    const { groupData, panelChildComponentMap } = useGlobalComponentData();

    // 未初始化
    expect(panelInfo.value.config, "面板信息").toEqual({});
    expect(activeStatus.value, "面板内组件").toBeUndefined();

    const dynamicPanel = initPanelDataFromLocalData(groupData.value[1].id);
    const dynamicPanelChildComponentMap = panelChildComponentMap.value.get(`${groupData.value[1].id}`);

    expect(dynamicPanel, "动态面板").toBeDefined();
    expect(dynamicPanelChildComponentMap, "动态面板组件").toBeDefined();
    expect(dynamicPanelChildComponentMap!.size, "动态面板组件数量").toBe(2);

    expect(panelInfo.value.config, "面板信息").toBeDefined();
    expect(activeStatus.value?.config.length, "面板内组件").toBe(2);
  });

  it("删除动态面板, 过滤器删除面板内组件监听参数", async () => {
    const { groupData } = useGlobalComponentData();
    const { syncGlobalComponentData } = useEditStore();
    syncGlobalComponentData();
    const { callbackArgumentsManager } = useCallbackArguments();
    const { handleDelComponent } = useAction();

    await handleDelComponent(`${groupData.value[1].id}`, UpdateHistoryTypeEnum.SKIP, false);

    expect(groupData.value.length, "删除动态面板后 组件列表数量").toBe(1);

    expect(callbackArgumentsManager.value["labelCb"]?.source.length, "删除动态面板后 回调参数源组件数量").toBe(1);
    expect(callbackArgumentsManager.value["labelCb"]?.target.length).toBe(0);
  });

  it("测试过滤器执行 过滤器未开启 返回组件原始数据", async () => {
    const { allComponentMap, groupData } = useGlobalComponentData();
    const { handleCallback } = useCallbackArguments();

    const doubleValue = (data: any) => {
      return data.map((item: any) => ({
        ...item,
        value: item.value * 2
      }));
    };

    const { dataFilter } = useDataFilter();
    dataFilter.value["新建过滤器"].dataFormatter = doubleValue.toString();

    const echartLine = allComponentMap.value.get("1884459")!;
    expect(echartLine.openFilter).toBe(false);
    const mutualComponent = groupData.value[0];

    const assignFilterToRawValue = (data: any) => {
      expect(data.length).toBeGreaterThan(0);

      const echartLineData = echartLine.data;
      expect(data.length).toBe(echartLineData.length);

      expect(data).toEqual(echartLineData);
    };

    const { registerFilter, unRegisterFilter } = useRegisterFilter(echartLine, assignFilterToRawValue);

    registerFilter();
    await handleCallback({
      sourceComponent: mutualComponent,
      throwValue: mutualComponent.data[0]
    });
    unRegisterFilter();
  });

  it("测试过滤器执行 过滤器开启 返回组件原始数据", async () => {
    const { allComponentMap, groupData } = useGlobalComponentData();
    const { handleCallback } = useCallbackArguments();

    const doubleValue = (data: any) => {
      return data.map((item: any) => ({
        ...item,
        value: item.value * 2
      }));
    };
    const { dataFilter } = useDataFilter();
    dataFilter.value["新建过滤器"].dataFormatter = doubleValue.toString();

    const echartLine = allComponentMap.value.get("1884459")!;
    echartLine.openFilter = true;

    expect(echartLine.openFilter).toBe(true);
    const mutualComponent = groupData.value[0];

    const assignFilterToRawValue = (data: any) => {
      expect(data.length).toBeGreaterThan(0);

      const echartLineData = echartLine.data;
      expect(data.length).toBe(echartLineData.length);

      // 验证返回数据每一项的 value 都是 echartLineData 每一项 value 的两倍
      expect(data).toEqual(echartLineData.map((item: any) => ({ ...item, value: item.value * 2 })));
    };

    const { registerFilter, unRegisterFilter } = useRegisterFilter(echartLine, assignFilterToRawValue);

    registerFilter();
    await handleCallback({
      sourceComponent: mutualComponent,
      throwValue: mutualComponent.data[0]
    });
    unRegisterFilter();
  });

  it("过滤器同时监听同一组件的两个回调参数 不开启防抖 过滤器执行两次", async () => {
    const { allComponentMap, groupData } = useGlobalComponentData();
    const { addCallback, _updateCallbackArgument } = useCallbackOption();
    const { setTargetSelectChart } = useEditStore();
    const { dataFilter, updateCallbackArgumentToFilter, handleSave } = useDataFilter();
    const { handleCallback, updateCallbackRelation } = useCallbackArguments();
    const mutualComponent = groupData.value[0];

    setTargetSelectChart(`${mutualComponent.id}`);
    addCallback();

    _updateCallbackArgument("valueCb");

    setTargetSelectChart("");

    const filter = dataFilter.value["新建过滤器"];
    const doubleValue = (data: any) =>
      data.map((item: any) => ({
        ...item,
        value: item.value * 2
      }));
    filter.dataFormatter = doubleValue.toString();
    updateCallbackArgumentToFilter(filter, ["labelCb", "valueCb"]);
    await handleSave(filter);

    const echartLine1 = allComponentMap.value.get("1884459")!;
    echartLine1.openFilter = true;
    updateCallbackRelation(echartLine1);
    const echartLine2 = allComponentMap.value.get("1884460")!;
    echartLine2.openFilter = true;
    updateCallbackRelation(echartLine2);

    expect(echartLine1.listenArgs.find((it) => it.filterName === "新建过滤器")?.callbackFields).toEqual([
      "labelCb",
      "valueCb"
    ]);
    expect(echartLine2.listenArgs.find((it) => it.filterName === "新建过滤器")?.callbackFields).toEqual([
      "labelCb",
      "valueCb"
    ]);

    const { registerFilter: registerFilter1, unRegisterFilter: unRegisterFilter1 } = useRegisterFilter(
      echartLine1,
      (data) => {
        mockFnWithCallCount();
        expect(data).toEqual(echartLine1.data.map((item: any) => ({ ...item, value: item.value * 2 })));
      }
    );

    const { registerFilter: registerFilter2, unRegisterFilter: unRegisterFilter2 } = useRegisterFilter(
      echartLine2,
      (data) => {
        mockFnWithCallCount();
        expect(data).toEqual(echartLine2.data.map((item: any) => ({ ...item, value: item.value * 2 })));
      }
    );

    registerFilter1();
    registerFilter2();

    // 关闭防抖
    const res = await handleCallback({
      sourceComponent: mutualComponent,
      throwValue: mutualComponent.data[0],
      debounce: false
    });

    expect(res).toBeDefined();
    expect(Object.keys(res!).length, "回调参数数量").toBe(2);
    expect(Object.keys(res!["labelCb"]).length, "回调参数数量").toBe(2);
    expect(Object.keys(res!["valueCb"]).length, "回调参数数量").toBe(2);
    expect(res!["labelCb"][echartLine1.id], "回调参数值").toBeDefined();
    expect(res!["valueCb"][echartLine1.id], "回调参数值").toBeDefined();
    expect(res!["labelCb"][echartLine2.id], "回调参数值").toBeDefined();
    expect(res!["valueCb"][echartLine2.id], "回调参数值").toBeDefined();
    expect(mockFnWithCallCount.mock.calls.length, "回调参数数量").toBe(4);

    const res1 = res!["labelCb"][echartLine1.id];
    const res2 = res!["valueCb"][echartLine1.id];
    const res3 = res!["labelCb"][echartLine2.id];
    const res4 = res!["valueCb"][echartLine2.id];
    const doubleValue1 = echartLine1.data.map((item: any) => ({ ...item, value: item.value * 2 }));
    const doubleValue2 = echartLine2.data.map((item: any) => ({ ...item, value: item.value * 2 }));

    expect(res1[0], "回调参数值1").toEqual(doubleValue1);
    expect(res2[0], "回调参数值2").toEqual(doubleValue1);
    expect(res3[0], "回调参数值3").toEqual(doubleValue2);
    expect(res4[0], "回调参数值4").toEqual(doubleValue2);

    unRegisterFilter1();
    unRegisterFilter2();
  });

  it("删除回调参数后 使用handleCallback 执行过滤器", async () => {
    const { allComponentMap, groupData } = useGlobalComponentData();
    const { deleteCallback, syncActiveState } = useCallbackOption();
    const { setTargetSelectChart } = useEditStore();
    const { handleCallback, callbackArgumentsManager, callbackEventManager, updateCallbackRelation } =
      useCallbackArguments();
    const echartLine1 = allComponentMap.value.get("1884459")!;
    echartLine1.openFilter = true;
    updateCallbackRelation(echartLine1);

    const { registerFilter, unRegisterFilter } = useRegisterFilter(echartLine1, (data) => {
      mockFnWithCallCount2();
    });

    registerFilter();

    const mutualComponent = groupData.value[0];
    expect(
      callbackEventManager.callbackFieldTriggerMap.get(`onCallbackFieldTrigger-labelCb-${echartLine1.id}`)
    ).toBeDefined();
    expect(
      callbackEventManager.callbackFieldTriggerMap.get(`onCallbackFieldTrigger-labelCb-${echartLine1.id}`)?.size
    ).toBe(1);

    // 添加回调参数
    setTargetSelectChart(`${mutualComponent.id}`);
    syncActiveState();
    await deleteCallback();
    expect(mockFnWithCallCount2, "删除前过滤器应该被执行").toHaveBeenCalled();
    expect(mutualComponent.cbArgs.length, "删除回调参数后 组件回调参数数量").toBe(0);
    expect(callbackArgumentsManager.value["labelCb"]?.source.length, "删除回调参数后 回调参数源组件数量").toBe(0);
    expect(
      callbackEventManager.callbackFieldTriggerMap.get(`onCallbackFieldTrigger-labelCb-${echartLine1.id}`)
    ).toBeUndefined();
    setTargetSelectChart("");

    // 执行回调，验证过滤器正常执行
    const res = await handleCallback({
      sourceComponent: mutualComponent,
      throwValue: mutualComponent.data[0],
      debounce: false
    });

    expect(res).toEqual({});

    unRegisterFilter();
  });

  it("handleCallback，同一组件先后监听不同回调字段并复用防抖，触发最新字段的过滤器监听", async () => {
    const { allComponentMap, groupData } = useGlobalComponentData();
    const { deleteCallbackRelation, handleCallback, updateCallbackRelation } = useCallbackArguments();
    const sourceComponent = groupData.value[0];
    const targetComponent = allComponentMap.value.get("1884459")!;
    targetComponent.openFilter = true;
    updateCallbackRelation(targetComponent);

    const firstRegistration = useRegisterFilter(targetComponent);
    firstRegistration.registerFilter();
    await handleCallback({
      sourceComponent,
      throwValue: sourceComponent.data[0]
    });
    await new Promise((resolve) => setTimeout(resolve, 350));
    firstRegistration.unRegisterFilter();

    deleteCallbackRelation(sourceComponent);
    deleteCallbackRelation(targetComponent);
    sourceComponent.cbArgs[0].value.origin.value = "value";
    sourceComponent.cbArgs[0].value.target.value = "valueCb";
    targetComponent.listenArgs[0].callbackFields = ["valueCb"];
    updateCallbackRelation(sourceComponent);
    updateCallbackRelation(targetComponent);

    const latestFilterListener = vi.fn();
    const secondRegistration = useRegisterFilter(targetComponent, latestFilterListener);
    secondRegistration.registerFilter();
    await handleCallback({
      sourceComponent,
      throwValue: sourceComponent.data[0]
    });
    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(latestFilterListener).toHaveBeenCalledTimes(1);
    secondRegistration.unRegisterFilter();
  });
});
