import type { MastraDBMessage, MessageList } from "@mastra/core/agent";
import type { ProcessInputArgs, Processor } from "@mastra/core/processors";

import { memory } from "../../../storage/storage";
import { filterActiveMessages, getCompactedIds, splitCurrentTurn } from "../history/activeMessages";
import { compactHistory } from "../history/compactHistory";
import { emitCompactionEvent } from "../history/compactionEvents";
import { shouldAutoCompact, tickRound } from "../history/trigger";

const firstDefined = <K extends "threadId" | "resourceId">(messages: MastraDBMessage[], key: K) =>
  messages.find((message) => message[key])?.[key];

/**
 * 用上一轮 LLM 真实回包的输入 token 数判断是否触发压缩,比 length/4 估算更准。
 * bi-chat-turn-stream.ts 的 onStepFinish 会把每步 usage 写进 thread metadata。
 */
const readLastPromptTokens = async (threadId: string): Promise<number> => {
  const thread = await memory.getThreadById({ threadId });
  const usage = (thread?.metadata as { lastUsage?: { inputTokens?: number; promptTokens?: number } } | undefined)
    ?.lastUsage;
  return usage?.inputTokens ?? usage?.promptTokens ?? 0;
};

/**
 * 自动压缩入口。`messages` 参数只含本轮新输入，memory 召回的历史要从 messageList 读写；
 * memory 处理器排在用户处理器之前，这里能拿到完整历史。
 */
export class CompactionProcessor implements Processor {
  id = "compaction";

  async processInput({ messageList }: ProcessInputArgs): Promise<MessageList> {
    const messages = messageList.get.all.db();
    const threadId = firstDefined(messages, "threadId");
    if (!threadId) {
      return messageList;
    }

    // memory 只按条数召回，已被摘要替代的原消息也会被带回来，先移出模型视图。
    const compactedIds = await getCompactedIds(threadId);
    const activeMessages = filterActiveMessages(messages, compactedIds);
    if (activeMessages.length < messages.length) {
      messageList.removeByIds(messages.filter((message) => compactedIds.has(message.id)).map(({ id }) => id));
    }

    tickRound(threadId);
    const decision = shouldAutoCompact(await readLastPromptTokens(threadId), threadId);
    if (!decision.compact) {
      return messageList;
    }

    const { history, currentTurn } = splitCurrentTurn(activeMessages);
    if (history.length === 0) {
      return messageList;
    }

    emitCompactionEvent(threadId, { status: "started" });
    try {
      const summaryMessage = await compactHistory({
        threadId,
        resourceId: firstDefined(messages, "resourceId"),
        history,
        keptCount: currentTurn.length
      });
      messageList.removeByIds(history.map(({ id }) => id));
      // 以 memory 来源加入：摘要已自行落库，不能再被当作本轮新输入保存。
      messageList.add(summaryMessage, "memory");
      emitCompactionEvent(threadId, {
        status: "completed",
        summary: summaryMessage,
        keptFromMessageId: currentTurn[0]?.id
      });
    } catch (err) {
      console.error("[compaction] 自动压缩失败，保留原历史:", err);
      emitCompactionEvent(threadId, { status: "failed" });
    }
    return messageList;
  }
}
