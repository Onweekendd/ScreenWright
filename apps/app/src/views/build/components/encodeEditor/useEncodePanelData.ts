import { computed, ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import { PanelType } from "@/views/build/components/buildRender/core/SystemComponent/type";

import { useCommonPanelData } from "../common/useCommonPanelData";

/**
 * 编码面板数据管理 hooks
 * 专门负责编码面板数据的状态管理，不包含业务逻辑
 */
export const useEncodePanelData = createGlobalState(() => {
  // 使用通用数据管理 hooks
  const commonDataHooks = useCommonPanelData();

  /**
   * 终端面板id
   */
  const encodePanelId = ref<number>(0);

  /**
   * 是否是动态面板编辑器
   */
  const isDynamicPanelEditor = computed(() => {
    return commonDataHooks.panelInfo.value.config.component?.prop === PanelType.dynamicPanel;
  });

  return {
    ...commonDataHooks,
    encodePanelId,
    isDynamicPanelEditor
  };
});
