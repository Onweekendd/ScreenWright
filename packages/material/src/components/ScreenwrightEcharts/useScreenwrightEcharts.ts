import { useBaseFilter } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import { DataType } from "@screenwright/types";
import { ref, shallowRef, watch } from "vue";

import { BaseComponent } from "./core";
import type { BaseChartProps } from "./core/type";

const createRenderElement = (
  element: BaseChartProps,
  data: unknown,
): BaseChartProps => ({
  ...element,
  // useBaseFilter 已完成取数、映射和过滤，渲染层只消费结果，不能再次请求或过滤。
  autoRefresh: false,
  data,
  dataType: DataType.STATIC,
  dataRemark: [],
  openFilter: false,
});

export const useScreenwrightEcharts = (element: ComponentType) => {
  const chartElement = element as BaseChartProps;
  const { inputData } = useBaseFilter(chartElement);
  const isBuild = {
    get value() {
      return window.location.href.includes("/build");
    },
  };

  const renderElement = shallowRef(
    createRenderElement(chartElement, inputData.value),
  );

  // init 为 async：渲染层数据已被 useBaseFilter 过滤为静态数据，filterData 不会发起请求，
  // 多数图表的 await 等同同步；词云(loadImage)/3D 饼图(getChartData) 存在真实异步。
  // 仅监听数据和图表配置，避免画布选中态变化导致图表重新初始化。
  const options = ref<Record<string, any>>({});
  watch(
    [inputData, () => chartElement.option],
    async ([data], _, onCleanup) => {
      let isExpired = false;
      onCleanup(() => {
        isExpired = true;
      });

      const nextRenderElement = createRenderElement(chartElement, data);
      const instance = new BaseComponent();
      await instance.init({
        baseChartProps: nextRenderElement,
      });

      if (isExpired) {
        return;
      }

      renderElement.value = nextRenderElement;
      options.value = instance.getOptions() ?? {};
    },
    { deep: isBuild.value ? true : false, immediate: true },
  );

  return {
    options,
    element: renderElement,
  };
};
