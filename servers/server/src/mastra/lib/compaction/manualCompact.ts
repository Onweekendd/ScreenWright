import type { MastraDBMessage } from "@mastra/core/agent";

import { memory, storage } from "../../storage/storage";
import { runCompaction } from "./compact";
import { compactionConfig } from "./config";
import { filterActiveMessages, getCompactedIds } from "./filter";
import { applyCompaction } from "./historyReplacer";
import { isCircuitBroken, recordCompactionFailure, recordCompactionSuccess } from "./trigger";

export type ManualCompactResult =
  | {
      compacted: true;
      messageCountBefore: number;
      messageCountAfter: number;
    }
  | {
      compacted: false;
      reason: "上下文压缩功能未开启" | "压缩失败过多已暂时熔断，请稍后再试" | "对话不存在" | "消息数量过少，无需压缩";
    };

// 手动压缩时,少于这个 active 消息数视为没必要压(避免短对话被无意义地塞进摘要)
const MIN_ACTIVE_MESSAGES = 5;

/**
 * 用户主动触发的 L3 压缩。跳过 token 阈值和 cooldown 判定,
 * 但仍尊重 l3Enabled flag 和熔断状态。
 */
export const manualCompact = async (threadId: string, resourceId: string): Promise<ManualCompactResult> => {
  if (!compactionConfig.l3Enabled) {
    return { compacted: false, reason: "上下文压缩功能未开启" };
  }
  if (isCircuitBroken(threadId)) {
    return { compacted: false, reason: "压缩失败过多已暂时熔断，请稍后再试" };
  }

  const thread = await memory.getThreadById({ threadId });
  if (!thread) {
    return { compacted: false, reason: "对话不存在" };
  }

  const memoryStore = await storage.getStore("memory");
  if (!memoryStore) {
    throw new Error("Memory store not available");
  }

  // 拿全量历史(按时间正序),足够覆盖一个 thread 的所有消息;
  // 超过 10000 条的场景在 BI agent 里不会出现,如果出现就需要分页处理。
  const listResult = await memoryStore.listMessages({
    threadId,
    resourceId,
    perPage: false,
    orderBy: { field: "createdAt", direction: "ASC" }
  });
  const allMessages = listResult.messages as MastraDBMessage[];

  const compactedIds = await getCompactedIds(threadId);
  const activeMessages = filterActiveMessages(allMessages, compactedIds);

  if (activeMessages.length < MIN_ACTIVE_MESSAGES) {
    return { compacted: false, reason: "消息数量过少，无需压缩" };
  }

  try {
    const result = await runCompaction(activeMessages);

    await applyCompaction({
      memory,
      threadId,
      resourceId,
      originalMessages: activeMessages,
      result
    });

    recordCompactionSuccess(threadId);

    return {
      compacted: true,
      messageCountBefore: activeMessages.length,
      messageCountAfter: activeMessages.length - result.hiddenIds.length + 1
    };
  } catch (err) {
    recordCompactionFailure(threadId);
    throw err;
  }
};
