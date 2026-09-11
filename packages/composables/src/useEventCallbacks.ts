import type { EventCallbackFunction, EventCallbackParams } from "@screenwright/core";
import { createGlobalState } from "@vueuse/core";

import { useScreenEditor } from "./core-adapter/useScreenEditor";

export type { EventCallbackFunction, EventCallbackParams };

/**
 * 事件回调管理 Hook（适配层）。
 * 实际注册表由 @screenwright/core 的 EventCallbackRegistry 托管（编辑器单例持有，全应用唯一）。
 * 返回签名与改造前一致。
 */
export const useEventCallbacks = createGlobalState(() => {
  const { eventCallbacks } = useScreenEditor().event;

  return {
    registerCallback: (callback: EventCallbackFunction) => eventCallbacks.registerCallback(callback),
    registerCallbacks: (callbackList: EventCallbackFunction[]) => eventCallbacks.registerCallbacks(callbackList),
    unregisterCallback: (callback: EventCallbackFunction) => eventCallbacks.unregisterCallback(callback),
    clearCallbacks: () => eventCallbacks.clearCallbacks(),
    executeCallbacks: (params: EventCallbackParams) => eventCallbacks.executeCallbacks(params),
    getCallbackCount: () => eventCallbacks.getCallbackCount()
  };
});
