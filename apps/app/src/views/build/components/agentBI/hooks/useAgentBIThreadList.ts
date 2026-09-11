import { computed, ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import type { CustomStorageThreadType } from "@screenwright/server/rpc";
import { apiClient } from "@screenwright/server/rpc";
import { ElMessage } from "element-plus";

import { useLargeScreenInfo } from "../../../useLargeScreenInfo";

/**
 * 历史线程列表 store（全局单例，按当前大屏 resourceId 共享）。
 *
 * 同一大屏下的多个对话 tab 看到的是同一份历史列表，因此把 memoryThreads / isLoadingMemory /
 * queryMemory / updateThreadTitle 从原 useAgentBIMemory（每 tab 私有）抽出来共享。
 * 每个会话的私有状态（activeThreadId / 分页 / mode 等）仍留在 useAgentBIMemory。
 *
 * resourceId 直接由全局的 useLargeScreenInfo 派生（navInfo.id），切大屏时由
 * useAgentBISessions 统一清空本列表。
 */
export const useAgentBIThreadList = createGlobalState(() => {
  const { navInfo } = useLargeScreenInfo();
  const resourceId = computed(() => `${navInfo.value.id}`);

  const memoryThreads = ref<CustomStorageThreadType[]>([]);
  const isLoadingMemory = ref(false);

  const queryMemory = async () => {
    if (isLoadingMemory.value) {
      return;
    }
    isLoadingMemory.value = true;
    try {
      const res = await apiClient.customApi["bi-chat"]["list-threads"].$post({
        json: { resourceId: resourceId.value }
      });
      const data = await res.json();
      memoryThreads.value = (data.threads ?? []) as unknown as CustomStorageThreadType[];
    } catch (_err) {
      memoryThreads.value = [];
    } finally {
      isLoadingMemory.value = false;
    }
  };

  const updateThreadTitle = async (threadId: string, newTitle: string) => {
    try {
      const currentThread = memoryThreads.value.find((t) => t.id === threadId);
      await apiClient.customApi["bi-chat"]["update-thread"].$post({
        json: {
          threadId,
          title: newTitle,
          metadata: (currentThread?.metadata as Record<string, unknown>) || {}
        }
      });
      const idx = memoryThreads.value.findIndex((t) => t.id === threadId);
      if (idx !== -1) {
        memoryThreads.value[idx].title = newTitle;
      }
    } catch (_err) {
      ElMessage.error("更新标题失败，请稍后重试。");
    }
  };

  /** 切大屏时清空列表，避免上一块大屏的历史串台 */
  const reset = () => {
    memoryThreads.value = [];
    isLoadingMemory.value = false;
  };

  return {
    memoryThreads,
    isLoadingMemory,
    queryMemory,
    updateThreadTitle,
    reset
  };
});
