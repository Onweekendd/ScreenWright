import type { ComputedRef, Ref } from "vue";
import { shallowRef } from "vue";

import type { ComponentSettingItem } from "@/views/build/components/buildConfig/attrsRender/components/customAnimation/type";
import type { PanelIdAndStatusIdToAnimationMap } from "@/views/build/components/buildConfig/attrsRender/components/customAnimation/useCustomAnimationData";
import type {
  DynamicPanel,
  DynamicPanelProps
} from "@/views/build/components/buildRender/core/SystemComponent/panel/DynamicPanel";
import type { PanelState } from "@/views/build/components/buildRender/core/SystemComponent/type";
import type { AnimationTrigger } from "@/views/build/components/buildRender/hooks/useGlobalAnimation";

/**
 * 动态面板状态管理钩子
 * 负责处理面板状态的切换、克隆和恢复
 */
export function useStateManagement({
  dynamicPanel,
  instance,
  triggerRegistry,
  panelIdAndStatusIdToAnimationMap,
  isExitAnimationPlaying,
  refreshKey
}: {
  /** 动态面板配置 */
  dynamicPanel: DynamicPanelProps;
  /** 动态面板实例引用 */
  instance: Ref<InstanceType<new () => DynamicPanel> | undefined>;
  /** 动画触发器注册表 */
  triggerRegistry: Map<string, AnimationTrigger>;
  /** 面板ID和状态ID到动画的映射 */
  panelIdAndStatusIdToAnimationMap: ComputedRef<PanelIdAndStatusIdToAnimationMap>;
  /** 退出动画播放标记 */
  isExitAnimationPlaying: Ref<boolean>;
  /** 刷新键 */
  refreshKey: Ref<number>;
}) {
  // 克隆的面板状态列表
  const clonedPanelStates = shallowRef<PanelState[]>([]);

  /**
   * 重置动态面板状态
   */
  const restartPatrol = () => {
    clonedPanelStates.value = [];
    if (!instance.value) {
      return;
    }
    const firstId = instance.value.panelData[0].id;
    if (firstId) {
      changeStatus(firstId);
    }
  };

  /**
   * 检查目标状态是否已在克隆面板状态中存在
   * @param targetStatusId - 目标状态ID
   * @returns 如果状态存在返回true，否则返回false
   */
  const isStateCloned = (targetStatusId: string): boolean => {
    return clonedPanelStates.value.some((panelState) => panelState.id === targetStatusId);
  };

  /**
   * 从动态面板数据中查找指定的状态
   * @param statusId - 状态ID
   * @returns 找到的状态对象
   * @throws 如果状态不存在则抛出错误
   */
  const findPanelState = (statusId: string) => {
    const state = dynamicPanel.panelData.find((panelState) => panelState.id === statusId);
    if (!state) {
      throw new Error(`状态ID为${statusId}的状态不存在`);
    }
    return state;
  };

  /**
   * 创建并添加新的克隆状态
   * @param targetStatusId - 目标状态ID
   */
  const addClonedState = (targetStatusId: string): void => {
    const targetState = findPanelState(targetStatusId);
    const clonedTarget = JSON.parse(JSON.stringify(targetState));
    clonedPanelStates.value.push(clonedTarget);
  };

  /**
   * 从克隆状态还原配置到原始状态
   * @param targetStatusId - 目标状态ID
   * @throws 如果目标状态或克隆状态不存在则抛出错误
   */
  const restoreStateFromClone = (targetStatusId: string): void => {
    const targetState = dynamicPanel.panelData.find((panelState) => panelState.id === targetStatusId);
    const clonedState = clonedPanelStates.value.find((panelState) => panelState.id === targetStatusId);

    if (!targetState || !clonedState) {
      throw new Error(`状态ID为${targetStatusId}的状态不存在`);
    }

    targetState.config = JSON.parse(JSON.stringify(clonedState.config));
  };

  /**
   * 检查是否需要进行状态重载处理
   * @returns 如果需要重载返回true，否则返回false
   */
  const shouldHandleStateReload = (): boolean => {
    return dynamicPanel.option.isSwitchStatusReload;
  };

  /**
   * 处理状态切换时的重载逻辑
   * 如果目标状态未克隆，则创建新的克隆状态
   * 如果已克隆，则从克隆状态还原配置
   * @param targetStatusId - 目标状态ID
   */
  const handleStateReload = (targetStatusId: string): void => {
    if (!isStateCloned(targetStatusId)) {
      addClonedState(targetStatusId);
    } else {
      restoreStateFromClone(targetStatusId);
    }
  };

  /**
   * 设置新的状态ID并更新动态面板的活动状态
   * 如果启用了状态切换重载选项，会先处理重载逻辑
   * @param targetStatusId - 目标状态ID
   */
  const setNewStatusId = (targetStatusId: string): void => {
    if (shouldHandleStateReload()) {
      handleStateReload(targetStatusId);
    }
    instance.value!.activeStatusId = targetStatusId;
  };

  /**
   * 检查当前是否正在播放退出动画且目标状态与当前状态相同
   * @param targetStatusId - 目标状态ID
   * @returns 如果满足条件返回true
   */
  const isAnimatingToSameState = (targetStatusId: string): boolean => {
    return isExitAnimationPlaying.value && instance.value!.activeStatusId === targetStatusId;
  };

  /**
   * 处理退出动画正在播放时的状态切换
   * @param targetStatusId - 目标状态ID
   */
  const handleAnimatingStateChange = (targetStatusId: string): void => {
    if (instance.value!.activeStatusId === targetStatusId) {
      refreshKey.value++;
    }
    isExitAnimationPlaying.value = false;
    instance.value!.activeStatusId = targetStatusId;
  };

  /**
   * 检查目标状态ID是否与当前激活状态ID相同
   * @param targetStatusId - 目标状态ID
   * @returns 如果相同返回true
   */
  const isSameAsCurrentState = (targetStatusId: string): boolean => {
    return targetStatusId === instance.value!.activeStatusId;
  };

  /**
   * 获取状态对应的卸载动画配置
   * @param instanceId - 实例ID
   * @param statusId - 状态ID
   * @returns 动画配置或undefined
   */
  const getUnloadAnimations = (instanceId: number, statusId: string | null) => {
    if (!statusId) return undefined;
    const key = `${instanceId}-${statusId}`;
    const componentSettingList = panelIdAndStatusIdToAnimationMap.value.get(key);
    return componentSettingList?.unload;
  };

  /**
   * 检查是否存在卸载动画
   * @param animations - 动画配置数组
   * @returns 如果存在动画返回true
   */
  const hasUnloadAnimations = (animations: ComponentSettingItem[] | undefined): boolean => {
    return !!animations && animations.length > 0;
  };

  /**
   * 执行单个卸载动画
   * @param animation - 动画配置
   * @param onComplete - 完成回调
   * @param onError - 错误回调
   */
  const executeUnloadAnimation = (
    animation: ComponentSettingItem,
    onComplete: () => void,
    onError: () => void
  ): void => {
    const trigger = triggerRegistry.get(`${animation.id}`);
    if (trigger) {
      trigger({
        animation: {
          ...animation,
          type: animation.animationType
        },
        newAnimationCallback: {
          onAfterLeave: () => {
            // 针对退出动画播放一半又触发切换的情况
            if (!isExitAnimationPlaying.value) {
              onError();
              return;
            }
            onComplete();
          }
        },
        triggerType: "leave"
      });
    }
  };

  /**
   * 执行所有卸载动画并等待完成
   * @param animations - 动画配置数组
   * @param targetStatusId - 目标状态ID
   * @param resolve - Promise resolve函数
   * @param reject - Promise reject函数
   */
  const executeAllUnloadAnimations = (
    animations: ComponentSettingItem[],
    targetStatusId: string,
    resolve: () => void,
    reject: () => void
  ): void => {
    let completedCount = 0;
    const totalAnimations = animations.length;

    isExitAnimationPlaying.value = true;

    animations.forEach((animation) => {
      executeUnloadAnimation(
        animation,
        () => {
          completedCount++;
          if (completedCount === totalAnimations) {
            isExitAnimationPlaying.value = false;
            setNewStatusId(targetStatusId);
            resolve();
          }
        },
        () => {
          reject();
        }
      );
    });
  };

  /**
   * 直接切换状态（无动画）
   * @param targetStatusId - 目标状态ID
   * @param resolve - Promise resolve函数
   */
  const switchStateDirectly = (targetStatusId: string, resolve: () => void): void => {
    setNewStatusId(targetStatusId);
    resolve();
  };

  /**
   * 切换动态面板状态
   * 支持退出动画、状态验证和错误处理
   * @param targetStatusId - 目标状态ID
   * @returns Promise，成功时resolve，失败时reject
   */
  const changeStatus = (targetStatusId: string): Promise<void> => {
    // 处理退出动画正在播放的情况
    if (isAnimatingToSameState(targetStatusId)) {
      handleAnimatingStateChange(targetStatusId);
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      // 验证实例是否存在
      if (!instance.value) {
        reject(new Error("动态面板实例不存在"));
        return;
      }

      // 验证目标状态ID是否与当前状态相同
      if (isSameAsCurrentState(targetStatusId)) {
        reject(new Error("目标状态ID与当前激活状态ID相同"));
        return;
      }

      // 获取卸载动画配置
      const unloadAnimations = getUnloadAnimations(instance.value.id, instance.value.activeStatusId);

      // 如果存在卸载动画，执行动画后切换
      if (hasUnloadAnimations(unloadAnimations)) {
        executeAllUnloadAnimations(unloadAnimations!, targetStatusId, resolve, reject);
      } else {
        // 否则直接切换状态
        switchStateDirectly(targetStatusId, resolve);
      }
    });
  };

  /**
   * 初始化状态管理
   * 如果启用了状态切换重载，初始化第一个状态的克隆
   */
  const initStateManagement = (): void => {
    if (dynamicPanel.option.isSwitchStatusReload) {
      const firstPanelState = dynamicPanel.panelData[0];
      const clonedFirstPanelState = JSON.parse(JSON.stringify(firstPanelState));
      clonedPanelStates.value.push(clonedFirstPanelState);
    }
  };

  return {
    clonedPanelStates,
    changeStatus,
    restartPatrol,
    initStateManagement
  };
}
