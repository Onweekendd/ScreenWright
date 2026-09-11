import { computed, ref, shallowRef, watch } from "vue";
import { createGlobalState } from "@vueuse/core";

import type { CustomStorageThreadType } from "@screenwright/server/rpc";

import { useLargeScreenInfo } from "../../useLargeScreenInfo";
import { useAgentBIThreadList } from "./hooks/useAgentBIThreadList";
import { useAgentBIVersionHistory } from "./hooks/useAgentBIVersionHistory";
import { type AgentBISession, createAgentBISession } from "./useAgentBI";

/**
 * 整组对话 tab 的管理 store（全局单例）。
 *
 * 维护抽屉可见性、会话列表与当前激活会话；并在切换大屏（navInfo.id 变化）时整体重置——
 * 多 tab 仅限同一大屏，切大屏即清空所有 tab、重建一个空白对话。
 */
export const useAgentBISessions = createGlobalState(() => {
  const { navInfo } = useLargeScreenInfo();
  const threadList = useAgentBIThreadList();
  const versionHistory = useAgentBIVersionHistory();

  const visible = ref(false);
  const sessions = shallowRef<AgentBISession[]>([]);
  const activeSessionId = ref<string>("");

  const activeSession = computed(() => sessions.value.find((s) => s.sessionId === activeSessionId.value));

  /** 新建一个 tab 并激活 */
  const addTab = (): AgentBISession => {
    const session = createAgentBISession();
    sessions.value = [...sessions.value, session];
    activeSessionId.value = session.sessionId;
    return session;
  };

  /**
   * 从历史记录打开一个对话：
   * - 若该对话已在某个 tab 中打开，则直接切换到该 tab（不重复打开）；
   * - 否则新建一个 tab 加到末尾并载入该对话（不替换当前 tab）。
   */
  const openThread = async (thread: CustomStorageThreadType) => {
    const existing = sessions.value.find((s) => s.activeThreadId.value === thread.id);
    if (existing) {
      activeSessionId.value = existing.sessionId;
      return;
    }
    const session = addTab();
    await session.switchToChatFromHistory(thread);
  };

  /**
   * 关闭一个 tab。
   * - 先停掉该 tab 自己的流（不影响其他 tab）；
   * - 若关闭的是激活 tab，则激活相邻 tab；
   * - 若关闭的是最后一个 tab，则自动新建一个空白 tab（保证抽屉里至少有一个会话）。
   */
  const closeTab = (sessionId: string) => {
    const idx = sessions.value.findIndex((s) => s.sessionId === sessionId);
    if (idx === -1) {
      return;
    }
    const target = sessions.value[idx];
    target.stopStreaming();

    const next = sessions.value.filter((s) => s.sessionId !== sessionId);
    sessions.value = next;

    if (activeSessionId.value === sessionId) {
      const fallback = next[idx] ?? next[idx - 1];
      if (fallback) {
        activeSessionId.value = fallback.sessionId;
      } else {
        addTab();
      }
    }
  };

  /** 切大屏：停掉所有 tab 的流、清空列表与共享历史，重建一个默认空白 tab */
  const resetSessions = () => {
    sessions.value.forEach((s) => s.stopStreaming());
    sessions.value = [];
    activeSessionId.value = "";
    threadList.reset();
    versionHistory.reset();
    addTab();
  };

  watch(
    () => navInfo.value.id,
    (id) => {
      if (`${id}` !== "-1") {
        // 历史记录改为「历史面板弹出时」按需拉取（见 queryMemory 的调用方），
        // 这里只负责整组 tab 的重置，不主动请求列表接口。
        resetSessions();
      }
    },
    { immediate: true }
  );

  return {
    visible,
    sessions,
    activeSessionId,
    activeSession,
    addTab,
    closeTab,
    openThread
  };
});
