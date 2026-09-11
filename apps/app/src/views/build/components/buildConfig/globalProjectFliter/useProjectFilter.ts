import { computed, ref, toRaw } from "vue";

import { has, isNil } from "lodash-es";

import { updateLargeScreen } from "@/api/library";
import type { Filter } from "@/views/build/components/buildRender/type";
import { useDataFilter } from "@/views/build/useDataFilter";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import type { ComponentType } from "../../buildRender/type";

export const useProjectFilter = () => {
  const { dataFilter, cloneDataFilterOnInit, deleteFilterFromComponent, handleSave, resetFilterToCloneData } =
    useDataFilter();
  const { navInfo } = useLargeScreenInfo();
  const { allComponentMap } = useGlobalComponentData();

  interface Params {
    search: string;
    pageSize: number;
    pageNumber: number;
    total: number;
  }

  const params = ref<Params>({
    search: "",
    pageSize: 10,
    pageNumber: 1,
    total: 0
  });

  const resetParams = () => {
    params.value = {
      search: "",
      pageSize: 10,
      pageNumber: 1,
      total: 0
    };
  };

  // 使用computed来动态计算过滤后的数据列表

  // 过滤后的数据列表
  const filterDataList = computed<Filter[]>({
    get() {
      // 将dataFilter对象转为数组
      const dataList = Object.values(dataFilter.value);
      let result: Filter[] = [];

      if (params.value.search.length > 0) {
        // 有搜索关键字时，过滤
        result = dataList.filter((it) => it.name.includes(params.value.search));
        params.value.total = result.length;
        return result;
      } else {
        // 无搜索关键字时，分页
        const start = (params.value.pageNumber - 1) * params.value.pageSize;
        const end = start + params.value.pageSize;
        params.value.total = dataList.length;
        return dataList.slice(start, end);
      }
    },
    set(_value) {
      // 将数组转换为对象并更新dataFilter
      const newDataFilter: Record<string, Filter> = {};
      _value.forEach((item: Filter) => {
        newDataFilter[item.name] = toRaw(item);
      });
      Object.assign(dataFilter.value, newDataFilter);
    }
  });

  const deleteDataFilter = async (dataFilterArr: string) => {
    await updateLargeScreen({
      dataFilterArr,
      filterType: false,
      id: navInfo.value.id
    });
  };

  // 获取绑定组件的过滤器组件
  const getBindFilterComponents = (filter: Filter) => {
    return filter.bindComponent
      .map((bindComponent) => allComponentMap.value.get(`${bindComponent.id}`))
      .filter((v) => !isNil(v));
  };

  // 从组件中删除过滤器
  const removeFilterFromComponents = async (filter: Filter, components: ComponentType[]) => {
    for (const component of components) {
      if (component.listenArgs.some((v) => v.filterName === filter.name)) {
        await deleteFilterFromComponent(filter, component);
      }
    }
  };

  // 从数据过滤器中删除指定名称的过滤器
  const removeFilterFromDataFilter = (name: string) => {
    const filter = dataFilter.value[name];
    delete dataFilter.value[name];
    dataFilter.value = { ...dataFilter.value };
    return filter;
  };

  // 创建删除对象
  const createDeleteObject = (name: string, filter: Filter) => {
    const deleteObj: Record<string, Filter> = {};
    deleteObj[name] = filter;
    return deleteObj;
  };

  const handleDelete = async (name: string) => {
    if (!has(dataFilter.value, name)) {
      return;
    }

    const filter = dataFilter.value[name];

    // 获取绑定的组件
    const bindComponents = getBindFilterComponents(filter);

    // 从组件中删除过滤器
    await removeFilterFromComponents(filter, bindComponents as any);

    // 从数据过滤器中删除
    const removedFilter = removeFilterFromDataFilter(name);

    // 创建删除对象并更新
    const deleteObj = createDeleteObject(name, removedFilter);
    await deleteDataFilter(JSON.stringify(deleteObj));
  };

  return {
    params,
    dataFilter,
    cloneDataFilterOnInit,
    filterDataList,
    handleSave,
    resetParams,
    handleDelete,
    resetFilterToCloneData,
    // 暴露拆分出来的函数供测试使用
    getBindFilterComponents,
    removeFilterFromComponents,
    removeFilterFromDataFilter,
    createDeleteObject
  };
};
