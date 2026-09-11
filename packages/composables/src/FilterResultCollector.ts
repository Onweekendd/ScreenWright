import type { ResultCollectItem } from "@screenwright/core";
import type { ChildComponent, ComponentType } from "@screenwright/types";
import type { Ref } from "vue";
import { ref } from "vue";

// ResultCollectItem 类型已迁移到 @screenwright/core；此处再导出以保持原有导入路径不变。
export type { ResultCollectItem };

/**
 * 过滤器结果收集映射类型（用于 ComponentType）
 */
export type ResultCollectMap = WeakMap<ComponentType, ResultCollectItem[]>;

/**
 * 子组件过滤器结果收集映射类型（用于 ChildComponent）
 */
export type ChildResultCollectMap = Map<string, ResultCollectItem[]>;

/**
 * 过滤器结果收集器类（单例模式）
 * 用于管理组件与过滤器结果的映射关系
 */
export class FilterResultCollector {
  private static instance: FilterResultCollector;
  private resultMap: ResultCollectMap;
  private childResultMap: ChildResultCollectMap;
  private versionRef: Ref<number>;

  private constructor() {
    this.resultMap = new WeakMap();
    this.childResultMap = new Map();
    this.versionRef = ref(0);
  }

  /**
   * 判断是否为子组件（ChildComponent 的 id 为 string 类型）
   */
  private isChildComponent(component: ComponentType | ChildComponent): component is ChildComponent {
    return typeof component.id === "string";
  }

  /**
   * 获取单例实例
   * @returns FilterResultCollector 实例
   */
  public static getInstance(): FilterResultCollector {
    if (!FilterResultCollector.instance) {
      FilterResultCollector.instance = new FilterResultCollector();
    }
    return FilterResultCollector.instance;
  }

  /**
   * 触发响应式更新
   */
  private triggerUpdate(): void {
    this.versionRef.value++;
  }

  /**
   * 获取响应式版本号，用于在 Vue 组件中监听数据变化
   * @returns 响应式版本号 ref
   */
  public getVersionRef(): Ref<number> {
    return this.versionRef;
  }

  /**
   * 设置组件的过滤结果
   * @param component - 组件对象
   * @param results - 过滤结果数组
   */
  setResults(component: ComponentType | ChildComponent, results: ResultCollectItem[]): void {
    if (this.isChildComponent(component)) {
      this.childResultMap.set(component.id, results);
    } else {
      this.resultMap.set(component, results);
    }
    this.triggerUpdate();
  }

  /**
   * 获取组件的过滤结果
   * @param component - 组件对象
   * @returns 过滤结果数组，如果不存在则返回 undefined
   */
  getResults(component: ComponentType | ChildComponent): ResultCollectItem[] | undefined {
    if (this.isChildComponent(component)) {
      return this.childResultMap.get(component.id);
    }
    return this.resultMap.get(component);
  }

  /**
   * 检查组件是否有过滤结果
   * @param component - 组件对象
   * @returns 是否存在过滤结果
   */
  hasResults(component: ComponentType | ChildComponent): boolean {
    if (this.isChildComponent(component)) {
      return this.childResultMap.has(component.id);
    }
    return this.resultMap.has(component);
  }

  /**
   * 删除组件的过滤结果
   * @param component - 组件对象
   * @returns 是否成功删除
   */
  deleteResults(component: ComponentType | ChildComponent): boolean {
    if (this.isChildComponent(component)) {
      return this.childResultMap.delete(component.id);
    }
    return this.resultMap.delete(component);
  }

  /**
   * 获取组件特定过滤器的结果
   * @param component - 组件对象
   * @param filterName - 过滤器名称
   * @returns 过滤结果项数组
   */
  getResultsByFilterName(component: ComponentType | ChildComponent, filterName: string): ResultCollectItem[] {
    const allResults = this.getResults(component);
    if (!allResults) {
      return [];
    }

    return allResults.flat().filter((item) => item.filterName === filterName);
  }

  /**
   * 清空所有结果
   */
  clear(): void {
    this.resultMap = new WeakMap();
    this.childResultMap.clear();
  }

  /**
   * 获取原始的 WeakMap 实例（用于向后兼容）
   * @returns WeakMap 实例
   */
  getRawMap(): ResultCollectMap {
    return this.resultMap;
  }

  /**
   * 获取子组件的 Map 实例
   * @returns Map 实例
   */
  getChildResultMap(): ChildResultCollectMap {
    return this.childResultMap;
  }
}
