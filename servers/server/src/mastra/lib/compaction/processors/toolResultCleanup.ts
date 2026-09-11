import type { MastraDBMessage, MastraMessagePart } from "@mastra/core/agent";
import type { MastraToolInvocationPart } from "@mastra/core/agent/message-list";
import type { Processor, ProcessorMessageContext } from "@mastra/core/processors";

import { compactionConfig } from "../config";

const isToolInvocation = (p: MastraMessagePart): p is MastraToolInvocationPart =>
  (p as { type?: string }).type === "tool-invocation";

const findRoundBoundary = (messages: MastraDBMessage[], keepRounds: number): number => {
  let userSeen = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      userSeen += 1;
      if (userSeen >= keepRounds) {
        return i;
      }
    }
  }
  return -1;
};

const clearToolResult = (part: MastraToolInvocationPart, placeholder: string): MastraToolInvocationPart => ({
  ...part,
  toolInvocation: {
    ...part.toolInvocation,
    result: { __cleared: true, placeholder }
  }
});

export class ToolResultCleanupProcessor implements Processor {
  id = "tool-result-cleanup";

  async processInput({ messages }: ProcessorMessageContext): Promise<MastraDBMessage[]> {
    if (!compactionConfig.l1Enabled) {
      return messages;
    }

    const { keepRecentRounds, clearableTools, placeholder } = compactionConfig.l1;
    const boundary = findRoundBoundary(messages, keepRecentRounds);
    if (boundary < 0) {
      return messages;
    }

    return messages.map((msg, idx) => {
      if (idx >= boundary || msg.role !== "assistant") {
        return msg;
      }
      const parts = msg.content?.parts;
      if (!Array.isArray(parts)) {
        return msg;
      }

      let mutated = false;
      const newParts = parts.map((part) => {
        if (!isToolInvocation(part)) {
          return part;
        }
        const toolName = part.toolInvocation?.toolName;
        if (!toolName || !clearableTools.has(toolName)) {
          return part;
        }
        const result = part.toolInvocation?.result as { __cleared?: boolean } | undefined;
        if (result?.__cleared) {
          return part;
        }
        mutated = true;
        return clearToolResult(part, placeholder);
      });

      if (!mutated) {
        return msg;
      }
      return { ...msg, content: { ...msg.content, parts: newParts } } as MastraDBMessage;
    });
  }
}
