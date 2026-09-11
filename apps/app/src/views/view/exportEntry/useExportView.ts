import type { CSSProperties } from "vue";
import { computed } from "vue";
import { useRoute } from "vue-router";

import type { LargeScreeInfo } from "@screenwright/types";

import { useScreenScale } from "@/hooks/useScreenScale";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useEncodePanelInfo } from "@/views/build/components/encodeEditor/useEncodePanelInfo";
import { useInitLargeScreenData } from "@/views/build/useInitLargeScreenData";
import { getOpacity, getOverflowStyle, useView } from "@/views/view/useView";

/**
 * 导出视图业务逻辑组合式函数
 * 复用 useView 中的方法，只重写特定的 initPreView 和 init 方法以及 currentConfig
 * @returns 视图相关的响应式数据和方法
 */
export function useExportView() {
  const route = useRoute();
  const { initLargeScreenData } = useInitLargeScreenData();
  const { editConfig } = useEditStore();
  const { panelConfig: encodePanelConfig, panelInfo: encodePanelInfo } = useEncodePanelInfo();

  // 复用 useView 中的所有方法和状态（除了 currentConfig 和 wrapperStyle）
  const {
    groupData,
    componentList,
    initTerminalPanel,
    initNormalPanel,
    initDefaultView,
    cleanup,
    enterDefaultView,
    initTerminalPanelWithLocalData
  } = useView();

  /**
   * 根据路由参数自动选择配置的计算属性
   * 逻辑与 initPreView 保持一致：
   * - 当 cid 存在时，使用终端面板配置
   * - 其他情况使用默认配置
   */
  const currentConfig = computed(() => {
    if (!route || !route.params) {
      return editConfig.value;
    }

    const encodeId = route.params.encodeId;

    if (encodeId) {
      // 终端面板配置
      return {
        ...encodePanelConfig.value,
        enableScroll: encodePanelInfo.value.config?.option?.enableScroll
      };
    } else {
      // 默认配置
      return editConfig.value;
    }
  });

  const overFlowStyle = computed<CSSProperties>(() => {
    return getOverflowStyle(currentConfig.value);
  });

  // 使用自定义的 currentConfig 重新计算 wrapperStyle
  const { wrapperStyle } = useScreenScale(currentConfig);

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
  const initPreView = async (data: LargeScreeInfo) => {
    if (!route || !route.params) {
      return;
    }

    initLargeScreenData(data);

    const panelId = route.params.encodeId;

    // electron 环境终端id参数获取方式与web环境不同，需兼容处理
    const encodeId = panelId || new URLSearchParams(window.location.search).get("encodeId");

    if (encodeId) {
      await initTerminalPanelWithLocalData(Number(encodeId));
    } else {
      await enterDefaultView();
    }
  };

  /**
   * 导出专用的初始化函数
   * 接收数据并执行完整的视图初始化流程
   */
  const init = async (data: LargeScreeInfo) => {
    // 直接使用传入的数据初始化
    await initPreView(data);
  };

  return {
    groupData,
    componentList,
    currentConfig,
    wrapperStyle,
    wrapperBgStyle,
    overFlowStyle,
    // 方法
    initPreView,
    initTerminalPanel,
    initNormalPanel,
    initDefaultView,
    init,
    cleanup
  };
}
