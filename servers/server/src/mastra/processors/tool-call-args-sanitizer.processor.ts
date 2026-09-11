import type { MastraDBMessage, MastraMessagePart } from "@mastra/core/agent";
import type { Processor, ProcessorMessageContext } from "@mastra/core/processors";

/**
 * 修复模型偶发性省略 tool-invocation args 字段的问题。
 * 缺少 args 会导致 OpenAI API 报 Missing required parameter。
 */
export class ToolCallArgsSanitizer implements Processor {
  id = "tool-call-args-sanitizer";

  async processInput({ messages }: ProcessorMessageContext): Promise<MastraDBMessage[]> {
    return messages.map((message) => {
      if (message.role !== "assistant") {
        return message;
      }

      const parts = message.content?.parts;
      if (!Array.isArray(parts)) {
        return message;
      }

      const sanitizedParts = parts.map((part: MastraMessagePart) => {
        const invocationPart = part as { type: string; toolInvocation?: { args?: unknown } };
        if (
          invocationPart.type === "tool-invocation" &&
          invocationPart.toolInvocation &&
          invocationPart.toolInvocation.args === undefined
        ) {
          return {
            ...part,
            toolInvocation: {
              ...invocationPart.toolInvocation,
              args: {}
            }
          };
        }
        return part;
      });

      return {
        ...message,
        content: {
          ...message.content,
          parts: sanitizedParts
        }
      };
    }) as MastraDBMessage[];
  }
}
