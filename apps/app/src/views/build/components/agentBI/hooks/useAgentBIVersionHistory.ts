import { computed, ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import type { FileChange, HistoryNode, RollbackPlan } from "@screenwright/server/rpc";
import { apiClient } from "@screenwright/server/rpc";

import { useLargeScreenInfo } from "../../../useLargeScreenInfo";

/** git 空树 hash：某提问是首个 commit（无父）时，"修改前" = 空大屏，用它作对比基准 */
const EMPTY_TREE_HASH = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

/**
 * 大屏版本回退节点 store（全局单例，按当前大屏共享）。
 *
 * 版本历史是「按大屏」的（git 仓库 screen_{resourceId}-{versionCode}，跨该屏所有对话线程），
 * 而消息是「按线程」的——两者尺度不同，故独立成 store，和 useAgentBIThreadList 一样按大屏共享，
 * 由 useAgentBISessions 在切大屏时统一 reset。
 *
 * 撤销某条用户提问 = 找到该提问产生的节点（node.messageId === 用户消息 id），
 * 回到它的父节点 node.parent（= 该提问「修改前」的状态）。
 */
export const useAgentBIVersionHistory = createGlobalState(() => {
  const { navInfo } = useLargeScreenInfo();
  const resourceId = computed(() => `${navInfo.value.id}`);
  const versionCode = computed(() => `${navInfo.value.versionCode ?? ""}`);

  /** 该大屏全部回退节点（含基线节点与每次提问节点），按时间倒序 */
  const nodes = ref<HistoryNode[]>([]);
  const isLoading = ref(false);

  /**
   * messageId → 该提问产生的回退节点。
   * 每条用户消息据此查自己的撤销锚点：查得到 → 显示撤销（目标 = node.parent）；
   * 查不到（基线节点无 messageId、或别的线程的提问）→ 不显示。
   */
  const nodesByMessageId = computed(() => {
    const map = new Map<string, HistoryNode>();
    for (const node of nodes.value) {
      if (node.messageId) {
        map.set(node.messageId, node);
      }
    }
    return map;
  });

  /** 拉取该大屏的回退节点列表。切换线程时（与 thread-messages 并行）、每轮编辑完成后调用刷新。 */
  const refreshVersionNodes = async () => {
    if (isLoading.value) {
      return;
    }
    isLoading.value = true;
    try {
      const res = await apiClient.customApi["bi-chat"]["version"]["list"].$post({
        json: { resourceId: resourceId.value, versionCode: versionCode.value }
      });
      const data = await res.json();
      nodes.value = (data.nodes ?? []) as HistoryNode[];
    } catch (_err) {
      nodes.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 预览「撤销某条用户提问」会变动哪些文件（工作区当前状态 vs 该提问「修改前」的状态）。
   *
   * 撤销目标 = 该提问 commit 的父节点（node.parent，= 提问前状态）；无父（首个 commit）则用空树。
   * 只返回差异、不执行回退。
   * @param messageId 用户消息 id
   * @returns { targetCommit, files }；该消息没有对应回退节点时返回 null
   */
  const previewRollback = async (messageId: string): Promise<{ targetCommit: string; files: FileChange[] } | null> => {
    const node = nodesByMessageId.value.get(messageId);
    if (!node) {
      return null;
    }
    const targetCommit = node.parent || EMPTY_TREE_HASH;
    try {
      const res = await apiClient.customApi["bi-chat"]["version"]["preview"].$post({
        json: { resourceId: resourceId.value, versionCode: versionCode.value, commit: targetCommit }
      });
      const data = await res.json();
      return { targetCommit, files: (data.files ?? []) as FileChange[] };
    } catch (_err) {
      return { targetCommit, files: [] };
    }
  };

  /**
   * 拉取「撤销某条用户提问」的回退计划（有序回退操作 + 暂不支持项）。
   *
   * 目标节点同 previewRollback：该提问 commit 的父（提问前状态），无父用空树。
   * 只取计划、不执行；执行交给 useRollbackExecutor。与 previewRollback 不同，
   * 请求失败向上抛出——回退是写操作，取不到计划就不该继续，让调用方感知并中止。
   * @param messageId 用户消息 id
   * @returns RollbackPlan；该消息无对应回退节点时返回 null
   */
  const fetchRollbackPlan = async (messageId: string): Promise<RollbackPlan | null> => {
    const node = nodesByMessageId.value.get(messageId);
    if (!node) {
      return null;
    }
    const targetCommit = node.parent || EMPTY_TREE_HASH;
    const res = await apiClient.customApi["bi-chat"]["version"]["rollback-plan"].$post({
      json: { resourceId: resourceId.value, versionCode: versionCode.value, commit: targetCommit }
    });
    return (await res.json()) as RollbackPlan;
  };

  /** 某条用户消息是否可撤销（存在对应回退节点） */
  const canUndoMessage = (messageId: string) => nodesByMessageId.value.has(messageId);

  /** 切大屏时清空，避免上一块大屏的节点串台 */
  const reset = () => {
    nodes.value = [];
    isLoading.value = false;
  };

  return {
    nodes,
    isLoading,
    nodesByMessageId,
    refreshVersionNodes,
    previewRollback,
    fetchRollbackPlan,
    canUndoMessage,
    reset
  };
});
