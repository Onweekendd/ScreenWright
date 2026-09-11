import type { ChildComponent, ComponentType } from "@screenwright/types";

/**
 * 添加回调字段事件处理函数类型
 */
export type AddCallbackFieldHandler = (data: { callbackField: string }) => Promise<any>;

/**
 * 移除回调字段事件处理函数类型
 */
export type RemoveCallbackFieldHandler = (data: { callbackField: string }) => Promise<any>;

/**
 * 回调字段触发事件处理函数类型
 */
export type CallbackFieldTriggerHandler = () => Promise<any>;

/**
 * 过滤器触发事件处理函数类型
 */
export type FilterTriggerHandler = (customComponent?: ComponentType | ChildComponent) => Promise<any>;

/**
 * 回调事件管理器（纯类，框架无关）。
 * 负责管理和分发各类回调事件：添加/移除回调字段、回调字段触发、过滤器触发。
 */
export class CallbackEventManager {
  /**
   * @description 添加回调参数的回调
   * @key `onAddCallbackField-${id}` - 其中 id 为组件ID
   */
  private addCallbackFieldMap = new Map<string, Set<AddCallbackFieldHandler>>();

  /**
   * @description 移除回调参数的回调
   * @key `onRemoveCallbackField-${id}` - 其中 id 为组件ID
   */
  private removeCallbackFieldMap = new Map<string, Set<RemoveCallbackFieldHandler>>();

  /**
   * @description 回调参数触发的回调
   * @key `onCallbackFieldTrigger-${targetKey}-${id}` - 其中 targetKey 为回调字段，id 为组件ID
   */
  callbackFieldTriggerMap = new Map<string, Set<CallbackFieldTriggerHandler>>();

  /**
   * @description 过滤器触发的回调 不需要回调参数，直接触发
   * @key `onFilterTrigger-${componentId}` - 其中 componentId 为组件ID
   */
  filterTriggerMap = new Map<string, Set<FilterTriggerHandler>>();

  onAddCallbackField(key: string, handler: AddCallbackFieldHandler) {
    if (!this.addCallbackFieldMap.has(key)) {
      this.addCallbackFieldMap.set(key, new Set());
    }
    this.addCallbackFieldMap.get(key)!.add(handler);
  }

  offAddCallbackField(key: string, handler?: AddCallbackFieldHandler) {
    const handlers = this.addCallbackFieldMap.get(key);
    if (!handlers) {
      return;
    }

    if (handler) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.addCallbackFieldMap.delete(key);
      }
    } else {
      this.addCallbackFieldMap.delete(key);
    }
  }

  async emitAddCallbackField(key: string, data: { callbackField: string }) {
    const handlers = this.addCallbackFieldMap.get(key);
    if (!handlers) {
      return [];
    }

    const results = [];
    for (const handler of handlers) {
      try {
        const result = await handler(data);
        results.push(result);
      } catch (error) {
        console.error(`Error in addCallbackField handler for key ${key}:`, error);
        results.push(error);
      }
    }
    return results;
  }

  onRemoveCallbackField(key: string, handler: RemoveCallbackFieldHandler) {
    if (!this.removeCallbackFieldMap.has(key)) {
      this.removeCallbackFieldMap.set(key, new Set());
    }
    this.removeCallbackFieldMap.get(key)!.add(handler);
  }

  offRemoveCallbackField(key: string, handler?: RemoveCallbackFieldHandler) {
    const handlers = this.removeCallbackFieldMap.get(key);
    if (!handlers) {
      return;
    }

    if (handler) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.removeCallbackFieldMap.delete(key);
      }
    } else {
      this.removeCallbackFieldMap.delete(key);
    }
  }

  async emitRemoveCallbackField(key: string, data: { callbackField: string }) {
    const handlers = this.removeCallbackFieldMap.get(key);
    if (!handlers) {
      return [];
    }

    const results = [];
    for (const handler of handlers) {
      try {
        await handler(data);
        results.push(true);
      } catch (error) {
        console.error(`Error in removeCallbackField handler for key ${key}:`, error);
        results.push(error);
      }
    }
    return results;
  }

  onCallbackFieldTrigger(key: string, handler: CallbackFieldTriggerHandler) {
    if (!this.callbackFieldTriggerMap.has(key)) {
      this.callbackFieldTriggerMap.set(key, new Set());
    }
    this.callbackFieldTriggerMap.get(key)!.add(handler);
  }

  async offCallbackFieldTrigger(key: string, handler?: CallbackFieldTriggerHandler) {
    const handlers = this.callbackFieldTriggerMap.get(key);
    if (!handlers) {
      return;
    }

    if (handler) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.callbackFieldTriggerMap.delete(key);
      }
      await handler();
    } else {
      this.callbackFieldTriggerMap.delete(key);
    }
  }

  async emitCallbackFieldTrigger(key: string) {
    // 多次监听同一个回调参数 eg: 一个组件添加两个过滤器 两个过滤器同时监听同一个回调参数
    const handlers = this.callbackFieldTriggerMap.get(key);
    if (!handlers) {
      return [];
    }

    const results = [];
    for (const handler of handlers) {
      try {
        const result = await handler();
        results.push(result);
      } catch (error) {
        console.error(`Error in callbackFieldTrigger handler for key ${key}:`, error);
        results.push(error);
      }
    }
    return results;
  }

  onFilterTrigger(key: string, handler: FilterTriggerHandler) {
    if (!this.filterTriggerMap.has(key)) {
      this.filterTriggerMap.set(key, new Set());
    }
    this.filterTriggerMap.get(key)!.add(handler);
  }

  offFilterTrigger(key: string, handler?: FilterTriggerHandler) {
    const handlers = this.filterTriggerMap.get(key);
    if (!handlers) {
      return;
    }

    if (handler) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.filterTriggerMap.delete(key);
      }
    } else {
      this.filterTriggerMap.delete(key);
    }
  }

  async emitFilterTrigger(key: string, customComponent?: ComponentType | ChildComponent) {
    const handlers = this.filterTriggerMap.get(key);
    if (!handlers) {
      return [];
    }

    const results = [];
    for (const handler of handlers) {
      try {
        const result = await handler(customComponent);
        results.push(result);
      } catch (error) {
        console.error(`Error in filterTrigger handler for key ${key}:`, error);
        results.push(error);
      }
    }
    return results;
  }

  /** 清理所有事件监听器 */
  clearAll() {
    this.addCallbackFieldMap.clear();
    this.removeCallbackFieldMap.clear();
    this.callbackFieldTriggerMap.clear();
    this.filterTriggerMap.clear();
  }

  /** 获取所有事件键（用于兼容性） */
  getAllEventKeys() {
    const keys = new Set<string>();
    for (const [key] of this.addCallbackFieldMap) {
      keys.add(key);
    }
    for (const [key] of this.removeCallbackFieldMap) {
      keys.add(key);
    }
    for (const [key] of this.callbackFieldTriggerMap) {
      keys.add(key);
    }
    for (const [key] of this.filterTriggerMap) {
      keys.add(key);
    }
    return Array.from(keys);
  }
}
