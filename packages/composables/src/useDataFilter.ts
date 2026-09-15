import { uuid } from "@screenwright/core";
import type { ChildComponent, ComponentType, Filter } from "@screenwright/types";
import { createGlobalState } from "@vueuse/core";
import { debounce, isNil, values } from "lodash-es";
import { computed, ref, toRaw } from "vue";

import { useScreenEditor } from "./core-adapter/useScreenEditor";
import { FilterResultCollector, type ResultCollectItem } from "./FilterResultCollector";
import { getDataFilterPersistence, UpdateHistoryTypeEnum } from "./ports/persistencePort";
import { useEditStore } from "./useEditStore";
import { useGlobalComponentData } from "./useGlobalComponentData";
import { useLargeScreenInfo } from "./useLargeScreenInfo";
import { useUpdateInstance } from "./useUpdateInstance";

/** 通用后端响应包裹（与 app 的 model/BaseEntity 结构一致，避免依赖 app 类型） */
export interface BaseEntity<T> {
  code: number;
  message: string;
  onlTable: unknown;
  requestId: string;
  success: boolean;
  timestamp: number;
  result: T;
}

/**
 * 过滤器验证结果类型
 */
export type FilterValidationResult =
  | { success: true }
  | { success: false; error: "duplicate_name" | "empty_name" | "filter_not_found" | "save_failed" | "not_modified" };

/**
 * 配置面板数据过滤器
 * @returns 数据过滤器相关的状态和方法
 */
export const useDataFilter = createGlobalState(() => {
  const editor = useScreenEditor();
  const { isPanel } = useEditStore();
  const { selectTargetData, update } = useUpdateInstance({
    history: false,
    isDynamicPanel: isPanel()
  });
  const { allComponentMap, globalComponentMap } = useGlobalComponentData();
  const { navInfo } = useLargeScreenInfo();

  const filterResultCollector = FilterResultCollector.getInstance();

  /**
   * 项目全局的过滤器
   */
  const dataFilter = computed({
    get: () => navInfo.value.dataFilterArr,
    set: (value) => {
      navInfo.value.dataFilterArr = value;
    }
  });

  const savedDataFilter = computed(() => {
    return Object.values(dataFilter.value).filter((v) => !v.notSaved);
  });

  /**
   * 项目全局过滤器的初始快照（用于 change detection 和 UI 还原）
   */
  const cloneDataFilter = computed(() => editor.dataFilter.getCloneDataFilter());

  /**
   * 新建的过滤器
   */
  const newDataFilter = ref<Filter[]>([]);

  const handleClearNotSave = () => {
    newDataFilter.value = newDataFilter.value.filter((item) => !item.notSaved);
  };

  /**
   * 获取当前组件的所有过滤器结果
   */
  const filterAllResultForCurrentComponent = computed(() => {
    void filterResultCollector.getVersionRef().value;
    return [...toRaw(filterResultCollector.getResults(selectTargetData.value[0]) || [])];
  });

  /**
   * 获取过滤器结果
   */
  const getFilterResult = (result?: ResultCollectItem) => {
    if (!result) {
      return ["过滤器执行失败 过滤器未执行"];
    }
    if (!result.success) {
      return [{ error: result.error?.message }];
    }
    return result.outputData;
  };

  /**
   * 获取当前组件的最后一个过滤器结果
   */
  const filterResultForCurrentComponent = computed(() => {
    const targetResults = filterAllResultForCurrentComponent.value;
    const lastResult = targetResults?.[targetResults.length - 1];
    const result = toRaw(getFilterResult(lastResult));
    if (Array.isArray(result)) {
      return [...result];
    }
    return result;
  });

  /**
   * 新增一个临时过滤器
   */
  const addNewDataFilterToGlobal = () => {
    const newFilter: Filter = {
      name: "新建过滤器",
      callBack: [],
      callBackStatus: false,
      dataFormatter: "(data, callbackArgs) => {\r\n    return data\r\n}",
      bindComponent: [{ label: selectTargetData.value[0].name, id: selectTargetData.value[0].id }],
      checked: true,
      notSaved: true,
      tempPool: { callBack: [], dataFormatter: "" },
      show: true,
      id: uuid()
    };
    newDataFilter.value.push(newFilter);
    return newFilter;
  };

  /**
   * 是否有有效的选中组件
   */
  const hasValidSelectedComponent = computed(() => {
    return selectTargetData.value && selectTargetData.value.length === 1 && selectTargetData.value[0].listenArgs;
  });

  /**
   * 当前选中的过滤器列表
   */
  const currentFilter = computed({
    get: () => {
      if (!hasValidSelectedComponent.value) {
        return [];
      }
      const allFilter = Object.values(dataFilter.value);
      return [
        ...selectTargetData.value[0].listenArgs.map((filter) => {
          return allFilter.find((v) => v.name === filter.filterName)!;
        }),
        ...newDataFilter.value
      ].filter((filter) => !isNil(filter));
    },
    set: (value) => {
      value.forEach((v) => {
        if (v.id) {
          return;
        }
        dataFilter.value[v.name] = toRaw(v);
      });
    }
  });

  /**
   * 未选中的过滤器列表
   */
  const diffSelectFilter = computed({
    get: () => {
      if (!selectTargetData.value || selectTargetData.value.length === 0) {
        return [];
      }
      const allFilter = values(dataFilter.value);
      return allFilter
        .filter((item) => !currentFilter.value.some((filter) => filter.name === item.name))
        .filter((v) => v.name);
    },
    set: (value) => {
      value.forEach((v) => {
        dataFilter.value[v.name] = toRaw(v);
      });
    }
  });

  const currentFilterNum = computed(() => currentFilter.value.length);

  const isCanAddFilter = computed(() => currentFilter.value.some((v) => v.notSaved));

  const hideAllFilter = () => {
    for (let i = 0; i < currentFilter.value.length; i++) {
      currentFilter.value[i].show = false;
    }
  };

  const handleSelectDataFilter = (value: string) => {
    addDataFilterToComponent(value);
  };

  /**
   * 大屏初始化时建立过滤器快照
   */
  const cloneDataFilterOnInit = () => {
    editor.dataFilter.cloneDataFilterOnInit();
  };

  /**
   * 保存全局过滤器到服务端
   */
  const saveGlobalDataFilter = async () => {
    return await getDataFilterPersistence().updateLargeScreen({
      dataFilterArr: JSON.stringify(dataFilter.value),
      filterType: true,
      id: navInfo.value.id,
      minioIds: "[]"
    });
  };

  /**
   * 保存组件图层（含 childrenIcon 特殊处理）
   */
  const _saveComponentLayer = (component: ComponentType | ChildComponent) => {
    const childrenIcon = ["iconListGroup", "twinIconListGroup", "twinPanelIconListGroup"];
    if (childrenIcon.includes(component.childComponentName)) {
      const threeComponent = globalComponentMap.value.get(`${component.parentId}`) as ComponentType;
      getDataFilterPersistence().saveLayersByType(threeComponent, isPanel(), {
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });
    } else {
      getDataFilterPersistence().saveLayersByType(component as ComponentType, isPanel(), {
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });
    }
  };

  /**
   * 处理当前选中组件的过滤器启用状态
   */
  const handleFilterEnable = async ({
    filter,
    value,
    component
  }: {
    filter: Filter;
    value: boolean;
    component: ComponentType | ChildComponent | undefined;
  }) => {
    const listenArgs = component?.listenArgs.find((v) => v.filterName === filter.name);
    if (!listenArgs) {
      return;
    }

    listenArgs.usageStatus = value;

    const updateComponent = component;
    if (!updateComponent) {
      console.warn("更新组件不存在");
      return;
    }

    await getDataFilterPersistence().saveLayersByType(updateComponent as ComponentType, isPanel(), {
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });

    return await editor.dataFilter.emitFilterTrigger(`${component?.id}`);
  };

  /**
   * 添加组件内部过滤器
   */
  const addDataFilterToComponent = async (name?: string) => {
    if (!name) {
      addNewDataFilterToGlobal();
    } else {
      const target = diffSelectFilter.value.find((v) => v.name === name);
      if (!target) {
        return;
      }

      const isHasBindComponent = target.bindComponent.some((v) => v.id === selectTargetData.value[0].id);
      if (!isHasBindComponent) {
        target.bindComponent.push({
          label: selectTargetData.value[0].name,
          id: selectTargetData.value[0].id
        });
      }
      target.show = true;

      editor.dataFilter.addListenArgs(target, selectTargetData.value[0]);
      editor.dataFilter.addCallbackRelations(name, target.callBack, selectTargetData.value[0]);

      await editor.dataFilter.emitFilterTrigger(`${selectTargetData.value[0].id}`);
      await saveGlobalDataFilter();
      await update();
    }
  };

  /**
   * 执行过滤器保存（内存侧）：同步状态到所有绑定组件
   *
   * 内存变更整段在 core 的 saveFilterWithBindings 里，后端 agent 编辑
   * dataFilterArr/*.json 走的是同一个方法；这里只补 app 侧的副作用：保存图层、触发过滤、API 持久化。
   *
   * @param originalName 编辑前的过滤器名；与 filter.name 不同即为改名，core 会先把旧名的绑定摘干净
   */
  const handleSaveFilter = async (filter: Filter, originalName?: string) => {
    const { filter: saved, boundComponents } = await editor.dataFilter.saveFilterWithBindings(filter, originalName);

    newDataFilter.value = [];

    boundComponents.forEach(_saveComponentLayer);

    for (const component of saved.bindComponent) {
      await editor.dataFilter.emitFilterTrigger(`${component.id}`);
    }

    saveGlobalDataFilter();
    return true;
  };

  const handleSave = async (filter: Filter) => {
    const validationResult = editor.dataFilter.validateFilterName(filter, savedDataFilter.value);
    if (!validationResult.success) {
      return validationResult;
    }
    const saveResult = await handleSaveFilter(filter);
    return saveResult ? { success: true } : { success: false, error: "save_failed" as const };
  };

  /**
   * 从指定组件上删除过滤器
   */
  const deleteFilterFromComponent = async (
    item: Filter,
    component?: ComponentType | ChildComponent
  ): Promise<{ success: boolean; error: "组件不存在" | "保存失败" | undefined; data: any[] | null }> => {
    if (item.id) {
      newDataFilter.value = newDataFilter.value.filter((v) => v.id !== item.id);
      return { success: true, error: undefined, data: [] };
    }

    const targetComponent = component ?? selectTargetData.value[0];
    if (!targetComponent) {
      return { success: false, error: "组件不存在", data: null };
    }

    const result = await editor.dataFilter.deleteFilterFromComponent(item, targetComponent);
    if (!result.success) {
      return { success: false, error: "保存失败", data: null };
    }

    try {
      await saveGlobalDataFilter();
      await getDataFilterPersistence().saveLayersByType(targetComponent as ComponentType, isPanel(), {
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });
      const data = await editor.dataFilter.emitFilterTrigger(`${targetComponent.id}`);
      return { success: true, error: undefined, data };
    } catch (error) {
      console.error(error);
      return { success: false, error: "保存失败", data: null };
    }
  };

  /**
   * 全局删除一个过滤器
   */
  const deleteFilter = async (filterName: string): Promise<{ success: boolean; error?: string }> => {
    const result = await editor.dataFilter.deleteFilter(filterName);
    if (!result.success) {
      return result;
    }
    await saveGlobalDataFilter();
    return { success: true };
  };

  /**
   * 组件删除后更新过滤器
   */
  const updateFilterOnComponentDeleted = async (id: number | string): Promise<BaseEntity<null> | undefined> => {
    const component = allComponentMap.value.get(`${id}`);
    if (!component) {
      return;
    }
    await editor.dataFilter.updateFilterOnComponentDeleted(component);
    return await saveGlobalDataFilter();
  };

  /**
   * 粘贴组件后更新过滤器
   */
  const updateFilterOnComponentPasted = async (id: number | string): Promise<BaseEntity<null> | undefined> => {
    const component = allComponentMap.value.get(`${id}`);
    if (!component) {
      return;
    }
    editor.dataFilter.updateFilterOnComponentPasted(component);
    return await saveGlobalDataFilter();
  };

  const updateCallbackArgumentToFilter = (filter: Filter, callbackArgument: string[]) => {
    editor.dataFilter.updateCallbackArgumentToFilter(filter, callbackArgument);
  };

  /**
   * 检查过滤器是否被修改
   */
  const checkFilterNotSavedOnCallbackChange = (filter: Filter) => {
    editor.dataFilter.checkFilterNotSaved(filter);
  };

  const debouncedCheckFilterNotSaved = debounce((filter: Filter) => {
    checkFilterNotSavedOnCallbackChange(filter);
  }, 1000);

  const onFilterCodeChange = (item: Filter, value: string) => {
    const oldDataFormatter = item.dataFormatter;
    item.dataFormatter = value;

    if (value.replace(/\s+/g, "") !== oldDataFormatter.replace(/\s+/g, "")) {
      item.notSaved = true;
      editor.dataFilter.getDataFilter(); // 触发响应式更新
      // 同步编译缓存（通过 applyFilterSave 内部已处理，此处只需标脏）
    }

    debouncedCheckFilterNotSaved(item);
  };

  /**
   * 还原指定过滤器到上次保存的状态
   */
  const resetFilterToCloneData = (item: Filter) => {
    const clone = editor.dataFilter.getCloneDataFilter();
    if (clone[item.name]) {
      const target = currentFilter.value.find((v) => v.name === item.name);
      if (target) {
        target.dataFormatter = clone[item.name].dataFormatter;
        target.callBack = clone[item.name].callBack;
      }
    }
  };

  const resetDataFilter = () => {
    newDataFilter.value = [];
    editor.dataFilter.reset();
    filterResultCollector.clear();
  };

  /**
   * 通过组件 ID 获取该组件所有过滤器的执行结果
   */
  const getFilterResultsByComponentId = (id: string | number) => {
    return editor.dataFilter.getFilterResultsByComponentId(id);
  };

  /**
   * 获取过滤器在组件中的索引
   */
  const getFilterInComponentIndex = (filter: Filter) => {
    if (!selectTargetData.value[0] || filter.id) {
      return -1;
    }
    return selectTargetData.value[0].listenArgs.findIndex((v: any) => v.filterName === filter.name);
  };

  const shouldShowTest = (filter: Filter, needTest: boolean) => {
    if (!selectTargetData.value[0] || "id" in filter) {
      return false;
    }
    const filterIndex = getFilterInComponentIndex(filter);
    const listenArg = selectTargetData.value[0].listenArgs[filterIndex];
    if (!listenArg) {
      return false;
    }
    return listenArg.usageStatus && needTest;
  };

  const shouldShowCheckbox = (filter: Filter, needCheckBox: boolean) => {
    if (!needCheckBox || !selectTargetData.value[0] || "id" in filter) {
      return false;
    }
    const filterIndex = getFilterInComponentIndex(filter);
    const listenArg = selectTargetData.value[0].listenArgs[filterIndex];
    return !!listenArg;
  };

  // ─── 测试用 wrappers（对应原内部方法，现委托给 manager）────────────────────
  const _addListenArgs = (filter: Filter, component?: ComponentType | ChildComponent) => {
    const target = component ?? selectTargetData.value[0];
    if (!target) {
      return;
    }
    editor.dataFilter.addListenArgs(filter, target);
  };

  const _updateFilterStatus = (filter: Filter) => editor.dataFilter.applyFilterSave(filter);

  const _processCallbackRelations = (name: string, component?: ComponentType | ChildComponent) => {
    const target = component ?? selectTargetData.value[0];
    if (!target) {
      return;
    }
    editor.dataFilter.processCallbackRelations(name, target);
  };

  const _updateComponentListeners = async (name: string, components?: (ComponentType | ChildComponent)[]) => {
    const targetFilter = dataFilter.value[name];
    if (!targetFilter) {
      return;
    }
    const targets = components?.length
      ? components
      : targetFilter.bindComponent
          .map((v) => allComponentMap.value.get(`${v.id}`) as ComponentType | ChildComponent)
          .filter(Boolean);
    for (const component of targets) {
      await editor.dataFilter.emitFilterTrigger(`${component.id}`);
    }
  };

  return {
    dataFilter,
    cloneDataFilter,
    diffSelectFilter,
    currentFilter,
    currentFilterNum,
    isCanAddFilter,
    filterResultCollector,
    newDataFilter,
    filterResultForCurrentComponent,
    filterAllResultForCurrentComponent,

    hideAllFilter,
    handleSelectDataFilter,
    handleClearNotSave,
    addNewDataFilterToGlobal,
    handleSave,
    handleSaveFilter,
    addDataFilterToComponent,
    deleteFilterFromComponent,
    cloneDataFilterOnInit,
    handleFilterEnable,
    updateFilterOnComponentPasted,
    updateFilterOnComponentDeleted,
    updateCallbackArgumentToFilter,
    checkFilterNotSavedOnCallbackChange,
    resetDataFilter,
    onFilterCodeChange,
    resetFilterToCloneData,
    getFilterResult,
    saveGlobalDataFilter,

    getFilterResultsByComponentId,
    getFilterInComponentIndex,
    shouldShowTest,
    shouldShowCheckbox,

    deleteFilter,

    // 用于测试
    _addListenArgs,
    _updateFilterStatus,
    _processCallbackRelations,
    _updateComponentListeners
  };
});
