import type { Ref } from "vue";

import type {
  DynamicPanel,
  DynamicPanelProps
} from "@/views/build/components/buildRender/core/SystemComponent/panel/DynamicPanel";

/**
 * 动态面板状态切换钩子
 * 负责处理上一个、下一个状态的切换逻辑
 */
export function useStatusSwitch({
  dynamicPanel,
  instance,
  isBuild,
  changeStatus,
  triggerRegistry,
  panelViewDefault,
  rotationType
}: {
  /** 动态面板配置 */
  dynamicPanel: DynamicPanelProps;
  /** 动态面板实例引用 */
  instance: Ref<InstanceType<new () => DynamicPanel> | undefined>;
  /** 是否为构建模式 */
  isBuild: Ref<boolean>;
  /** 状态切换函数 */
  changeStatus: (targetStatusId: string) => Promise<void>;
  /** 动画触发器注册表 */
  triggerRegistry: Map<string, any>;
  /** 默认面板视图引用 */
  panelViewDefault: Ref<HTMLElement | null>;
  /** 轮播类型 */
  rotationType: Ref<string | false>;
}) {
  /**
   * 验证面板实例和数据是否存在
   * @throws 如果实例或数据不存在则抛出错误
   */
  const validatePanelInstance = (): void => {
    if (!instance.value || !instance.value.panelData) {
      throw new Error("动态面板实例或状态数据不存在");
    }
  };

  /**
   * 验证状态数量是否足够切换
   * @throws 如果状态数量不足则抛出错误
   */
  const validateStateCount = (): void => {
    if (instance.value!.panelData.length <= 1) {
      throw new Error("状态数量不足，无法切换");
    }
  };

  /**
   * 获取当前状态索引
   * @returns 当前状态在面板数据中的索引
   * @throws 如果当前状态ID无效则抛出错误
   */
  const getCurrentStateIndex = (): number => {
    const panelData = instance.value!.panelData;
    const currentStatusId = instance.value!.activeStatusId;
    const currentIndex = panelData.findIndex((item) => item.id === currentStatusId);

    if (currentIndex === -1) {
      throw new Error("当前状态ID无效");
    }

    return currentIndex;
  };

  /**
   * 计算下一个状态索引（支持循环）
   * @param currentIndex - 当前索引
   * @param total - 总状态数
   * @param direction - 切换方向
   * @returns 新的状态索引
   */
  const calculateNextIndex = (currentIndex: number, total: number, direction: "prev" | "next"): number => {
    if (direction === "prev") {
      return (currentIndex - 1 + total) % total;
    } else {
      return (currentIndex + 1) % total;
    }
  };

  /**
   * 检查是否应该应用不透明度动画
   * @returns 如果应该应用返回true
   */
  const shouldApplyOpacityAnimation = (): boolean => {
    return !rotationType.value && dynamicPanel.option?.animationType === "opacity";
  };

  /**
   * 应用不透明度切换动画
   */
  const applyOpacityAnimation = (): void => {
    if (!panelViewDefault.value) return;

    const dynamicPanelAnimationTrigger = triggerRegistry.get(`${dynamicPanel.id}`);
    if (!dynamicPanelAnimationTrigger) return;

    const animation = {
      delay: 0,
      direction: "right",
      duration: 1000,
      opacityOpen: false,
      timingFunction: "linear",
      type: "opacity-in"
    };

    dynamicPanelAnimationTrigger({
      animation,
      triggerType: "preview"
    });
  };

  /**
   * 切换动态面板状态
   * @param type - 切换方向，"prev"上一个或"next"下一个
   */
  const switchStatus = async (type: "prev" | "next"): Promise<void> => {
    // 在构建模式下不执行切换
    if (isBuild.value) return;

    // 验证实例和数据
    if (!instance.value || !instance.value.panelData) return;

    const panelData = instance.value.panelData;
    const currentStatusId = instance.value.activeStatusId;
    const currentIndex = panelData.findIndex((item) => item.id === currentStatusId);

    // 无效索引直接返回
    if (currentIndex === -1) return;

    // 计算新的状态索引
    const newIndex = calculateNextIndex(currentIndex, panelData.length, type);
    const newStatusId = panelData[newIndex].id;

    // 切换到新状态
    await changeStatus(newStatusId);

    // 应用不透明度动画（如果需要）
    if (shouldApplyOpacityAnimation()) {
      applyOpacityAnimation();
    }
  };

  /**
   * 切换到上一个状态
   * 支持边界循环：当前是第一个状态时，会跳转到最后一个状态
   * @returns Promise，成功时resolve，失败时reject
   */
  const toPrevStatus = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        validatePanelInstance();
        validateStateCount();
        getCurrentStateIndex();

        // 切换状态
        switchStatus("prev").then(resolve).catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  };

  /**
   * 切换到下一个状态
   * 支持边界循环：当前是最后一个状态时，会跳转到第一个状态
   * @returns Promise，成功时resolve，失败时reject
   */
  const toNextStatus = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        validatePanelInstance();
        validateStateCount();
        getCurrentStateIndex();

        // 切换状态
        switchStatus("next").then(resolve).catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  };

  return {
    switchStatus,
    toPrevStatus,
    toNextStatus
  };
}
