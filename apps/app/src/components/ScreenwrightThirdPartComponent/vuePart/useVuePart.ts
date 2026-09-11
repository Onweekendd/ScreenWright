import { computed } from "vue";

import { useBaseData } from "@/hooks/useBaseData";
import { setPx } from "@/utils/utils";
import type { ComponentType } from "@/views/build/components/buildRender/type";

export const useVuePart = (options: ComponentType) => {
  const {
    minWidth,
    width,
    height,
    option,
    styleSizeName,
    componentClasses,
    isBuild,
    events,
    dataChart,
    handleEventAndCallbackEvent,
    handleEncode
  } = useBaseData(options);
  const styleChartName = computed(() => {
    const obj = {
      width: setPx(`${minWidth.value || width.value}`),
      height: setPx(`${height.value}`)
    };
    return obj;
  });

  return {
    styleSizeName,
    componentClasses,
    isBuild,
    events,
    option,
    dataChart,
    styleChartName,
    handleEventAndCallbackEvent,
    handleEncode
  };
};
