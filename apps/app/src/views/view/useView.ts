import type { CSSProperties } from "vue";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useWindowSize } from "@vueuse/core";

import type { LargeScreenDetailInfo } from "@screenwright/types";

import { mediaEnum } from "@/components/componentEntry/type";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import { useScreenScale } from "@/hooks/useScreenScale";
import { handleConstraint } from "@/utils/constraint";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useInitLargeScreenData } from "@/views/build/useInitLargeScreenData";

import { useMinioPreload } from "../../service-workers/minioCache/useMinioPreload";
import { AdaptationType } from "../build/components/buildConfig/graphConfig/options";
import type { DynamicPanelProps } from "../build/components/buildRender/core/SystemComponent/panel/DynamicPanel";
import type { SystemComponentProps } from "../build/components/buildRender/core/SystemComponent/type";
import { renderSystemComponentType } from "../build/components/buildRender/core/SystemComponent/type";
import type { ComponentType } from "../build/components/buildRender/type";
import { useEncodePanelInfo } from "../build/components/encodeEditor/useEncodePanelInfo";
import { usePanelInfo } from "../build/components/panelEditor/usePanelInfo";
import { useGlobalComponentData } from "../build/useGlobalComponentData";
import { useEncodeCommunication } from "./useEncodeCommunication";

/**
 * 获取颜色透明度值
 * @param color - 颜色字符串，支持rgba格式
 * @returns 透明度值，范围0-1
 */
export const getOpacity = (color: string) => {
  // 检查是否是rgba格式
  if (typeof color !== "string" || !color.startsWith("rgba(")) {
    return 1; // 非rgba格式默认为完全不透明
  }

  // 提取rgba参数部分
  const params = color
    .slice(5, -1)
    .split(",")
    .map((param) => param.trim());

  // 第四个参数是alpha值
  if (params.length === 4) {
    const alpha = parseFloat(params[3]);
    // 确保alpha值在0-1范围内
    return Math.max(0, Math.min(1, alpha));
  }

  return 1; // 格式不正确时默认为完全不透明
};

/**
 * 获取 overflow 样式
 * @param config - 配置对象
 * @returns overflow 样式对象
 */
export const getOverflowStyle = (config: any): CSSProperties => {
  if (config.adaptationType === AdaptationType.overflow) {
    return {
      overflow: "auto"
    };
  }

  if ((config as unknown as { enableScroll: boolean }).enableScroll) {
    return {
      overflow: "auto"
    };
  }

  return {
    overflow: "hidden"
  };
};

/**
 * 视图业务逻辑组合式函数
 * 提供视图初始化、配置管理、事件处理等功能
 * @returns 视图相关的响应式数据和方法
 */
export function useView() {
  const route = useRoute();
  const { width: windowW, height: windowH } = useWindowSize();
  const oldCpL = ref<ComponentType[] | null>(null);
  const { componentList, editConfig, isBuild } = useEditStore();
  const { groupData, initLargeScreen } = useInitLargeScreenData();
  const { panelInfo, panelData, panelConfig, activeStatus, initPanelData, activeStatusId } = usePanelInfo();
  const {
    panelConfig: encodePanelConfig,
    panelData: encodePanelData,
    activeStatus: encodeActiveStatus,
    activeStatusId: encodeActiveStatusId,
    panelInfo: encodePanelInfo,
    initPanelData: initEncodePanelData,
    initEncodePanelDataWithLocalData
  } = useEncodePanelInfo();

  const { loadingScreen: loadingScreenData } = useGlobalLoading();
  const { startPreload } = useMinioPreload();
  const { allComponentMap } = useGlobalComponentData();

  const panelId = computed<number | undefined>(() => {
    return panelInfo.value.config.id || encodePanelInfo.value.config.id;
  });

  const statusId = computed<string | undefined>(() => {
    return activeStatus.value?.id || encodeActiveStatus.value?.id;
  });

  // 根据路由参数自动选择配置的计算属性
  const currentConfig = computed(() => {
    if (!route || !route.params || !route.query) {
      return editConfig.value;
    }

    const type = route.query.type;
    const cid = route.params.cid;

    if (type && type !== "0") {
      // 终端面板配置
      return {
        ...encodePanelConfig.value,
        enableScroll: encodePanelInfo.value.config?.option?.enableScroll
      };
    } else if (cid) {
      // 普通面板配置
      return panelConfig.value;
    } else {
      // 默认配置
      return editConfig.value;
    }
  });

  const { wrapperStyle } = useScreenScale(currentConfig);
  const { initTerminalCommunication, initScreenCommunication, cleanup } = useEncodeCommunication();

  const overFlowStyle = computed<CSSProperties>(() => {
    return getOverflowStyle(currentConfig.value);
  });

  /**
   * 初始化终端面板
   * 处理终端通信和编码面板配置，设置面板尺寸和激活状态
   * @async
   * @function initTerminalPanel
   * @description 执行终端面板逻辑，包括通信初始化、面板信息获取和组件列表设置
   */
  const initTerminalPanel = async (panelId: number) => {
    await initEncodePanelData(panelId);
    initTerminalCommunication();

    encodeActiveStatusId.value = (route.query.status as string)
      ? (route.query.status as string)
      : encodePanelData.value[0].id;

    componentList.value = encodeActiveStatus.value?.config ?? [];
  };

  const initTerminalPanelWithLocalData = async (panelId: number) => {
    await initEncodePanelDataWithLocalData(panelId);
    initTerminalCommunication();

    componentList.value = encodeActiveStatus.value?.config ?? [];
  };

  /**
   * 初始化普通面板
   * 根据面板ID获取面板信息并配置显示状态
   * @async
   * @function initNormalPanel
   * @param {string} cid - 面板ID，用于获取对应的面板信息
   * @description 处理普通面板的初始化逻辑，包括面板信息获取、状态设置和组件列表设置
   */
  const initNormalPanel = async (cid: string) => {
    await initPanelData(Number(cid));
    activeStatusId.value = (route.query.status as string) ? (route.query.status as string) : panelData.value[0].id;

    componentList.value = activeStatus.value?.config ?? [];
  };

  const onBeforeEnter = async (): Promise<{
    openComponent: ComponentType | null;
    openDelayLoading: boolean;
  }> => {
    // loadingScene.value = false

    const openVideo = groupData.value.find((component) => component.component.prop === mediaEnum.FtOpenVideo);

    if (openVideo && !isBuild()) {
      const { delayLoadingTime, openDelayLoading, delayPlayTime, autoPlay } = openVideo.option as {
        delayLoadingTime: number;
        openDelayLoading: boolean;
        delayPlayTime: number;
        autoPlay: boolean;
      };
      if (openDelayLoading) {
        // 开场视频层级设置为最高
        componentList.value = [
          {
            ...openVideo,
            zIndex: groupData.value.length + 1
          }
        ];

        return new Promise((resolve) => {
          setTimeout(
            () => {
              resolve({
                openComponent: openVideo,
                openDelayLoading: true
              });
            },
            autoPlay ? delayPlayTime * 1000 : delayPlayTime * 1000 + delayLoadingTime * 1000
          );
        });
      }
    }

    return {
      openComponent: null,
      openDelayLoading: false
    };
  };

  const onEnter = async () => {
    componentList.value = groupData.value;
  };

  /**
   * 初始化默认视图
   * 设置默认的组件列表和屏幕通信
   * @function initDefaultView
   * @description 当没有特定面板配置时，使用默认的组数据初始化视图并启动屏幕通信
   */
  const initDefaultView = async (id: string) => {
    await initLargeScreen(Number(id));

    await onBeforeEnter();

    await onEnter();

    initScreenCommunication();

    initConstraint();
  };

  const initConstraint = () => {
    if (oldCpL.value === null) {
      oldCpL.value = JSON.parse(JSON.stringify(componentList.value));
    } else {
      console.log("已有数值", oldCpL.value);
    }

    if (editConfig.value.adaptationType !== 4 || !editConfig.value) {
      return;
    }
    // const { width, height } = editConfig.value;
    // const designW = Number(width);
    // const designH = Number(height);
    // const safeW = Number.isFinite(designW) && designW !== 0 ? designW : 1;
    // const safeH = Number.isFinite(designH) && designH !== 0 ? designH : 1;

    componentList.value = handleConstraint(
      {
        viewport: {
          width: Number(windowW.value),
          height: Number(windowH.value)
        }
      },
      oldCpL.value as ComponentType[],
      editConfig.value as LargeScreenDetailInfo
    );
  };

  watch(
    () => [windowW.value, windowH.value],
    () => {
      initConstraint();
    }
  );

  /**
   * 进入默认视图
   * 设置默认的组件列表和屏幕通信
   * @function enterDefaultView
   * @description 当没有特定面板配置时，使用默认的组数据初始化视图并启动屏幕通信
   */
  const enterDefaultView = async () => {
    await onBeforeEnter();
    await onEnter();

    initScreenCommunication();
  };

  /**
   * 初始化预览视图
   * 根据路由参数和查询参数决定初始化哪种类型的视图
   * @async
   * @function initPreView
   * @description 主控制函数，解析路由参数并调用相应的初始化函数：
   * - 当type存在且不为"0"时，初始化终端面板
   * - 当cid存在时，初始化普通面板
   * - 其他情况初始化默认视图
   * 最后添加鼠标移动事件监听
   */
  const initPreView = async () => {
    if (!route || !route.params) {
      return;
    }

    const cid = route.params.cid;
    const id = route.params.id;
    const type = route.query.type;

    if (type && type !== "0") {
      // 执行终端面板逻辑
      await initTerminalPanel(Number(type));
      return;
    } else if (cid) {
      // 执行普通面板逻辑
      await initNormalPanel(cid as string);
    } else {
      // 执行默认视图逻辑
      await initDefaultView(id as string);
    }
  };

  /**
   * 初始化函数
   * 执行完整的视图初始化流程
   */
  const init = async () => {
    loadingScreenData.value = true;
    await initPreView();
    const allTopDynamicPanel = Array.from(allComponentMap.value.values()).filter((component) =>
      renderSystemComponentType.some(
        (type) =>
          component.component.prop === type &&
          component.parentDynamicPanelId.length === 0 &&
          (component as DynamicPanelProps).option.isPreLoad
      )
    ) as SystemComponentProps[];

    // 等待所有预加载任务完成后再关闭 loading
    await Promise.all(allTopDynamicPanel.map((component) => startPreload(component)));
    loadingScreenData.value = false;
  };

  /**
   * 计算包装器背景样式
   * 根据当前配置的背景颜色计算样式
   */
  const wrapperBgStyle = computed(() => {
    if (!currentConfig.value.backgroundColor) {
      return {
        backgroundColor: "transparent"
      };
    }
    const opacity = getOpacity(currentConfig.value.backgroundColor);
    if (opacity === 0) {
      return {
        backgroundColor: "transparent"
      };
    }
    return {
      backgroundColor: "rgb(24, 26, 36)"
    };
  });

  return {
    groupData,
    componentList,
    currentConfig,
    wrapperStyle,
    wrapperBgStyle,
    overFlowStyle,
    loadingScreenData,
    panelId,
    statusId,
    // 方法
    initPreView,
    initTerminalPanel,
    initNormalPanel,
    initDefaultView,
    init,
    cleanup,
    enterDefaultView,
    initTerminalPanelWithLocalData
  };
}
