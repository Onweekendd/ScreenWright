import { uuid } from "@/utils/utils";

import type { UpdateRemoteDataParam } from "../../utils/utils";
import { createNewStatus, deleteStatus, prepareUpdateData, updateRemoteDataThrottle } from "../../utils/utils";
import type { UseAnimationOperationsReturn } from "./useAnimationOperations";
import type { UseStatusAnimationStateReturn } from "./useStatusAnimationState";

export interface UpdateStatusNameParams {
  animationId: string;
  statusId: string;
  newName: string;
}

/**
 * 状态操作模块
 * @description 提供状态的增删改查功能
 */
export function useStatusOperations(state: UseStatusAnimationStateReturn, animationOps: UseAnimationOperationsReturn) {
  const {
    animations,
    statusAnimations,
    componentAnimations,
    selectAnimationId,
    selectStatusId,
    getCurrentStatusList,
    updateAnimationState,
    setSelectStatusId,
    screenId
  } = state;

  const { handleRemoteUpdate } = animationOps;

  /**
   * 添加状态到动画
   * @description 向当前选中的动画组添加新状态，复制最后一个状态的配置
   */
  const onAddStatusToAnimation = async () => {
    if (!selectAnimationId.value || !animations.value[selectAnimationId.value]) {
      return console.warn("未选中动画组或动画组不存在");
    }

    const currentAnimationStatusMap = statusAnimations.value[selectAnimationId.value] || {};
    const statusIds = Object.keys(currentAnimationStatusMap);

    if (statusIds.length === 0) {
      return console.warn("当前动画组没有可复制的状态");
    }

    const sourceStatusIndex = statusIds.length - 1;
    const sourceStatusId = statusIds[sourceStatusIndex];

    const { newStatusAnimation, newComponentAnimations } = createNewStatus({
      animationId: selectAnimationId.value,
      statusAnimations: statusAnimations.value,
      componentAnimations: componentAnimations.value,
      sourceStatusId
    });

    const { backUpData, toUpdateData } = prepareUpdateData({
      animations: animations.value,
      statusAnimations: statusAnimations.value,
      componentAnimations: componentAnimations.value,
      newStatusAnimation,
      newComponentAnimations
    });

    updateAnimationState(toUpdateData);
    await handleRemoteUpdate(toUpdateData, backUpData);
  };

  /**
   * 从动画中删除状态
   * @description 从指定动画组中删除指定状态，至少保留一个状态
   * @param animationId 动画组ID，不传则使用当前选中的动画组
   * @param statusId 要删除的状态ID，不传则使用当前选中的状态
   */
  const onDeleteStatusFromAnimation = async (animationId?: string, statusId?: string) => {
    const targetAnimationId = animationId || selectAnimationId.value;
    const targetStatusId = statusId || selectStatusId.value;

    if (!targetAnimationId || !animations.value[targetAnimationId]) {
      return console.warn("未指定动画组或动画组不存在");
    }

    if (!targetStatusId) {
      return console.warn("未指定要删除的状态");
    }

    const currentAnimationStatusMap = statusAnimations.value[targetAnimationId] || {};
    const statusIds = Object.keys(currentAnimationStatusMap);

    if (!currentAnimationStatusMap[targetStatusId]) {
      return console.warn(`状态 ${targetStatusId} 在动画组 ${targetAnimationId} 中不存在，无法删除`);
    }

    if (statusIds.length <= 1) {
      return console.warn("至少保留一个状态，无法删除");
    }

    const { newStatusAnimations, newComponentAnimations } = deleteStatus({
      animationId: targetAnimationId,
      statusId: targetStatusId,
      statusAnimations: statusAnimations.value,
      componentAnimations: componentAnimations.value
    });

    const { backUpData, toUpdateData } = prepareUpdateData({
      animations: animations.value,
      statusAnimations: statusAnimations.value,
      componentAnimations: componentAnimations.value,
      newStatusAnimation: newStatusAnimations,
      newComponentAnimations
    });

    updateAnimationState(toUpdateData);
    await handleRemoteUpdate(toUpdateData, backUpData);
  };

  /**
   * 添加状态
   * @description 向当前选中的动画组添加新状态，复制最后一个状态的组件配置
   */
  const addStatus = async () => {
    if (!selectAnimationId.value) return;

    const statusId = uuid();
    const newStatusIndex = Object.keys(statusAnimations.value[selectAnimationId.value] || {}).length + 1;

    const newStatusAnimations = {
      ...statusAnimations.value,
      [selectAnimationId.value]: {
        ...statusAnimations.value[selectAnimationId.value],
        [statusId]: {
          statusId,
          statusName: `状态${newStatusIndex}`
        }
      }
    };

    const statusList = getCurrentStatusList.value;
    const lastStatus = statusList[statusList.length - 1];

    const newComponentAnimations = {
      ...componentAnimations.value,
      [selectAnimationId.value]: {
        ...componentAnimations.value[selectAnimationId.value],
        [statusId]: {
          ...componentAnimations.value[selectAnimationId.value][lastStatus.statusId]
        }
      }
    };

    const toUpdateData = {
      animations: animations.value,
      statusAnimations: newStatusAnimations,
      componentAnimations: newComponentAnimations
    };

    updateAnimationState(toUpdateData);
    setSelectStatusId(statusId);

    await updateRemoteDataThrottle({
      screenId: screenId.value,
      data: toUpdateData,
      onError: () => {
        updateAnimationState({
          animations: animations.value,
          statusAnimations: statusAnimations.value,
          componentAnimations: componentAnimations.value
        });
      }
    } as UpdateRemoteDataParam);
  };

  /**
   * 更新状态名称
   * @description 更新指定动画组中指定状态的名称
   * @param params 更新参数
   * @param params.animationId 动画组ID
   * @param params.statusId 状态ID
   * @param params.newName 新的状态名称
   */
  const updateStatusName = async ({ animationId, statusId, newName }: UpdateStatusNameParams) => {
    if (!animationId || !statusId || !statusAnimations.value[animationId]?.[statusId]) {
      return console.warn("未找到要更新名称的状态");
    }

    const newStatusAnimations = {
      ...statusAnimations.value,
      [animationId]: {
        ...statusAnimations.value[animationId],
        [statusId]: {
          ...statusAnimations.value[animationId][statusId],
          statusName: newName
        }
      }
    };

    const backUpData = {
      animations: animations.value,
      statusAnimations: statusAnimations.value,
      componentAnimations: componentAnimations.value
    };

    const toUpdateData = {
      animations: animations.value,
      statusAnimations: newStatusAnimations,
      componentAnimations: componentAnimations.value
    };

    updateAnimationState(toUpdateData);
    await handleRemoteUpdate(toUpdateData, backUpData);
  };

  /**
   * 重新排序状态
   * @description 根据新的状态顺序重新排列状态动画和组件动画
   * @param animationId 动画组ID
   * @param newStatusOrder 新的状态顺序（状态ID数组）
   */
  const reorderStatuses = async (animationId: string, newStatusOrder: string[]) => {
    if (!animationId || !statusAnimations.value[animationId]) {
      return console.warn("动画组不存在");
    }

    const currentStatusMap = statusAnimations.value[animationId];
    const currentComponentMap = componentAnimations.value[animationId] || {};

    // 验证所有状态ID都存在
    const existingStatusIds = Object.keys(currentStatusMap);
    const isValidOrder = newStatusOrder.every((statusId) => existingStatusIds.includes(statusId));
    const hasAllStatuses = existingStatusIds.every((statusId) => newStatusOrder.includes(statusId));

    if (!isValidOrder || !hasAllStatuses) {
      return console.warn("状态顺序无效，包含不存在的状态或缺少状态");
    }

    // 重新构建状态动画映射
    const newStatusAnimations = {
      ...statusAnimations.value,
      [animationId]: {} as Record<string, (typeof currentStatusMap)[string]>
    };

    // 重新构建组件动画映射
    const newComponentAnimations = {
      ...componentAnimations.value,
      [animationId]: {} as Record<string, (typeof currentComponentMap)[string]>
    };

    // 按照新顺序重新排列
    newStatusOrder.forEach((statusId) => {
      newStatusAnimations[animationId][statusId] = currentStatusMap[statusId];
      if (currentComponentMap[statusId]) {
        newComponentAnimations[animationId][statusId] = currentComponentMap[statusId];
      }
    });

    const backUpData = {
      animations: animations.value,
      statusAnimations: statusAnimations.value,
      componentAnimations: componentAnimations.value
    };

    const toUpdateData = {
      animations: animations.value,
      statusAnimations: newStatusAnimations,
      componentAnimations: newComponentAnimations
    };

    updateAnimationState(toUpdateData);
    await handleRemoteUpdate(toUpdateData, backUpData);
  };

  return {
    onAddStatusToAnimation,
    onDeleteStatusFromAnimation,
    addStatus,
    updateStatusName,
    deleteStatus,
    reorderStatuses
  };
}

export type UseStatusOperationsReturn = ReturnType<typeof useStatusOperations>;
