import { computed, watch } from "vue";

import { usePanelData } from "@/views/build/components/panelEditor/usePanelData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import { useStatusAnimationData } from "../../useStatusAnimationData";

/**
 * 状态动画基础状态管理
 * @description 提供基础的状态管理和数据访问功能
 */
export function useStatusAnimationState() {
  const {
    animations,
    statusAnimations,
    componentAnimations,
    selectAnimationId,
    selectStatusId,
    getCurrentStatusList,
    updateAnimationState,
    setSelectStatusId,
    resetTargetComponentConfig,
    componentDefaultConfigMap,
    editorVisible,
    resetStatusAnimationOnPanelChange,
    snapshotComponentConfig,
    getCurrentAnimationList,
    setSelectAnimationId,
    ...dataHooks
  } = useStatusAnimationData();

  const { allComponentMap } = useGlobalComponentData();
  const { navInfo } = useLargeScreenInfo();
  const { activeStatusId, panelInfo } = usePanelData();

  const screenId = computed(() => navInfo.value.id);

  // 监听面板状态变化，自动选择动画和状态
  watch(
    () => activeStatusId.value,
    (newVal) => {
      if (!editorVisible.value || !newVal) {
        return;
      }

      resetStatusAnimationOnPanelChange();

      const currentAnimationList = getCurrentAnimationList(panelInfo.value.config.id, newVal);

      if (currentAnimationList.length > 0) {
        setSelectAnimationId(currentAnimationList[0].id);
        const currentStatusList = getCurrentStatusList.value;

        if (currentStatusList.length > 0) {
          setSelectStatusId(currentStatusList[0].statusId);
        }
      }
    }
  );

  return {
    // 基础数据
    animations,
    statusAnimations,
    componentAnimations,
    selectAnimationId,
    selectStatusId,
    getCurrentStatusList,
    componentDefaultConfigMap,
    editorVisible,
    allComponentMap,
    navInfo,
    screenId,
    panelInfo,
    activeStatusId,

    // 基础操作
    updateAnimationState,
    setSelectStatusId,
    resetTargetComponentConfig,
    resetStatusAnimationOnPanelChange,
    snapshotComponentConfig,
    getCurrentAnimationList,
    setSelectAnimationId,

    // 其他数据hooks
    ...dataHooks
  };
}

export type UseStatusAnimationStateReturn = ReturnType<typeof useStatusAnimationState>;
