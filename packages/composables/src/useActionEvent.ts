import type { toAddEvent, TotalPanelEventMap } from "@screenwright/types";
import { createGlobalState } from "@vueuse/core";
import { ref } from "vue";

import { useScreenEditor } from "./core-adapter/useScreenEditor";

/**
 * @description 组件挂载自身方法用于事件的action调用（适配层）。
 * 注册表逻辑（addEvent / addEventHandler 合并）已迁移到 @screenwright/core 的 ActionEventRegistry，
 * 由编辑器单例持有；本文件只把它接成 Vue 响应式 ref。返回签名与改造前一致。
 */
export const useActionEvent = createGlobalState(() => {
  const registry = useScreenEditor().event.actionEvents;

  // eventList 仍是响应式 ref：registry 变化时重新赋值（registry 每次变化产出新对象引用）
  const eventList = ref<TotalPanelEventMap>(registry.getEventList() as unknown as TotalPanelEventMap);
  registry.subscribe(() => {
    eventList.value = registry.getEventList() as unknown as TotalPanelEventMap;
  });

  const addEvent = (event: toAddEvent) => {
    registry.addEvent(event as Record<string, any>);
  };

  /**
   * 向已存在的事件对象中添加新的处理函数
   * 如果函数名已存在，会合并原有逻辑和新逻辑
   * @param key - 事件对象的 key，例如 'FtMutual-123'
   * @param functionName - 要添加的函数名，会根据 key 自动推断可用的函数名
   * @param handler - 处理函数
   */
  const addEventHandler = <
    K extends keyof TotalPanelEventMap,
    F extends keyof TotalPanelEventMap[K],
    T extends Parameters<Extract<TotalPanelEventMap[K][F], (...args: any) => any>>
  >(
    key: K,
    functionName: F,
    handler: (...args: T) => void | Promise<void>
  ) => {
    registry.addEventHandler(
      key as string,
      functionName as string,
      handler as (...args: any[]) => void | Promise<void>
    );
  };

  return {
    eventList,
    addEvent,
    addEventHandler
  };
});
