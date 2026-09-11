import { computed } from "vue";
import { createGlobalState } from "@vueuse/core";

import type { LayerInfo } from "@/model/Layer";
import type { DynamicPanelProps } from "@/views/build/components/buildRender/core/SystemComponent/panel/DynamicPanel";

import { useCommonPanelData } from "../common/useCommonPanelData";

export type PanelInfo = Omit<LayerInfo, "config"> & { config: DynamicPanelProps };

/**
 * 面板数据管理 hooks
 * 专门负责面板数据的状态管理，不包含业务逻辑
 */
export const usePanelData = createGlobalState(() => {
  // 使用通用数据管理 hooks
  const commonDataHooks = useCommonPanelData<DynamicPanelProps>();

  /**
   * 是否是场景弹窗面板
   */
  const isScenePopupPanel = computed(() => {
    return (commonDataHooks.panelInfo.value.config as DynamicPanelProps).isPopupInScene ?? false;
  });

  return {
    // 从通用数据管理 hooks 导出的所有功能
    ...commonDataHooks,
    // 动态面板特有的计算属性
    isScenePopupPanel
  };
});
