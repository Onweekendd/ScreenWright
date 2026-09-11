import { computed } from "vue";

import { useScreenEditor } from "@/core-adapter/useScreenEditor";
import { useDialog } from "@/hooks/useDialog";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import { useHistoryData } from "@/views/build/command/useHistoryData";
import { useCustomAnimation } from "@/views/build/components/buildConfig/attrsRender/components/customAnimation/useCustomAnimation";
import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { useDataFilter } from "@/views/build/useDataFilter";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import { usePanelInfo } from "../../panelEditor/usePanelInfo";
import { useEditStore } from "./useEditStore";

export interface UseActionProps {
  isDynamicPanel: boolean;
}

export const useActionContext = (props: UseActionProps) => {
  const editor = useScreenEditor();
  const {
    componentList,
    currentCanvasPlacement,
    targetChart,
    editConfig,
    selectTargetData,
    setTargetSelectChart,
    isEncodePanel
  } = useEditStore();
  const { onComponentDeleteGlobal: onCustomAnimationComponentDelete } = useCustomAnimation();
  const { onDeleteComponentFromAllAnimations, deleteAnimationOnPanelDelete } = useStatusAnimation();
  const { navInfo } = useLargeScreenInfo();
  const { dialog } = useDialog();
  const { loading: addLoading } = useGlobalLoading();
  const { panelInfo } = usePanelInfo();
  const { encodeComponentMap, allComponentMap } = useGlobalComponentData();
  const cIsDynamicPanel = computed(() => props.isDynamicPanel);
  const { updateFilterOnComponentDeleted } = useDataFilter();
  const { clearHistory, shouldClearHistory, updateCacheComponent } = useHistoryData();

  return {
    addLoading,
    allComponentMap,
    cIsDynamicPanel,
    clearHistory,
    componentList,
    currentCanvasPlacement,
    deleteAnimationOnPanelDelete,
    dialog,
    editConfig,
    editor,
    encodeComponentMap,
    isEncodePanel,
    navInfo,
    onCustomAnimationComponentDelete,
    onDeleteComponentFromAllAnimations,
    panelInfo,
    selectTargetData,
    setTargetSelectChart,
    shouldClearHistory,
    targetChart,
    updateCacheComponent,
    updateFilterOnComponentDeleted
  };
};

export type ActionContext = ReturnType<typeof useActionContext>;
