import type { ComponentType } from "@/views/build/components/buildRender/type";

import type { ComponentAnimationConfig } from "../../../type";
import { ComponentConfigBuilder } from "./ComponentConfigBuilder";
import type { BuilderOptions } from "./types";

// 单例生成器实例，提高性能
let defaultBuilder: ComponentConfigBuilder | null = null;

/**
 * 获取默认生成器实例（单例模式）
 */
function getDefaultBuilder(): ComponentConfigBuilder {
  if (!defaultBuilder) {
    defaultBuilder = ComponentConfigBuilder.createDefault();
  }
  return defaultBuilder;
}

/**
 * 构建组件配置 包含应用的映射和跳过的映射
 * @param statusAnimationData 状态动画数据
 * @param component 目标组件
 * @returns 构建结果
 */
export function buildComponent(statusAnimationData: Partial<ComponentAnimationConfig>, component: ComponentType) {
  const builder = getDefaultBuilder();
  return builder.build({ animationConfig: statusAnimationData, component });
}

/**
 * 便捷函数：构建组件配置
 * @description 使用默认生成器快速构建组件配置
 * @param statusAnimationData 状态动画数据
 * @param component 目标组件
 * @returns 构建的组件配置
 */
export function buildComponentConfig(
  statusAnimationData: Partial<ComponentAnimationConfig>,
  component: ComponentType
): Partial<ComponentType> {
  const result = buildComponent(statusAnimationData, component);
  return result.config;
}

/**
 * 创建优化的生成器
 * @description 根据组件类型创建优化的生成器实例
 * @param componentProp 组件类型
 * @param options 生成器选项
 * @returns 生成器实例
 */
export function createOptimizedBuilder(componentProp: string, options?: BuilderOptions): ComponentConfigBuilder {
  // 这里可以根据组件类型进行优化
  // 例如，只加载该组件类型需要的映射规则
  return ComponentConfigBuilder.createDefault(options);
}

/**
 * 重置默认生成器
 * @description 清除单例实例，强制重新创建（主要用于测试）
 */
export function resetDefaultBuilder(): void {
  defaultBuilder = null;
}

/**
 * 验证组件配置的完整性
 * @param config 组件配置
 * @param required 必需的属性列表
 * @returns 验证结果
 */
export function validateComponentConfig(
  config: Partial<ComponentType>,
  required: (keyof ComponentType)[] = []
): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  for (const field of required) {
    if (config[field] === undefined) {
      missingFields.push(field as string);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * 深度合并两个组件配置
 * @param target 目标配置
 * @param source 源配置
 * @returns 合并后的配置
 */
export function mergeComponentConfigs(
  target: Partial<ComponentType>,
  source: Partial<ComponentType>
): Partial<ComponentType> {
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined) {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // 深度合并对象
        result[key as keyof ComponentType] = {
          ...(result[key as keyof ComponentType] as any),
          ...(value as any)
        } as any;
      } else {
        // 直接赋值
        result[key as keyof ComponentType] = value as any;
      }
    }
  }

  return result;
}

/**
 * 智能应用组件配置
 * @description 整体替换对象/数组以触发 Vue 响应式更新
 * @param target 目标组件
 * @param source 源配置（已经是浅拷贝后的完整对象）
 */
export function smartApplyComponentConfig(target: ComponentType, source: Partial<ComponentType>): void {
  Object.keys(source).forEach((key) => {
    const value = source[key as keyof ComponentType];
    if (value !== undefined && value !== null) {
      // 直接整体赋值，触发 Vue 响应式更新
      // source 中的对象/数组已经在 ComponentConfigBuilder 中浅拷贝过了
      (target as Record<string, unknown>)[key] = value;
    }
  });
}

/**
 * 计算配置差异
 * @param oldConfig 旧配置
 * @param newConfig 新配置
 * @returns 差异对象
 */
export function getConfigDiff(
  oldConfig: Partial<ComponentType>,
  newConfig: Partial<ComponentType>
): {
  added: string[];
  removed: string[];
  changed: string[];
} {
  const oldKeys = new Set(Object.keys(oldConfig));
  const newKeys = new Set(Object.keys(newConfig));

  const added = Array.from(newKeys).filter((key) => !oldKeys.has(key));
  const removed = Array.from(oldKeys).filter((key) => !newKeys.has(key));
  const changed = Array.from(newKeys).filter((key) => {
    if (!oldKeys.has(key)) return false;
    return oldConfig[key as keyof ComponentType] !== newConfig[key as keyof ComponentType];
  });

  return { added, removed, changed };
}
