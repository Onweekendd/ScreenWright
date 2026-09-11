import { toRaw } from "vue";

import type { ComponentType } from "@/views/build/components/buildRender/type";

import type { ComponentAnimationConfig } from "../../../type";
import { DEFAULT_PROPERTY_MAPPINGS, PropertyMappingManager } from "./mappings";
import type { BuilderOptions, BuildResult, ExtractResult, ExtractToComponentResult, PropertyMapping } from "./types";
import { PropertyMappingType } from "./types";

/**
 * 组件配置生成器
 * @description 基于配置化的属性映射，根据输入数据的 key 查找对应的映射规则生成组件配置
 * 只处理输入数据中实际存在的属性，提高性能并避免不必要的处理
 */
export class ComponentConfigBuilder {
  private mappingManager: PropertyMappingManager;
  private options: BuilderOptions;

  constructor(customMappings?: PropertyMapping[], options: BuilderOptions = {}) {
    this.mappingManager = new PropertyMappingManager(customMappings || DEFAULT_PROPERTY_MAPPINGS);
    this.options = {
      debug: false,
      strict: false,
      ...options
    };
  }

  /**
   * 构建组件配置
   * @param params 构建参数
   * @param params.animationConfig 状态动画数据
   * @param params.component 目标组件
   * @returns 构建结果
   */
  build({
    animationConfig,
    component
  }: {
    animationConfig: Partial<ComponentAnimationConfig>;
    component: ComponentType;
  }): BuildResult {
    const result: BuildResult = {
      config: {},
      appliedMappings: [],
      skippedMappings: []
    };

    // 根据组件类型获取对应的映射配置
    const componentProp = component.component.prop;
    const mappings = this.mappingManager.getFilteredMappings(componentProp);

    if (this.options.debug) {
      console.log(
        `[ComponentConfigBuilder] 开始构建 ${componentProp} 组件，处理 ${Object.keys(animationConfig).length} 个属性`
      );
    }

    // 遍历 animationConfig 中的每个属性
    for (const key of Object.keys(animationConfig)) {
      // 排除特殊属性，这些属性不需要映射处理
      if (key === "componentId") {
        continue;
      }

      // 查找对应的映射规则
      const mapping = mappings.find((m) => m.source === key);

      if (!mapping) {
        const error = `未找到属性 ${key} 的映射规则，组件类型: ${componentProp}`;
        if (this.options.debug) {
          console.error(`[ComponentConfigBuilder] ${error}`);
        }

        if (this.options.debug) {
          console.log(
            `[ComponentConfigBuilder] 构建中止，应用 ${result.appliedMappings.length} 个映射，跳过 ${result.skippedMappings.length} 个映射`
          );
        }

        throw new Error(error);
      }

      try {
        this.applyMapping({ mapping, animationConfig, component, result });
      } catch (error) {
        if (this.options.strict) {
          throw error;
        }

        result.skippedMappings.push({
          mapping,
          reason: "transform_error",
          error: error instanceof Error ? error.message : String(error)
        });

        if (this.options.debug) {
          console.warn(`[ComponentConfigBuilder] 映射 ${mapping.source} 应用失败:`, error);
        }
      }
    }

    if (this.options.debug) {
      console.log(
        `[ComponentConfigBuilder] 构建完成，应用 ${result.appliedMappings.length} 个映射，跳过 ${result.skippedMappings.length} 个映射`
      );
    }

    return result;
  }

  /**
   * 从动画配置提取到组件配置
   * @param params 提取参数
   * @param params.animationConfig 动画配置数据
   * @param params.component 参考组件（用于复用 extract 和 build 逻辑）
   * @returns 提取到组件的结果
   */
  extractToComponent({
    animationConfig,
    component
  }: {
    animationConfig: Partial<ComponentAnimationConfig>;
    component: ComponentType;
  }): ExtractToComponentResult {
    if (this.options.debug) {
      console.log(
        `[ComponentConfigBuilder] 开始从动画配置提取到组件配置，处理 ${Object.keys(animationConfig).length} 个动画属性`
      );
    }

    // 第一步：使用 extract 方法从参考组件中提取与动画配置相同字段的配置
    // 这一步获取参考组件中对应字段的实际值
    const extractResult = this.extract({ component, animationConfig });

    if (this.options.debug) {
      console.log(`[ComponentConfigBuilder] extract 阶段完成，提取了 ${extractResult.appliedMappings.length} 个字段`);
    }

    // 第二步：使用 build 方法将第一步提取的配置构建成组件配置
    // 这里使用第一步的结果，而不是原始的动画配置
    const buildResult = this.build({ animationConfig: extractResult.config, component });

    // 转换结果格式
    const result: ExtractToComponentResult = {
      config: buildResult.config,
      appliedMappings: buildResult.appliedMappings,
      skippedMappings: buildResult.skippedMappings
    };

    if (this.options.debug) {
      console.log(
        `[ComponentConfigBuilder] 从动画配置提取到组件配置完成，应用 ${result.appliedMappings.length} 个映射，跳过 ${result.skippedMappings.length} 个映射`
      );
    }

    return result;
  }

  /**
   * 反向提取动画配置
   * @param params 提取参数
   * @param params.component 源组件数据
   * @param params.animationConfig 指导模板，指示需要提取哪些字段
   * @returns 提取结果
   */
  extract({
    component,
    animationConfig
  }: {
    component: ComponentType;
    animationConfig: Partial<ComponentAnimationConfig>;
  }): ExtractResult {
    const result: ExtractResult = {
      config: {},
      appliedMappings: [],
      skippedMappings: []
    };

    // 根据组件类型获取对应的映射配置
    const componentProp = component.component.prop;
    const mappings = this.mappingManager.getFilteredMappings(componentProp);

    if (this.options.debug) {
      console.log(
        `[ComponentConfigBuilder] 开始反向提取 ${componentProp} 组件，处理 ${
          Object.keys(animationConfig).length
        } 个模板属性`
      );
    }

    // 遍历 animationConfig 中的每个属性
    for (const key of Object.keys(animationConfig)) {
      // 排除特殊属性，这些属性不需要映射处理
      if (key === "componentId") {
        continue;
      }

      // 查找对应的映射规则
      const mapping = mappings.find((m) => m.source === key);

      if (!mapping) {
        const error = `未找到属性 ${key} 的映射规则，组件类型: ${componentProp}`;
        if (this.options.debug) {
          console.error(`[ComponentConfigBuilder] ${error}`);
        }

        if (this.options.debug) {
          console.log(
            `[ComponentConfigBuilder] 反向提取中止，提取 ${result.appliedMappings.length} 个属性，跳过 ${result.skippedMappings.length} 个属性`
          );
        }

        throw new Error(error);
      }

      try {
        this.extractMapping({ mapping, component, animationConfig, result });
      } catch (error) {
        if (this.options.strict) {
          throw error;
        }

        result.skippedMappings.push({
          mapping,
          reason: "transform_error",
          error: error instanceof Error ? error.message : String(error)
        });

        if (this.options.debug) {
          console.warn(`[ComponentConfigBuilder] 反向提取 ${mapping.source} 失败:`, error);
        }
      }
    }

    if (this.options.debug) {
      console.log(
        `[ComponentConfigBuilder] 反向提取完成，提取 ${result.appliedMappings.length} 个属性，跳过 ${result.skippedMappings.length} 个属性`
      );
    }

    return result;
  }

  /**
   * 应用单个映射规则
   */
  private applyMapping(params: {
    mapping: PropertyMapping;
    animationConfig: Partial<ComponentAnimationConfig>;
    component: ComponentType;
    result: BuildResult;
  }): void {
    const { mapping, animationConfig, component, result } = params;
    const sourceValue = animationConfig[mapping.source];

    // 注意：由于我们现在只处理存在于 animationConfig 中的 key，这里不再需要检查 undefined

    // 验证值
    if (mapping.validator && !mapping.validator(sourceValue)) {
      const error = `值验证失败: ${mapping.source} = ${sourceValue}`;

      if (this.options.onValidationError) {
        this.options.onValidationError(mapping, sourceValue, error);
      }

      result.skippedMappings.push({
        mapping,
        reason: "validation_failed",
        error
      });
      return;
    }

    // 转换值
    let transformedValue = sourceValue;
    if (mapping.transformer) {
      transformedValue = mapping.transformer(sourceValue, component);
    }

    // 应用映射
    switch (mapping.type) {
      case PropertyMappingType.DIRECT:
        this.applyDirectMapping(mapping, transformedValue, result);
        break;
      case PropertyMappingType.NESTED:
        this.applyNestedMapping({ mapping, value: transformedValue, component, result });
        break;
      case PropertyMappingType.COMPOUND:
        this.applyCompoundMapping({ mapping, value: transformedValue, component, result });
        break;
      case PropertyMappingType.ARRAY:
        this.applyArrayMapping({ mapping, value: transformedValue, component, result });
        break;
      default:
        throw new Error(`不支持的映射类型: ${mapping.type}`);
    }

    result.appliedMappings.push(mapping);

    if (this.options.debug) {
      console.log(
        `[ComponentConfigBuilder] 应用映射: ${mapping.source} -> ${
          Array.isArray(mapping.target) ? mapping.target.join(", ") : mapping.target
        }`
      );
    }
  }

  /**
   * 应用直接映射
   */
  private applyDirectMapping(mapping: PropertyMapping, value: any, result: BuildResult): void {
    if (typeof mapping.target !== "string") {
      throw new Error(`直接映射的target必须是字符串: ${mapping.source}`);
    }

    (result.config as any)[mapping.target] = value;
  }

  /**
   * 应用嵌套映射
   * @description 为了触发 Vue 响应式更新，需要先浅拷贝原对象再修改
   */
  private applyNestedMapping(params: {
    mapping: PropertyMapping;
    value: any;
    component: ComponentType;
    result: BuildResult;
  }): void {
    const { mapping, value, component, result } = params;
    if (typeof mapping.target !== "string") {
      throw new Error(`嵌套映射的target必须是字符串: ${mapping.source}`);
    }

    const targetPath = mapping.target.split(".");
    if (targetPath.length !== 2) {
      throw new Error(`嵌套映射的target必须是"parent.child"格式: ${mapping.target}`);
    }

    const [parentKey, childKey] = targetPath;

    // 如果 result.config 中还没有该父对象，先从原组件浅拷贝
    if (!result.config[parentKey as keyof ComponentType]) {
      const originalParent = component[parentKey];
      // 浅拷贝原组件的父对象，确保整体替换时能触发响应式
      // 需要区分数组和对象
      if (Array.isArray(originalParent)) {
        result.config[parentKey as keyof ComponentType] = toRaw(originalParent).map((item) =>
          item && typeof item === "object" ? { ...item } : item
        );
      } else {
        result.config[parentKey as keyof ComponentType] = originalParent ? { ...toRaw(originalParent) } : ({} as any);
      }
    }

    // 设置子属性
    result.config[parentKey as keyof ComponentType][childKey] = value;
  }

  /**
   * 应用复合映射
   * @description 为了触发 Vue 响应式更新，需要先浅拷贝原对象再修改
   */
  private applyCompoundMapping(params: {
    mapping: PropertyMapping;
    value: any;
    component: ComponentType;
    result: BuildResult;
  }): void {
    const { mapping, value, component, result } = params;
    if (!Array.isArray(mapping.target)) {
      throw new Error(`复合映射的target必须是数组: ${mapping.source}`);
    }

    for (const target of mapping.target) {
      const targetPath = target.split(".");

      if (targetPath.length === 1) {
        // 直接属性
        (result.config as any)[target] = value;
      } else if (targetPath.length === 2) {
        // 嵌套属性
        const [parentKey, childKey] = targetPath;

        // 如果 result.config 中还没有该父对象，先从原组件浅拷贝
        if (!result.config[parentKey as keyof ComponentType]) {
          const originalParent = (component as any)[parentKey];
          // 浅拷贝原组件的父对象，确保整体替换时能触发响应式
          // 需要区分数组和对象
          if (Array.isArray(originalParent)) {
            result.config[parentKey as keyof ComponentType] = toRaw(originalParent).map((item: any) =>
              item && typeof item === "object" ? { ...item } : item
            ) as any;
          } else {
            result.config[parentKey as keyof ComponentType] = originalParent
              ? { ...toRaw(originalParent) }
              : ({} as any);
          }
        }

        // 设置子属性
        (result.config[parentKey as keyof ComponentType] as any)[childKey] = value;
      } else {
        throw new Error(`不支持的target路径: ${target}`);
      }
    }
  }

  /**
   * 应用数组索引映射
   * @description 处理如 data[0].value 这样的数组索引路径
   * 为了触发 Vue 响应式更新，需要浅拷贝数组和数组项
   */
  private applyArrayMapping(params: {
    mapping: PropertyMapping;
    value: any;
    component: ComponentType;
    result: BuildResult;
  }): void {
    const { mapping, value, component, result } = params;
    if (typeof mapping.target !== "string") {
      throw new Error(`数组映射的target必须是字符串: ${mapping.source}`);
    }

    // 解析数组路径，如 "data[0].value"
    const arrayPathMatch = mapping.target.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
    if (!arrayPathMatch) {
      throw new Error(`无效的数组映射路径格式: ${mapping.target}，应该是 "arrayName[index].property" 格式`);
    }

    const [, arrayName, indexStr, property] = arrayPathMatch;
    const index = parseInt(indexStr, 10);

    // 确保数组存在，并浅拷贝原数组
    if (!result.config[arrayName as keyof ComponentType]) {
      // 从原组件复制数组，如果不存在则创建空数组
      const originalArray = (component[arrayName as keyof ComponentType] as any) || [];
      // 浅拷贝数组，同时浅拷贝每个数组项，确保整体替换时能触发响应式
      result.config[arrayName as keyof ComponentType] = [
        ...toRaw(originalArray).map((item: any) => (item && typeof item === "object" ? { ...item } : item))
      ];
    }

    const targetArray = result.config[arrayName as keyof ComponentType] as any[];

    // 确保数组长度足够
    while (targetArray.length <= index) {
      targetArray.push({});
    }

    // 确保数组项是对象，如果已经存在则浅拷贝
    if (!targetArray[index] || typeof targetArray[index] !== "object") {
      targetArray[index] = {};
    }

    // 设置属性值
    targetArray[index][property] = value;

    if (this.options.debug) {
      console.log(`[ComponentConfigBuilder] 数组映射: ${mapping.source} -> ${mapping.target} = ${value}`);
    }
  }

  /**
   * 反向提取单个映射规则
   */
  private extractMapping(params: {
    mapping: PropertyMapping;
    component: ComponentType;
    animationConfig: Partial<ComponentAnimationConfig>;
    result: ExtractResult;
  }): void {
    const { mapping, component, result } = params;

    // 注意：由于我们现在只处理存在于 animationConfig 中的 key，这里不再需要检查是否在 animationConfig 中

    // 从组件中提取值
    let extractedValue: any;
    try {
      extractedValue = this.extractValueFromComponent(mapping, component);
    } catch (error) {
      result.skippedMappings.push({
        mapping,
        reason: "missing_value",
        error: error instanceof Error ? error.message : String(error)
      });
      return;
    }

    // 注意：反向提取时，转换器通常不需要应用
    // 因为我们是从组件中提取原始值
    // 如果需要反向转换，可以在 PropertyMapping 中添加 reverseTransformer 属性

    // 验证提取的值
    if (mapping.validator && !mapping.validator(extractedValue)) {
      const error = `反向提取值验证失败: ${mapping.source} = ${extractedValue}`;

      if (this.options.onValidationError) {
        this.options.onValidationError(mapping, extractedValue, error);
      }

      result.skippedMappings.push({
        mapping,
        reason: "validation_failed",
        error
      });
      return;
    }

    // 设置提取的值
    (result.config as any)[mapping.source] = extractedValue;
    result.appliedMappings.push(mapping);

    if (this.options.debug) {
      console.log(
        `[ComponentConfigBuilder] 反向提取映射: ${
          Array.isArray(mapping.target) ? mapping.target.join(", ") : mapping.target
        } -> ${mapping.source}`
      );
    }
  }

  /**
   * 从组件中提取值
   */
  private extractValueFromComponent(mapping: PropertyMapping, component: ComponentType): any {
    switch (mapping.type) {
      case PropertyMappingType.DIRECT:
        return this.extractDirectValue(mapping, component);
      case PropertyMappingType.NESTED:
        return this.extractNestedValue(mapping, component);
      case PropertyMappingType.COMPOUND:
        return this.extractCompoundValue(mapping, component);
      case PropertyMappingType.ARRAY:
        return this.extractArrayValue(mapping, component);
      default:
        throw new Error(`不支持的映射类型: ${mapping.type}`);
    }
  }

  /**
   * 提取直接映射值
   */
  private extractDirectValue(mapping: PropertyMapping, component: ComponentType): any {
    if (typeof mapping.target !== "string") {
      throw new Error(`直接映射的target必须是字符串: ${mapping.source}`);
    }

    const value = (component as any)[mapping.target];
    if (value === undefined) {
      throw new Error(`组件中不存在属性: ${mapping.target}`);
    }

    return value;
  }

  /**
   * 提取嵌套映射值
   */
  private extractNestedValue(mapping: PropertyMapping, component: ComponentType): any {
    if (typeof mapping.target !== "string") {
      throw new Error(`嵌套映射的target必须是字符串: ${mapping.source}`);
    }

    const targetPath = mapping.target.split(".");
    if (targetPath.length !== 2) {
      throw new Error(`嵌套映射的target必须是"parent.child"格式: ${mapping.target}`);
    }

    const [parentKey, childKey] = targetPath;
    const parentObject = (component as any)[parentKey];

    if (!parentObject || typeof parentObject !== "object") {
      throw new Error(`组件中不存在父对象: ${parentKey}`);
    }

    const value = parentObject[childKey];
    if (value === undefined) {
      throw new Error(`组件中不存在嵌套属性: ${mapping.target}`);
    }

    return value;
  }

  /**
   * 提取复合映射值
   * @description 对于复合映射，我们优先从第一个目标路径提取值
   */
  private extractCompoundValue(mapping: PropertyMapping, component: ComponentType): any {
    if (!Array.isArray(mapping.target)) {
      throw new Error(`复合映射的target必须是数组: ${mapping.source}`);
    }

    // 尝试从第一个目标路径提取值
    const primaryTarget = mapping.target[0];
    const targetPath = primaryTarget.split(".");

    if (targetPath.length === 1) {
      // 直接属性
      const value = (component as any)[primaryTarget];
      if (value === undefined) {
        throw new Error(`组件中不存在属性: ${primaryTarget}`);
      }
      return value;
    } else if (targetPath.length === 2) {
      // 嵌套属性
      const [parentKey, childKey] = targetPath;
      const parentObject = (component as any)[parentKey];

      if (!parentObject || typeof parentObject !== "object") {
        throw new Error(`组件中不存在父对象: ${parentKey}`);
      }

      const value = parentObject[childKey];
      if (value === undefined) {
        throw new Error(`组件中不存在嵌套属性: ${primaryTarget}`);
      }
      return value;
    } else {
      throw new Error(`不支持的target路径: ${primaryTarget}`);
    }
  }

  /**
   * 提取数组索引映射值
   * @description 处理如 data[0].value 这样的数组索引路径
   */
  private extractArrayValue(mapping: PropertyMapping, component: ComponentType): any {
    if (typeof mapping.target !== "string") {
      throw new Error(`数组映射的target必须是字符串: ${mapping.source}`);
    }

    // 解析数组路径，如 "data[0].value"
    const arrayPathMatch = mapping.target.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
    if (!arrayPathMatch) {
      throw new Error(`无效的数组映射路径格式: ${mapping.target}，应该是 "arrayName[index].property" 格式`);
    }

    const [, arrayName, indexStr, property] = arrayPathMatch;
    const index = parseInt(indexStr, 10);

    // 获取数组
    const targetArray = (component as any)[arrayName];
    if (!Array.isArray(targetArray)) {
      throw new Error(`组件中不存在数组: ${arrayName}`);
    }

    // 检查索引是否存在
    if (index >= targetArray.length) {
      throw new Error(`数组索引超出范围: ${arrayName}[${index}]，数组长度为 ${targetArray.length}`);
    }

    // 获取数组项
    const arrayItem = targetArray[index];
    if (!arrayItem || typeof arrayItem !== "object") {
      throw new Error(`数组项不是对象: ${arrayName}[${index}]`);
    }

    // 获取属性值
    const value = arrayItem[property];
    if (value === undefined) {
      throw new Error(`数组项中不存在属性: ${mapping.target}`);
    }

    return value;
  }

  /**
   * 添加映射
   */
  addMapping(mapping: PropertyMapping): this {
    this.mappingManager.setMapping(mapping);
    return this;
  }

  /**
   * 删除映射
   */
  removeMapping(source: string): this {
    this.mappingManager.removeMapping(source);
    return this;
  }

  /**
   * 获取所有映射
   */
  getMappings(): PropertyMapping[] {
    return this.mappingManager.getAllMappings();
  }

  /**
   * 检查是否存在映射
   */
  hasMapping(source: string): boolean {
    return this.mappingManager.hasMapping(source);
  }

  /**
   * 设置选项
   */
  setOptions(options: Partial<BuilderOptions>): this {
    this.options = { ...this.options, ...options };
    return this;
  }

  /**
   * 获取当前选项
   */
  getOptions(): BuilderOptions {
    return { ...this.options };
  }

  /**
   * 静态工厂方法 - 创建默认生成器
   */
  static createDefault(options?: BuilderOptions): ComponentConfigBuilder {
    return new ComponentConfigBuilder(undefined, options);
  }

  /**
   * 静态工厂方法 - 创建调试模式生成器
   */
  static createDebug(): ComponentConfigBuilder {
    return new ComponentConfigBuilder(undefined, { debug: true });
  }

  /**
   * 静态工厂方法 - 创建严格模式生成器
   */
  static createStrict(): ComponentConfigBuilder {
    return new ComponentConfigBuilder(undefined, { strict: true, debug: true });
  }
}
