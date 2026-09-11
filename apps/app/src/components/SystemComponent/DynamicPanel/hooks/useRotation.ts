import type { Ref } from "vue";
import { computed, onBeforeUnmount, ref } from "vue";

import type { DynamicPanelProps } from "@/views/build/components/buildRender/core/SystemComponent/panel/DynamicPanel";

import { calculateNextCardIndex, getCardIndexFromEvent, updateCardClasses } from "../util";

/**
 * 动态面板轮播和自动播放钩子
 * 负责处理面板的轮播、自动播放和卡片切换功能
 */
export function useRotation({
  dynamicPanel,
  isBuild,
  panelViewCard,
  rotationType,
  switchStatus
}: {
  /** 动态面板配置 */
  dynamicPanel: DynamicPanelProps;
  /** 是否为构建模式 */
  isBuild: Ref<boolean>;
  /** 卡片面板视图引用 */
  panelViewCard: Ref<HTMLElement | null>;
  /** 轮播类型 */
  rotationType: Ref<string | false>;
  /** 状态切换函数 */
  switchStatus: (type: "prev" | "next") => Promise<void>;
}) {
  // 当前卡片索引
  const currentIdx = ref(0);
  // 自动播放定时器
  const timer = ref<NodeJS.Timeout | null>(null);

  /**
   * 计算是否自动播放
   * 根据配置决定是否自动轮播（非编辑模式下）
   */
  const autoPlay = computed(
    () => dynamicPanel.option?.rotationShow && dynamicPanel.option?.autoRotation && !isBuild.value
  );

  /**
   * 检查是否可以进行卡片切换
   * @returns 如果可以切换返回true
   */
  const canSwitchCard = (): boolean => {
    return !isBuild.value && !!panelViewCard.value;
  };

  /**
   * 获取所有卡片元素
   * @returns 卡片元素数组或null
   */
  const getCardItems = (): NodeListOf<Element> | null => {
    if (!panelViewCard.value) return null;
    const cardItems = panelViewCard.value.querySelectorAll(".subgroupItem");
    return cardItems.length > 0 ? cardItems : null;
  };

  /**
   * 根据事件确定新的卡片索引
   * @param event - 点击事件
   * @param cardItems - 卡片元素列表
   * @returns 新的卡片索引
   */
  const getIndexFromEvent = (event: Event | undefined, cardItems: NodeListOf<Element>): number => {
    if (event?.currentTarget) {
      return getCardIndexFromEvent(event, cardItems);
    }
    return currentIdx.value;
  };

  /**
   * 根据自动轮播确定新的卡片索引
   * @param cardItems - 卡片元素列表
   * @param direction - 轮播方向
   * @returns 新的卡片索引
   */
  const getIndexFromAutoRotate = (cardItems: NodeListOf<Element>, direction?: "prev" | "next"): number => {
    return calculateNextCardIndex(currentIdx.value, cardItems.length, direction);
  };

  /**
   * 更新当前卡片索引和UI
   * @param newIndex - 新的卡片索引
   * @param cardItems - 卡片元素列表
   */
  const updateCardState = (newIndex: number, cardItems: NodeListOf<Element>): void => {
    currentIdx.value = newIndex;
    updateCardClasses(cardItems, newIndex);
  };

  /**
   * 卡片轮播切换
   * 支持点击切换和自动轮播
   * @param options - 轮播切换选项
   */
  const handleSwitch = (
    options: {
      /** 触发事件，点击卡片时传入 */
      event?: Event;
      /** 是否为自动轮播 */
      isAutoRotate?: boolean;
      /** 轮播方向，"prev"上一个或"next"下一个 */
      direction?: "prev" | "next";
    } = {}
  ): void => {
    const { event, isAutoRotate = false, direction } = options;

    // 检查是否可以切换
    if (!canSwitchCard()) return;

    // 获取卡片元素
    const cardItems = getCardItems();
    if (!cardItems) return;

    let newIndex = 0;

    // 根据触发方式确定新的活动卡片索引
    if (isAutoRotate) {
      newIndex = getIndexFromAutoRotate(cardItems, direction);
    } else {
      newIndex = getIndexFromEvent(event, cardItems);
    }

    // 更新卡片状态和UI
    updateCardState(newIndex, cardItems);
  };

  /**
   * 获取自动播放间隔时间
   * @returns 间隔时间（毫秒）或null
   */
  const getAutoPlayInterval = (): number | null => {
    if (!dynamicPanel.option?.timingFunction) return null;

    const interval = parseFloat(String(dynamicPanel.option.timingFunction)) * 1000;

    if (!interval || isNaN(interval)) return null;

    return interval;
  };

  /**
   * 执行自动轮播切换
   * 根据轮播类型选择对应的切换方式
   */
  const performAutoSwitch = (): void => {
    if (rotationType.value) {
      handleSwitch({ isAutoRotate: true });
    } else {
      switchStatus("next");
    }
  };

  /**
   * 启动自动播放
   * 根据配置的时间间隔自动切换面板状态
   */
  const startAutoPlay = (): void => {
    stopAutoPlay();

    const interval = getAutoPlayInterval();
    if (!interval) return;

    timer.value = setInterval(() => {
      performAutoSwitch();
    }, interval);
  };

  /**
   * 停止自动播放
   * 清除轮播定时器
   */
  const stopAutoPlay = (): void => {
    if (timer.value) {
      clearInterval(timer.value);
      timer.value = null;
    }
  };

  /**
   * 重启自动播放
   * 先停止当前播放，然后重新启动
   */
  const restartAutoPlay = (): void => {
    if (autoPlay.value) {
      startAutoPlay();
    }
  };

  // 资源清理
  onBeforeUnmount(() => {
    stopAutoPlay();
  });

  // 初始检查并启动自动轮播
  if (autoPlay.value) {
    startAutoPlay();
  }

  return {
    currentIdx,
    autoPlay,
    handleSwitch,
    startAutoPlay,
    stopAutoPlay,
    restartAutoPlay
  };
}
