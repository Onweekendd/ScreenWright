import type { StatusAnimationResponse } from "../../type";
import type { UpdateRemoteDataParam } from "../../utils/utils";
import { createDefaultAnimation, updateRemoteDataThrottle } from "../../utils/utils";
import type { UseStatusAnimationStateReturn } from "./useStatusAnimationState";

export interface UpdateAnimationNameParams {
  animationId: string;
  newName: string;
}

/**
 * 动画组操作模块
 * @description 提供动画组的增删改查功能
 */
export function useAnimationOperations(state: UseStatusAnimationStateReturn) {
  const { animations, statusAnimations, componentAnimations, updateAnimationState, screenId, selectAnimationId } =
    state;

  /**
   * 处理远程数据更新
   * @description 将动画数据同步到远程服务器，失败时自动回滚到备份数据
   * @param toUpdateData 要更新的动画数据
   * @param backUpData 备份数据，用于失败时回滚
   */
  const handleRemoteUpdate = async (toUpdateData: StatusAnimationResponse, backUpData: StatusAnimationResponse) => {
    await updateRemoteDataThrottle({
      screenId: screenId.value,
      data: toUpdateData,
      onError: () => {
        updateAnimationState(backUpData);
      }
    } as UpdateRemoteDataParam);
  };

  /**
   * 添加动画组
   * @description 创建一个新的动画组，包含默认的动画配置、状态和组件动画
   * @param params 添加动画的参数
   * @param params.panelId 面板ID（可选）
   * @param params.activeStatusId 面板状态ID（可选）
   * @param params.statusIndex 状态索引
   */
  const onAddAnimation = async ({
    panelId,
    activeStatusId,
    statusIndex
  }: {
    panelId?: number;
    activeStatusId?: string;
    statusIndex: number;
  }) => {
    try {
      const {
        animations: animationsToAdd,
        statusAnimations: statusAnimationsToAdd,
        componentAnimations: componentAnimationsToAdd
      } = createDefaultAnimation({
        panelId,
        activeStatusId,
        statusIndex,
        existingAnimations: {
          animations: animations.value,
          statusAnimations: statusAnimations.value,
          componentAnimations: componentAnimations.value
        }
      });

      const backUpData = {
        animations: animations.value,
        statusAnimations: statusAnimations.value,
        componentAnimations: componentAnimations.value
      };

      const newAnimations = { ...animations.value, ...animationsToAdd };
      const newStatusAnimations = { ...statusAnimations.value, ...statusAnimationsToAdd };
      const newComponentAnimations = { ...componentAnimations.value, ...componentAnimationsToAdd };

      const toUpdateData = {
        animations: newAnimations,
        statusAnimations: newStatusAnimations,
        componentAnimations: newComponentAnimations
      };

      updateAnimationState(toUpdateData);
      await handleRemoteUpdate(toUpdateData, backUpData);
    } catch (error) {
      console.error("添加动画失败:", error instanceof Error ? error.message : String(error));
      throw error;
    }
  };

  /**
   * 删除动画组
   * @description 删除指定的动画组及其相关的状态动画和组件动画数据
   * @param toDeleteAnimationId 要删除的动画组ID
   */
  const onDeleteAnimation = async (toDeleteAnimationId: string) => {
    if (!toDeleteAnimationId) {
      return console.warn("删除动画ID不能为空");
    }

    if (!animations.value[toDeleteAnimationId]) {
      return console.warn(`动画组 ${toDeleteAnimationId} 不存在，无法删除`);
    }

    const { [toDeleteAnimationId]: _deletedAnimation, ...restAnimations } = animations.value;
    const { [toDeleteAnimationId]: _deletedStatusAnimation, ...restStatusAnimations } = statusAnimations.value;
    const { [toDeleteAnimationId]: _deletedComponentAnimation, ...restComponentAnimations } = componentAnimations.value;

    const backUpData = {
      animations: animations.value,
      statusAnimations: statusAnimations.value,
      componentAnimations: componentAnimations.value
    };

    const toUpdateData = {
      animations: restAnimations,
      statusAnimations: restStatusAnimations,
      componentAnimations: restComponentAnimations
    };

    updateAnimationState(toUpdateData);
    await handleRemoteUpdate(toUpdateData, backUpData);
  };

  /**
   * 更新动画持续时间
   * @description 更新当前选中动画组的持续时间
   * @param newDuration 新的持续时间（毫秒）
   */
  const onUpdateAnimationDuration = async (newDuration: number) => {
    if (!selectAnimationId.value) return;

    const newAnimations = {
      ...animations.value,
      [selectAnimationId.value]: {
        ...animations.value[selectAnimationId.value],
        duration: newDuration
      }
    };

    const backUpData = {
      animations: animations.value,
      statusAnimations: statusAnimations.value,
      componentAnimations: componentAnimations.value
    };

    const toUpdateData = {
      animations: newAnimations,
      statusAnimations: statusAnimations.value,
      componentAnimations: componentAnimations.value
    };

    updateAnimationState(toUpdateData);
    await handleRemoteUpdate(toUpdateData, backUpData);
  };

  /**
   * 更新持续时间
   * @description 更新当前选中动画组的持续时间（简化版本，不包含备份回滚）
   * @param newDuration 新的持续时间（毫秒）
   */
  const updateDuration = async (newDuration: number) => {
    if (!selectAnimationId.value) return;

    const newAnimations = {
      ...animations.value,
      [selectAnimationId.value]: {
        ...animations.value[selectAnimationId.value],
        duration: newDuration
      }
    };

    const toUpdateData = {
      animations: newAnimations,
      statusAnimations: statusAnimations.value,
      componentAnimations: componentAnimations.value
    };

    updateAnimationState(toUpdateData);

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
   * 更新动画名称
   * @description 更新指定动画组的名称
   * @param params 更新参数
   * @param params.animationId 动画组ID
   * @param params.newName 新的动画名称
   */
  const updateAnimationName = async ({ animationId, newName }: UpdateAnimationNameParams) => {
    if (!animationId || !animations.value[animationId]) {
      return console.warn("未找到要更新名称的动画组");
    }

    const newAnimations = {
      ...animations.value,
      [animationId]: {
        ...animations.value[animationId],
        name: newName
      }
    };

    const backUpData = {
      animations: animations.value,
      statusAnimations: statusAnimations.value,
      componentAnimations: componentAnimations.value
    };

    const toUpdateData = {
      animations: newAnimations,
      statusAnimations: statusAnimations.value,
      componentAnimations: componentAnimations.value
    };

    updateAnimationState(toUpdateData);
    await handleRemoteUpdate(toUpdateData, backUpData);
  };

  return {
    onAddAnimation,
    onDeleteAnimation,
    onUpdateAnimationDuration,
    updateDuration,
    updateAnimationName,
    handleRemoteUpdate
  };
}

export type UseAnimationOperationsReturn = ReturnType<typeof useAnimationOperations>;
