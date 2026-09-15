import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import type { CSSProperties } from "vue";
import { computed } from "vue";

export const useDataContainer = (options: ComponentType | any) => {
  const {
    isBuild,
    componentClasses,
    dataChart,
    styleSizeName,
    option,
    handleEventAndCallbackEvent,
  } = useBaseData(options);

  const styleFont = computed<CSSProperties>(() => {
    return {
      color: option.value.color,
      fontSize: `${option.value.fontSize || 0}px`,
      fontFamily: option.value.fontFamily,
      backgroundColor: option.value.backgroundColor,
      fontWeight: option.value.fontWeight,
      fontStyle: option.value.fontStyle,
    };
  });

  return {
    isBuild,
    componentClasses,
    styleFont,
    option,
    dataChart,
    styleSizeName,
    handleEventAndCallbackEvent,
  };
};
