import { updateLargeScreen } from "@/api/library";

import { useGlobalComponentData } from "./useGlobalComponentData";
import { useLargeScreenInfo } from "./useLargeScreenInfo";

/**
 * 数据过滤器绑定修复 hooks
 * 用于修复旧版本中组件与数据过滤器绑定关系的问题
 */
export const useDataFilterBindingsFix = () => {
  const { navInfo } = useLargeScreenInfo();
  const { allComponentMap } = useGlobalComponentData();

  /**
   * 同步组件绑定关系
   * 确保所有监听了数据过滤器的组件都在对应过滤器的 bindComponent 列表中
   * @param dataFilter - 数据过滤器对象
   */
  const syncComponentBindings = (dataFilter: typeof navInfo.value.dataFilterArr) => {
    Array.from(allComponentMap.value.values()).forEach((component) => {
      if (!component.listenArgs || component.listenArgs.length === 0) {
        return;
      }

      component.listenArgs.forEach((listenArg) => {
        const filter = dataFilter[listenArg.filterName];
        if (!filter.bindComponent.some((bindComponent) => bindComponent.id === component.id)) {
          filter.bindComponent.push({
            id: component.id,
            label: component.name
          });
        }
      });
    });
  };

  /**
   * 清理无效的绑定关系
   * 移除数据过滤器中已删除组件的绑定记录
   * @param dataFilter - 数据过滤器对象
   */
  const cleanupInvalidBindings = (dataFilter: typeof navInfo.value.dataFilterArr) => {
    Object.values(dataFilter).forEach((filter) => {
      for (let i = filter.bindComponent.length - 1; i >= 0; i--) {
        const bindComponent = filter.bindComponent[i];
        if (!allComponentMap.value.has(`${bindComponent.id}`)) {
          filter.bindComponent.splice(i, 1);
        }
      }
    });
  };

  /**
   * 更新数据过滤器绑定关系
   * 同步和清理绑定关系后，将更新提交到服务器
   * @returns 更新结果的 Promise
   * @throws 当更新失败时抛出错误
   */
  const updateDataFilterBindings = async () => {
    try {
      const dataFilter = navInfo.value.dataFilterArr;

      syncComponentBindings(dataFilter);
      cleanupInvalidBindings(dataFilter);

      return await updateLargeScreen({
        dataFilterArr: JSON.stringify(dataFilter),
        filterType: true,
        id: navInfo.value.id,
        minioIds: "[]"
      });
    } catch (error) {
      console.error("Failed to update data filter bindings:", error);
      throw error;
    }
  };

  return {
    syncComponentBindings,
    cleanupInvalidBindings,
    updateDataFilterBindings
  };
};
