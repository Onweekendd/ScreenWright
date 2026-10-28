import type { UIMessage } from "ai";

import { isCompactionSummary } from "./compactionSummary";

/** 能并进同一段执行过程的消息：压缩摘要虽是 assistant 消息，却是一条分界线，不和前后合并 */
const isMergeable = (message: UIMessage | undefined): message is UIMessage =>
  message?.role === "assistant" && !isCompactionSummary(message);

/**
 * 工具挂起、恢复及截图续接可能生成不同 messageId，但不应因此拆开执行过程。
 * 只合并展示用的连续 assistant 消息；原始消息仍供流式回写、审批恢复和历史记录使用。
 * 正文在 parts 中保留原位置，由 groupAssistantParts 分隔前后执行阶段。
 */
export function groupAssistantMessages(messages: readonly UIMessage[]): UIMessage[] {
  return createAssistantMessageGrouper()(messages);
}

/** 每个消息列表单独缓存：流式更新只重建发生变化的段，避免历史消息跟着每帧重渲染。 */
export function createAssistantMessageGrouper() {
  let cache = new Map<string, { sources: UIMessage[]; message: UIMessage }>();
  return (messages: readonly UIMessage[]): UIMessage[] => {
    const rows: UIMessage[] = [];
    const nextCache = new Map<string, { sources: UIMessage[]; message: UIMessage }>();

    for (let index = 0; index < messages.length; index++) {
      const first = messages[index];
      if (!isMergeable(first)) {
        rows.push(first);
        continue;
      }
      const sources = [first];
      while (isMergeable(messages[index + 1])) {
        sources.push(messages[++index]);
      }
      if (sources.length === 1) {
        rows.push(first);
        continue;
      }
      const previous = cache.get(first.id);
      const unchanged =
        previous?.sources.length === sources.length && sources.every((source, i) => previous.sources[i] === source);
      const message = unchanged ? previous.message : { ...first, parts: sources.flatMap((source) => source.parts) };
      rows.push(message);
      nextCache.set(first.id, { sources, message });
    }

    cache = nextCache;
    return rows;
  };
}
