import { interactiveEnum, mediaEnum, textEnum } from "@/components/componentEntry/type";

import type { PropertyMapping } from "./types";
import { PropertyMappingType } from "./types";

/**
 * 默认属性映射配置
 * @description 定义了如何从 ComponentAnimationConfig 映射到 ComponentType
 */
export const DEFAULT_PROPERTY_MAPPINGS: PropertyMapping[] = [
  // 位置组属性
  {
    source: "left",
    target: "left",
    type: PropertyMappingType.DIRECT,
    validator: (value) => typeof value === "number",
    description: "X轴位置",
    group: "position"
  },
  {
    source: "top",
    target: "top",
    type: PropertyMappingType.DIRECT,
    validator: (value) => typeof value === "number",
    description: "Y轴位置",
    group: "position"
  },

  // 尺寸组属性
  {
    source: "width",
    target: "component.width",
    type: PropertyMappingType.NESTED,
    validator: (value) => typeof value === "number" && value > 0,
    description: "宽度",
    group: "size"
  },
  {
    source: "height",
    target: "component.height",
    type: PropertyMappingType.NESTED,
    validator: (value) => typeof value === "number" && value > 0,
    description: "高度",
    group: "size"
  },

  // 显示组属性
  {
    source: "display",
    target: "display",
    type: PropertyMappingType.DIRECT,
    validator: (value) => typeof value === "boolean",
    description: "显示/隐藏状态",
    group: "display"
  },
  {
    source: "zIndex",
    target: "zIndex",
    type: PropertyMappingType.DIRECT,
    validator: (value) => typeof value === "number",
    description: "层级",
    group: "zIndex"
  }
];

const advanceMappings: PropertyMapping[] = [
  // 外观组属性
  {
    source: "opacity",
    target: "option.opacity",
    type: PropertyMappingType.NESTED,
    validator: (value) => typeof value === "number" && value >= 0 && value <= 1,
    description: "透明度",
    group: "appearance"
  },

  // 旋转组属性
  {
    source: "rotateX",
    target: "option.rotateX",
    type: PropertyMappingType.NESTED,
    validator: (value) => typeof value === "number",
    description: "X轴旋转角度",
    group: "rotation"
  },
  {
    source: "rotateY",
    target: "option.rotateY",
    type: PropertyMappingType.NESTED,
    validator: (value) => typeof value === "number",
    description: "Y轴旋转角度",
    group: "rotation"
  },
  {
    source: "rotateZ",
    target: "option.rotateZ",
    type: PropertyMappingType.NESTED,
    validator: (value) => typeof value === "number",
    description: "Z轴旋转角度",
    group: "rotation"
  }
];

const ftImgMappings: PropertyMapping[] = [
  {
    source: "image",
    target: "data[0].value",
    type: PropertyMappingType.ARRAY,
    validator: (value) => typeof value === "string",
    description: "图片路径（映射到 data 数组第一个元素的 value 属性）",
    group: "image"
  }
];

const ftMutualMappings: PropertyMapping[] = [
  {
    source: "image",
    target: "option.bgImage",
    type: PropertyMappingType.NESTED,
    validator: (value) => typeof value === "string",
    description: "图片路径（映射到 option.bgImage 属性）",
    group: "image"
  }
];

const ftTextMappings: PropertyMapping[] = [
  {
    source: "fontSize",
    target: "option.fontSize",
    type: PropertyMappingType.NESTED,
    validator: (value) => typeof value === "number",
    description: "字体大小（映射到 option.fontSize 属性）",
    group: "fontSize"
  }
];

const ftVideoMappings: PropertyMapping[] = [
  {
    source: "video",
    target: "data[0].value",
    type: PropertyMappingType.ARRAY,
    validator: (value) => typeof value === "string",
    description: "视频路径（映射到 data 数组第一个元素的 value 属性）",
    group: "video"
  }
];

/**
 * 组件类型到映射配置的映射表
 * @description 定义每种组件类型对应的额外映射配置
 */
export const COMPONENT_TYPE_MAPPINGS: Record<string, PropertyMapping[]> = {
  [mediaEnum.SwImg]: [...advanceMappings, ...ftImgMappings],
  [mediaEnum.SwVideo]: [...advanceMappings, ...ftVideoMappings],
  [interactiveEnum.SwMutual]: [...advanceMappings, ...ftMutualMappings],
  [textEnum.SwText]: [...advanceMappings, ...ftTextMappings]
};

/**
 * 根据组件类型获取特定的属性映射
 * @param componentProp 组件类型
 * @returns 属性映射数组
 */
export function getMappingsByComponentType(componentProp: string): PropertyMapping[] {
  // 基础映射适用于所有组件
  const mappings = [...DEFAULT_PROPERTY_MAPPINGS];

  // 根据组件类型添加特定映射
  const additionalMappings = COMPONENT_TYPE_MAPPINGS[componentProp] || advanceMappings;
  mappings.push(...additionalMappings);

  return mappings;
}

/**
 * 属性映射管理器
 * @description 提供动态管理属性映射的功能
 */
export class PropertyMappingManager {
  private mappings: Map<string, PropertyMapping> = new Map();

  constructor(initialMappings: PropertyMapping[] = DEFAULT_PROPERTY_MAPPINGS) {
    this.loadMappings(initialMappings);
  }

  /**
   * 加载映射配置
   */
  private loadMappings(mappings: PropertyMapping[]) {
    mappings.forEach((mapping) => {
      this.mappings.set(mapping.source, mapping);
    });
  }

  /**
   * 获取所有映射
   */
  getAllMappings(): PropertyMapping[] {
    return Array.from(this.mappings.values());
  }

  /**
   * 获取特定属性的映射
   */
  getMapping(source: string): PropertyMapping | undefined {
    return this.mappings.get(source);
  }

  /**
   * 添加或更新映射
   */
  setMapping(mapping: PropertyMapping): this {
    this.mappings.set(mapping.source, mapping);
    return this;
  }

  /**
   * 删除映射
   */
  removeMapping(source: string): boolean {
    return this.mappings.delete(source);
  }

  /**
   * 检查是否存在映射
   */
  hasMapping(source: string): boolean {
    return this.mappings.has(source);
  }

  /**
   * 清空所有映射
   */
  clear(): this {
    this.mappings.clear();
    return this;
  }

  /**
   * 根据组件类型过滤映射
   */
  getFilteredMappings(componentProp: string): PropertyMapping[] {
    // 获取组件类型对应的默认映射
    const defaultMappings = getMappingsByComponentType(componentProp);

    // 获取当前 mappingManager 中存储的所有映射（包括自定义添加的）
    const allStoredMappings = this.getAllMappings();

    // 创建映射 Map，用于合并和去重
    const mappingMap = new Map<string, PropertyMapping>();

    // 首先添加默认映射
    defaultMappings.forEach((mapping) => {
      mappingMap.set(mapping.source, mapping);
    });

    // 然后添加/覆盖自定义映射
    allStoredMappings.forEach((mapping) => {
      mappingMap.set(mapping.source, mapping);
    });

    return Array.from(mappingMap.values());
  }
}
