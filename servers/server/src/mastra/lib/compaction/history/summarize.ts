import type { MastraDBMessage } from "@mastra/core/agent";

import { compactionSummarizerAgent } from "@/mastra/agents/compaction-summarizer-agent";

import { serializeMessagesForSummary } from "./serialization";

export interface SummaryResult {
  text: string;
  /** 摘要模型本次调用的真实用量，用于评估压缩自身的开销 */
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * 将传入的全部历史压缩为摘要正文，不按消息角色或最近轮数筛选。
 * 保护当前这轮、XML 包裹、Token 统计和持久化都由 compactHistory 处理。
 */
export async function summarizeHistory(messages: readonly MastraDBMessage[]): Promise<SummaryResult> {
  if (messages.length === 0) {
    throw new Error("没有可压缩的历史消息");
  }
  const conversation = serializeMessagesForSummary(messages);
  const response = await compactionSummarizerAgent.generate(
    [{ role: "user", content: `<conversation-history>\n${conversation}\n</conversation-history>` }],
    { modelSettings: { temperature: 0.2 } }
  );
  const summaryText = response.text?.trim();
  if (!summaryText) {
    throw new Error("摘要模型返回了空内容，保留原始历史");
  }
  return { text: summaryText, inputTokens: response.usage?.inputTokens, outputTokens: response.usage?.outputTokens };
}
