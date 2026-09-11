import type { MastraDBMessage, MastraMessagePart } from "@mastra/core/agent";

import { compactionSummarizerAgent } from "../../agents/compaction-summarizer-agent";
import { compactionConfig } from "./config";

export const SUMMARY_MESSAGE_MARKER = "<!-- compaction-summary-v1 -->";

export interface CompactionResult {
  summaryText: string;
  hiddenIds: string[];
  selectedUserIds: string[];

  /** 被隐藏(将被摘要替代)消息的估算 token 总数 */
  hiddenTokenCount: number;
  /** 新生成摘要文本的估算 token 数 */
  summaryTokenCount: number;
  /**
   * 本次压缩节省的估算 token 数。
   * = hiddenTokenCount - summaryTokenCount(下限 0)。
   * 因为保留的 N 条 user 消息压缩前后都在、不变,真正被替换掉的只有被隐藏的消息。
   * 注意:这是基于字符的粗略估算,精确值需以压缩生效后下一轮 LLM 回包的 usage.inputTokens 为准。
   */
  savedTokenCount: number;
}

/**
 * 粗略估算文本的 token 数(中英文混合)。
 *
 * 项目里没有内置 tokenizer,真实 token 只能从模型回包的 usage 拿到总数,无法逐条消息拆分。
 * 这里用字符级近似:CJK(中日韩)字符约 0.6 token/字,其余字符按 4 字符/token。
 * 仅用于压缩节省量的展示,不用于计费或触发阈值判定(后者以真实 usage 为准)。
 *
 * @param text - 待估算的文本。
 * @returns 估算的 token 数。
 */
const estimateTokens = (text: string): number => {
  if (!text) {
    return 0;
  }
  const cjkCount = (text.match(/[㐀-鿿豈-﫿]/g) ?? []).length;
  const restCount = text.length - cjkCount;
  return Math.ceil(cjkCount * 0.6 + restCount / 4);
};

const isSummaryMessage = (msg: MastraDBMessage): boolean => {
  const content = msg.content as { parts?: MastraMessagePart[] } | undefined;
  if (!content?.parts) {
    return false;
  }
  const firstText = content.parts.find((p) => (p as { type?: string }).type === "text") as
    | { text?: string }
    | undefined;
  return firstText?.text?.includes(SUMMARY_MESSAGE_MARKER) ?? false;
};

/**
 * 模型的多个part合并为一个
 * @param msg
 * @returns
 */
const extractTextFromMessage = (msg: MastraDBMessage): string => {
  const content = msg.content as { parts?: MastraMessagePart[]; text?: string } | string | undefined;
  if (typeof content === "string") {
    return content;
  }
  if (!content) {
    return "";
  }

  if (Array.isArray(content.parts)) {
    return content.parts
      .map((part) => {
        if (part.type === "text") {
          return part.text ?? "";
        }
        if (part.type === "tool-invocation") {
          const tn = part.toolInvocation?.toolName ?? "unknown";
          const args = part.toolInvocation?.args ? JSON.stringify(part.toolInvocation.args) : "";
          const result = part.toolInvocation?.result ? JSON.stringify(part.toolInvocation.result) : "";
          return `[tool:${tn} args=${args} result=${result}]`;
        }
        return "";
      })
      .join("\n");
  }
  return content.text ?? "";
};

const serializeMessagesForSummary = (messages: MastraDBMessage[]): string =>
  messages
    .map((msg) => {
      const text = extractTextFromMessage(msg);
      return `[role:${msg.role}] ${text}`;
    })
    .join("\n\n---\n\n");

/**
 * 保留最近 N 条用户消息作为锚点(N=userMessageKeepCount)。
 * 摘要消息(包含 SUMMARY_MESSAGE_MARKER)不计入候选池。
 */
const selectUserMessageIds = (messages: MastraDBMessage[]): string[] => {
  const keepN = compactionConfig.l3.userMessageKeepCount;
  const userMsgs = messages.filter((m) => m.role === "user" && !isSummaryMessage(m));
  return userMsgs.slice(-keepN).map((m) => m.id);
};

const computeHiddenIds = (messages: MastraDBMessage[], selectedUserIds: Set<string>): string[] => {
  const hidden: string[] = [];
  for (const msg of messages) {
    if (msg.role === "user" && selectedUserIds.has(msg.id)) {
      continue;
    }
    hidden.push(msg.id);
  }
  return hidden;
};

export const runCompaction = async (messages: MastraDBMessage[]): Promise<CompactionResult> => {
  const conversation = serializeMessagesForSummary(messages);

  const response = await compactionSummarizerAgent.generate(
    [{ role: "user", content: `<conversation-history>\n${conversation}\n</conversation-history>` }],
    { modelSettings: { temperature: 0.2 } }
  );

  const { text } = response;

  const summaryText = text;
  const selectedUserIds = selectUserMessageIds(messages);
  const hiddenIds = computeHiddenIds(messages, new Set(selectedUserIds));

  // 被隐藏的消息会被这条摘要替代,二者的差值即本次压缩节省的估算 token。
  // 保留的 N 条 user 消息压缩前后都在,不参与节省计算。
  const hiddenSet = new Set(hiddenIds);
  const hiddenText = messages
    .filter((m) => hiddenSet.has(m.id))
    .map(extractTextFromMessage)
    .join("\n");
  const hiddenTokenCount = estimateTokens(hiddenText);
  const summaryTokenCount = estimateTokens(summaryText);
  const savedTokenCount = Math.max(0, hiddenTokenCount - summaryTokenCount);

  return { summaryText, hiddenIds, selectedUserIds, hiddenTokenCount, summaryTokenCount, savedTokenCount };
};
