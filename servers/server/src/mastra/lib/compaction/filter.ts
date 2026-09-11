import type { MastraDBMessage } from "@mastra/core/agent";

import { prismaClient } from "../../storage/prisma";

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

export const filterActiveMessages = (messages: MastraDBMessage[], compactedIds: Set<string>): MastraDBMessage[] => {
  if (compactedIds.size === 0) {
    return messages;
  }
  return messages.filter((msg) => !compactedIds.has(msg.id));
};
