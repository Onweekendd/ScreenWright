import { randomUUID } from "node:crypto";

import type { MastraDBMessage } from "@mastra/core/agent";

import { loadPrompt } from "@/agent-resources/prompts";

export const SUMMARY_MESSAGE_MARKER = "<!-- compaction-summary-v1 -->";

/** 存储、模型输入与 Token 统计共用同一份最终摘要文本。 */
export const buildSummaryText = (summaryText: string): string => {
  const prefix = loadPrompt("mastra/compact/summaryPrefix.md");
  return `${SUMMARY_MESSAGE_MARKER}\n${prefix}\n\n<conversation-summary>\n${summaryText}\n</conversation-summary>`;
};

interface SummaryMessageInput {
  threadId: string;
  resourceId?: string;
  summaryText: string;
  /** 取被替换的最后一条消息的时间，让摘要按 createdAt 排序时落在当前这轮之前。 */
  createdAt: Date;
}

export const buildSummaryMessage = ({
  threadId,
  resourceId,
  summaryText,
  createdAt
}: SummaryMessageInput): MastraDBMessage => ({
  id: randomUUID(),
  role: "assistant",
  createdAt,
  threadId,
  resourceId,
  content: {
    format: 2,
    parts: [{ type: "text", text: buildSummaryText(summaryText) }],
    metadata: { kind: "compaction_summary" }
  }
});
