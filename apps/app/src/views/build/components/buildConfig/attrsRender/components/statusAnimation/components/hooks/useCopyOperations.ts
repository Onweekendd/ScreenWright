import { uuid } from "@/utils/utils";
import type { PanelState } from "@/views/build/components/buildRender/core/SystemComponent/type";

import type { AnimationInfo, ComponentAnimationConfig, StatusAnimationMapping } from "../../type";
import type { UseConfigSyncReturn } from "./useConfigSync";
import type { UseStatusAnimationStateReturn } from "./useStatusAnimationState";

/**
 * 复制操作模块
 * @description 提供复制相关的操作功能
 */
export function useCopyOperations(state: UseStatusAnimationStateReturn, configSync: UseConfigSyncReturn) {
  const {
    animations,
    statusAnimations,
    componentAnimations,
    getCurrentAnimationList,
    updateAnimationState,
    panelInfo
  } = state;

  const { syncStatusAnimationDataToServer } = configSync;

  /**
   * 复制组件动画配置，更新组件ID映射
   * @param componentAnimationConfig 原始组件动画配置
   * @param componentIdMap 组件ID映射表
   * @returns 复制的组件动画配置或null
   */
  const copyComponentAnimationConfig = (
    componentAnimationConfig: ComponentAnimationConfig,
    componentIdMap: Record<number, number>
  ): ComponentAnimationConfig | null => {
    const newComponentId = componentIdMap[parseInt(componentAnimationConfig.componentId)];
    if (!newComponentId) {
      return null; // 组件没有被复制，跳过
    }
    return {
      ...componentAnimationConfig,
      componentId: newComponentId.toString()
    };
  };

  /**
   * 复制组件动画配置集合
   * @param originalComponentAnimations 原始组件动画配置
   * @param _copiedStatusId 复制的状态ID
   * @param componentIdMap 组件ID映射表
   * @param statusIdMap 状态ID映射表
   * @returns 复制的组件动画配置
   */
  const copyComponentAnimationConfigs = (
    originalComponentAnimations: Record<string, Record<string, ComponentAnimationConfig>>,
    _copiedStatusId: string,
    componentIdMap: Record<number, number>,
    statusIdMap: Record<string, string>
  ): Record<string, Record<string, ComponentAnimationConfig>> => {
    const copiedComponentAnimations: Record<string, Record<string, ComponentAnimationConfig>> = {};

    Object.entries(originalComponentAnimations).forEach(([statusId, componentConfigs]) => {
      const newStatusId = statusIdMap[statusId];
      if (!newStatusId) return;

      copiedComponentAnimations[newStatusId] = {};

      Object.entries(componentConfigs).forEach(([_componentId, config]) => {
        const copiedConfig = copyComponentAnimationConfig(config, componentIdMap);
        if (copiedConfig) {
          copiedComponentAnimations[newStatusId][copiedConfig.componentId] = copiedConfig;
        }
      });
    });

    return copiedComponentAnimations;
  };

  /**
   * 复制状态时同时复制相关的状态动画配置
   * @param originalStatus 原始状态
   * @param copiedStatus 复制的新状态
   * @param componentIdMap 新旧组件ID映射表，key为旧组件ID，value为新组件ID
   *
   * @example
   * ```typescript
   * // 在复制状态时，需要先收集组件ID映射表
   * const componentIdMap: Record<number, number> = {}
   *
   * // 假设在复制组件时收集映射关系
   * originalStatus.config.forEach((originalComponent, index) => {
   *   const copiedComponent = copiedStatus.config[index]
   *   if (originalComponent && copiedComponent) {
   *     componentIdMap[originalComponent.id] = copiedComponent.id
   *   }
   * })
   *
   * // 然后调用复制状态动画配置
   * await copyStatusAnimationOnStatusCopy(originalStatus, copiedStatus, componentIdMap)
   * ```
   */
  const copyStatusAnimationOnStatusCopy = async (
    originalStatus: PanelState,
    copiedStatus: PanelState,
    componentIdMap: Record<number, number>
  ) => {
    try {
      // 1. 获取原始状态相关的动画列表
      const originalAnimationList = getCurrentAnimationList(panelInfo.value.config.id, originalStatus.id);

      if (originalAnimationList.length === 0) {
        return; // 没有状态动画需要复制
      }

      // 2. 复制动画信息
      const copiedAnimations: Record<string, AnimationInfo> = {};
      const animationIdMap: Record<string, string> = {};

      originalAnimationList.forEach((animation) => {
        const newAnimationId = uuid();
        animationIdMap[animation.id] = newAnimationId;

        copiedAnimations[newAnimationId] = {
          ...animation,
          id: newAnimationId,
          name: `${animation.name}_副本`,
          panelId: panelInfo.value.config.id,
          statusId: copiedStatus.id
        };
      });

      // 3. 复制状态动画映射和组件动画配置
      const copiedStatusAnimations: Record<string, Record<string, StatusAnimationMapping>> = {};
      const copiedComponentAnimations: Record<string, Record<string, Record<string, ComponentAnimationConfig>>> = {};

      Object.entries(animationIdMap).forEach(([originalAnimationId, newAnimationId]) => {
        // 复制状态动画映射
        const originalStatusMappings = statusAnimations.value[originalAnimationId];
        if (originalStatusMappings) {
          const statusIdMap: Record<string, string> = {};
          const newStatusMappings: Record<string, StatusAnimationMapping> = {};

          Object.entries(originalStatusMappings).forEach(([statusId, statusMapping]) => {
            const newStatusId = uuid();
            statusIdMap[statusId] = newStatusId;
            newStatusMappings[newStatusId] = {
              statusId: newStatusId,
              statusName: `${statusMapping.statusName}_副本`
            };
          });

          copiedStatusAnimations[newAnimationId] = newStatusMappings;

          // 复制组件动画配置
          const originalComponentConfigs = componentAnimations.value[originalAnimationId];
          if (originalComponentConfigs) {
            copiedComponentAnimations[newAnimationId] = copyComponentAnimationConfigs(
              originalComponentConfigs,
              copiedStatus.id,
              componentIdMap,
              statusIdMap
            );
          }
        }
      });

      // 4. 更新本地状态
      const newAnimations = { ...animations.value, ...copiedAnimations };
      const newStatusAnimations = { ...statusAnimations.value, ...copiedStatusAnimations };
      const newComponentAnimations = { ...componentAnimations.value, ...copiedComponentAnimations };

      updateAnimationState({
        animations: newAnimations,
        statusAnimations: newStatusAnimations,
        componentAnimations: newComponentAnimations
      });

      // 5. 同步到服务器
      await syncStatusAnimationDataToServer(newAnimations, newStatusAnimations, newComponentAnimations);

      console.log(`成功复制 ${originalAnimationList.length} 个状态动画配置到新状态`, {
        originalStatusId: originalStatus.id,
        copiedStatusId: copiedStatus.id,
        componentIdMap,
        copiedAnimationCount: Object.keys(copiedAnimations).length
      });
    } catch (error) {
      console.error("复制状态动画配置失败:", error);
      // 如果出错，回滚操作
      updateAnimationState({
        animations: animations.value,
        statusAnimations: statusAnimations.value,
        componentAnimations: componentAnimations.value
      });
    }
  };

  return {
    copyStatusAnimationOnStatusCopy
  };
}

export type UseCopyOperationsReturn = ReturnType<typeof useCopyOperations>;
