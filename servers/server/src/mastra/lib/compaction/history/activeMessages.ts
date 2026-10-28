import type { MastraDBMessage } from "@mastra/core/agent";

import { prismaClient } from "../../../storage/prisma";
import { isSummaryMessage } from "./summaryMessage";

export const getCompactedIds = async (threadId: string): Promise<Set<string>> => {
  const records = await prismaClient.compactionRecord.findMany({
    where: { threadId },
    select: { compactedMessageIds: true }
  });

  const ids = new Set<string>();
  for (const record of records) {
    const list = record.compactedMessageIds as unknown;
    if (Array.isArray(list)) {
      for (const id of list) {
        if (typeof id === "string") {
          ids.add(id);
        }
      }
    }
  }
  return ids;
};

/** 去掉已被摘要替代的消息；原消息只是软删除，仍留在存储里。 */
export const filterActiveMessages = (messages: MastraDBMessage[], compactedIds: Set<string>): MastraDBMessage[] => {
  if (compactedIds.size === 0) {
    return messages;
  }
  return messages.filter((msg) => !compactedIds.has(msg.id));
};

/**
 * 当前这轮从最后一条 user 消息开始，包含其后执行中的工具调用，不参与压缩；
 * 否则摘要会吞掉用户刚发的指令，模型看到的最后一条变成 assistant 摘要。
 */
export const splitCurrentTurn = (
  messages: MastraDBMessage[]
): { history: MastraDBMessage[]; currentTurn: MastraDBMessage[] } => {
  let start = messages.length - 1;
  // 上一次的摘要也是 user 消息，但它属于历史，不是当前这轮的起点
  while (start >= 0 && (messages[start].role !== "user" || isSummaryMessage(messages[start]))) {
    start--;
  }
  if (start < 0) {
    return { history: messages, currentTurn: [] };
  }
  return { history: messages.slice(0, start), currentTurn: messages.slice(start) };
};
