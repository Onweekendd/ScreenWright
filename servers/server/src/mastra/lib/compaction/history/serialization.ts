import type { MastraDBMessage, MastraMessagePart } from "@mastra/core/agent";

/** 提取消息的文字及工具调用信息；保持原序列化行为，非文本片段暂不展开。 */
export const extractTextFromMessage = (msg: MastraDBMessage): string => {
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

/** 将全部传入消息按原顺序序列化，不筛选或修改消息。 */
export const serializeMessagesForSummary = (messages: readonly MastraDBMessage[]): string =>
  messages
    .map((msg) => {
      const text = extractTextFromMessage(msg);
      return `[role:${msg.role}] ${text}`;
    })
    .join("\n\n---\n\n");
