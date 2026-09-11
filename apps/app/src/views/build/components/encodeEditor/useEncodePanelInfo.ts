import { computed } from "vue";
import { createGlobalState } from "@vueuse/core";

import router from "@/router";
import { PanelType } from "@/views/build/components/buildRender/core/SystemComponent/type";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { useAlignmentWasm } from "../buildRender/hooks/useAlignmentWasm";
import type { ComponentType } from "../buildRender/type";
import type { PanelInitConfig } from "../common/useCommonPanelInfo";
import { useCommonPanelInfo } from "../common/useCommonPanelInfo";
import { useEncodePanelData } from "./useEncodePanelData";

const route = computed(() => router.currentRoute.value);

export const useEncodePanelInfo = createGlobalState(() => {
  const { encodeComponentMap } = useGlobalComponentData();
  const { syncComponentData, resetAlignmentLines } = useAlignmentWasm();

  // 使用数据管理 hooks
  const { encodePanelId, isDynamicPanelEditor, ...dataHooks } = useEncodePanelData();

  // 使用通用业务逻辑 hooks，配置为编码面板模式
  const commonInfoHooks = useCommonPanelInfo({
    componentMapKey: "encodeComponentMap",
    paramKey: "cid",
    commonDataHooks: dataHooks
  });

  // 编码面板特有的 handleActiveStatusChange 实现
  const handleActiveStatusChange = () => {
    const activePanel = commonInfoHooks.panelData.value.find(
      (item) => item.id === commonInfoHooks.activeStatusId.value
    );
    if (!activePanel) {
      return;
    }
    // 更新组件列表
    commonInfoHooks.updateComponentList(activePanel.config);

    resetAlignmentLines();
    syncComponentData({
      renderHeight: commonInfoHooks.panelInfo.value.config.component.height,
      renderWidth: commonInfoHooks.panelInfo.value.config.component.width
    });

    // 初始化targetChart
    commonInfoHooks.initTargetChart();
  };

  /**
   * 查找编码面板ID
   * @param dynamicPanelId 动态面板ID
   * @param encodeComponentMap 编码组件映射
   * @param defaultPanelId 默认面板ID
   * @returns 找到的编码面板ID
   */
  const findEncodePanelId = (
    dynamicPanelId: number,
    encodeComponentMap: Map<string, ComponentType>,
    defaultPanelId: number
  ): number => {
    const panel = encodeComponentMap.get(`${dynamicPanelId}`);
    const parentDynamicPanelId = (panel?.parentDynamicPanelId as number[]) || [];

    if (!parentDynamicPanelId || parentDynamicPanelId.length === 0) {
      return defaultPanelId;
    }

    for (const id of parentDynamicPanelId) {
      const parentPanel = encodeComponentMap.get(`${id}`);
      if (!parentPanel) {
        continue;
      }
      if (parentPanel.component.prop === PanelType.encodePanel) {
        return id;
      }
    }

    return defaultPanelId;
  };

  // 编码面板特有的初始化逻辑
  const initPanelDataWithEncodeLogic = async (dynamicPanelId: number, config?: PanelInitConfig) => {
    await commonInfoHooks.initPanelData(dynamicPanelId, config);

    if (commonInfoHooks.activeStatus.value?.config) {
      commonInfoHooks.updateComponentList(commonInfoHooks.activeStatus.value.config);
    }

    // 使用提炼出的函数查找编码面板ID
    encodePanelId.value = findEncodePanelId(
      dynamicPanelId,
      encodeComponentMap.value,
      commonInfoHooks.panelInfo.value.config.id
    );
  };

  // 编码面板特有的初始化逻辑
  const initEncodePanelDataWithLocalData = async (dynamicPanelId: number) => {
    await commonInfoHooks.initPanelDataFromLocalData(dynamicPanelId);

    if (commonInfoHooks.activeStatus.value?.config) {
      commonInfoHooks.updateComponentList(commonInfoHooks.activeStatus.value.config);
    }

    // 使用提炼出的函数查找编码面板ID
    encodePanelId.value = findEncodePanelId(
      dynamicPanelId,
      encodeComponentMap.value,
      commonInfoHooks.panelInfo.value.config.id
    );
  };

  // 编码面板特有的初始化方法
  const initialize = async (config?: PanelInitConfig) => {
    await initPanelDataWithEncodeLogic(Number(route.value.params.cid), config);
  };

  return {
    // 从数据层导出的状态和方法
    ...dataHooks,
    // 从通用业务层导出的方法（但使用编码面板特有的实现）
    ...commonInfoHooks,
    // 编码面板特有的状态和方法
    isDynamicPanelEditor,
    encodePanelId,
    // 重写的方法
    handleActiveStatusChange,
    initialize,
    initPanelData: initPanelDataWithEncodeLogic,
    initEncodePanelDataWithLocalData,
    // 编码面板特有的工具方法
    findEncodePanelId
  };
});
