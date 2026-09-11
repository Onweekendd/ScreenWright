/**
 * 组件配置生成器模块
 * @description 提供基于配置的组件属性映射和生成功能
 */

// 导出类型
export type { BuilderOptions, BuildResult, PropertyMapping } from "./types";
export { PropertyMappingType } from "./types";

// 导出映射配置
export { DEFAULT_PROPERTY_MAPPINGS, getMappingsByComponentType, PropertyMappingManager } from "./mappings";

// 导出生成器
export { ComponentConfigBuilder } from "./ComponentConfigBuilder";

// 导出便捷函数
export { buildComponent, buildComponentConfig, createOptimizedBuilder, smartApplyComponentConfig } from "./utils";
