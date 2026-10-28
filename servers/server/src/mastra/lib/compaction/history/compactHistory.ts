import type { MastraDBMessage } from "@mastra/core/agent";

import { getModelConfigSync } from "../../../provider/model-registry";
import { countTextTokens } from "../../../services/llm-exchange/llm-exchange-token-count";
import { prismaClient } from "../../../storage/prisma";
import { memory } from "../../../storage/storage";
import { extractTextFromMessage } from "./serialization";
import { summarizeHistory } from "./summarize";
import { buildSummaryMessage } from "./summaryMessage";
import { recordCompactionFailure, recordCompactionSuccess } from "./trigger";

/**
 * 只统计文本部分；完整请求（聊天模板、系统提示、工具定义、图片）的用量仍以模型 usage 为准。
 */
export interface CompactionStats {
  /** 被摘要替代的历史的 token 数 */
  hiddenTokenCount: number;
  /** 最终摘要文本的 token 数，包含固定前缀与 XML 标签 */
  summaryTokenCount: number;
  /** = hiddenTokenCount - summaryTokenCount(下限 0) */
  savedTokenCount: number;
  tokenCountEstimated: boolean;
  tokenizer: string | null;
  /** 摘要模型调用耗时，即自动压缩让这一轮多等的时间 */
  durationMs: number;
  summarizerInputTokens?: number;
  summarizerOutputTokens?: number;
}

interface CompactHistoryInput {
  threadId: string;
  resourceId?: string;
  /** 要被一条摘要整体替代的历史，按时间正序，不含当前这轮。 */
  history: MastraDBMessage[];
  /** 压缩后仍留在模型视图里的消息数（当前这轮），只用于记录前后消息数。 */
  keptCount?: number;
}

const assertUniqueIds = (messages: readonly MastraDBMessage[]): void => {
  const ids = messages.map((message) => message.id);
  if (ids.some((id) => !id.trim()) || new Set(ids).size !== ids.length) {
    throw new Error("历史消息 ID 不能为空或重复");
  }
};

const measureTextTokens = async (
  history: readonly MastraDBMessage[],
  summaryMessage: MastraDBMessage
): Promise<Omit<CompactionStats, "durationMs" | "summarizerInputTokens" | "summarizerOutputTokens">> => {
  const modelId = getModelConfigSync("reasoning").modelId;
  const [before, after] = await Promise.all([
    countTextTokens(history.map(extractTextFromMessage).join("\n"), modelId),
    countTextTokens(extractTextFromMessage(summaryMessage), modelId)
  ]);
  return {
    hiddenTokenCount: before.total,
    summaryTokenCount: after.total,
    savedTokenCount: Math.max(0, before.total - after.total),
    tokenCountEstimated: before.estimated || after.estimated,
    tokenizer: before.tokenizer ?? after.tokenizer
  };
};

/**
 * 压缩后清掉 thread 上的 lastUsage：
 * - 自动压缩时提前归零，前端进度条立即更新，下一轮 trigger 也不会误用压缩前的高 token 值；
 *   本轮 stream 的 onStepFinish 随后会回填压缩后的真实 usage。
 * - 手动压缩不经过 stream/onStepFinish，只能靠这里更新。
 * 必须基于最新 metadata 做 merge,避免覆盖 mode / subAgentSnapshots 等其它字段。
 */
const resetLastUsage = async (threadId: string): Promise<void> => {
  const latestThread = await memory.getThreadById({ threadId });
  if (latestThread) {
    await memory.updateThread({
      ...(latestThread as { id: string; title: string }),
      metadata: { ...latestThread.metadata, lastUsage: undefined }
    });
  }
};

/** 统计随摘要消息落库（metadata 不会发给模型），离线分析压缩效果时与 compaction_records 关联读取 */
const withStats = (summaryMessage: MastraDBMessage, stats: CompactionStats): MastraDBMessage => ({
  ...summaryMessage,
  content: { ...summaryMessage.content, metadata: { ...summaryMessage.content.metadata, stats } }
});

/**
 * 用一条摘要替代传入的全部历史：摘要 → 统计 → 保存摘要并软删除原消息。
 * 成功与失败都计入熔断；失败时不写隐藏记录，调用方继续使用原历史。
 */
export const compactHistory = async ({
  threadId,
  resourceId,
  history,
  keptCount = 0
}: CompactHistoryInput): Promise<MastraDBMessage> => {
  try {
    assertUniqueIds(history);
    const startedAt = Date.now();
    const summary = await summarizeHistory(history);
    const durationMs = Date.now() - startedAt;
    const draft = buildSummaryMessage({
      threadId,
      resourceId,
      summaryText: summary.text,
      createdAt: new Date(history[history.length - 1].createdAt)
    });
    const stats: CompactionStats = {
      ...(await measureTextTokens(history, draft)),
      durationMs,
      summarizerInputTokens: summary.inputTokens,
      summarizerOutputTokens: summary.outputTokens
    };
    const summaryMessage = withStats(draft, stats);

    await memory.saveMessages({ messages: [summaryMessage] });
    await prismaClient.compactionRecord.create({
      data: {
        threadId,
        compactedMessageIds: history.map((message) => message.id),
        summaryMessageId: summaryMessage.id,
        messageCountBefore: history.length + keptCount,
        messageCountAfter: 1 + keptCount
      }
    });
    await resetLastUsage(threadId);

    recordCompactionSuccess(threadId);
    console.info("[compaction] 历史已压缩", { threadId, messages: history.length, ...stats });
    return summaryMessage;
  } catch (error) {
    recordCompactionFailure(threadId);
    throw error;
  }
};
