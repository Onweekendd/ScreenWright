import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import type { CSSProperties } from "vue";
import { computed } from "vue";

/**
 * 矩形 (swBox)：纯 CSS 盒子，样式直接从 option 展开。
 * 默认值全部为空，即一个透明的盒子（方案文档 §4.3）。
 */
export const buildSwBoxStyle = (option: Record<string, any> | null | undefined): CSSProperties => {
  const o = option ?? {};
  const style: CSSProperties = {
    pointerEvents: o.pointerEvents ? "auto" : "none"
  };
  if (o.background !== undefined) style.background = o.background;
  if (o.border !== undefined) style.border = o.border;
  if (o.borderRadius !== undefined) style.borderRadius = typeof o.borderRadius === "number" ? `${o.borderRadius}px` : o.borderRadius;
  if (o.boxShadow !== undefined) style.boxShadow = o.boxShadow;
  if (o.backdropFilter !== undefined) style.backdropFilter = o.backdropFilter;
  if (o.opacity !== undefined) style.opacity = o.opacity;
  if (o.clipPath !== undefined) style.clipPath = o.clipPath;
  if (o.transform !== undefined) style.transform = o.transform;
  if (o.animation !== undefined) style.animation = o.animation;
  return style;
};

export const useSwBox = (element: ComponentType) => {
  const { option } = useBaseData(element);
  const boxStyle = computed<CSSProperties>(() => buildSwBoxStyle(option.value));

  return { boxStyle };
};
