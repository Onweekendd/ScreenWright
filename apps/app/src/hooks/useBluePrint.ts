import { ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import type { ComponentType } from "@/views/build/components/buildRender/type";

/**
 * 蓝图（funBlueprint）已移除 —— 这是Screenwright自研的可视化事件编排外部应用，
 * 开源版不含。保留同名空实现以兼容仍引用它的调用点（QuotePanel / view /
 * usePorts / 模板 deliver-export / 场景组件），所有方法为 no-op。
 */
export const useBluePrint = createGlobalState(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blueprintEventChains = ref<Record<string, any>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventListMap = ref<Record<string, any[]>>({});

  const getBlueprintEventChains = async (_largeId?: number) => {};
  const initBluePrint = async (_id?: string) => {};
  const tranFormBluePrint = async (_component: ComponentType[], _id: number) => {};

  return {
    blueprintEventChains,
    eventListMap,
    getBlueprintEventChains,
    tranFormBluePrint,
    initBluePrint
  };
});
