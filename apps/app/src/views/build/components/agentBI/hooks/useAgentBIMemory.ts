import { ref } from "vue";

import { AgentMode, type CustomStorageThreadType } from "@screenwright/server/rpc";
import { apiClient } from "@screenwright/server/rpc";
import type { UIMessage } from "ai";
import { ElMessage } from "element-plus";

import type { AgentBISharedState, UsageInfo } from "../type";

/**
 * 单个会话 tab 私有的记忆状态：当前激活线程、分页、mode 及对应的加载/切换逻辑。
 *
 * 共享的历史线程列表（memoryThreads / queryMemory / updateThreadTitle）由
 * useAgentBIThreadList 持有，这里通过 shared.memoryThreads 注入，用于 ensureActiveThread
 * 推入新线程、applyLocalMode/updateThreadMode 同步 metadata。
 */
export function useAgentBIMemory(shared: AgentBISharedState) {
  const { messages, resourceId, lastUsage, memoryThreads } = shared;

  const PAGE_SIZE = 10;

  const activeThreadId = ref<string | undefined>(undefined);
  const isLoadingThreadMessages = ref(false);
  const isLoadingMoreMessages = ref(false);
  const hasMoreMessages = ref(false);
  const currentPage = ref(0);
  const currentMode = ref<AgentMode>(AgentMode.ASK_BEFORE_EDIT);

  const ensureActiveThread = async () => {
    if (activeThreadId.value) {
      return;
    }

    const res = await apiClient.customApi["bi-chat"]["create-thread"].$post({
      json: { resourceId: resourceId.value, title: "新对话", metadata: { mode: currentMode.value } }
    });
    const newThread = await res.json();

    activeThreadId.value = newThread.id;
    memoryThreads.value.push(newThread as unknown as CustomStorageThreadType);
  };

  const loadThreadMessages = async (threadHead: CustomStorageThreadType) => {
    if (isLoadingThreadMessages.value) {
      return;
    }

    activeThreadId.value = threadHead.id;
    isLoadingThreadMessages.value = true;
    currentPage.value = 0;
    messages.value = [];
    try {
      const res = await apiClient.customApi["bi-chat"]["thread-messages"].$post({
        json: {
          threadId: threadHead.id,
          resourceId: threadHead.resourceId,
          page: 0,
          perPage: PAGE_SIZE
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const { messages: responseMessages, hasMore } = await res.json();

      messages.value = responseMessages as UIMessage[];
      hasMoreMessages.value = hasMore;

      if (threadHead.metadata?.lastUsage) {
        lastUsage.value = threadHead.metadata.lastUsage as UsageInfo;
      } else {
        lastUsage.value = { inputTokens: 0, outputTokens: 0, totalTokens: 0, reasoningTokens: 0 };
      }
      currentMode.value = (threadHead.metadata?.mode as AgentMode) ?? AgentMode.ASK_BEFORE_EDIT;
    } catch (_err) {
      messages.value = [];
      ElMessage.error("加载对话失败，请稍后重试。");
    } finally {
      isLoadingThreadMessages.value = false;
    }
  };

  const loadOlderMessages = async () => {
    if (isLoadingMoreMessages.value || !hasMoreMessages.value || !activeThreadId.value) {
      return;
    }

    isLoadingMoreMessages.value = true;
    const nextPage = currentPage.value + 1;
    try {
      const res = await apiClient.customApi["bi-chat"]["thread-messages"].$post({
        json: {
          threadId: activeThreadId.value,
          resourceId: resourceId.value,
          page: nextPage,
          perPage: PAGE_SIZE
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const { messages: olderMessages, hasMore } = await res.json();

      messages.value = [...(olderMessages as UIMessage[]), ...messages.value];
      hasMoreMessages.value = hasMore;
      currentPage.value = nextPage;
    } catch (_err) {
      ElMessage.error("加载更多消息失败，请稍后重试。");
    } finally {
      isLoadingMoreMessages.value = false;
    }
  };

  const startNewChat = () => {
    messages.value = [];
    activeThreadId.value = undefined;
    lastUsage.value = { inputTokens: 0, outputTokens: 0, totalTokens: 0, reasoningTokens: 0 };
    currentMode.value = AgentMode.ASK_BEFORE_EDIT;
    hasMoreMessages.value = false;
    currentPage.value = 0;
  };

  /**
   * 仅同步本地状态（currentMode + memoryThreads 缓存），不请求后端。
   * 用于后端工具（enter-plan-mode / submit-plan）已经在服务端写入 metadata.mode 的场景，
   * 避免前端重复发 update-thread 请求。
   */
  const applyLocalMode = (mode: AgentMode) => {
    currentMode.value = mode;
    if (!activeThreadId.value) {
      return;
    }
    const idx = memoryThreads.value.findIndex((t) => t.id === activeThreadId.value);
    if (idx !== -1) {
      memoryThreads.value[idx].metadata = { ...memoryThreads.value[idx].metadata, mode };
    }
  };

  const updateThreadMode = async (mode: AgentMode) => {
    currentMode.value = mode;
    if (!activeThreadId.value) {
      return;
    }

    try {
      const currentThread = memoryThreads.value.find((t) => t.id === activeThreadId.value);
      await apiClient.customApi["bi-chat"]["update-thread"].$post({
        json: {
          threadId: activeThreadId.value,
          title: currentThread?.title ?? "新对话",
          metadata: { ...(currentThread?.metadata as Record<string, unknown>), mode }
        }
      });
      const idx = memoryThreads.value.findIndex((t) => t.id === activeThreadId.value);
      if (idx !== -1) {
        memoryThreads.value[idx].metadata = { ...memoryThreads.value[idx].metadata, mode };
      }
    } catch (_err) {
      ElMessage.error("更新模式失败，请稍后重试。");
    }
  };

  return {
    activeThreadId,
    isLoadingThreadMessages,
    isLoadingMoreMessages,
    hasMoreMessages,
    currentMode,
    ensureActiveThread,
    loadThreadMessages,
    loadOlderMessages,
    startNewChat,
    updateThreadMode,
    applyLocalMode
  };
}
