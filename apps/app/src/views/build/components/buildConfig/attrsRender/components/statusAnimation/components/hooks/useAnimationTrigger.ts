import { nextTick } from "vue";

import { useGlobalAnimation } from "@/views/build/components/buildRender/hooks/useGlobalAnimation";
import type { ComponentType } from "@/views/build/components/buildRender/type";

import type { ComponentAnimationConfig } from "../../type";
import { buildComponentConfig, smartApplyComponentConfig } from "./generators";
import { ComponentConfigBuilder } from "./generators/ComponentConfigBuilder";
import type { UseStatusAnimationStateReturn } from "./useStatusAnimationState";

/**
 * 动画触发模块
 * @description 提供动画触发和播放相关功能
 */
export function useAnimationTrigger(state: UseStatusAnimationStateReturn) {
  const {
    animations,
    componentAnimations,
    selectAnimationId,
    selectStatusId,
    allComponentMap,
    componentDefaultConfigMap
  } = state;

  const { triggerRegistry } = useGlobalAnimation();

  /**
   * 触发状态动画(在编辑状态下)
   * @param componentId 组件ID
   */
  const triggerStatusAnimationOnEdit = async (componentId: string) => {
    const animationId = selectAnimationId.value;
    const statusId = selectStatusId.value;

    if (!animationId || !statusId) {
      console.warn("请先选择动画和状态");
      return;
    }

    // 使用新的通用函数
    await triggerSingleComponentAnimation(componentId, animationId, statusId);
  };

  /**
   * 准备组件动画数据和配置
   * @param componentId 组件ID
   * @param animationId 动画ID
   * @param statusId 状态ID
   * @returns 动画准备数据，如果失败返回null
   */
  const prepareComponentAnimation = (componentId: string, animationId: string, statusId: string) => {
    const trigger = triggerRegistry.get(componentId);
    const animationData = animations.value[animationId];
    if (!animationData) {
      console.warn(`动画 ${animationId} 不存在`);
      return null;
    }

    const { duration } = animationData;
    const statusAnimationData = componentAnimations.value[animationId]?.[statusId]?.[componentId];

    if (!statusAnimationData) {
      console.warn(`组件 ${componentId} 在动画 ${animationId} 的状态 ${statusId} 中不存在`);
      return null;
    }

    const component = allComponentMap.value.get(componentId);
    if (!component) {
      console.warn(`未找到组件 ${componentId}`);
      return null;
    }

    return {
      trigger,
      animationData,
      duration,
      statusAnimationData,
      component,
      componentId
    };
  };

  /**
   * 创建状态动画的回调函数
   * @param componentId 组件ID
   * @param duration 动画持续时间
   * @returns 动画回调对象
   */
  const createAnimationCallbacks = (componentId: string, duration: number) => {
    const styleId = `status-animation-transition-style-${componentId}`;

    return {
      onBeforeEnter: () => {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
          .status-animation-transition-${componentId} * {
            transition: all ${duration}ms linear !important;
          }
        `;
        document.head.appendChild(style);
        style.dataset.animationStyleId = styleId;
      },
      onAfterEnter: () => {
        // 删除全局样式
        const style = document.getElementById(styleId);
        if (style) {
          style.remove();
        }
      }
    };
  };

  /**
   * 应用组件状态变化
   * @param statusAnimationData 状态动画数据
   * @param component 组件对象
   */
  const applyComponentState = (statusAnimationData: ComponentAnimationConfig, component: ComponentType) => {
    assignNewStatusToComponent({ statusAnimationData, component });
  };

  /**
   * 触发单个组件的状态动画（原始实现）
   * @param componentId 组件ID
   * @param animationId 动画ID
   * @param statusId 状态ID
   */
  const triggerSingleComponentAnimation = async (componentId: string, animationId: string, statusId: string) => {
    const animationSetup = prepareComponentAnimation(componentId, animationId, statusId);
    if (!animationSetup) {
      return;
    }

    const { trigger, duration, statusAnimationData, component } = animationSetup;
    const callbacks = createAnimationCallbacks(componentId, duration);

    await nextTick(() => {
      if (trigger && componentAnimations) {
        trigger({
          type: "transition",
          animation: {
            timingFunction: "linear",
            duration,
            delay: 0,
            type: "all"
          },
          triggerType: "preview",
          newAnimationCallback: callbacks
        });
      }
    });

    await nextTick(() => {
      applyComponentState(statusAnimationData, component);
    });
  };

  /**
   * @description 将状态动画数据赋值给组件（使用生成器按需赋值）
   * @param param0
   * @param param0.statusAnimationData 状态动画数据
   * @param param0.component 组件
   */
  function assignNewStatusToComponent({
    statusAnimationData,
    component
  }: {
    statusAnimationData: ComponentAnimationConfig;
    component: ComponentType;
  }) {
    // 使用配置化生成器构建组件配置
    const newComponentConfig = buildComponentConfig(statusAnimationData, component);

    // 使用智能应用函数，只应用实际有值的属性，避免覆盖原始对象的默认值
    smartApplyComponentConfig(component, newComponentConfig);
  }

  /**
   * 通过动作触发状态动画
   * @param panelStatusAnimationId 面板状态动画ID
   * @param panelStatusId 面板状态ID
   */
  const triggerStatusAnimationByAction = async (panelStatusAnimationId: string, panelStatusId: string) => {
    // 如果选择的是初始状态(ID为"0")，则恢复指定状态下的组件到初始状态
    if (panelStatusId === "0") {
      console.info("选择了初始状态，恢复指定状态下的组件到初始状态");
      await triggerResetToInitialState(panelStatusAnimationId, panelStatusId);
      return;
    }

    const animationData = animations.value[panelStatusAnimationId];
    if (!animationData) {
      console.warn(`动画 ${panelStatusAnimationId} 不存在`);
      return;
    }

    const statusAnimationData = componentAnimations.value[panelStatusAnimationId]?.[panelStatusId];
    if (!statusAnimationData) {
      console.warn(`状态 ${panelStatusId} 在动画 ${panelStatusAnimationId} 中不存在`);
      return;
    }

    // 遍历该状态下的所有组件，逐个触发动画
    const animationPromises = Object.values(statusAnimationData).map((status) => {
      const component = allComponentMap.value.get(status.componentId);
      if (!component) {
        console.warn(`组件 ${status.componentId} 不存在`);
        return Promise.resolve();
      }

      return triggerSingleComponentAnimation(status.componentId, panelStatusAnimationId, panelStatusId);
    });

    // 等待所有动画完成
    await Promise.all(animationPromises);
  };

  /**
   * 触发重置到初始状态
   * @description 将指定动画绑定的组件恢复到初始状态（从 componentDefaultConfigMap 中获取）
   * @param animationId 动画ID
   * @param _statusId 状态ID（当为"0"时表示初始状态，此参数暂未使用）
   */
  const triggerResetToInitialState = async (animationId: string, _statusId: string) => {
    if (componentDefaultConfigMap.value.size === 0) {
      console.warn("没有组件的初始状态配置");
      return;
    }

    // 获取当前动画绑定的组件列表（通过第一个状态获取，因为每个状态的组件都是一样的）
    const animationStatuses = componentAnimations.value[animationId];
    if (!animationStatuses) {
      console.warn(`动画 ${animationId} 不存在`);
      return;
    }

    const statusIds = Object.keys(animationStatuses);
    if (statusIds.length === 0) {
      console.warn(`动画 ${animationId} 没有任何状态`);
      return;
    }

    // 通过第一个状态获取组件列表
    const firstStatusId = statusIds[0];
    const firstStatusComponents = animationStatuses[firstStatusId];
    const targetComponentIds = Object.keys(firstStatusComponents);

    if (targetComponentIds.length === 0) {
      console.warn(`动画 ${animationId} 中没有找到绑定的组件`);
      return;
    }

    // 获取动画持续时间
    const animationData = animations.value[animationId];
    const duration = animationData?.duration || 1000;

    // 为每个组件触发过渡动画恢复到初始状态
    const animationPromises = targetComponentIds.map(async (componentId) => {
      const defaultConfig = componentDefaultConfigMap.value.get(componentId);
      if (!defaultConfig) {
        console.warn(`组件 ${componentId} 没有初始状态配置，跳过恢复`);
        return;
      }

      const component = allComponentMap.value.get(componentId);
      if (!component) {
        console.warn(`组件 ${componentId} 不存在，跳过恢复`);
        return;
      }

      // 触发带过渡动画的恢复
      await triggerComponentResetWithAnimation({
        componentId,
        defaultConfig,
        duration,
        animationId,
        statusId: firstStatusId
      });

      console.log(`组件 ${componentId} 已通过动画恢复到初始状态`);
    });

    // 等待所有组件的恢复动画完成
    await Promise.all(animationPromises);

    console.log(`动画 ${animationId} 绑定的所有组件已通过动画恢复到初始状态`);
  };

  /**
   * 触发组件带动画恢复到初始状态
   * @param componentId 组件ID
   * @param defaultConfig 初始状态配置
   * @param duration 动画持续时间
   */
  const triggerComponentResetWithAnimation = async ({
    componentId,
    defaultConfig,
    duration,
    animationId,
    statusId
  }: {
    componentId: string;
    defaultConfig: ComponentType;
    duration: number;
    animationId: string;
    statusId: string;
  }) => {
    const component = allComponentMap.value.get(componentId);

    if (!component) {
      console.warn(`组件 ${componentId} 不存在，跳过恢复`);
      return;
    }

    // 确保组件可见
    if (!component.display) {
      component.display = true;
    }

    // 创建临时的重置动画ID和状态ID
    const resetAnimationId = `reset-animation-${componentId}-${Date.now()}`;
    const resetStatusId = "reset-status";

    // 使用 ComponentConfigBuilder 从默认配置创建状态动画数据
    const builder = ComponentConfigBuilder.createDefault();

    const currentStatusAnimationData = componentAnimations.value[animationId]?.[statusId]?.[componentId];

    // 使用 ComponentConfigBuilder 的 extractToComponent 方法从默认配置中提取动画配置
    const extractResult = builder.extract({
      animationConfig: currentStatusAnimationData,
      component: defaultConfig
    });

    // 使用 updateAnimationStateData 来更新动画状态（处理 immer 对象）
    const currentState = {
      animations: { ...animations.value },
      statusAnimations: { ...state.statusAnimations.value },
      componentAnimations: { ...componentAnimations.value }
    };

    // 添加重置动画数据
    currentState.animations[resetAnimationId] = {
      id: resetAnimationId,
      name: `重置动画-${componentId}`,
      duration
    };

    if (!currentState.componentAnimations[resetAnimationId]) {
      currentState.componentAnimations[resetAnimationId] = {};
    }
    if (!currentState.componentAnimations[resetAnimationId][resetStatusId]) {
      currentState.componentAnimations[resetAnimationId][resetStatusId] = {};
    }
    currentState.componentAnimations[resetAnimationId][resetStatusId][componentId] = JSON.parse(
      JSON.stringify(extractResult.config)
    ) as ComponentAnimationConfig;

    // 使用 updateAnimationState 更新状态
    state.updateAnimationState(currentState);

    try {
      // 使用现有的 triggerSingleComponentAnimation 函数
      await triggerSingleComponentAnimation(componentId, resetAnimationId, resetStatusId);
    } finally {
      // 清理临时数据
      const cleanupState = {
        animations: { ...animations.value },
        statusAnimations: { ...state.statusAnimations.value },
        componentAnimations: { ...componentAnimations.value }
      };

      delete cleanupState.animations[resetAnimationId];
      delete cleanupState.componentAnimations[resetAnimationId];

      state.updateAnimationState(cleanupState);
    }
  };

  return {
    triggerStatusAnimation: triggerStatusAnimationOnEdit,
    triggerStatusAnimationByAction,
    triggerSingleComponentAnimation,
    triggerResetToInitialState,
    triggerComponentResetWithAnimation,
    // 导出新的拆分函数供测试使用
    prepareComponentAnimation,
    createAnimationCallbacks,
    applyComponentState
  };
}

export type UseAnimationTriggerReturn = ReturnType<typeof useAnimationTrigger>;
