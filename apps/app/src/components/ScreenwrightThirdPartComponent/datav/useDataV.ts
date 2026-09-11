import { computed, nextTick, ref } from "vue";

import { useBaseData } from "@/hooks/useBaseData";
import { getFunction, setPx } from "@/utils/utils";
import type { ComponentType } from "@/views/build/components/buildRender/type";

export const useDataV = (options: ComponentType) => {
  const isLoad = ref<boolean>(false);
  const config = ref<any>(null);
  const { minWidth, dataChart, width, height, option, id, styleSizeName } = useBaseData(options);

  const styleChartName = computed(() => {
    const obj = {
      width: setPx(`${minWidth.value || width.value}`),
      height: setPx(`${height.value}`)
    };
    return obj;
  });

  const updateChart = async () => {
    const echartFormatter = getFunction(option.value.echartFormatter, true);
    config.value = echartFormatter(dataChart.value);
    isLoad.value = false;
    await nextTick();
    isLoad.value = true;
  };

  return { isLoad, dataChart, styleChartName, option, id, styleSizeName, config, updateChart };
};
