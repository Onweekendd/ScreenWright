import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isProxy, isReactive, isRef, nextTick, shallowRef } from "vue";

import { initDataFilterPersistence } from "@screenwright/composables";
import dayjs from "dayjs";

import { getLargeScreenInfo } from "@/api/build";
import { useRegisterFilter } from "@/components/componentEntry/useRegisterFilter";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { FilterData } from "@/views/build/components/buildRender/core/BaseComponent/filterData";
import { UpdateHistoryTypeEnum, useAction } from "@/views/build/components/buildRender/hooks/useAction";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useCacheData } from "@/views/build/useCacheData";
import { useCacheTime } from "@/views/build/useCacheTime";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { useDataFilter } from "../../views/build/useDataFilter";
import { useLargeScreenInfo } from "../../views/build/useLargeScreenInfo";
// 多过滤器测试 当前一个条形图组件绑定了4个过滤器
import mockDetail from "./componentData3.mock.json";

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

// mock Element Plus 消息组件，避免真实弹窗在 jsdom 环境销毁后异步触发 transition 报错
vi.mock("element-plus", () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  },
  ElMessageBox: {
    confirm: vi.fn()
  }
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

describe("多过滤器测试", () => {
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

    // 等待所有待处理的 DOM 更新完成
    await nextTick();
    await nextTick();
  });

  it("过滤器可以成功被删除", () => {
    const { deleteFilterFromComponent, currentFilter } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart, selectTargetData } = useEditStore();

    const echartLine = groupData.value[0];
    setTargetSelectChart(`${echartLine.id}`);

    const filter = currentFilter.value[0];
    expect(selectTargetData.value[0].listenArgs.length).toBe(4);
    expect(currentFilter.value.length).toBe(4);

    deleteFilterFromComponent(filter);
    expect(selectTargetData.value[0].listenArgs.length).toBe(3);
    expect(currentFilter.value.length).toBe(3);
    expect(filter.bindComponent.length).toBe(0);

    const filter2 = currentFilter.value[0];
    deleteFilterFromComponent(filter2);

    expect(selectTargetData.value[0].listenArgs.length).toBe(2);
    expect(currentFilter.value.length).toBe(2);
    expect(filter2.bindComponent.length).toBe(0);

    const filter3 = currentFilter.value[0];
    deleteFilterFromComponent(filter3);

    expect(selectTargetData.value[0].listenArgs.length).toBe(1);
    expect(currentFilter.value.length).toBe(1);
    expect(filter3.bindComponent.length).toBe(0);

    const filter4 = currentFilter.value[0];
    deleteFilterFromComponent(filter4);

    expect(selectTargetData.value[0].listenArgs.length).toBe(0);
    expect(currentFilter.value.length).toBe(0);
    expect(filter4.bindComponent.length).toBe(0);
  });

  it("测试过滤器一起执行效果", async () => {
    const { currentFilter, handleSave, onFilterCodeChange } = useDataFilter();
    const { emitFilterTrigger } = useCallbackArguments();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart } = useEditStore();
    const echartLine = groupData.value[0];

    const { registerFilter, unRegisterFilter } = useRegisterFilter(echartLine, () => {});

    setTargetSelectChart(`${echartLine.id}`);

    const filter1 = currentFilter.value[0];

    const doubleValue = (data: any) => {
      return data.map((item: any) => ({
        ...item,
        value: item.value * 2
      }));
    };

    const tripleValue = (data: any) => {
      return data.map((item: any) => ({
        ...item,
        value: item.value * 3
      }));
    };

    onFilterCodeChange(filter1, doubleValue.toString());
    expect(filter1.notSaved).toBe(true);

    const res = await handleSave(filter1);
    expect(res.success).toBe(true);
    expect(filter1.notSaved).toBe(false);
    expect(filter1.dataFormatter).toEqual(doubleValue.toString());

    const filter2 = currentFilter.value[1];
    onFilterCodeChange(filter2, tripleValue.toString());
    expect(filter2.notSaved).toBe(true);
    await handleSave(filter2);
    expect(filter2.notSaved).toBe(false);
    expect(filter2.dataFormatter).toEqual(tripleValue.toString());

    registerFilter();
    const value = await emitFilterTrigger(`${echartLine.id}`);
    expect(value[0], "2*3 值要翻6倍").toEqual(echartLine.data.map((item: any) => ({ ...item, value: item.value * 6 })));
    unRegisterFilter();
  });

  it("测试过滤器一起执行效果", async () => {
    const { currentFilter, handleSave, onFilterCodeChange, handleFilterEnable } = useDataFilter();
    const { emitFilterTrigger } = useCallbackArguments();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart, selectTargetData } = useEditStore();
    const echartLine = groupData.value[0];

    const { registerFilter, unRegisterFilter } = useRegisterFilter(echartLine, () => {});

    setTargetSelectChart(`${echartLine.id}`);

    const filter1 = currentFilter.value[0];

    const doubleValue = (data: any) => {
      return data.map((item: any) => ({
        ...item,
        value: item.value * 2
      }));
    };

    const tripleValue = (data: any) => {
      return data.map((item: any) => ({
        ...item,
        value: item.value * 3
      }));
    };

    onFilterCodeChange(filter1, doubleValue.toString());
    const res = await handleSave(filter1);
    expect(res.success).toBe(true);

    const filter2 = currentFilter.value[1];
    onFilterCodeChange(filter2, tripleValue.toString());
    const res2 = await handleSave(filter2);
    expect(res2.success).toBe(true);

    registerFilter();
    const value = await emitFilterTrigger(`${echartLine.id}`);
    expect(value[0], "2*3 值要翻6倍").toEqual(echartLine.data.map((item: any) => ({ ...item, value: item.value * 6 })));

    const value2 = await handleFilterEnable({
      filter: filter2,
      value: false,
      component: selectTargetData.value[0]
    });
    expect(value2).toBeDefined();
    expect(value2![0], "禁用了乘3的过滤器 值要翻2倍").toEqual(
      echartLine.data.map((item: any) => ({ ...item, value: item.value * 2 }))
    );

    const value3 = await handleFilterEnable({
      filter: filter2,
      value: true,
      component: selectTargetData.value[0]
    });
    expect(value3).toBeDefined();
    expect(value3![0], "启用了乘3的过滤器 值要翻6倍").toEqual(
      echartLine.data.map((item: any) => ({ ...item, value: item.value * 6 }))
    );

    const value4 = await handleFilterEnable({
      filter: filter1,
      value: false,
      component: selectTargetData.value[0]
    });
    expect(value4).toBeDefined();
    expect(value4![0], "禁用了乘2的过滤器 值要翻3倍").toEqual(
      echartLine.data.map((item: any) => ({ ...item, value: item.value * 3 }))
    );

    const value5 = await handleFilterEnable({
      filter: filter1,
      value: true,
      component: selectTargetData.value[0]
    });
    expect(value5).toBeDefined();
    expect(value5![0], "启用了乘2的过滤器 值要翻6倍").toEqual(
      echartLine.data.map((item: any) => ({ ...item, value: item.value * 6 }))
    );

    unRegisterFilter();
  });

  it("测试过滤器收集", async () => {
    const {
      currentFilter,
      dataFilter,
      filterAllResultForCurrentComponent,
      filterResultForCurrentComponent,
      handleSave,
      handleFilterEnable,
      onFilterCodeChange
    } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart, selectTargetData } = useEditStore();
    const echartLine = groupData.value[0];
    const { registerFilter, unRegisterFilter } = useRegisterFilter(echartLine, () => {});
    registerFilter();

    setTargetSelectChart(`${echartLine.id}`);

    const filter1 = currentFilter.value[0];
    const filter2 = currentFilter.value[1];
    const filter3 = currentFilter.value[2];

    const doubleValue = (data: any) => {
      return data.map((item: any) => ({
        ...item,
        value: item.value * 2
      }));
    };

    const tripleValue = (data: any) => {
      return data.map((item: any) => ({
        ...item,
        value: item.value * 3
      }));
    };

    const addTwentyThousand = (data: any) => {
      return data.map((item: any) => ({
        ...item,
        value: item.value + 20000
      }));
    };

    onFilterCodeChange(filter1, doubleValue.toString());
    const res = await handleSave(filter1);
    expect(res.success).toBe(true);

    onFilterCodeChange(filter2, tripleValue.toString());
    const res2 = await handleSave(filter2);
    expect(res2.success).toBe(true);

    onFilterCodeChange(filter3, addTwentyThousand.toString());
    const res3 = await handleSave(filter3);
    expect(res3.success).toBe(true);

    const filterData = new FilterData();
    const result = await filterData.run({ filterConfig: dataFilter.value, target: echartLine });
    expect(result, "2*3 + 20000").toEqual(
      echartLine.data.map((item: any) => ({ ...item, value: item.value * 2 * 3 + 20000 }))
    );

    expect(filterAllResultForCurrentComponent.value?.length, "收集到的结果长度").toEqual(4);

    expect(filterResultForCurrentComponent.value, "2*3 + 20000").toEqual(
      echartLine.data.map((item: any) => ({ ...item, value: item.value * 2 * 3 + 20000 }))
    );

    // 关闭 乘3的过滤器 自动执行过滤器
    await handleFilterEnable({
      filter: filter2,
      value: false,
      component: selectTargetData.value[0]
    });

    expect(filterAllResultForCurrentComponent.value?.length, "收集到的结果长度").toEqual(3);

    expect(filterResultForCurrentComponent.value, "2 + 20000").toEqual(
      echartLine.data.map((item: any) => ({ ...item, value: item.value * 2 + 20000 }))
    );

    unRegisterFilter();
  });

  it("过滤器执行失败后，后续过滤器错误应与失败者一致", async () => {
    const { currentFilter, handleSave, onFilterCodeChange } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart } = useEditStore();
    const echartLine = groupData.value[0];
    const { registerFilter, unRegisterFilter } = useRegisterFilter(echartLine, () => {});
    const { filterAllResultForCurrentComponent, filterResultForCurrentComponent } = useDataFilter();
    const { emitFilterTrigger } = useCallbackArguments();

    registerFilter();
    setTargetSelectChart(`${echartLine.id}`);

    // 准备3个过滤器：第2个抛错
    const filter1 = currentFilter.value[0];
    const filter2 = currentFilter.value[1];
    const filter3 = currentFilter.value[2];

    const passThrough = (_data: any) => _data;
    const broken = (_data: any) => {
      // 故意抛出错误
      throw new Error("故意的处理错误");
    };
    const alsoPass = (_data: any) => _data;

    onFilterCodeChange(filter1, passThrough.toString());
    await handleSave(filter1);

    onFilterCodeChange(filter2, broken.toString());
    const res = await handleSave(filter2);
    expect(res.success).toBe(true);

    onFilterCodeChange(filter3, alsoPass.toString());
    const res3 = await handleSave(filter3);
    expect(res3.success).toBe(true);

    const error = `'${filter2.name}' 执行失败: 故意的处理错误`;

    // 断言收集到的链路结果
    // all[0] 是原始输入，后续是每个过滤器的处理记录
    // 失败发生在 filter2，上它及其后续的 filter3 都应带相同错误
    const failedError = filterAllResultForCurrentComponent.value?.[2]?.error;
    expect(failedError).toBeInstanceOf(Error);
    expect((failedError as Error).message).toContain(filter2.name);
    expect((failedError as Error).message).toEqual(error);

    // filter3 未执行，但错误应等于失败错误
    const filter3Error = filterAllResultForCurrentComponent.value?.[3]?.error;
    expect(filter3Error).toBeInstanceOf(Error);
    expect((filter3Error as Error).message).toEqual((failedError as Error).message);

    expect(filterResultForCurrentComponent.value).toEqual([
      {
        error
      }
    ]);

    const value = await emitFilterTrigger(`${echartLine.id}`);
    expect(value[0], "执行出错返回空数组").toEqual([]);

    unRegisterFilter();
  });

  it("删除组件 组件执行数据应该要消失", async () => {
    const { groupData } = useGlobalComponentData();
    const { syncGlobalComponentData } = useEditStore();
    syncGlobalComponentData();
    const { emitFilterTrigger } = useCallbackArguments();
    const { filterResultCollector } = useDataFilter();
    const { handleDelComponent } = useAction();

    const echartLine = groupData.value[0];
    const { registerFilter, unRegisterFilter } = useRegisterFilter(echartLine, () => {});
    registerFilter();

    const value = await emitFilterTrigger(`${echartLine.id}`);
    expect(value[0]).toEqual(echartLine.data);

    const map = filterResultCollector.getRawMap();

    expect(map.has(echartLine)).toBe(true);

    // 四个数据过滤器
    expect(map.get(echartLine)?.length).toBe(4);

    await handleDelComponent(`${echartLine.id}`, UpdateHistoryTypeEnum.SKIP, false);

    expect(groupData.value.length).toBe(1);

    unRegisterFilter();
  });

  it("shouldShowTest/shouldShowCheckbox/getFilterInComponentIndex：已有过滤器 + 新增过滤器，need 为 true/false", async () => {
    const { currentFilter, addNewDataFilterToGlobal, shouldShowTest, shouldShowCheckbox, getFilterInComponentIndex } =
      useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart, selectTargetData } = useEditStore();

    const echartLine = groupData.value[0];
    setTargetSelectChart(`${echartLine.id}`);

    // 已有过滤器（已绑定组件，无 id 字段）
    const existingFilter = currentFilter.value[0];

    // 校验 getFilterInComponentIndex 与组件 listenArgs 的索引一致
    const expectIndex = selectTargetData.value[0].listenArgs.findIndex((v) => v.filterName === existingFilter.name);
    expect(getFilterInComponentIndex(existingFilter)).toBe(expectIndex);

    // shouldShowTest：needTest = true/false
    expect(shouldShowTest(existingFilter, true)).toBe(true);
    expect(shouldShowTest(existingFilter, false)).toBe(false);

    // shouldShowCheckbox：needCheckBox = true/false
    expect(shouldShowCheckbox(existingFilter, true)).toBe(true);
    expect(shouldShowCheckbox(existingFilter, false)).toBe(false);

    // 新增过滤器（临时，有 id 字段）
    const newFilter = addNewDataFilterToGlobal();

    // 新增过滤器不应展示测试按钮与复选框（因为有 id）
    expect(shouldShowTest(newFilter, true)).toBe(false);
    expect(shouldShowTest(newFilter, false)).toBe(false);
    expect(shouldShowCheckbox(newFilter, true)).toBe(false);
    expect(shouldShowCheckbox(newFilter, false)).toBe(false);

    // 新增过滤器名称未绑定到组件，索引回落为 0
    expect(getFilterInComponentIndex(newFilter)).toBe(-1);
  });

  it("shouldShowTest：已有过滤器禁用后 needTest=true 也不显示", async () => {
    const { currentFilter, handleFilterEnable, shouldShowTest } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart, selectTargetData } = useEditStore();

    const echartLine = groupData.value[0];
    setTargetSelectChart(`${echartLine.id}`);

    const existingFilter = currentFilter.value[0];
    // 禁用该过滤器
    const value = await handleFilterEnable({
      filter: existingFilter,
      value: false,
      component: selectTargetData.value[0]
    });
    expect(value).toBeDefined();

    // needTest = true，但 usageStatus=false，应返回 false
    expect(shouldShowTest(existingFilter, true)).toBe(false);
  });

  it("禁用所有过滤器后 filterResultForCurrentComponent 与原始数据一致", async () => {
    const { currentFilter, handleFilterEnable, filterResultForCurrentComponent } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart, selectTargetData } = useEditStore();
    const echartLine = groupData.value[0];
    const { registerFilter, unRegisterFilter } = useRegisterFilter(echartLine, () => {});

    registerFilter();
    setTargetSelectChart(`${echartLine.id}`);

    // 禁用所有过滤器
    const filters = [...currentFilter.value];
    for (const filter of filters) {
      await handleFilterEnable({
        filter: filter,
        value: false,
        component: selectTargetData.value[0]
      });
    }

    // 验证结果与原始数据一致
    expect(filterResultForCurrentComponent.value).toEqual(echartLine.data);

    unRegisterFilter();
  });

  it("删除所有过滤器后 filterResultForCurrentComponent 与原始数据一致", async () => {
    const { currentFilter, deleteFilterFromComponent, filterResultForCurrentComponent } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart } = useEditStore();
    const echartLine = groupData.value[0];
    const filterResult = shallowRef([]);
    const { registerFilter, unRegisterFilter } = useRegisterFilter(echartLine, (data) => {
      filterResult.value = data as never[];
    });

    registerFilter();
    setTargetSelectChart(`${echartLine.id}`);

    // 删除所有过滤器
    const filters = [...currentFilter.value];
    for (const filter of filters) {
      const res = await deleteFilterFromComponent(filter);
      expect(res.data![0]).toEqual(echartLine.data);
    }
    expect(currentFilter.value.length).toBe(0);

    // 验证结果与原始数据一致
    expect(filterResultForCurrentComponent.value).toEqual(echartLine.data);
    expect(
      isReactive(filterResultForCurrentComponent.value),
      "filterResultForCurrentComponent.value 不是代理对象"
    ).toBe(false);

    expect(
      isReactive(filterResultForCurrentComponent.value[0]),
      "filterResultForCurrentComponent.value[0] 不是代理对象"
    ).toBe(false);

    expect(filterResult.value).toEqual(echartLine.data);
    expect(isRef(filterResult), "filterResult.value 是代理对象").toBe(true);
    expect(isProxy(filterResult.value[0]), "filterResult.value[0] 不是代理对象").toBe(false);

    unRegisterFilter();
  });

  it("未开启 openFilter 的组件 仍然能获取到 filter 结果 但 executed 为 false", async () => {
    const { filterResultCollector } = useDataFilter();
    const { emitFilterTrigger } = useCallbackArguments();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart } = useEditStore();

    const videoComponent = groupData.value[1];

    const { registerFilter, unRegisterFilter } = useRegisterFilter(videoComponent, () => {});
    registerFilter();
    setTargetSelectChart(`${videoComponent.id}`);

    await emitFilterTrigger(`${videoComponent.id}`);

    const results = filterResultCollector.getResults(videoComponent);

    console.log("results", results);
    // 即使未开启 openFilter，依然能获取到结果
    expect(results).toBeDefined();
    expect(results!.length).toBe(1);

    expect(results![0].executed).toBe(true);
    expect(results![0].inputData.length).toBeGreaterThan(0);
    expect(results![0].outputData.length).toBeGreaterThan(0);

    unRegisterFilter();
  });
});
