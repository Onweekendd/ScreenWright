import type { UIMessage } from "ai";

/**
 * 上下文压缩的摘要消息：后端用一条 assistant 消息替代被压缩掉的历史
 * （servers/server/src/mastra/lib/compaction/history/summaryMessage.ts），
 * 原消息只是软删除，历史记录里照样拉得到。前端据此把摘要单独折叠显示、把被替代的消息淡化。
 */
const SUMMARY_KIND = "compaction_summary";
const SUMMARY_MARKER = "<!-- compaction-summary-v1 -->";

/** 后端随摘要落库的压缩统计，字段见 compactHistory.ts 的 CompactionStats */
export interface CompactionSummaryStats {
  hiddenTokenCount?: number;
  summaryTokenCount?: number;
  savedTokenCount?: number;
}

interface SummaryMetadata {
  kind?: unknown;
  stats?: CompactionSummaryStats;
}

const textOf = (message: UIMessage): string =>
  message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");

export const isCompactionSummary = (message: UIMessage): boolean =>
  (message.metadata as SummaryMetadata | undefined)?.kind === SUMMARY_KIND ||
  textOf(message).startsWith(SUMMARY_MARKER);

/** 给用户看的摘要正文：去掉写给模型的前缀说明，只留 <conversation-summary> 里的内容 */
export const summaryBody = (message: UIMessage): string => {
  const text = textOf(message);
  const body = /<conversation-summary>\s*([\s\S]*?)\s*<\/conversation-summary>/.exec(text)?.[1];
  return body ?? text.replace(SUMMARY_MARKER, "").trim();
};

export const summaryStats = (message: UIMessage): CompactionSummaryStats | undefined =>
  (message.metadata as SummaryMetadata | undefined)?.stats;

/** 自动压缩时后端顺流推的 data-compaction 帧（servers/server/src/mastra/services/chat/compaction-chunk.ts） */
export interface CompactionChunkData {
  status: "started" | "completed" | "failed";
  summary?: UIMessage;
  /** 压缩后保留的当前这轮从哪条消息开始；摘要排在它前面 */
  keptFromMessageId?: string;
}

/** 当前这轮在列表里的起点；前端消息 id 和后端对不上时，退回最后一条用户消息 */
const keptTurnStart = (messages: readonly UIMessage[], keptFromMessageId: string): number => {
  const index = messages.findIndex((message) => message.id === keptFromMessageId);
  return index !== -1
    ? index
    : messages.findLastIndex((message) => message.role === "user" && !isCompactionSummary(message));
};

/**
 * 把刚生成的摘要放进对话，和后端存储里的顺序一致：
 * - 自动压缩：排在保留下来的当前这轮之前（keptFromMessageId；找不到就排在最后一条用户消息之前）；
 * - 手动压缩（不传 keptFromMessageId）：全部历史都被替代，排在最后。
 * 同 id 的摘要已经在列表里时不重复插入。
 */
export const insertCompactionSummary = (
  messages: readonly UIMessage[],
  summary: UIMessage,
  keptFromMessageId?: string
): UIMessage[] => {
  if (messages.some((message) => message.id === summary.id)) {
    return [...messages];
  }
  const index = keptFromMessageId === undefined ? -1 : keptTurnStart(messages, keptFromMessageId);
  return index === -1 ? [...messages, summary] : [...messages.slice(0, index), summary, ...messages.slice(index)];
};

/**
 * 已被摘要替代的消息：最新一条摘要之前的全部消息（含更早的摘要）。
 * 摘要的 createdAt 取被替换的最后一条消息，按时间排序时正好落在被压缩的历史之后、当前这轮之前；
 * 多次压缩时新摘要连同旧摘要一起替代，所以只看最新一条即可。
 */
export const compactedMessageIds = (messages: readonly UIMessage[]): Set<string> => {
  const latest = messages.findLastIndex(isCompactionSummary);
  return new Set(latest > 0 ? messages.slice(0, latest).map((message) => message.id) : []);
};
