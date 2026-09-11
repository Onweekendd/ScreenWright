import type { Animation } from "@screenwright/types";
import { createGlobalState } from "@vueuse/core";

/**
 * 动画回调接口
 */
export interface AnimationCallbacks {
  /**
   * 动画开始前回调
   */
  onBeforeEnter?: () => void;
  /**
   * 动画开始回调
   */
  onEnter?: () => void;
  /**
   * 动画结束回调
   */
  onAfterEnter?: () => void;
  /**
   * 动画取消回调
   */
  onEnterCancelled?: () => void;
  /**
   * 动画开始前回调
   */
  onBeforeLeave?: () => void;
  /**
   * 动画开始回调
   */
  onLeave?: () => void;
  /**
   * 动画结束回调
   */
  onAfterLeave?: () => void;
  /**
   * 动画取消回调
   */
  onLeaveCancelled?: () => void;
}

/**
 * 动画触发器接口
 */
export type AnimationTrigger = (params: {
  animation: Animation;
  newAnimationCallback?: AnimationCallbacks;
  type?: "animation" | "transition";
  triggerType: "enter" | "leave" | "preview";
}) => void;

/**
 * 全局动画管理器
 */
export const useGlobalAnimation = createGlobalState(() => {
  // 动画触发器注册表
  const triggerRegistry = new Map<string, AnimationTrigger>();

  /**
   * 注册动画触发器
   */
  const registerAnimationTrigger = (
    id: string,
    trigger: (params: {
      animation: Animation;
      newAnimationCallback?: AnimationCallbacks;
      triggerType: "enter" | "leave" | "preview";
    }) => void
  ): void => {
    triggerRegistry.set(id, trigger);
  };

  /**
   * 注销动画触发器
   */
  const unregisterAnimationTrigger = (componentId: string): void => {
    // 清理注册表
    triggerRegistry.delete(componentId);
  };

  /**
   * 获取所有注册的触发器
   */
  const getAllTriggers = (): string[] => {
    return Array.from(triggerRegistry.keys());
  };

  const resetTriggerRegistry = (): void => {
    triggerRegistry.clear();
  };

  return {
    triggerRegistry,
    registerAnimationTrigger,
    unregisterAnimationTrigger,
    getAllTriggers,
    resetTriggerRegistry
  };
});
