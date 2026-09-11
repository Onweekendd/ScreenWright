import { computed, ref } from "vue";
import { useToggle } from "@vueuse/core";

import { cloneDeep } from "lodash-es";

import type { LayerInfo } from "@/model/Layer";
import type { PanelState } from "@/views/build/components/buildRender/core/SystemComponent/type";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";

import { AdaptationType } from "../buildConfig/graphConfig/options";
import type { DynamicPanelProps } from "../buildRender/core/SystemComponent/panel/DynamicPanel";
import type { EncodePanelProps } from "../buildRender/core/SystemComponent/panel/EncodePanel";
import { createLocalPanelStatus } from "../buildRender/hooks/useCommonPanelAction";
import type { ComponentType } from "../buildRender/type";

export type PanelInfo = Omit<LayerInfo, "config"> & { config: DynamicPanelProps | EncodePanelProps };

const defaultLayerInfo: PanelInfo = {
  config: {} as DynamicPanelProps | EncodePanelProps,
  name: "",
  detail: "",
  backgroundUrl: "",
  id: 0,
  invitationCode: "",
  status: false,
  type: 0,
  versionCode: "",
  aniFrameSet: "",
  versionDesc: null
};

/**
 * 通用面板数据管理 hooks
 * 提供面板数据的基础状态管理功能
 */
export const useCommonPanelData = <T = DynamicPanelProps | EncodePanelProps>() => {
  const { editConfig, componentList, targetChart } = useEditStore();

  /**
   * 面板信息
   */
  const panelInfo = ref<PanelInfo>(cloneDeep(defaultLayerInfo));

  /**
   * 是否完成加载
   */
  const isLoad = ref(false);

  /**
   * 当前激活状态ID
   */
  const activeStatusId = ref<string>("");

  /**
   * 激活状态堆栈
   */
  const activeStatusStack = ref<
    Array<{
      panelId: number;
      activeStatusId: string;
    }>
  >([]);

  /**
   * 状态菜单显示控制
   */
  const [statusMenuShow, setStatusMenuShow] = useToggle();

  /**
   * 面板数据计算属性
   */
  const panelData = computed(() => {
    return panelInfo.value.config.panelData ?? [];
  });

  /**
   * 当前激活状态计算属性
   */
  const activeStatus = computed(() => {
    return panelData.value.find((item) => item.id === activeStatusId.value);
  });

  /**
   * 面板配置计算属性
   */
  const panelConfig = computed(() => ({
    ...editConfig.value,
    scale: editConfig.value.scale,
    width: String(panelInfo.value.config?.component?.width || 0),
    height: String(panelInfo.value.config?.component?.height || 0),
    showBackgroundImage: activeStatus.value?.showBackgroundImage ? true : false,
    backgroundColor: activeStatus.value?.backgroundColor ?? editConfig.value.backgroundColor ?? "",
    backgroundImage: activeStatus.value?.backgroundImage ?? editConfig.value.backgroundImage ?? "",
    adaptationType: AdaptationType.scale
  }));

  /**
   * 设置面板信息
   */
  const setPanelInfo = (newPanelInfo: PanelInfo) => {
    panelInfo.value = newPanelInfo;
  };

  /**
   * 更新面板配置
   */
  const updatePanelConfig = (config: Partial<T>) => {
    panelInfo.value.config = { ...panelInfo.value.config, ...config };
  };

  /**
   * 设置激活状态ID
   */
  const setActiveStatusId = (statusId: string) => {
    activeStatusId.value = statusId;
  };

  /**
   * 设置加载状态
   */
  const setIsLoad = (loadStatus: boolean) => {
    isLoad.value = loadStatus;
  };

  /**
   * 添加面板状态
   */
  const addPanelStatus = () => {
    const newStatus: PanelState = createLocalPanelStatus(panelInfo.value.config.panelData?.length || 0);
    panelInfo.value.config?.panelData?.push(newStatus);
    return newStatus;
  };

  /**
   * 更新组件列表
   */
  const updateComponentList = (components: ComponentType[]) => {
    componentList.value = components;
  };

  /**
   * 初始化目标图表
   */
  const initTargetChart = () => {
    targetChart.value = {
      selectId: [],
      hoverId: undefined
    };
  };

  /**
   * 推入激活状态堆栈
   */
  const pushActiveStatusStack = (item: { panelId: number; activeStatusId: string }) => {
    activeStatusStack.value.push(item);
  };

  /**
   * 弹出激活状态堆栈
   */
  const popActiveStatusStack = () => {
    return activeStatusStack.value.pop();
  };

  /**
   * 重置所有数据
   */
  const reset = () => {
    panelInfo.value = cloneDeep(defaultLayerInfo);
    isLoad.value = false;
    activeStatusId.value = "";
    activeStatusStack.value = [];
  };

  return {
    // 状态
    panelInfo,
    isLoad,
    activeStatusId,
    activeStatusStack,
    statusMenuShow,

    // 计算属性
    panelData,
    activeStatus,
    panelConfig,

    // 状态更新方法
    setPanelInfo,
    updatePanelConfig,
    setActiveStatusId,
    setIsLoad,
    addPanelStatus,
    updateComponentList,
    initTargetChart,
    pushActiveStatusStack,
    popActiveStatusStack,
    reset,

    // 工具方法
    setStatusMenuShow
  };
};
