/**
 * 组件 action 方法注册表（纯类，框架无关）。
 *
 * 物料组件挂载时把自身方法注册进来（addEvent），事件派发（useEventHandling）按 key 读取并调用。
 * 强类型 TotalPanelEventMap 属 app 物料类型，不进 core；core 用宽松类型，强类型在适配层用 as 桥接。
 *
 * 响应式说明：core 内部用普通对象维护；变化时通过 subscribe 通知，Vue 适配层据此把 eventList
 * 包成可响应的 ref。
 */
type EventHandler = (...args: any[]) => void | Promise<void>;
type EventObject = Record<string, EventHandler>;
type EventList = Record<string, EventObject>;

export class ActionEventRegistry {
  private eventList: EventList = {};

  /** 栈变化订阅者（供适配层桥接响应式）。 */
  private listeners = new Set<() => void>();

  /** 订阅事件表变化，返回取消订阅函数。 */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** 通知所有订阅者事件表发生变化。 */
  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  /** 获取当前事件表（每次变化后为新对象引用）。 */
  getEventList(): EventList {
    return this.eventList;
  }

  /**
   * 添加（合并）一组事件对象。
   * @param event 形如 { "FtMutual-123": { fn: handler } }
   */
  addEvent(event: Record<string, any>): void {
    this.eventList = { ...this.eventList, ...event };
    this.notify();
  }

  /**
   * 向已存在的事件对象中添加新的处理函数。
   * 如果函数名已存在，会合并原有逻辑和新逻辑（先原后新）。
   * @param key 事件对象的 key，例如 'FtMutual-123'
   * @param functionName 要添加的函数名
   * @param handler 处理函数
   */
  addEventHandler(key: string, functionName: string, handler: EventHandler): void {
    const existingEvent = this.eventList[key] as EventObject | undefined;
    const existingHandler = existingEvent?.[functionName];

    // 如果已经存在同名函数，合并逻辑
    const mergedHandler: EventHandler = existingHandler
      ? async (...args: any[]) => {
          // 先执行原有逻辑
          await existingHandler(...args);
          // 再执行新逻辑
          await handler(...args);
        }
      : handler;

    const updatedEvent: EventObject = {
      ...existingEvent, // 保留原有的所有方法
      [functionName]: mergedHandler // 添加或合并方法
    };

    // 整体替换为新对象引用，便于适配层响应式追踪
    this.eventList = { ...this.eventList, [key]: updatedEvent };
    this.notify();
  }
}
