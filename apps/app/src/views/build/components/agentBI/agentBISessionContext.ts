import { type ComputedRef, inject, type InjectionKey } from "vue";

import type { AgentBISession } from "./useAgentBI";

/**
 * 当前激活会话（active tab）的注入 key。
 *
 * index.vue 在顶层 provide 激活会话，叶子组件（ChatInput / ApprovalDialog / BackgroundTasksView 等）
 * 通过 useActiveAgentBISession 取用，避免逐层 prop drilling。叶子组件在切 tab 时由
 * index.vue 用 :key 重新挂载，因此这里在 setup 阶段解析出当次激活会话的实例即可。
 */
export const ActiveSessionKey: InjectionKey<ComputedRef<AgentBISession | undefined>> = Symbol("ActiveAgentBISession");

/**
 * 取当前激活会话实例（必须在已 provide ActiveSessionKey 的组件子树内调用）。
 */
export function useActiveAgentBISession(): AgentBISession {
  const session = inject(ActiveSessionKey);
  if (!session?.value) {
    throw new Error("useActiveAgentBISession 必须在已 provide ActiveSessionKey 的组件内使用");
  }
  return session.value;
}
