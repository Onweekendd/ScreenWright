import type { MastraDBMessage } from "@mastra/core/agent";
import type { Processor, ProcessorMessageContext } from "@mastra/core/processors";

import { memory } from "../../../storage/storage";
import { runCompaction } from "../compact";
import { compactionConfig } from "../config";
import { filterActiveMessages, getCompactedIds } from "../filter";
import { applyCompaction } from "../historyReplacer";
import { recordCompactionFailure, recordCompactionSuccess, shouldCompactL3, tickRound } from "../trigger";

const extractThreadId = (messages: MastraDBMessage[]): string | undefined => {
  for (const msg of messages) {
    if (msg.threadId) {
      return msg.threadId;
    }
  }
  return undefined;
};

const extractResourceId = (messages: MastraDBMessage[]): string | undefined => {
  for (const msg of messages) {
    if (msg.resourceId) {
      return msg.resourceId;
    }
  }
  return undefined;
};

export class CompactionProcessor implements Processor {
  id = "compaction";

  async processInput({ messages }: ProcessorMessageContext): Promise<MastraDBMessage[]> {
    if (!compactionConfig.l3Enabled) {
      return messages;
    }

    const threadId = extractThreadId(messages);
    if (!threadId) {
      return messages;
    }

    const compactedIds = await getCompactedIds(threadId);
    const activeMessages = filterActiveMessages(messages, compactedIds);

    tickRound(threadId);

    // 用上一轮 LLM 真实回包的输入 token 数判断是否触发压缩,
    // 比 length/4 估算更准。bi-chat.server.ts 的 onStepFinish 会把每轮 usage 写进 thread metadata。
    const thread = await memory.getThreadById({ threadId });
    const usage = (thread?.metadata as { lastUsage?: { inputTokens?: number; promptTokens?: number } } | undefined)
      ?.lastUsage;
    const promptTokens = usage?.inputTokens ?? usage?.promptTokens ?? 0;

    const decision = shouldCompactL3(promptTokens, threadId);
    if (!decision.compact) {
      return activeMessages;
    }

    try {
      const result = await runCompaction(activeMessages);
      const newActive = await applyCompaction({
        memory,
        threadId,
        resourceId: extractResourceId(messages),
        originalMessages: activeMessages,
        result
      });
      recordCompactionSuccess(threadId);
      return newActive;
    } catch (err) {
      recordCompactionFailure(threadId);
      console.error("[compaction] L3 failed:", err);
      return activeMessages;
    }
  }
}
