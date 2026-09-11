import type { ComponentType } from "@/views/build/components/buildRender/type";

import type { ComponentAnimationConfig } from "../../../type";

/**
 * 属性映射类型枚举
 */
export enum PropertyMappingType {
  /** 直接属性映射 - 如 left -> left */
  DIRECT = "direct",
  /** 嵌套属性映射 - 如 width -> component.width */
  NESTED = "nested",
  /** 复合属性映射 - 如 width -> 同时映射到外层width和component.width */
  COMPOUND = "compound",
  /** 数组索引映射 - 如 image -> data[0].value */
  ARRAY = "array"
}

/**
 * 属性映射配置接口
 */
export interface PropertyMapping {
  /** 源属性名（来自 ComponentAnimationConfig） */
  source: keyof ComponentAnimationConfig;
  /** 目标属性路径 */
  target: string | string[];
  /** 映射类型 */
  type: PropertyMappingType;
  /** 可选的值验证函数 */
  validator?: (value: any) => boolean;
  /** 可选的值转换函数 */
  transformer?: (value: any, component: ComponentType) => any;
  /** 属性描述（用于调试和文档） */
  description?: string;
  /** 属性分组（用于自动推导属性组） */
  group?: string;
}

/**
 * 生成器选项
 */
export interface BuilderOptions {
  /** 是否启用调试模式 */
  debug?: boolean;
  /** 是否严格模式（验证失败时抛出错误） */
  strict?: boolean;
  /** 自定义验证失败处理 */
  onValidationError?: (mapping: PropertyMapping, value: any, error: string) => void;
}

/**
 * 构建结果
 */
export interface BuildResult {
  /** 构建的组件配置 */
  config: Partial<ComponentType>;
  /** 应用的映射列表 */
  appliedMappings: PropertyMapping[];
  /** 跳过的映射列表（值不存在或验证失败） */
  skippedMappings: Array<{
    mapping: PropertyMapping;
    reason: "missing_value" | "validation_failed" | "transform_error";
    error?: string;
  }>;
}

/**
 * 反向提取结果
 */
export interface ExtractResult {
  /** 提取的动画配置 */
  config: Partial<ComponentAnimationConfig>;
  /** 应用的映射列表 */
  appliedMappings: PropertyMapping[];
  /** 跳过的映射列表（值不存在或验证失败） */
  skippedMappings: Array<{
    mapping: PropertyMapping;
    reason: "missing_value" | "validation_failed" | "transform_error" | "not_requested";
    error?: string;
  }>;
}

/**
 * 反向提取到组件结果
 */
export interface ExtractToComponentResult {
  /** 提取的组件配置 */
  config: Partial<ComponentType>;
  /** 应用的映射列表 */
  appliedMappings: PropertyMapping[];
  /** 跳过的映射列表（值不存在或验证失败） */
  skippedMappings: Array<{
    mapping: PropertyMapping;
    reason: "missing_value" | "validation_failed" | "transform_error" | "not_requested";
    error?: string;
  }>;
}
