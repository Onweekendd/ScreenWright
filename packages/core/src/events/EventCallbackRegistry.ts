import type { EventTypeEnum } from "@screenwright/types";

/** 事件回调参数类型 */
export interface EventCallbackParams {
  throwValue: Record<string, any>;
  id?: number | string;
  triggerType: EventTypeEnum;
}

/** 事件回调函数类型 */
export type EventCallbackFunction = (params: EventCallbackParams) => void | Promise<void>;

/**
 * 事件回调注册表（纯类，框架无关）。
 * 注册/执行多个通用事件回调；执行时并发等待所有异步回调完成。
 */
export class EventCallbackRegistry {
  private callbacks = new Set<EventCallbackFunction>();

  /** 注册回调，返回取消注册函数。 */
  registerCallback(callback: EventCallbackFunction): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /** 批量注册回调，返回取消全部注册函数。 */
  registerCallbacks(callbackList: EventCallbackFunction[]): () => void {
    callbackList.forEach((callback) => this.callbacks.add(callback));
    return () => {
      callbackList.forEach((callback) => this.callbacks.delete(callback));
    };
  }

  /** 取消注册单个回调。 */
  unregisterCallback(callback: EventCallbackFunction): void {
    this.callbacks.delete(callback);
  }

  /** 清空所有回调。 */
  clearCallbacks(): void {
    this.callbacks.clear();
  }

  /** 执行所有已注册回调（并发等待异步完成）。 */
  async executeCallbacks(params: EventCallbackParams): Promise<void> {
    const promises: Promise<void>[] = [];

    this.callbacks.forEach((callback) => {
      try {
        const result = callback(params);
        if (result instanceof Promise) {
          promises.push(result);
        }
      } catch (error) {
        console.error("执行事件回调函数时出错:", error);
      }
    });

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  /** 当前注册的回调数量。 */
  getCallbackCount(): number {
    return this.callbacks.size;
  }
}
