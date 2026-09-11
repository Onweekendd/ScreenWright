// 模块化导入
import { useAnimationOperations } from "./components/hooks/useAnimationOperations";
import { useAnimationTrigger } from "./components/hooks/useAnimationTrigger";
import { useComponentOperations } from "./components/hooks/useComponentOperations";
import { useConfigSync } from "./components/hooks/useConfigSync";
import { useCopyOperations } from "./components/hooks/useCopyOperations";
import { useStatusAnimationState } from "./components/hooks/useStatusAnimationState";
import { useStatusOperations } from "./components/hooks/useStatusOperations";

/**
 * 状态动画管理Hook
 * @description 提供状态动画的完整管理功能，包括动画组的增删改查、状态管理、组件配置等
 * @returns 返回状态动画相关的数据和操作方法
 * @example
 * ```typescript
 * const {
 *   animations,
 *   onAddAnimation,
 *   onDeleteAnimation,
 *   triggerStatusAnimation
 * } = useStatusAnimation()
 *
 * // 添加新动画组
 * await onAddAnimation({ statusIndex: 1 })
 *
 * // 触发动画
 * triggerStatusAnimation('component-id')
 * ```
 */
export function useStatusAnimation() {
  // 基础状态管理
  const state = useStatusAnimationState();

  // 动画组操作
  const animationOps = useAnimationOperations(state);

  // 状态操作
  const statusOps = useStatusOperations(state, animationOps);

  // 组件操作
  const componentOps = useComponentOperations(state, animationOps);

  // 动画触发
  const triggerModule = useAnimationTrigger(state);

  // 配置同步
  const configSync = useConfigSync(state, animationOps, triggerModule);

  // 复制操作
  const copyOps = useCopyOperations(state, configSync);

  return {
    // 基础数据
    ...state,

    // 动画组操作
    ...animationOps,

    // 状态操作
    ...statusOps,

    // 组件操作
    ...componentOps,

    // 动画触发
    ...triggerModule,

    // 配置同步
    ...configSync,

    // 复制操作
    ...copyOps
  };
}

export type UseStatusAnimationReturn = ReturnType<typeof useStatusAnimation>;
