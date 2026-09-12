import { computed, nextTick } from "vue";

import { ElMessage } from "element-plus";

import router from "@/router";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { useCacheTime } from "../../useCacheTime";
import { useInitLargeScreenData } from "../../useInitLargeScreenData";
import type { SystemComponentProps } from "../buildRender/core/SystemComponent/type";
import { useAlignmentWasm } from "../buildRender/hooks/useAlignmentWasm";
import type { useCommonPanelData } from "./useCommonPanelData";

export interface CommonPanelInfoOptions {
  componentMapKey: "allComponentMap" | "encodeComponentMap";
  paramKey: "cid" | "id";
  commonDataHooks: ReturnType<typeof useCommonPanelData>;
}

/**
 * 通用面板业务逻辑管理 hooks
 * 提供面板相关的通用业务逻辑处理
 */
export const useCommonPanelInfo = (options: CommonPanelInfoOptions) => {
  const { componentMapKey, paramKey, commonDataHooks } = options;
  const { isLoad: isDetailLoad, initLargeScreen } = useInitLargeScreenData();
  const { groupData, [componentMapKey]: componentMap } = useGlobalComponentData();
  const { syncComponentData, resetAlignmentLines } = useAlignmentWasm();

  const route = computed(() => router.currentRoute.value);

  const { checkCacheDataIsExpired } = useCacheTime();

  const {
    panelInfo,
    activeStatus,
    panelData,
    setIsLoad,
    updateComponentList,
    initTargetChart,
    popActiveStatusStack,
    setActiveStatusId,
    activeStatusStack,
    addPanelStatus: addPanelStatusData
  } = commonDataHooks;

  // 处理activeStatusId变化的函数 - 仅处理组件列表更新
  const handleActiveStatusChange = () => {
    if (!activeStatus.value) {
      return;
    }

    // 更新组件列表
    updateComponentList(activeStatus.value.config);

    resetAlignmentLines();
    syncComponentData({
      renderHeight: panelInfo.value.config.component.height,
      renderWidth: panelInfo.value.config.component.width
    });

    // 初始化targetChart
    initTargetChart();
  };

  // 初始化当前激活状态ID
  const initializeActiveStatusId = (dynamicPanelId: number) => {
    if (panelData.value.length <= 0) {
      return;
    }

    // 默认使用第一个面板状态
    let targetStatusId = panelData.value[0].id;

    // 尝试从堆栈恢复上一次的状态
    if (activeStatusStack.value.length > 0) {
      const lastStackItem = activeStatusStack.value[activeStatusStack.value.length - 1];
      const canRestore =
        lastStackItem.panelId === dynamicPanelId &&
        panelData.value.some((item) => item.id === lastStackItem.activeStatusId);

      if (canRestore) {
        targetStatusId = lastStackItem.activeStatusId;
        popActiveStatusStack(); // 移除已使用的堆栈项
      }
    }

    setActiveStatusId(targetStatusId);
  };

  const initPanelDataFromRemoteData = async (dynamicPanelId: number) => {
    const checkPanelExist = () => {
      if (!componentMap.value.get(`${dynamicPanelId}`)) {
        ElMessage.error("面板不存在");
        return false;
      }

      return true;
    };

    await initLargeScreen(Number(route.value.params.id));

    if (!checkPanelExist()) {
      return;
    }

    initPanelDataFromLocalData(dynamicPanelId);
  };

  /**
   * @description 从本地数据中初始化面板数据
   * @param dynamicPanelId 动态面板ID
   * @param syncComponentList 是否同步大屏组件列表
   */
  const initPanelDataFromLocalData = async (dynamicPanelId: number, syncComponentList = true) => {
    // 无需重新请求 从groupData中获取到面板
    const panel = componentMap.value.get(`${dynamicPanelId}`) as SystemComponentProps;

    if (!panel) {
      await initPanelDataFromRemoteData(dynamicPanelId);
      return;
    }

    panelInfo.value.config = panel;

    initializeActiveStatusId(dynamicPanelId);

    if (syncComponentList) {
      updateComponentList(activeStatus.value?.config ?? []);
    }

    isDetailLoad.value = true;

    setIsLoad(true);

    return panel;
  };

  // 初始化面板数据
  const initPanelData = async (dynamicPanelId: number) => {
    const isDataCacheInMemory = () => {
      return groupData.value && groupData.value.length > 0 && componentMap.value;
    };

    if (isDataCacheInMemory() && !(await checkCacheDataIsExpired())) {
      initPanelDataFromLocalData(dynamicPanelId);
    } else {
      await initPanelDataFromRemoteData(dynamicPanelId);
    }
  };

  // 初始化方法
  const initialize = async () => {
    await nextTick();
    await initPanelData(Number(route.value.params[paramKey]));
  };

  // 使用数据管理 hooks 中的 addPanelStatus
  const addPanelStatus = () => {
    return addPanelStatusData();
  };

  return {
    ...commonDataHooks,
    initialize,
    initPanelData,
    handleActiveStatusChange,
    initPanelDataFromLocalData,
    initializeActiveStatusId,
    addPanelStatus
  };
};
