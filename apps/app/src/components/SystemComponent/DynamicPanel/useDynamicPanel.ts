import type { ComputedRef, Ref } from "vue";
import { computed, ref } from "vue";

import { useActionEvent } from "@/hooks/eventHandling/useActionEvent";
import { useBaseData } from "@/hooks/useBaseData";
import { useCustomAnimationData } from "@/views/build/components/buildConfig/attrsRender/components/customAnimation/useCustomAnimationData";
import type { DynamicPanelProps } from "@/views/build/components/buildRender/core/SystemComponent/panel/DynamicPanel";
import { DynamicPanel } from "@/views/build/components/buildRender/core/SystemComponent/panel/DynamicPanel";
import { PanelType } from "@/views/build/components/buildRender/core/SystemComponent/type";
import { renderComponent } from "@/views/build/components/buildRender/core/utils";
import { useGlobalAnimation } from "@/views/build/components/buildRender/hooks/useGlobalAnimation";
import { setSizeStyle } from "@/views/build/components/buildRender/utils";
import { useComponentStyle } from "@/views/build/components/buildRender/utils";

import { useCardProperty } from "./hooks/useCardProperty";
import { useGesture } from "./hooks/useGesture";
import { useRotation } from "./hooks/useRotation";
import { useStateManagement } from "./hooks/useStateManagement";
import { useStatusSwitch } from "./hooks/useStatusSwitch";
import { useStyles } from "./hooks/useStyles";

/**./hooks/useDynamicPanelProvide
 * 动态面板钩子函数
 * 整合所有子模块，提供完整的动态面板功能
 * @param params - 动态面板参数
 * @returns 返回动态面板相关功能和属性
 */
export function useDynamicPanel({
  dynamicPanel,
  panelViewDefault,
  panelViewCard,
  statusViewRef
}: {
  /** 动态面板配置选项 */
  dynamicPanel: DynamicPanelProps;
  /** 默认面板视图引用 */
  panelViewDefault: Ref<HTMLElement | null>;
  /** 卡片面板视图引用 */
  panelViewCard: Ref<HTMLElement | null>;
  /** StatusView 暴露方法引用 */
  statusViewRef: Ref<{ pauseScroll: () => void; startScroll: () => void } | null>;
}) {
  // ==================== 基础设置 ====================
  const { addEvent } = useActionEvent();
  const { isBuild } = useBaseData(dynamicPanel);
  const { panelIdAndStatusIdToAnimationMap } = useCustomAnimationData();
  const { triggerRegistry } = useGlobalAnimation();

  // 内部状态
  const instance = ref<InstanceType<new () => DynamicPanel> | undefined>();
  const isExitAnimationPlaying = ref(false);
  const refreshKey = ref(0);

  // ==================== 状态管理模块 ====================
  const stateManagement = useStateManagement({
    dynamicPanel,
    instance,
    triggerRegistry,
    panelIdAndStatusIdToAnimationMap,
    isExitAnimationPlaying,
    refreshKey
  });

  // ==================== 样式计算模块 ====================
  const styles = useStyles({
    dynamicPanel,
    instance,
    isBuild: isBuild as Ref<boolean>
  });

  // ==================== 计算轮播类型 ====================
  // 在主文件中计算，避免循环依赖
  const rotationType: ComputedRef<string | false> = computed(
    () => dynamicPanel.option?.rotationShow && dynamicPanel.option?.rotationType
  );

  // ==================== 状态切换模块 ====================
  const statusSwitch = useStatusSwitch({
    dynamicPanel,
    instance,
    isBuild: isBuild as Ref<boolean>,
    changeStatus: stateManagement.changeStatus,
    triggerRegistry,
    panelViewDefault,
    rotationType: rotationType as Ref<string | false>
  });

  // ==================== 轮播和自动播放模块 ====================
  const rotation = useRotation({
    dynamicPanel,
    isBuild: isBuild as Ref<boolean>,
    panelViewCard,
    rotationType: rotationType as Ref<string | false>,
    switchStatus: statusSwitch.switchStatus
  });

  // ==================== 卡片属性管理模块 ====================
  const cardProperty = useCardProperty({
    dynamicPanel,
    panelViewCard,
    rotationType: rotationType as Ref<string | false>
  });

  // ==================== 手势处理模块 ====================
  const gesture = useGesture({
    dynamicPanel,
    panelViewDefault,
    panelViewCard,
    rotationType: rotationType as Ref<string | false>,
    switchStatus: statusSwitch.switchStatus,
    handleSwitch: rotation.handleSwitch
  });

  /**
   * 初始化面板
   * 创建动态面板实例并设置事件监听
   */
  const initPanel = async (): Promise<void> => {
    // 创建实例
    instance.value = new DynamicPanel();
    instance.value.init(dynamicPanel);

    // 注册事件
    addEvent({
      [`${PanelType.dynamicPanel}-${instance.value.id}`]: {
        changeStatus: stateManagement.changeStatus,
        toPrevStatus: statusSwitch.toPrevStatus,
        toNextStatus: statusSwitch.toNextStatus,
        setupPatrolAction: (type: "turnOnPatrol" | "pausePatrol" | "restartPatrol" | "pauseScroll" | "startScroll") => {
          if (type === "turnOnPatrol") {
            rotation.startAutoPlay();
          } else if (type === "pausePatrol") {
            rotation.stopAutoPlay();
          } else if (type === "restartPatrol") {
            stateManagement.restartPatrol();
            if (rotation.autoPlay.value) {
              rotation.startAutoPlay();
            } else {
              rotation.stopAutoPlay();
            }
          } else if (type === "pauseScroll") {
            statusViewRef.value?.pauseScroll();
          } else if (type === "startScroll") {
            statusViewRef.value?.startScroll();
          }
        }
      }
    });

    // 初始化状态管理
    stateManagement.initStateManagement();

    // 初始化自动播放
    if (rotation.autoPlay.value) {
      rotation.startAutoPlay();
    }

    // 设置手势滑动
    gesture.setupTouchEvents();

    // 更新卡片属性
    cardProperty.updateProperty();
  };

  // ==================== 导出所有功能 ====================
  return {
    // 实例和基础状态
    instance,
    isBuild,
    refreshKey,

    // 样式相关
    activeStatus: styles.activeStatus,
    panelStyle: styles.panelStyle,
    arrowContainStyle: styles.arrowContainStyle,
    arrowLStyle: styles.arrowLStyle,
    arrowRStyle: styles.arrowRStyle,
    setPerspective: styles.setPerspective,
    setTranslate3d: styles.setTranslate3d,
    bgStyle: styles.bgStyle,

    // 轮播相关
    rotationType,
    autoPlay: rotation.autoPlay,
    handleSwitch: rotation.handleSwitch,
    startAutoPlay: rotation.startAutoPlay,
    stopAutoPlay: rotation.stopAutoPlay,

    // 状态切换相关
    switchStatus: statusSwitch.switchStatus,

    // 卡片属性相关
    setAniStyle: cardProperty.setAniStyle,
    updateProperty: cardProperty.updateProperty,

    // 初始化
    initPanel,

    // 手势滑动
    setupTouchEvents: gesture.setupTouchEvents,

    // 工具函数（保持向后兼容）
    setSizeStyle,
    renderComponent,
    useComponentStyle
  };
}
