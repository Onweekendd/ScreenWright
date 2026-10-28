import type { MastraDBMessage } from "@mastra/core/agent";

import { memory, storage } from "../../storage/storage";
import { filterActiveMessages, getCompactedIds } from "./history/activeMessages";
import { compactHistory } from "./history/compactHistory";
import { isCircuitBroken } from "./history/trigger";

export type ManualCompactResult =
  | {
      compacted: true;
      messageCountBefore: number;
      messageCountAfter: number;
    }
  | {
      compacted: false;
      reason: "压缩失败过多已暂时熔断，请稍后再试" | "对话不存在" | "消息数量过少，无需压缩";
    };

// 手动压缩时,少于这个 active 消息数视为没必要压(避免短对话被无意义地塞进摘要)
const MIN_ACTIVE_MESSAGES = 5;

/**
 * 用户主动触发的压缩：跳过 token 阈值和 cooldown，但仍尊重熔断。
 * 此时没有进行中的请求，全部活跃历史都替换为一条摘要。
 */
export const manualCompact = async (threadId: string, resourceId: string): Promise<ManualCompactResult> => {
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
  const activeMessages = filterActiveMessages(allMessages, await getCompactedIds(threadId));

  if (activeMessages.length < MIN_ACTIVE_MESSAGES) {
    return { compacted: false, reason: "消息数量过少，无需压缩" };
  }

  await compactHistory({ threadId, resourceId, history: activeMessages });
  return {
    compacted: true,
    messageCountBefore: activeMessages.length,
    messageCountAfter: 1
  };
};
