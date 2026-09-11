import type { Ref } from "vue";
import { onBeforeUnmount, ref } from "vue";

import type { DynamicPanelProps } from "@/views/build/components/buildRender/core/SystemComponent/panel/DynamicPanel";

import { onDomTouch } from "../util";

/**
 * 手势触摸函数类型
 */
interface TouchFunctions {
  /** 开始触摸事件处理函数 */
  startFun: (e: TouchEvent | MouseEvent) => void;
  /** 结束触摸事件处理函数 */
  endFun: (e: TouchEvent | MouseEvent) => void;
  /** 是否触摸状态 */
  isTouch: boolean;
}

/**
 * 动态面板手势处理钩子
 * 负责处理面板的手势滑动功能
 */
export function useGesture({
  dynamicPanel,
  panelViewDefault,
  panelViewCard,
  rotationType,
  switchStatus,
  handleSwitch
}: {
  /** 动态面板配置 */
  dynamicPanel: DynamicPanelProps;
  /** 默认面板视图引用 */
  panelViewDefault: Ref<HTMLElement | null>;
  /** 卡片面板视图引用 */
  panelViewCard: Ref<HTMLElement | null>;
  /** 轮播类型 */
  rotationType: Ref<string | false>;
  /** 状态切换函数 */
  switchStatus: (type: "prev" | "next") => Promise<void>;
  /** 卡片切换函数 */
  handleSwitch: (options?: { event?: Event; isAutoRotate?: boolean; direction?: "prev" | "next" }) => void;
}) {
  // 默认视图手势处理函数引用
  const defaultTouchFun = ref<TouchFunctions | null>(null);
  // 卡片视图手势处理函数引用
  const cardTouchFun = ref<TouchFunctions | null>(null);

  /**
   * 检查是否启用手势滑动
   * @returns 如果启用返回true
   */
  const isGestureSlidingEnabled = (): boolean => {
    return !!dynamicPanel.option?.gestureSliding;
  };

  /**
   * 检查默认视图是否可用
   * @returns 如果可用返回true
   */
  const isDefaultViewAvailable = (): boolean => {
    return !!panelViewDefault.value;
  };

  /**
   * 检查卡片视图是否可用
   * @returns 如果可用返回true
   */
  const isCardViewAvailable = (): boolean => {
    return !!panelViewCard.value && !!rotationType.value;
  };

  /**
   * 处理默认模式下的滑动方向
   * @param direction - 滑动方向
   */
  const handleDefaultSwipe = (direction: string): void => {
    if (direction === "left") {
      switchStatus("next");
    } else if (direction === "right") {
      switchStatus("prev");
    }
  };

  /**
   * 处理卡片模式下的滑动方向
   * @param direction - 滑动方向
   */
  const handleCardSwipe = (direction: string): void => {
    if (direction === "left") {
      handleSwitch({ isAutoRotate: true });
    } else if (direction === "right") {
      handleSwitch({ isAutoRotate: true, direction: "prev" });
    }
  };

  /**
   * 设置默认模式手势滑动
   * 为默认面板视图添加触摸事件以实现滑动切换功能
   */
  const setupDefaultTouchEvents = (): void => {
    if (!isGestureSlidingEnabled() || !isDefaultViewAvailable()) {
      return;
    }

    defaultTouchFun.value = onDomTouch(panelViewDefault.value!, handleDefaultSwipe, true);
  };

  /**
   * 设置卡片模式手势滑动
   * 为卡片面板视图添加触摸事件以实现滑动切换功能
   */
  const setupCardTouchEvents = (): void => {
    if (!isCardViewAvailable()) {
      return;
    }

    cardTouchFun.value = onDomTouch(panelViewCard.value!, handleCardSwipe, true);
  };

  /**
   * 设置手势滑动
   * 根据面板配置为不同视图添加触摸事件
   */
  const setupTouchEvents = (): void => {
    if (!dynamicPanel.option) return;

    // 设置默认模式手势滑动
    setupDefaultTouchEvents();

    // 设置卡片模式手势滑动
    setupCardTouchEvents();
  };

  /**
   * 清理默认视图手势事件
   */
  const cleanupDefaultTouchEvents = (): void => {
    if (defaultTouchFun.value) {
      defaultTouchFun.value = null;
    }
  };

  /**
   * 清理卡片视图手势事件
   */
  const cleanupCardTouchEvents = (): void => {
    if (cardTouchFun.value) {
      cardTouchFun.value = null;
    }
  };

  /**
   * 清理所有手势事件
   * 在组件卸载时调用
   */
  const cleanupTouchEvents = (): void => {
    cleanupDefaultTouchEvents();
    cleanupCardTouchEvents();
  };

  // 组件卸载时清理手势事件
  onBeforeUnmount(() => {
    cleanupTouchEvents();
  });

  return {
    defaultTouchFun,
    cardTouchFun,
    setupTouchEvents,
    cleanupTouchEvents
  };
}
