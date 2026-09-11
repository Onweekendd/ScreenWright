import { toRaw } from "vue";

import { debounce, isEqual, omit } from "lodash-es";

import type { ComponentType } from "@/views/build/components/buildRender/type";

import type { ComponentAnimationConfig, StatusAnimationResponse } from "../../type";
import { ComponentConfigBuilder } from "./generators";
import type { UseAnimationOperationsReturn } from "./useAnimationOperations";
import type { UseAnimationTriggerReturn } from "./useAnimationTrigger";
import type { UseStatusAnimationStateReturn } from "./useStatusAnimationState";

export interface UpdatePropertyValueParams {
  componentId: string;
  statusId: string;
  property: keyof ComponentAnimationConfig;
  value: any;
}

/**
 * 配置同步模块
 * @description 提供配置同步和更新相关功能
 */
export function useConfigSync(
  state: UseStatusAnimationStateReturn,
  animationOps: UseAnimationOperationsReturn,
  triggerModule: UseAnimationTriggerReturn
) {
  const {
    animations,
    statusAnimations,
    componentAnimations,
    selectAnimationId,
    selectStatusId,
    updateAnimationState,
    snapshotComponentConfig,
    navInfo
  } = state;

  const { handleRemoteUpdate } = animationOps;
  const { triggerSingleComponentAnimation } = triggerModule;

  /**
   * 更新属性值（原始实现）
   * @description 更新指定组件在指定状态下的动画属性值
   * @param params 更新参数
   * @param params.componentId 组件ID
   * @param params.statusId 状态ID
   * @param params.property 要更新的属性名
   * @param params.value 新的属性值
   */
  const updatePropertyValueImpl = async ({ componentId, statusId, property, value }: UpdatePropertyValueParams) => {
    if (!selectAnimationId.value || !componentId || !statusId) {
      return console.warn("缺少必要参数");
    }

    const currentConfig = componentAnimations.value[selectAnimationId.value]?.[statusId]?.[componentId];
    if (!currentConfig) {
      return console.warn("未找到对应的组件配置");
    }

    const updatedConfig = {
      ...currentConfig,
      [property]: value
    };

    const newComponentAnimations = {
      ...componentAnimations.value,
      [selectAnimationId.value]: {
        ...componentAnimations.value[selectAnimationId.value],
        [statusId]: {
          ...componentAnimations.value[selectAnimationId.value][statusId],
          [componentId]: updatedConfig
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
      statusAnimations: statusAnimations.value,
      componentAnimations: newComponentAnimations
    };

    updateAnimationState(toUpdateData);
    await handleRemoteUpdate(toUpdateData, backUpData);

    if (statusId === selectStatusId.value) {
      triggerSingleComponentAnimation(componentId, selectAnimationId.value, statusId);
    }
  };

  /**
   * 更新属性值（防抖版本）
   * @description 更新指定组件在指定状态下的动画属性值，使用防抖避免频繁更新
   * @param params 更新参数
   * @param params.componentId 组件ID
   * @param params.statusId 状态ID
   * @param params.property 要更新的属性名
   * @param params.value 新的属性值
   */
  const updatePropertyValue = debounce(updatePropertyValueImpl, 300);

  /**
   * 同步组件配置
   * @description 将组件的当前配置同步到选中的动画状态中，支持组件类型验证，这是一个复杂的配置同步函数
   * @param componentConfig 组件配置对象
   * @returns 返回操作结果，包含成功状态、错误码和消息
   * @example
   * ```typescript
   * const result = await syncComponentConfig(componentConfig)
   * if (result.success) {
   *   console.log('同步成功')
   * } else {
   *   console.error(result.message)
   * }
   * ```
   */
  // 原始的同步组件配置函数
  const _syncComponentConfig = async (componentConfig: ComponentType) => {
    // if (!Object.keys(specialComponentProp).some((key) => componentConfig.component.prop === key)) {
    //   console.warn("未支持组件")
    //   return {
    //     success: false,
    //     code: "UNSUPPORTED_COMPONENT",
    //     message: "未支持组件",
    //     componentId: componentConfig.id.toString()
    //   }
    // }

    if (!selectAnimationId.value || !selectStatusId.value) {
      const errorResult = {
        success: false,
        message: "未选择动画或状态",
        componentId: componentConfig.id.toString()
      };
      console.warn(errorResult);
      return errorResult;
    }

    if (!animations.value[selectAnimationId.value]) {
      const errorResult = {
        success: false,
        message: "选中的动画组不存在",
        componentId: componentConfig.id.toString()
      };
      console.warn(errorResult);
      return errorResult;
    }

    if (!statusAnimations.value[selectAnimationId.value]?.[selectStatusId.value]) {
      const errorResult = {
        success: false,
        message: "选中的状态在当前动画组中不存在",
        componentId: componentConfig.id.toString()
      };
      console.warn(errorResult);
      return errorResult;
    }

    if (!componentAnimations.value[selectAnimationId.value]?.[selectStatusId.value]?.[componentConfig.id]) {
      const errorResult = {
        success: false,
        message: "组件在当前状态中不存在",
        componentId: componentConfig.id.toString()
      };
      console.warn(errorResult);
      return errorResult;
    }

    const componentId = componentConfig.id.toString();
    let existingAnimationId = null;
    let existingStatusId = null;

    for (const animationId of Object.keys(componentAnimations.value)) {
      const animationStatuses = componentAnimations.value[animationId] || {};
      for (const statusId of Object.keys(animationStatuses)) {
        if (animationStatuses[statusId] && animationStatuses[statusId][componentId]) {
          existingAnimationId = animationId;
          existingStatusId = statusId;
          break;
        }
      }
      if (existingAnimationId) break;
    }

    if (!existingAnimationId || !existingStatusId) {
      const errorResult = {
        success: false,
        message: "组件不存在",
        componentId: componentConfig.id.toString()
      };
      console.error(errorResult);
      return errorResult;
    }

    // 获取当前状态中已经存在的组件动画配置
    const existingConfig = componentAnimations.value[selectAnimationId.value][selectStatusId.value][componentId];

    // 使用生成器的反向提取功能，直接使用现有配置作为提取模板
    const builder = ComponentConfigBuilder.createDefault();

    // 直接使用现有配置作为模板（生成器会根据模板中存在的字段进行提取）
    const extractResult = builder.extract({ component: componentConfig, animationConfig: existingConfig });

    if (isEqual(extractResult.config, omit(existingConfig, ["componentId"]))) {
      return {
        success: false,
        message: "组件动画配置未发生变化",
        componentId: componentId
      };
    }

    // 构建最终的组件动画配置，完全基于生成器的反向提取结果
    const toUpdateComponentAnimationConfig = {
      // 首先设置必需的字段
      componentId: componentId,
      // 然后添加生成器提取的配置
      ...extractResult.config
    } as ComponentAnimationConfig;

    const newComponentAnimations = {
      ...componentAnimations.value,
      [selectAnimationId.value]: {
        ...componentAnimations.value[selectAnimationId.value],
        [selectStatusId.value]: {
          ...componentAnimations.value[selectAnimationId.value][selectStatusId.value],
          [componentConfig.id]: toUpdateComponentAnimationConfig
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
      statusAnimations: statusAnimations.value,
      componentAnimations: newComponentAnimations
    };

    updateAnimationState(toUpdateData);
    await handleRemoteUpdate(toUpdateData, backUpData);

    return {
      success: true,
      message: "组件动画配置已添加",
      componentId: componentId
    };
  };

  // 防抖版本的同步组件配置函数
  const syncComponentConfig = debounce(_syncComponentConfig, 300);

  /**
   * 初始化动画和组件默认配置映射
   * @description 从导航信息中初始化状态动画数据，并为所有相关组件设置默认配置，这是一个复杂的初始化函数
   * @example
   * ```typescript
   * // 在组件挂载时调用
   * initAnimationAndComponentDefaultConfigMap()
   * ```
   */
  const initAnimationAndComponentDefaultConfigMap = () => {
    if (!navInfo.value.statusAnimation) {
      return;
    }

    // 未配置状态动画的大屏，navInfo.statusAnimation 整体为 {}，三个字段均可能缺失
    const rawStatusAnimation = toRaw(navInfo.value.statusAnimation);

    if (!rawStatusAnimation.componentAnimations) {
      return;
    }

    const statusAnimationResponse: StatusAnimationResponse = {
      animations: rawStatusAnimation.animations ?? {},
      statusAnimations: rawStatusAnimation.statusAnimations ?? {},
      componentAnimations: rawStatusAnimation.componentAnimations
    };

    updateAnimationState(statusAnimationResponse);

    snapshotComponentConfig();
  };

  /**
   * 同步状态动画数据到服务器
   * @param newAnimations 新的动画信息
   * @param newStatusAnimations 新的状态动画映射
   * @param newComponentAnimations 新的组件动画配置
   */
  const syncStatusAnimationDataToServer = async (
    newAnimations: Record<string, any>,
    newStatusAnimations: Record<string, any>,
    newComponentAnimations: Record<string, any>
  ) => {
    const toUpdateData: StatusAnimationResponse = {
      animations: newAnimations,
      statusAnimations: newStatusAnimations,
      componentAnimations: newComponentAnimations
    };

    await handleRemoteUpdate(toUpdateData, {
      animations: animations.value,
      statusAnimations: statusAnimations.value,
      componentAnimations: componentAnimations.value
    });
  };

  return {
    updatePropertyValue,
    updatePropertyValueImpl,
    syncComponentConfig,
    // 导出非防抖版本用于测试
    syncComponentConfigDirect: _syncComponentConfig,
    initAnimationAndComponentDefaultConfigMap,
    syncStatusAnimationDataToServer
  };
}

export type UseConfigSyncReturn = ReturnType<typeof useConfigSync>;
