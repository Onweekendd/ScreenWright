import type { ChildComponent, ComponentType } from "@screenwright/types";
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";

import { useRegisterFilter } from "./useRegisterFilter";

export const useBaseFilter = (component: ComponentType | ChildComponent) => {
  // 使用 useRegisterFilter 来处理回调逻辑
  const componentData = shallowRef<any>([]);
  const { calculateComponentData, registerFilter, unRegisterFilter } = useRegisterFilter(component, (data) => {
    componentData.value = data;
  });

  const autoRefreshInterval = ref<NodeJS.Timeout | null>(null);

  onMounted(() => {
    if (autoRefreshInterval.value) {
      clearInterval(autoRefreshInterval.value);
    }
    // 注册过滤器回调
    registerFilter();

    calculateComponentData();

    if (component.autoRefresh && component.time) {
      autoRefreshInterval.value = setInterval(
        () => {
          calculateComponentData();
        },
        component.time ? component.time * 1000 : 30 * 1000
      );
    }
  });
  watch(
    () => component.data,
    () => {
      calculateComponentData();
    }
  );

  onBeforeUnmount(() => {
    // 清理自动刷新定时器
    if (autoRefreshInterval.value) {
      clearInterval(autoRefreshInterval.value);
    }

    // 注销过滤器回调
    unRegisterFilter();
  });

  return {
    inputData: componentData,
    initData: calculateComponentData
  };
};
