import { ElMessage } from "element-plus";

import type { ComponentType } from "@/views/build/components/buildRender/type";
import { FolderType } from "@/views/build/components/buildRender/type";

import type { AnimationProperty, ComponentAnimationConfig } from "../../type";
import type { UpdateRemoteDataParam } from "../../utils/utils";
import { createComponentAnimationConfigWithKeys, updateRemoteDataThrottle } from "../../utils/utils";
import { ComponentConfigBuilder, smartApplyComponentConfig } from "./generators";
import type { UseAnimationOperationsReturn } from "./useAnimationOperations";
import type { UseStatusAnimationStateReturn } from "./useStatusAnimationState";

/**
 * 更新备份组件配置
 * @description 从当前组件中提取指定属性的最新值并更新到备份组件中
 * @param component 当前组件
 * @param backupComponent 备份组件
 * @param keysToAdd 需要添加的属性键列表
 */
function updateBackupComponentConfig(
  component: ComponentType,
  backupComponent: ComponentType,
  keysToAdd: string[]
): void {
  if (keysToAdd.length === 0) {
    return;
  }

  // 使用 ComponentConfigBuilder 从当前组件中提取指定属性的最新值
  const builder = ComponentConfigBuilder.createDefault();
  const template = {} as Partial<ComponentAnimationConfig>;
  keysToAdd.forEach((key) => {
    (template as any)[key] = undefined;
  });

  const extractResult = builder.extract({ component, animationConfig: template });

  if (extractResult.appliedMappings.length > 0) {
    // 更新备份组件中的对应属性
    keysToAdd.forEach((key) => {
      const extractedValue = (extractResult.config as any)[key];
      if (extractedValue !== undefined) {
        // 使用生成器构建组件配置来正确应用属性值到备份
        const buildResult = builder.build({
          animationConfig: { [key]: extractedValue },
          component: backupComponent
        });

        if (buildResult.appliedMappings.length > 0) {
          smartApplyComponentConfig(backupComponent, buildResult.config);
        }
      }
    });
  }
}

/**
 * 组件操作模块
 * @description 提供组件相关的操作功能
 */
export function useComponentOperations(
  state: UseStatusAnimationStateReturn,
  animationOps: UseAnimationOperationsReturn
) {
  const {
    animations,
    statusAnimations,
    componentAnimations,
    selectAnimationId,
    setSelectStatusId,
    updateAnimationState,
    resetTargetComponentConfig,
    snapshotComponentConfig,
    editorVisible,
    allComponentMap,
    screenId,
    componentDefaultConfigMap
  } = state;

  const { handleRemoteUpdate } = animationOps;

  /**
   * 添加组件到状态动画
   * @description 将组件添加到当前选中动画组的所有状态中
   * @param componentAnimationConfig 组件动画配置
   */
  const onAddComponentToStatusAnimation = async (componentAnimationConfig: ComponentAnimationConfig) => {
    const allStatusIds = Object.keys(statusAnimations.value[selectAnimationId.value] || {});

    const newAnimationComponents: Record<string, Record<string, ComponentAnimationConfig>> = {};

    allStatusIds.forEach((statusId) => {
      newAnimationComponents[statusId] = {
        ...(componentAnimations.value[selectAnimationId.value]?.[statusId] || {}),
        [componentAnimationConfig.componentId]: componentAnimationConfig
      };
    });

    const newComponentAnimations = {
      ...componentAnimations.value,
      [selectAnimationId.value]: newAnimationComponents
    };

    const backUpData = {
      animations: animations.value,
      statusAnimations: statusAnimations.value,
      componentAnimations: componentAnimations.value
    };

    const toUpdateData = {
      animations: animations.value,
      statusAnimations: statusAnimations.value,
      componentAnimations: newComponentAnimations
    };

    updateAnimationState(toUpdateData);

    await handleRemoteUpdate(toUpdateData, backUpData);

    snapshotComponentConfig();

    return toUpdateData;
  };

  /**
   * 为当前选中动画的所有状态按需添加过渡属性
   * @param componentId 目标组件ID
   * @param keys 要添加的属性键列表（受 AnimationProperty 约束）
   */
  const addTransitionPropertiesForComponent = async (componentId: string, keys: Array<keyof AnimationProperty>) => {
    if (!componentId) {
      return;
    }
    if (!selectAnimationId.value) {
      ElMessage.error("请先选择动画");
      return;
    }

    const component = allComponentMap.value.get(componentId);
    if (!component) {
      ElMessage.error("组件不存在");
      return;
    }

    // 合并到所有状态
    const currentAnimationId = selectAnimationId.value;
    const allStatusIds = Object.keys(statusAnimations.value[currentAnimationId] || {});

    // 检查哪些属性需要实际添加（过滤掉已存在的）
    const existingKeys = new Set<keyof AnimationProperty>();
    const keysToAdd: Array<keyof AnimationProperty> = [];

    // 从第一个状态中检查已存在的属性
    if (allStatusIds.length > 0) {
      const firstStatusId = allStatusIds[0];
      const existingConfig = componentAnimations.value[currentAnimationId]?.[firstStatusId]?.[componentId];

      if (existingConfig) {
        keys.forEach((key) => {
          if (existingConfig[key] !== undefined) {
            existingKeys.add(key);
          } else {
            keysToAdd.push(key);
          }
        });
      } else {
        keysToAdd.push(...keys);
      }
    } else {
      keysToAdd.push(...keys);
    }

    // 如果所有属性都已存在，则跳过
    if (keysToAdd.length === 0) {
      if (existingKeys.size > 0) {
        const existingKeysList = Array.from(existingKeys).join(", ");
        ElMessage.warning(`属性 [${existingKeysList}] 已存在，跳过添加`);
      }
      return;
    }

    // 基于需要添加的属性生成最小配置
    try {
      const partialConfig = createComponentAnimationConfigWithKeys(component, keysToAdd);

      const nextComponentAnimations = { ...componentAnimations.value };
      nextComponentAnimations[currentAnimationId] = {
        ...(nextComponentAnimations[currentAnimationId] || {})
      };

      allStatusIds.forEach((statusId) => {
        const prevStatusMap = nextComponentAnimations[currentAnimationId][statusId] || {};
        const prevComponentConfig = prevStatusMap[componentId] || { componentId };

        // 只添加新属性，不覆盖已存在的属性
        const newConfig: ComponentAnimationConfig = { ...prevComponentConfig };
        keysToAdd.forEach((key) => {
          if (partialConfig[key] !== undefined) {
            (newConfig as any)[key] = partialConfig[key];
          }
        });

        nextComponentAnimations[currentAnimationId][statusId] = {
          ...prevStatusMap,
          [componentId]: newConfig
        };
      });

      const backUpData = {
        animations: animations.value,
        statusAnimations: statusAnimations.value,
        componentAnimations: componentAnimations.value
      };

      const toUpdateData = {
        animations: animations.value,
        statusAnimations: statusAnimations.value,
        componentAnimations: nextComponentAnimations
      };

      updateAnimationState(toUpdateData);
      await handleRemoteUpdate(toUpdateData, backUpData);

      // 更新备份组件配置（从当前组件中提取最新值）
      const currentBackup = componentDefaultConfigMap.value.get(componentId);
      if (currentBackup) {
        updateBackupComponentConfig(component, currentBackup, keysToAdd);
      }
    } catch (error) {
      if (error instanceof Error) {
        ElMessage.error(error.message);
      } else {
        ElMessage.error("生成组件动画配置失败");
      }
      return;
    }
  };

  /**
   * 为当前选中动画的所有状态按需删除过渡属性
   * @param componentId 目标组件ID
   * @param keys 要删除的属性键列表（受 AnimationProperty 约束）
   */
  const removeTransitionPropertiesForComponent = async (componentId: string, keys: Array<keyof AnimationProperty>) => {
    if (!componentId) {
      return;
    }
    if (!selectAnimationId.value) {
      ElMessage.error("请先选择动画");
      return;
    }

    if (!keys || keys.length === 0) {
      console.warn("没有指定要删除的属性");
      return;
    }

    const component = allComponentMap.value.get(componentId);
    if (!component) {
      ElMessage.error("组件不存在");
      return;
    }

    // 验证组件是否存在于当前动画中
    const currentAnimationId = selectAnimationId.value;
    const allStatusIds = Object.keys(statusAnimations.value[currentAnimationId] || {});

    const componentExistsInAnimation = allStatusIds.some(
      (statusId) => componentAnimations.value[currentAnimationId]?.[statusId]?.[componentId]
    );

    if (!componentExistsInAnimation) {
      console.warn(`组件 ${componentId} 在当前动画中不存在`);
      return;
    }

    // 从所有状态中删除指定属性
    const nextComponentAnimations = { ...componentAnimations.value };
    nextComponentAnimations[currentAnimationId] = {
      ...(nextComponentAnimations[currentAnimationId] || {})
    };

    allStatusIds.forEach((statusId) => {
      const prevStatusMap = nextComponentAnimations[currentAnimationId][statusId] || {};
      const prevComponentConfig = prevStatusMap[componentId] || { componentId };

      // 创建新的组件配置，删除指定属性
      const newComponentConfig = { ...prevComponentConfig };

      keys.forEach((key) => {
        // 删除指定的动画属性
        delete newComponentConfig[key];
      });

      nextComponentAnimations[currentAnimationId][statusId] = {
        ...prevStatusMap,
        [componentId]: newComponentConfig
      };
    });

    const backUpData = {
      animations: animations.value,
      statusAnimations: statusAnimations.value,
      componentAnimations: componentAnimations.value
    };

    const toUpdateData = {
      animations: animations.value,
      statusAnimations: statusAnimations.value,
      componentAnimations: nextComponentAnimations
    };

    updateAnimationState(toUpdateData);
    await handleRemoteUpdate(toUpdateData, backUpData);

    // 恢复组件的属性值到备份状态
    const backupComponent = componentDefaultConfigMap.value.get(componentId);
    if (backupComponent) {
      const builder = ComponentConfigBuilder.createDefault();

      keys.forEach((propertyKey) => {
        // 使用 ComponentConfigBuilder 提取备份组件中的指定属性值
        const template = { [propertyKey]: undefined } as Partial<ComponentAnimationConfig>;
        const extractResult = builder.extract({ component: backupComponent, animationConfig: template });

        if (extractResult.appliedMappings.length > 0) {
          const extractedValue = extractResult.config[propertyKey];
          if (extractedValue !== undefined) {
            // 使用生成器构建组件配置来正确应用属性值
            const buildResult = builder.build({ animationConfig: { [propertyKey]: extractedValue }, component });

            if (buildResult.appliedMappings.length > 0) {
              smartApplyComponentConfig(component, buildResult.config);
            }
          }
        }
      });
    }
  };

  /**
   * 处理组件添加到状态动画
   * @description 这是从 index.vue 移动过来的函数，用于处理组件添加到状态动画的逻辑
   * @param component 要添加的组件
   */
  const handleComponentAddToStatusAnimation = async ({ component }: { component: ComponentType }) => {
    // 如果编辑器未打开，则不进行添加
    if (!editorVisible.value) {
      return;
    }

    // 检查是否已选择动画
    if (!selectAnimationId.value) {
      ElMessage.error("请先选择动画");
      return;
    }

    if (!component) {
      ElMessage.error("组件不存在");
      return;
    }

    if (component.component.prop === FolderType.group) {
      ElMessage.error("分组组件不能添加到状态动画");
      return;
    }

    // 使用生成器的反向提取功能来构建组件动画配置
    const builder = ComponentConfigBuilder.createDefault();

    // 创建基础模板，只提取 zIndex 字段
    const extractTemplate = {
      zIndex: 0 // 值不重要，只是表示需要提取这个字段
    } as Partial<ComponentAnimationConfig>;

    const extractResult = builder.extract({ component, animationConfig: extractTemplate });

    // 构建最终的组件动画配置，使用传统方法确保类型正确
    const toAddComponentAnimation: ComponentAnimationConfig = createComponentAnimationConfigWithKeys(component, [
      "zIndex"
    ]);

    // 使用生成器提取的值覆盖传统方法的值（如果提取成功）
    if (extractResult.config.zIndex !== undefined) {
      toAddComponentAnimation.zIndex = extractResult.config.zIndex;
    }

    try {
      await onAddComponentToStatusAnimation(toAddComponentAnimation);
    } catch (error) {
      console.error("添加组件到状态动画失败:", error);
      ElMessage.error("添加组件失败");
    }
  };

  /**
   * 从状态动画中删除组件
   * @description 从当前选中动画组的所有状态中删除指定组件
   * @param componentId 要删除的组件ID
   */
  const onDeleteComponentFromStatusAnimation = async (componentId: string) => {
    if (!componentId) {
      return console.warn("组件ID不能为空");
    }

    if (!selectAnimationId.value || !animations.value[selectAnimationId.value]) {
      return console.warn("未选中动画组或动画组不存在");
    }

    const allStatusIds = Object.keys(statusAnimations.value[selectAnimationId.value] || {});

    const componentExistsInAnyStatus = allStatusIds.some(
      (statusId) => componentAnimations.value[selectAnimationId.value]?.[statusId]?.[componentId]
    );

    if (!componentExistsInAnyStatus) {
      return console.warn(`组件 ${componentId} 在当前动画组中不存在，无法删除`);
    }

    const newAnimationComponents: Record<string, Record<string, ComponentAnimationConfig>> = {};

    allStatusIds.forEach((statusId) => {
      const currentStatusComponents = { ...(componentAnimations.value[selectAnimationId.value]?.[statusId] || {}) };

      if (currentStatusComponents[componentId]) {
        delete currentStatusComponents[componentId];
      }

      newAnimationComponents[statusId] = currentStatusComponents;
    });

    const newComponentAnimations = {
      ...componentAnimations.value,
      [selectAnimationId.value]: newAnimationComponents
    };

    const backUpData = {
      animations: animations.value,
      statusAnimations: statusAnimations.value,
      componentAnimations: componentAnimations.value
    };

    const toUpdateData = {
      animations: animations.value,
      statusAnimations: statusAnimations.value,
      componentAnimations: newComponentAnimations
    };

    updateAnimationState(toUpdateData);
    await handleRemoteUpdate(toUpdateData, backUpData);
    resetTargetComponentConfig(componentId);
  };

  /**
   * 从所有动画中删除组件
   * @description 从所有动画组的所有状态中删除指定组件，用于组件被删除时的清理工作
   * @param componentId 要删除的组件ID
   */
  const onDeleteComponentFromAllAnimations = async (componentId: string) => {
    if (!componentId) {
      return console.warn("组件ID不能为空");
    }

    const hasComponentInAnyAnimation = Object.keys(componentAnimations.value).some((animationId) =>
      Object.keys(componentAnimations.value[animationId] || {}).some(
        (statusId) =>
          componentAnimations.value[animationId][statusId] &&
          componentAnimations.value[animationId][statusId][componentId]
      )
    );

    if (!hasComponentInAnyAnimation) {
      return;
    }

    const newComponentAnimations: Record<string, Record<string, Record<string, ComponentAnimationConfig>>> = {};

    Object.keys(componentAnimations.value).forEach((animationId) => {
      const animationStatuses = componentAnimations.value[animationId] || {};

      const newAnimationStatuses: Record<string, Record<string, ComponentAnimationConfig>> = {};

      Object.keys(animationStatuses).forEach((statusId) => {
        const statusComponents = { ...animationStatuses[statusId] };

        if (statusComponents[componentId]) {
          delete statusComponents[componentId];
          console.log(`已从动画组 ${animationId} 的状态 ${statusId} 中删除组件 ${componentId}`);
        }

        newAnimationStatuses[statusId] = statusComponents;
      });

      newComponentAnimations[animationId] = newAnimationStatuses;
    });

    const backUpData = {
      animations: animations.value,
      statusAnimations: statusAnimations.value,
      componentAnimations: componentAnimations.value
    };

    const toUpdateData = {
      animations: animations.value,
      statusAnimations: statusAnimations.value,
      componentAnimations: newComponentAnimations
    };

    updateAnimationState(toUpdateData);

    await updateRemoteDataThrottle({
      screenId: screenId.value,
      data: toUpdateData,
      onError: () => {
        console.error(`清理组件 ${componentId} 动画数据失败，正在回滚...`);
        updateAnimationState(backUpData);
      }
    } as UpdateRemoteDataParam);

    console.log(`组件 ${componentId} 的动画数据清理完成`);
  };

  /**
   * 面板删除时删除相关动画数据
   * @description 当面板被删除时，删除所有与该面板关联的动画数据
   * @param panelId 要删除的面板ID
   */
  const deleteAnimationOnPanelDelete = async (panelId: number) => {
    // 1. 收集所有需要删除的 animationId
    const animationIdsToDelete: string[] = [];
    Object.keys(animations.value).forEach((animationId) => {
      const animation = animations.value[animationId];
      if (animation.panelId === panelId) {
        animationIdsToDelete.push(animationId);
      }
    });

    if (animationIdsToDelete.length === 0) {
      return; // 没有需要删除的动画
    }

    // 2. 从三个数据结构中移除这些动画
    const newAnimations = { ...animations.value };
    const newStatusAnimations = { ...statusAnimations.value };
    const newComponentAnimations = { ...componentAnimations.value };

    animationIdsToDelete.forEach((animationId) => {
      delete newAnimations[animationId];
      delete newStatusAnimations[animationId];
      delete newComponentAnimations[animationId];
    });

    // 3. 备份原数据
    const backUpData = {
      animations: animations.value,
      statusAnimations: statusAnimations.value,
      componentAnimations: componentAnimations.value
    };

    // 4. 构造更新数据
    const toUpdateData = {
      animations: newAnimations,
      statusAnimations: newStatusAnimations,
      componentAnimations: newComponentAnimations
    };

    // 5. 更新状态
    updateAnimationState(toUpdateData);

    // 6. 调用远程更新服务（失败时回滚）
    updateRemoteDataThrottle({
      screenId: screenId.value,
      data: toUpdateData,
      onError: () => {
        console.error(`面板 ${panelId} 动画数据删除失败，正在回滚...`);
        updateAnimationState(backUpData);
      }
    } as UpdateRemoteDataParam);

    // 7. 如果当前选中的动画被删除了，清空选中状态
    if (animationIdsToDelete.includes(selectAnimationId.value)) {
      selectAnimationId.value = "";
      setSelectStatusId("");
    }

    console.log(`面板 ${panelId} 的 ${animationIdsToDelete.length} 个动画数据已删除`);
  };

  /**
   * 删除组件的指定属性并恢复到默认值
   * @param componentId 目标组件ID
   * @param propertyKey 要删除的属性键
   */
  const removePropertyAndRestoreDefault = async (componentId: string, propertyKey: keyof AnimationProperty) => {
    if (!componentId || !propertyKey) {
      return;
    }
    if (!selectAnimationId.value) {
      ElMessage.error("请先选择动画");
      return;
    }

    const component = allComponentMap.value.get(componentId);
    if (!component) {
      ElMessage.error("组件不存在");
      return;
    }

    // 获取备份的组件配置
    const backupComponent = componentDefaultConfigMap.value.get(componentId);
    if (!backupComponent) {
      ElMessage.error("找不到组件的备份配置");
      return;
    }

    // 删除指定属性（恢复逻辑已包含在 removeTransitionPropertiesForComponent 中）
    await removeTransitionPropertiesForComponent(componentId, [propertyKey]);

    ElMessage.success("属性删除成功，已恢复到默认值");
  };

  return {
    onAddComponentToStatusAnimation,
    addTransitionPropertiesForComponent,
    removeTransitionPropertiesForComponent,
    handleComponentAddToStatusAnimation,
    onDeleteComponentFromStatusAnimation,
    onDeleteComponentFromAllAnimations,
    removePropertyAndRestoreDefault,
    deleteAnimationOnPanelDelete
  };
}

export type UseComponentOperationsReturn = ReturnType<typeof useComponentOperations>;
