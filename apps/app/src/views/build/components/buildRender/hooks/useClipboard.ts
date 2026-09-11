import { onBeforeMount, ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import { ElMessage } from "element-plus";
import { cloneDeep } from "lodash-es";

import { copyLayers } from "@/api/library";
import { useScreenEditor } from "@/core-adapter/useScreenEditor";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import { useUpdateInstance } from "@/views/build/components/buildConfig/useUpdateInstance";
import { useDataFilter } from "@/views/build/useDataFilter";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { usePanelData } from "../../panelEditor/usePanelData";
import type { ComponentType } from "../type";
import { getMaxIndex } from "../utils";
import { validateComponentForPaste } from "../utils";
import { UpdateHistoryTypeEnum, useAction } from "./useAction";
import { useEditStore } from "./useEditStore";

// import { sceneEnumType } from "../core/SceneComponent/type"

const useClipboard = createGlobalState(() => {
  const editor = useScreenEditor();
  const { componentList, currentCanvasPlacement, targetChart, selectTargetData, isPanel, isEncodePanel } =
    useEditStore();
  const { panelInfo } = usePanelData();
  const { update } = useUpdateInstance();
  const { updateComponentLayers } = useAction({ isDynamicPanel: isPanel() });
  const { encodeComponentMap, allComponentMap } = useGlobalComponentData();
  const recordChart = ref<ComponentType[] | undefined>(undefined); // 记录临时数据（复制等）
  const recordStyle = ref<Record<string, any>>({}); // 记录当前样式配置
  const { loading } = useGlobalLoading();
  const { updateFilterOnComponentPasted } = useDataFilter();
  const { updateCallbackRelation } = useCallbackArguments();
  /**
   * 重置组件位置
   * @param pastedComponent 粘贴的组件
   */
  const resetComponentPosition = (pastedComponent: ComponentType) => {
    if (pastedComponent.children?.length) {
      pastedComponent.children.forEach((item) => {
        item.top -= pastedComponent.top;
        item.left -= pastedComponent.left;
      });
    }
    pastedComponent.top = 0;
    pastedComponent.left = 0;
  };

  /**
   * 添加粘贴的组件到画布
   * @param pastedComponent 粘贴的组件
   */
  const addPastedComponent = async (pastedComponent: ComponentType) => {
    pastedComponent.zIndex = getMaxIndex(componentList.value) + 1;
    if (pastedComponent.parent) {
      delete pastedComponent.parent;
    }

    editor.component.upsert(pastedComponent, currentCanvasPlacement());

    await updateComponentLayers(pastedComponent, {
      updateHistoryType: UpdateHistoryTypeEnum.ADD,
      fullUpdateGroup: false
    });

    updateFilterOnComponentPasted(pastedComponent.id);
    updateCallbackRelation(pastedComponent);
  };

  /**
   * 复制组件
   */
  const handleCopyComponent = () => {
    if (targetChart.value.selectId.length < 1) {
      // ElMessage.warning("请至少选择一个组件")
      return;
    }
    recordChart.value = selectTargetData.value;
    // ElMessage.success("复制成功")
  };

  /**
   * 粘贴组件
   */
  const handlePasteComponent = async () => {
    if (!recordChart.value || recordChart.value.length === 0) {
      ElMessage.warning("剪贴板为空，粘贴失效!");
      return;
    }

    loading.value = true;

    for (let i = 0; i < recordChart.value.length; i++) {
      const id = recordChart.value[i].id;

      // 组件校验，包括粘贴权限校验
      const result = await validateComponentForPaste({
        componentList: componentList.value,
        newComponent: recordChart.value[i],
        encodeComponentMap: encodeComponentMap.value,
        isEncodePanel: isEncodePanel(),
        isDynamicPanel: isPanel(),
        onError: (message: string) => {
          ElMessage.warning(message);
        }
      });

      if (!result) {
        continue;
      }
      let res = null;

      res = await copyLayers(id, true, isPanel());
      if (!res) {
        continue;
      }

      if (res.success) {
        const pastedComponent = JSON.parse(res.result.config) as ComponentType;
        const copiedComponent = allComponentMap.value.get(`${id}`);

        if (!copiedComponent) {
          console.error("复制组件失败，组件不存在");
          continue;
        }

        const currentRecord = recordChart.value[i];
        const isScreenToScreen = copiedComponent.parentDynamicPanelId.length === 0 && !isPanel();

        const parentIdIndex = currentRecord.parentDynamicPanelId ? currentRecord.parentDynamicPanelId.length - 1 : 0;
        const isPanelToSamePanel =
          copiedComponent.parentDynamicPanelId?.length > 0 &&
          isPanel() &&
          panelInfo.value.config.id === copiedComponent.parentDynamicPanelId?.[parentIdIndex];

        // 不需要修改的情况
        if (!(isScreenToScreen || isPanelToSamePanel)) {
          resetComponentPosition(pastedComponent);
        }

        await addPastedComponent(pastedComponent);
      } else {
        ElMessage.error(res.message || "复制失败");
      }
    }
    loading.value = false;
  };

  // 清空剪切板
  const clearRecordChart = () => {
    recordChart.value = undefined;
    ElMessage.success("清空剪切板成功");
  };

  // 复制样式
  const handleCopyStyle = () => {
    if (selectTargetData.value.length === 0) {
      return;
    }
    const isOverMultiple = selectTargetData.value.length > 1;
    if (isOverMultiple) {
      ElMessage.warning("同步样式只能单选！");
      return;
    }
    const target = selectTargetData.value[0];
    if (target) {
      recordStyle.value = cloneDeep(target);
    }
  };
  // 粘贴样式
  const handlePasteStyle = () => {
    if (Object.keys(recordStyle.value).length === 0) {
      ElMessage.warning("请先复制样式！");
      return;
    }
    if (selectTargetData.value.length === 0) {
      return;
    }
    const option = recordStyle.value.option;
    const currentComponent = selectTargetData.value[0].component.prop;
    const isSameComponent = recordStyle.value.component.prop === currentComponent;
    if (!isSameComponent) {
      ElMessage.error("请相同类型的图层！");
      return;
    }
    selectTargetData.value[0].option = {
      ...selectTargetData.value[0].option,
      ...option
    };
    update();
  };

  onBeforeMount(() => {
    recordChart.value = undefined;
    loading.value = false;
    recordStyle.value = {};
  });

  return {
    recordChart,
    recordStyle,
    handleCopyComponent,
    handlePasteComponent,
    clearRecordChart,
    handleCopyStyle,
    handlePasteStyle
  };
});

export { useClipboard };
