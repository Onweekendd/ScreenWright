import type { StateKeyEnum } from "../types";

/**
 * 基础状态存储接口
 * 所有可以被 StateManager 管理的存储都必须实现这个接口
 */
export interface IStateStore {
  /**
   * 清空状态
   */
  clear(): void;
}

/**
 * 单值状态存储接口
 * 用于存储单个值或对象的状态存储
 */
export interface IValueStore<T> extends IStateStore {
  /**
   * 获取状态
   */
  get(): T | undefined;

  /**
   * 设置状态
   */
  set(value: T): void;

  /**
   * 更新状态（支持部分更新）
   */
  update(updater: (prev: T | undefined) => T): void;

  /**
   * 检查是否有值
   */
  hasValue(): boolean;
}

/**
 * 通用状态管理器
 *
 * 类似于前端的状态管理库（Redux/Zustand），支持存储多种类型的数据
 * 提供类型安全的状态访问和修改方法
 */
class StateManager {
  private stores: Map<string, IValueStore<any>> = new Map();

  /**
   * 创建或获取一个状态存储切片
   * @param key 存储键名
   * @param initialValue 初始值（可选）
   */
  createDefaultStore<T>(key: string, initialValue?: T): DefaultStateStore<T> {
    if (!this.stores.has(key)) {
      this.stores.set(key, new DefaultStateStore<T>(initialValue));
    }
    return this.stores.get(key) as DefaultStateStore<T>;
  }

  /**
   * 直接设置一个状态存储切片
   * @param key 存储键名
   * @param store 实现了 IValueStore 接口的存储实例
   */
  setStore<V extends IValueStore<any>>(key: StateKeyEnum, store: V): V {
    this.stores.set(key, store);
    return store;
  }

  /**
   * 获取状态存储切片
   * @param key 存储键名
   */
  getStore<V extends IValueStore<any>>(key: StateKeyEnum): V | undefined {
    return this.stores.get(key) as V | undefined;
  }

  /**
   * 删除状态存储切片
   * @param key 存储键名
   */
  deleteStore(key: StateKeyEnum): boolean {
    return this.stores.delete(key);
  }

  /**
   * 清空所有状态
   */
  clearAll(): void {
    this.stores.forEach((store) => {
      store.clear();
    });
    this.stores.clear();
  }

  /**
   * 获取所有存储键名
   */
  getAllKeys(): string[] {
    return Array.from(this.stores.keys());
  }
}

/**
 * 通用状态存储切片
 * 支持存储任意类型的数据
 */
class DefaultStateStore<T> implements IStateStore {
  private state: T | undefined;

  constructor(initialValue?: T) {
    this.state = initialValue;
  }

  /**
   * 获取状态
   */
  get(): T | undefined {
    return this.state;
  }

  /**
   * 设置状态
   */
  set(value: T): void {
    this.state = value;
  }

  /**
   * 更新状态（支持部分更新）
   */
  update(updater: (prev: T | undefined) => T): void {
    this.state = updater(this.state);
  }

  /**
   * 清空状态
   */
  clear(): void {
    this.state = undefined;
  }

  /**
   * 检查是否有状态
   */
  hasValue(): boolean {
    return this.state !== undefined;
  }
}

/**
 * 通用状态管理器实例
 * 支持存储多种类型的数据，类似于前端状态管理库
 */
export const stateManager = new StateManager();

// 导出类供外部使用
export { DefaultStateStore, StateManager };
