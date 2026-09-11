import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initDataFilterPersistence } from "@screenwright/composables";
import { isNumber, isString } from "lodash-es";

import { getLargeScreenInfo } from "@/api/build";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useCallbackOption } from "@/views/build/components/buildConfig/attrsRender/components/callbackArgument/useCallbackOption";
import { useProjectFilter } from "@/views/build/components/buildConfig/globalProjectFliter/useProjectFilter";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import type { ComponentType } from "@/views/build/components/buildRender/type";
import { useCacheData } from "@/views/build/useCacheData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { useDataFilter } from "../../views/build/useDataFilter";
import { useLargeScreenInfo } from "../../views/build/useLargeScreenInfo";
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
vi.mock("@/utils/utils", async () => ({
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

  it("dataFilter getter 应该从 navInfo.value.dataFilterArr 正确读取", () => {
    const { dataFilter } = useDataFilter();
    // mock 数据中包含 "新建过滤器" 这一项
    expect(dataFilter.value).toBeTruthy();
    expect(typeof dataFilter.value).toBe("object");
    expect(Object.keys(dataFilter.value)).toContain("新建过滤器");
    expect(dataFilter.value["新建过滤器"].show).toBe(true);
  });

  it("cloneDataFilterOnInit 应深拷贝，修改克隆不影响原数据，反之亦然", () => {
    const { dataFilter, cloneDataFilter, cloneDataFilterOnInit } = useDataFilter();

    // 生成深拷贝
    cloneDataFilterOnInit();

    // 修改克隆体的深层字段
    cloneDataFilter.value["新建过滤器"].show = false;
    expect(dataFilter.value["新建过滤器"].show).toBe(true);

    // 再修改原数据，克隆不变
    dataFilter.value["新建过滤器"].checked = false;
    expect(cloneDataFilter.value["新建过滤器"].checked).toBe(true);
  });

  it("添加同名数据过滤器", async () => {
    const { handleSave, addNewDataFilterToGlobal, currentFilter } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart } = useEditStore();

    setTargetSelectChart(`${groupData.value[0].id}`);

    const filter = addNewDataFilterToGlobal();

    expect(currentFilter.value.length).toBe(1);

    // 尝试保存一个与已有过滤器同名的过滤器
    const result = await handleSave(filter);

    // 应该返回重复名称的错误
    expect(result.success).toBe(false);
    expect(result.error).toBe("duplicate_name");
  });

  it("添加不同名数据过滤器并保存 全局数据过滤器增加 组件数据过滤器参数增加", async () => {
    const { addNewDataFilterToGlobal, handleSave, newDataFilter, currentFilter } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart, selectTargetData } = useEditStore();

    setTargetSelectChart(`${groupData.value[1].id}`);
    const currentListenArgs = [...selectTargetData.value[0].listenArgs];
    expect(selectTargetData.value.length).toBe(1);

    // 该组件目前数据过滤器
    expect(currentFilter.value.length, "该组件目前数据过滤器").toBe(1);

    // 新增一个过滤器
    addNewDataFilterToGlobal();

    // 验证新过滤器被添加
    expect(newDataFilter.value.length, "新增的过滤器").toBe(1);
    expect(newDataFilter.value[0].name, "新增的过滤器名称").toBe("新建过滤器");
    expect(newDataFilter.value[0].notSaved, "新增的过滤器未保存").toBe(true);
    expect(currentFilter.value.length, "新增的过滤器后，数据过滤器数量").toBe(2);

    const newListenArgs = [...selectTargetData.value[0].listenArgs];

    // 验证新增的过滤器没有被添加到组件的 listenArgs 中
    expect(newListenArgs.length, "新增的过滤器后，组件的 listenArgs 数量").toBe(currentListenArgs.length);

    newDataFilter.value[0].name = "测试过滤器";

    // 保存过滤器
    const result = await handleSave(newDataFilter.value[0]);

    // 验证保存成功
    expect(result.success).toBe(true);
    expect(selectTargetData.value[0].listenArgs.length, "新增过滤器后，组件的 listenArgs 数量").toBe(
      currentListenArgs.length + 1
    );
    expect(currentFilter.value.length, "新增过滤器后，数据过滤器数量").toBe(2);

    expect(
      selectTargetData.value[0].listenArgs.every((item) =>
        currentFilter.value.some((filter) => filter.name === item.filterName)
      ),
      "新增过滤器后，组件的 listenArgs 中是否包含新增的过滤器"
    ).toBe(true);

    expect(newDataFilter.value.length, "新增过滤器后，新过滤器列表长度").toBe(0);
  });

  it("删除临时过滤器", async () => {
    const { addNewDataFilterToGlobal, deleteFilterFromComponent, newDataFilter, currentFilter } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart } = useEditStore();

    setTargetSelectChart(`${groupData.value[1].id}`);

    // 该组件目前数据过滤器数量
    const initialFilterCount = currentFilter.value.length;
    expect(initialFilterCount, "该组件目前数据过滤器").toBeGreaterThan(0);

    // 新增一个临时过滤器
    addNewDataFilterToGlobal();

    // 验证临时过滤器被添加
    expect(newDataFilter.value.length, "新增的临时过滤器").toBe(1);
    expect(currentFilter.value.length, "新增临时过滤器后，数据过滤器数量").toBe(initialFilterCount + 1);

    // 删除临时过滤器
    await deleteFilterFromComponent(newDataFilter.value[0]);

    // 验证临时过滤器被删除
    expect(newDataFilter.value.length, "删除后，临时过滤器列表长度").toBe(0);
    expect(currentFilter.value.length, "删除临时过滤器后，数据过滤器数量").toBe(initialFilterCount);
  });

  it("删除已保存的过滤器 组件数据过滤器参数减少", async () => {
    const { deleteFilterFromComponent, currentFilter, dataFilter } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart, selectTargetData } = useEditStore();

    // 选择有绑定过滤器的组件（文本框组件，从mock数据可知它绑定了"新建过滤器"）
    setTargetSelectChart(`${groupData.value[1].id}`);

    const initialListenArgsCount = selectTargetData.value[0].listenArgs.length;
    const initialFilterCount = currentFilter.value.length;

    expect(initialListenArgsCount, "组件初始的 listenArgs 数量").toBe(1);
    expect(initialFilterCount, "组件绑定的过滤器数量").toBe(1);

    // 找到要删除的过滤器（选择第一个绑定的过滤器）
    const filterToDelete = currentFilter.value[0];
    const filterName = filterToDelete.name;

    // 记录删除前该过滤器的绑定组件数量
    const initialBindComponentCount = dataFilter.value[filterName].bindComponent.length;
    expect(initialBindComponentCount, "过滤器初始绑定的组件数量").toBe(1);

    // 删除过滤器
    await deleteFilterFromComponent(filterToDelete);

    // 验证组件的 listenArgs 减少
    expect(selectTargetData.value[0].listenArgs.length, "删除后，组件的 listenArgs 数量").toBe(
      initialListenArgsCount - 1
    );

    // 验证过滤器的绑定组件中不再包含当前组件
    expect(
      dataFilter.value[filterName].bindComponent.some((comp) => comp.id === selectTargetData.value[0].id),
      "过滤器的绑定组件中不应包含当前组件"
    ).toBe(false);

    // 验证组件的 listenArgs 中不再包含被删除的过滤器
    expect(
      selectTargetData.value[0].listenArgs.some((arg) => arg.filterName === filterName),
      "组件的 listenArgs 中不应包含被删除的过滤器"
    ).toBe(false);

    // 验证当前过滤器列表中不再包含被删除的过滤器
    expect(currentFilter.value.length, "删除后，当前过滤器数量").toBe(initialFilterCount - 1);
    expect(
      currentFilter.value.some((filter) => filter.name === filterName),
      "当前过滤器列表中不应包含被删除的过滤器"
    ).toBe(false);
  });

  it("新增过滤器，并添加回调参数", async () => {
    const {
      newDataFilter,
      dataFilter,
      addNewDataFilterToGlobal,
      _addListenArgs,
      _updateFilterStatus,
      _processCallbackRelations,
      _updateComponentListeners
    } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart, selectTargetData } = useEditStore();

    setTargetSelectChart(`${groupData.value[1].id}`);

    // 新增过滤器
    addNewDataFilterToGlobal();

    // 添加回调参数
    newDataFilter.value[0].callBack = ["labelCb", "valueCb"];

    // 修改过滤器名称
    const filterName = "测试回调过滤器";
    newDataFilter.value[0].name = filterName;

    const target = _updateFilterStatus(newDataFilter.value[0]);
    expect(target).toBeTruthy();
    expect(target?.id).toBe(undefined);
    expect(dataFilter.value[filterName]).toEqual(target);

    // 清空新建的过滤器
    newDataFilter.value = [];

    _addListenArgs({
      ...target!,
      callBack: []
    });

    // 在这里 新的过滤器在组件中的 callbackFields 应该为空
    expect(selectTargetData.value[0].listenArgs.find((v) => v.filterName === filterName)?.callbackFields).toEqual([]);

    // 处理回调关系
    _processCallbackRelations(filterName);

    // 更新组件监听参数
    _updateComponentListeners(filterName);

    // 在这里 新的过滤器在组件中的 callbackFields 应该为过滤器数据
    expect(selectTargetData.value[0].listenArgs.find((v) => v.filterName === filterName)?.callbackFields).toEqual([
      "labelCb",
      "valueCb"
    ]);
  });

  it("组件添加现有过滤器", async () => {
    const { diffSelectFilter, addDataFilterToComponent, currentFilter } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart, selectTargetData } = useEditStore();

    setTargetSelectChart(`${groupData.value[0].id}`);

    const otherFilter = diffSelectFilter.value[0];

    addDataFilterToComponent(otherFilter.name);

    expect(diffSelectFilter.value.length).toBe(0);
    expect(currentFilter.value.length).toBe(1);
    expect(selectTargetData.value[0].listenArgs[0].filterName).toBe(otherFilter.name);
  });

  it("initCallbackArguments 应该正确初始化回调参数", () => {
    const { callbackArgumentsManager } = useCallbackArguments();
    const { groupData } = useGlobalComponentData();
    // 交互组件回调参数 抛出了 labelCb
    // 文本框绑定的过滤器 监听了 labelCb

    expect(callbackArgumentsManager.value["labelCb"]).toBeTruthy();
    expect(callbackArgumentsManager.value["labelCb"]!.source).toEqual([
      { id: groupData.value[0].id, name: groupData.value[0].name, cbId: groupData.value[0].cbArgs[0].id }
    ]);
    expect(callbackArgumentsManager.value["labelCb"]!.target).toEqual([
      { id: groupData.value[1].id, name: groupData.value[1].name, filterName: "新建过滤器" }
    ]);
  });

  it("新过滤器添加监听回调参数", async () => {
    const { newDataFilter, handleSave, updateCallbackArgumentToFilter, addNewDataFilterToGlobal } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart, selectTargetData } = useEditStore();
    const { callbackArgumentsManager } = useCallbackArguments();

    setTargetSelectChart(`${groupData.value[0].id}`);
    const filter = addNewDataFilterToGlobal();
    expect(newDataFilter.value.length).toBe(1);

    updateCallbackArgumentToFilter(filter, ["labelCb"]);
    expect(filter.notSaved, "添加回调参数 过滤器变为未保存状态").toBe(true);
    expect(filter.callBack, "过滤器回调参数").toEqual(["labelCb"]);
    filter.name = "测试过滤器";

    handleSave(filter);
    expect(filter.notSaved, "完成保存 过滤器变为保存状态").toBe(false);
    expect(selectTargetData.value[0].listenArgs.find((v) => v.filterName === filter.name)?.callbackFields).toEqual([
      "labelCb"
    ]);

    expect(callbackArgumentsManager.value["labelCb"]!.source.length, "labelCb 回调参数源组件存在").toBe(1);
    expect(callbackArgumentsManager.value["labelCb"]!.target.length, "labelCb 回调参数目标组件存在").toBe(2);
  });

  it("绑定了多个过滤器的组件 删除其中一个过滤器", async () => {
    const { currentFilter, deleteFilterFromComponent, addNewDataFilterToGlobal, handleSave } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart, selectTargetData } = useEditStore();

    setTargetSelectChart(`${groupData.value[1].id}`);
    const filter = currentFilter.value[0];
    const newFilter = addNewDataFilterToGlobal();
    newFilter.name = "测试过滤器";
    handleSave(newFilter);

    await deleteFilterFromComponent(filter);

    expect(selectTargetData.value[0].listenArgs.length, "组件的 listenArgs 数量").toBe(1);
    expect(
      selectTargetData.value[0].listenArgs.find((v) => v.filterName === filter.name),
      "组件的 listenArgs 中不应包含被删除的过滤器"
    ).toBeUndefined();
    expect(
      selectTargetData.value[0].listenArgs.find((v) => v.filterName === newFilter.name),
      "组件的 listenArgs 中应包含新增的过滤器"
    ).toBeDefined();
    expect(filter.bindComponent.length, "过滤器回调参数数量").toBe(0);
  });

  it("过滤器添加监听回调参数", async () => {
    const { currentFilter, handleSave, updateCallbackArgumentToFilter } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart, selectTargetData } = useEditStore();
    const { callbackArgumentsManager } = useCallbackArguments();

    setTargetSelectChart(`${groupData.value[1].id}`);
    const filter = currentFilter.value[0];

    updateCallbackArgumentToFilter(filter, [...filter.callBack, "valueCb"]);
    expect(filter.notSaved, "添加回调参数 过滤器变为未保存状态").toBe(true);

    handleSave(filter);
    expect(filter.notSaved, "完成保存 过滤器变为保存状态").toBe(false);

    expect(filter.callBack, "过滤器回调参数").toEqual(["labelCb", "valueCb"]);
    expect(
      selectTargetData.value[0].listenArgs.find((v) => v.filterName === filter.name)?.callbackFields,
      "组件内回调参数增加"
    ).toEqual(["labelCb", "valueCb"]);

    expect(callbackArgumentsManager.value["valueCb"], "valueCb 回调参数存在").toBeTruthy();
    expect(callbackArgumentsManager.value["valueCb"]!.source, "valueCb 回调参数源组件不存在").toEqual([]);
    expect(callbackArgumentsManager.value["valueCb"]!.target, "valueCb 回调参数目标组件存在").toEqual([
      { id: selectTargetData.value[0].id, name: selectTargetData.value[0].name, filterName: filter.name }
    ]);
  });

  it("选择分组 当前过滤器为空", () => {
    const { currentFilter } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart } = useEditStore();

    const group = groupData.value[4];
    setTargetSelectChart(`${group.id}`);
    expect(currentFilter.value.length).toBe(0);
  });

  it("过滤器删除监听回调参数", async () => {
    const { currentFilter, handleSave, updateCallbackArgumentToFilter } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart, selectTargetData } = useEditStore();
    const { callbackArgumentsManager } = useCallbackArguments();

    setTargetSelectChart(`${groupData.value[1].id}`);
    const filter = currentFilter.value[0];

    updateCallbackArgumentToFilter(filter, []);
    expect(filter.notSaved, "添加回调参数 过滤器变为未保存状态").toBe(true);

    handleSave(filter);
    expect(filter.notSaved, "完成保存 过滤器变为保存状态").toBe(false);

    expect(filter.callBack, "过滤器回调参数").toEqual([]);
    expect(
      selectTargetData.value[0].listenArgs.find((v) => v.filterName === filter.name)?.callbackFields,
      "组件内回调参数减少"
    ).toEqual([]);

    expect(callbackArgumentsManager.value["labelCb"], "labelCb 关系存在").toBeTruthy();
    expect(callbackArgumentsManager.value["labelCb"]!.target, "labelCb 回调参数目标组件不存在").toEqual([]);
  });

  it("过滤器删除监听回调参数 再添加同一个监听回调参数 过滤器状态不变", async () => {
    const { currentFilter, updateCallbackArgumentToFilter } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart, selectTargetData } = useEditStore();
    const { callbackArgumentsManager } = useCallbackArguments();

    setTargetSelectChart(`${groupData.value[1].id}`);
    const filter = currentFilter.value[0];

    updateCallbackArgumentToFilter(filter, [""]);
    expect(filter.notSaved, "添加回调参数 过滤器变为未保存状态").toBe(true);

    updateCallbackArgumentToFilter(filter, ["labelCb"]);
    expect(filter.notSaved, "添加回调参数 过滤器变为未保存状态").toBe(false);

    expect(callbackArgumentsManager.value["labelCb"]!.source, "labelCb 回调参数源组件存在").toEqual([
      { id: groupData.value[0].id, name: groupData.value[0].name, cbId: groupData.value[0].cbArgs[0].id }
    ]);
    expect(callbackArgumentsManager.value["labelCb"]!.target, "labelCb 回调参数目标组件存在").toEqual([
      { id: selectTargetData.value[0].id, name: selectTargetData.value[0].name, filterName: filter.name }
    ]);
  });

  it("未修改的过滤器保存 不进行任何操作", async () => {
    const { currentFilter, handleSave } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart } = useEditStore();

    setTargetSelectChart(`${groupData.value[1].id}`);
    const filter = currentFilter.value[0];

    const result = await handleSave(filter);
    expect(result.success).toBe(false);
    expect(result.error).toBe("not_modified");
  });

  it("组件新增回调参数", () => {
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart, selectTargetData } = useEditStore();

    // 选择第一个组件（交互组件，从mock数据可知它有cbArgs）
    setTargetSelectChart(`${groupData.value[0].id}`);

    const { addCallback, callbackOptions, currentCallback, activeTab } = useCallbackOption();

    // 记录添加前的回调参数数量
    const initialCallbackCount = selectTargetData.value[0].cbArgs ? selectTargetData.value[0].cbArgs.length : 0;

    // 验证初始状态
    expect(callbackOptions.value.length, "初始回调参数数量").toBe(initialCallbackCount);

    // 添加新的回调参数
    addCallback();

    // 验证添加后的状态
    expect(selectTargetData.value[0].cbArgs, "组件应该有cbArgs数组").toBeTruthy();
    expect(selectTargetData.value[0].cbArgs.length, "添加后回调参数数量应增加1").toBe(initialCallbackCount + 1);

    // 验证新添加的回调参数结构
    const newCallback = selectTargetData.value[0].cbArgs[selectTargetData.value[0].cbArgs.length - 1];
    expect(newCallback.id, "新回调参数应有ID").toBeTruthy();
    expect(newCallback.name, "新回调参数应有名称").toBe("回调");
    expect(newCallback.type, "新回调参数类型").toBe("object");
    expect(newCallback.method, "新回调参数方法").toBe("default");
    expect(newCallback.value, "新回调参数应有value对象").toBeTruthy();
    expect(newCallback.value.origin, "新回调参数应有origin字段").toBeTruthy();
    expect(newCallback.value.target, "新回调参数应有target字段").toBeTruthy();

    // 验证当前选中项更新
    expect(activeTab.value, "激活标签应为新添加的回调ID").toBe(newCallback.id);
    expect(currentCallback.value, "当前回调应为新添加的回调").toEqual(newCallback);

    // 验证计算属性
    expect(callbackOptions.value.length, "callbackOptions应反映新的数量").toBe(initialCallbackCount + 1);
  });

  it("组件删除回调参数", async () => {
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart, selectTargetData } = useEditStore();
    const { callbackArgumentsManager } = useCallbackArguments();

    // 选择第一个组件（交互组件，从mock数据可知它有cbArgs）
    setTargetSelectChart(`${groupData.value[0].id}`);

    const { deleteCallback, callbackOptions, currentCallback, activeTab, updateCurrentCallback } = useCallbackOption();

    // 确保组件有回调参数
    expect(selectTargetData.value[0].cbArgs, "组件应该有cbArgs数组").toBeTruthy();
    const initialCallbackCount = selectTargetData.value[0].cbArgs.length;
    expect(initialCallbackCount, "组件应该至少有1个回调参数").toBeGreaterThan(0);

    // 选择第一个回调参数进行删除
    const firstCallbackId = selectTargetData.value[0].cbArgs[0].id;
    updateCurrentCallback(firstCallbackId);

    // 验证选中状态
    expect(activeTab.value, "应该选中第一个回调").toBe(firstCallbackId);
    expect(currentCallback.value, "当前回调应该存在").toBeTruthy();
    expect(currentCallback.value!.id, "当前回调ID应匹配").toBe(firstCallbackId);

    // 记录删除前的目标值（如果存在）
    const targetValue = currentCallback.value?.value?.target?.value;
    const initialRelationExists = targetValue && callbackArgumentsManager.value[targetValue];
    let initialSourceCount = 0;
    if (initialRelationExists) {
      initialSourceCount = callbackArgumentsManager.value[targetValue]!.source.length;
    }

    // 删除回调参数
    await deleteCallback();

    // 验证删除后的状态
    expect(selectTargetData.value[0].cbArgs.length, "删除后回调参数数量应减少1").toBe(initialCallbackCount - 1);

    // 验证删除的回调参数不再存在
    const deletedCallbackExists = selectTargetData.value[0].cbArgs.some((cb) => cb.id === firstCallbackId);
    expect(deletedCallbackExists, "被删除的回调参数不应再存在").toBe(false);

    // 验证激活标签更新
    if (selectTargetData.value[0].cbArgs.length > 0) {
      // 如果还有其他回调，应该选中第一个
      expect(activeTab.value, "应该选中剩余的第一个回调").toBe(selectTargetData.value[0].cbArgs[0].id);
      expect(currentCallback.value, "当前回调应该更新").toBeTruthy();
      expect(currentCallback.value!.id, "当前回调ID应该是新选中的").toBe(selectTargetData.value[0].cbArgs[0].id);
    } else {
      // 如果没有回调了，应该清空选中
      expect(activeTab.value, "没有回调时激活标签应为空").toBe("");
      expect(currentCallback.value, "没有回调时当前回调应为null").toBe(null);
    }

    // 验证回调关系被正确清理（如果原来有目标值）
    if (targetValue && initialRelationExists) {
      const relation = callbackArgumentsManager.value[targetValue];
      if (relation) {
        // 应该从source中移除当前组件和回调的关系
        const stillHasRelation = relation.source.some(
          (source) => source.id === selectTargetData.value[0].id && source.cbId === firstCallbackId
        );
        expect(stillHasRelation, "回调关系应该被清理").toBe(false);
        expect(relation.source.length, "source数量应该减少").toBe(initialSourceCount - 1);
      }
    }

    // 验证计算属性
    expect(callbackOptions.value.length, "callbackOptions应反映新的数量").toBe(initialCallbackCount - 1);
  });

  it("参数无对应的源组件和目标组件时，回调管理中删除该参数 先删除交互组件上的回调参数，再删除过滤器上的回调参数", () => {
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart, selectTargetData } = useEditStore();
    const { callbackArgumentsManager } = useCallbackArguments();
    const { currentFilter, deleteFilterFromComponent } = useDataFilter();
    const { deleteCallback, updateCurrentCallback } = useCallbackOption();

    // 交互组件 先删除上面的回调参数
    setTargetSelectChart(`${groupData.value[0].id}`);

    const firstCallback = selectTargetData.value[0].cbArgs[0];
    updateCurrentCallback(firstCallback.id);

    deleteCallback();

    // 文本框组件 删除过滤器上的回调参数
    setTargetSelectChart(`${groupData.value[1].id}`);

    const filter = currentFilter.value[0];
    deleteFilterFromComponent(filter);

    expect(callbackArgumentsManager.value[firstCallback.value.target.value], "回调参数应该被删除").toBeUndefined();
  });

  it("参数无对应的源组件和目标组件时，回调管理中删除该参数 先删除过滤器上的回调参数，再删除交互组件上的回调参数", () => {
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart, selectTargetData } = useEditStore();
    const { callbackArgumentsManager } = useCallbackArguments();
    const { currentFilter, deleteFilterFromComponent } = useDataFilter();
    const { deleteCallback, updateCurrentCallback } = useCallbackOption();
    // 文本框组件 删除过滤器上的回调参数
    setTargetSelectChart(`${groupData.value[1].id}`);

    const filter = currentFilter.value[0];
    deleteFilterFromComponent(filter);

    // 交互组件 先删除上面的回调参数
    setTargetSelectChart(`${groupData.value[0].id}`);

    const firstCallback = selectTargetData.value[0].cbArgs[0];
    updateCurrentCallback(firstCallback.id);

    deleteCallback();

    expect(callbackArgumentsManager.value[firstCallback.value.target.value], "回调参数应该被删除").toBeUndefined();
  });

  it("两个组件一起使用一个数据过滤器 数据过滤器修改 两个组件中的 listenArgs 应该同步修改", () => {
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart } = useEditStore();
    const { updateCallbackArgumentToFilter, diffSelectFilter, addDataFilterToComponent, handleSave } = useDataFilter();
    const { callbackArgumentsManager } = useCallbackArguments();

    setTargetSelectChart(`${groupData.value[0].id}`);

    const otherFilter = diffSelectFilter.value[0];

    addDataFilterToComponent(otherFilter.name);

    updateCallbackArgumentToFilter(otherFilter, ["labelCb", "valueCb"]);
    handleSave(otherFilter);

    expect(groupData.value[0].listenArgs[0].filterName).toBe(otherFilter.name);
    expect(groupData.value[1].listenArgs[0].filterName).toBe(otherFilter.name);

    expect(groupData.value[0].listenArgs[0].callbackFields).toEqual(["labelCb", "valueCb"]);
    expect(groupData.value[1].listenArgs[0].callbackFields).toEqual(["labelCb", "valueCb"]);

    expect(callbackArgumentsManager.value["valueCb"]!.source.length, "valueCb 回调参数源组件不存在").toBe(0);
    expect(callbackArgumentsManager.value["valueCb"]!.target.length, "valueCb 回调参数目标组件存在").toBe(2);

    // 交互组件抛出
    expect(callbackArgumentsManager.value["labelCb"]!.source.length, "labelCb 回调参数源组件存在").toBe(1);
    expect(callbackArgumentsManager.value["labelCb"]!.target.length, "labelCb 回调参数目标组件存在").toBe(2);
  });

  it("两个组件一起使用一个数据过滤器 数据过滤器删除 两个组件中的 listenArgs 应该同步删除", async () => {
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart } = useEditStore();
    const { navInfo } = useLargeScreenInfo();
    const { diffSelectFilter, currentFilter, addDataFilterToComponent } = useDataFilter();
    const { callbackArgumentsManager } = useCallbackArguments();
    const { getBindFilterComponents, removeFilterFromComponents, removeFilterFromDataFilter } = useProjectFilter();

    setTargetSelectChart(`${groupData.value[0].id}`);

    const otherFilter = diffSelectFilter.value[0];

    await addDataFilterToComponent(otherFilter.name);
    expect(otherFilter.bindComponent.length).toBe(2);

    setTargetSelectChart("");

    const bindComponents = getBindFilterComponents(otherFilter);
    expect(bindComponents.length, "获取绑定的组件数量").toBe(2);

    await removeFilterFromComponents(otherFilter, bindComponents as ComponentType[]);

    expect(groupData.value[0].listenArgs.length, "数据过滤器删除后 交互组件的监听参数列表为空").toBe(0);
    expect(groupData.value[1].listenArgs.length, "数据过滤器删除后 文本框组件的监听参数列表为空").toBe(0);

    expect(callbackArgumentsManager.value["labelCb"]!.source.length, "labelCb 回调参数源组件存在").toBe(1);
    expect(callbackArgumentsManager.value["labelCb"]!.target.length, "labelCb 回调参数目标组件不存在").toBe(0);

    setTargetSelectChart(`${groupData.value[0].id}`);
    expect(currentFilter.value.length, "数据过滤器删除后 数据过滤器列表为空").toBe(0);

    await removeFilterFromDataFilter(otherFilter.name);
    expect(navInfo.value.dataFilterArr, "数据过滤器删除后 数据过滤器列表为空").toEqual({});
  });

  it("不选中组件，直接对数据过滤器进行修改", async () => {
    const { dataFilter, updateCallbackArgumentToFilter } = useDataFilter();
    const { handleSave } = useProjectFilter();

    const filter = dataFilter.value["新建过滤器"];
    updateCallbackArgumentToFilter(filter, ["labelCb", "valueCb"]);
    expect(filter.callBack).toEqual(["labelCb", "valueCb"]);
    expect(filter.notSaved).toBe(true);

    const res = await handleSave(filter);
    expect(res.success).toBe(true);
    expect(filter.notSaved).toBe(false);
    expect(filter.callBack).toEqual(["labelCb", "valueCb"]);
  });
});

describe("CompiledFunctionCache - 过滤器函数编译缓存测试", () => {
  let cache: any;

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
    const { getCompiledFunctionCache } = await import(
      "@/views/build/components/buildRender/core/BaseComponent/filterData/utils/CompiledFunctionCache"
    );

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

    // 获取缓存实例
    cache = getCompiledFunctionCache();
  });

  afterEach(() => {
    const { buildWorkerCacheInput } = useCacheData();
    const workerCacheInput = buildWorkerCacheInput(Date.now());
    structuredClone(workerCacheInput);
  });

  it("应该能缓存已编译的函数 相同的 filter 返回相同的函数引用", () => {
    const { dataFilter } = useDataFilter();
    const filter = dataFilter.value["新建过滤器"];

    // 第一次调用，应该编译并缓存
    const fn1 = cache.getOrCompile(filter);
    expect(fn1).toBeTruthy();
    expect(typeof fn1).toBe("function");

    // 第二次调用相同的 filter，应该返回缓存的函数
    const fn2 = cache.getOrCompile(filter);
    expect(fn2).toBe(fn1);
  });

  it("应该在过滤器代码改变时重新编译 返回新的函数引用", () => {
    const { dataFilter } = useDataFilter();
    const filter = dataFilter.value["新建过滤器"];

    // 第一次编译
    const originalCode = filter.dataFormatter;
    const fn1 = cache.getOrCompile(filter);

    // 修改过滤器代码
    filter.dataFormatter = "(data, callbackArgs) => { return data.slice(0, 2) }";

    // 第二次调用应该返回新的函数（因为代码变了）
    const fn2 = cache.getOrCompile(filter);
    expect(fn2).not.toBe(fn1);

    // 恢复原始代码
    filter.dataFormatter = originalCode;
  });

  it("onFilterCodeChange 应该自动更新缓存", () => {
    const { dataFilter, onFilterCodeChange } = useDataFilter();
    const filter = dataFilter.value["新建过滤器"];

    // 第一次编译和缓存
    const fn1 = cache.getOrCompile(filter);

    // 通过 onFilterCodeChange 修改代码
    const newCode = "(data, callbackArgs) => { return data.map(v => v * 2) }";
    onFilterCodeChange(filter, newCode);

    // 验证代码已修改
    expect(filter.dataFormatter).toBe(newCode);
    expect(filter.notSaved).toBe(true);

    // 再次调用应该重新编译（因为 updateFilter 被调用了）
    const fn2 = cache.getOrCompile(filter);
    expect(fn2).not.toBe(fn1);
  });

  it("handleSaveFilter 应该在保存后更新缓存", async () => {
    const { dataFilter, handleSaveFilter } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart } = useEditStore();

    setTargetSelectChart(`${groupData.value[1].id}`);

    const filter = dataFilter.value["新建过滤器"];

    // 第一次编译
    const fn1 = cache.getOrCompile(filter);

    // 修改过滤器代码
    filter.dataFormatter = "(data, callbackArgs) => { return data.filter(v => v.id > 0) }";
    filter.notSaved = true;

    // 保存过滤器
    await handleSaveFilter(filter);

    // 验证缓存已更新，再次调用应该使用新代码
    const fn2 = cache.getOrCompile(filter);
    expect(fn2).not.toBe(fn1);
  });

  it("应该正确统计缓存命中次数", () => {
    const { dataFilter } = useDataFilter();
    const filter = dataFilter.value["新建过滤器"];

    // 清空统计（如果有 reset 方法）
    const initialStats = cache.getStats?.();

    // 第一次调用 - miss
    cache.getOrCompile(filter);

    // 后续调用 - hit
    cache.getOrCompile(filter);
    cache.getOrCompile(filter);
    cache.getOrCompile(filter);

    const stats = cache.getStats?.();
    expect(stats?.hits).toBeGreaterThanOrEqual(3);
  });

  it("应该正确统计代码变化次数", () => {
    const { dataFilter } = useDataFilter();
    const filter = dataFilter.value["新建过滤器"];

    // 第一次编译
    cache.getOrCompile(filter);
    const initialStats = cache.getStats?.();
    const initialCodeChanges = initialStats?.codeChanges || 0;

    // 修改代码后再调用
    filter.dataFormatter = "(data) => data.slice(0, 5)";
    cache.getOrCompile(filter);

    // 再修改一次
    filter.dataFormatter = "(data) => data.slice(0, 10)";
    cache.getOrCompile(filter);

    const stats = cache.getStats?.();
    expect(stats?.codeChanges).toBe(initialCodeChanges + 2);
  });

  it("不同名称的过滤器应该使用不同的缓存", () => {
    const { addNewDataFilterToGlobal } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart } = useEditStore();

    setTargetSelectChart(`${groupData.value[1].id}`);

    // 创建两个不同名称的过滤器
    const filter1 = addNewDataFilterToGlobal();
    filter1.name = "测试过滤器1";
    filter1.dataFormatter = "(data) => data";

    const filter2 = addNewDataFilterToGlobal();
    filter2.name = "测试过滤器2";
    filter2.dataFormatter = "(data) => data";

    // 编译两个不同名称的过滤器
    const fn1 = cache.getOrCompile(filter1);
    const fn2 = cache.getOrCompile(filter2);

    // 虽然代码相同，但由于名称不同，应该是不同的函数实例
    expect(fn1).not.toBe(fn2);
  });

  it("编译的函数应该能正确执行并返回预期结果", () => {
    const { dataFilter } = useDataFilter();
    const filter = dataFilter.value["新建过滤器"];

    // 修改为简单的测试代码
    filter.dataFormatter = "(data) => Array.isArray(data) ? data.map(v => ({ ...v, processed: true })) : data";

    const fn = cache.getOrCompile(filter);
    const testData = [{ id: 1 }, { id: 2 }];
    const result = fn(testData);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty("processed", true);
  });

  it("updateFilter 方法应该使缓存失效", () => {
    const { dataFilter } = useDataFilter();
    const filter = dataFilter.value["新建过滤器"];

    // 第一次编译和缓存
    const fn1 = cache.getOrCompile(filter);

    // 修改 filter 的代码
    filter.dataFormatter = "(data) => data.reverse()";

    // 调用 updateFilter 使缓存失效
    cache.updateFilter(filter);

    // 第二次调用应该重新编译新的代码
    const fn2 = cache.getOrCompile(filter);

    // 应该是不同的函数
    expect(fn2).not.toBe(fn1);
  });

  it("相同 name 但代码不同时 应该检测到代码变化并重新编译", () => {
    const { dataFilter } = useDataFilter();
    const filter = dataFilter.value["新建过滤器"];

    // 第一次编译
    const fn1 = cache.getOrCompile(filter);

    // 保持相同的 name，但改变代码
    filter.dataFormatter = "(data) => data.filter(v => v.checked)";

    // 再次调用应该检测到代码改变
    const fn2 = cache.getOrCompile(filter);

    // 由于代码改变，应该返回新的函数
    expect(fn2).not.toBe(fn1);
  });

  it("完整的缓存更新流程测试 从代码修改到保存", async () => {
    const { dataFilter, onFilterCodeChange, handleSaveFilter } = useDataFilter();
    const { groupData } = useGlobalComponentData();
    const { setTargetSelectChart } = useEditStore();

    setTargetSelectChart(`${groupData.value[1].id}`);

    const filter = dataFilter.value["新建过滤器"];

    // 1. 第一次编译
    const fn1 = cache.getOrCompile(filter);

    // 2. 通过 onFilterCodeChange 修改代码
    const newCode = "(data, callbackArgs) => { return data.slice(0, 3) }";
    onFilterCodeChange(filter, newCode);
    expect(filter.notSaved).toBe(true);

    // 3. 验证缓存被更新
    const fn2 = cache.getOrCompile(filter);
    expect(fn2).not.toBe(fn1);

    // 4. 保存过滤器
    await handleSaveFilter(filter);

    // 5. 验证保存后缓存仍然有效
    const fn3 = cache.getOrCompile(filter);
    expect(fn3).toBe(fn2); // 因为代码没变，应该使用缓存
  });
});
