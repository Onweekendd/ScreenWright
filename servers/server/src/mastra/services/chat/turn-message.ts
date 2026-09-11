/**
 * 从一轮请求的消息里提取版本快照所需的信息。
 *
 * 纯解析，不碰会话生命周期：会话只是这些结果的消费方（commit message + screenwright-msg-id）。
 */
import type { BIChatRequest } from "./types";

/** commit message 的长度上限，超出截断加省略号，避免把大段上下文写进 git 历史 */
const COMMIT_MESSAGE_MAX = 100;

/** 取本轮最后一条消息，仅当它是用户消息时返回（resume/后台续接轮 messages 为空 → undefined）。 */
function lastUserMessage(messages: BIChatRequest["messages"] | undefined) {
  const last = messages?.[messages.length - 1];
  return last && last.role === "user" ? last : undefined;
}

/**
 * 提取用户问题文本，作为版本快照的 commit message。
 * 前端会把编辑器上下文包进 <user-message> 标签，这里只取标签内的纯问题；
 * 取首行、限长，避免 commit message 过长 / 含大段上下文。
 */
export function extractUserMessageText(messages: BIChatRequest["messages"] | undefined): string {
  const last = lastUserMessage(messages);
  if (!last) {
    return "";
  }
  const raw = (last.parts ?? [])
    .filter((p): p is { type: "text"; text: string } => (p as { type?: string }).type === "text")
    .map((p) => p.text)
    .join("\n");
  const matched = /<user-message>\s*([\s\S]*?)\s*<\/user-message>/.exec(raw);
  const text = (matched?.[1] ?? raw).trim();
  const firstLine = text.split("\n")[0].trim();
  return firstLine.length > COMMIT_MESSAGE_MAX ? `${firstLine.slice(0, COMMIT_MESSAGE_MAX)}…` : firstLine;
}

/**
 * 提取本轮发起提问的用户消息 id，作为版本节点与消息的绑定键（screenwright-msg-id）。
 * 前端撤销时按此 id 定位到「该提问的 commit」，再跳到其父 = 提问前状态。
 */
export function extractUserMessageId(messages: BIChatRequest["messages"] | undefined): string {
  return lastUserMessage(messages)?.id ?? "";
}
