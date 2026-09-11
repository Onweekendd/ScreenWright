import type { ComponentType } from "@screenwright/types";
import { computed } from "vue";

/**
 * 毛玻璃样式 hook：根据 element.option 的 backdropFilter 配置生成 backdrop-filter 样式
 * 纯 computed，已从主包下沉到 @screenwright/composables 共享
 */
export const useFrostedStyle = (element: ComponentType) => {
  const getFrostedStyle = computed(() => {
    const backdropFilter = element.option.backdropFilter;
    const backdropFilterBlur = element.option.backdropFilterBlur;
    const backdropFilterSaturate = element.option.backdropFilterSaturate;
    return backdropFilter
      ? { "backdrop-filter": `blur(${backdropFilterBlur || 0}px) saturate(${backdropFilterSaturate || 100}%)` }
      : {};
  });
  return {
    getFrostedStyle
  };
};
