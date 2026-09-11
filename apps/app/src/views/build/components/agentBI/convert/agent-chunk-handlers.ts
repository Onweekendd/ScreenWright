import type { ChunkType } from "@mastra/core/stream";
import type { UIMessage } from "ai";
import { parsePartialJson } from "ai";

import type { ChunkHandlerFn, InternalToolPart, UnifiedStreamCallbacks } from "./shared-types";

export interface AgentContext {
  message: UIMessage;
  updateMessage: () => Promise<void>;
  currentTextPart: { type: "text"; text: string } | undefined;
  setCurrentTextPart: (part: { type: "text"; text: string } | undefined) => void;
  currentReasoningPart: { type: "reasoning"; reasoning: string; details: { type: "text"; text: string }[] } | undefined;
  setCurrentReasoningPart: (
    part: { type: "reasoning"; reasoning: string; details: { type: "text"; text: string }[] } | undefined
  ) => void;
  currentReasoningTextDetail: { type: "text"; text: string } | undefined;
  setCurrentReasoningTextDetail: (part: { type: "text"; text: string } | undefined) => void;
  partialToolCalls: Record<string, { text: string; toolName: string }>;
  getToolParts: () => InternalToolPart[];
  updateToolPart: (toolCallId: string, toolName: string, update: Partial<InternalToolPart>) => void;
  callbacks: UnifiedStreamCallbacks;
}

export function createAgentHandlers(ctx: AgentContext): Partial<Record<ChunkType["type"], ChunkHandlerFn>> {
  return {
    // ========== Agent: 文本 ==========
    "text-delta": async (chunk) => {
      const { text } = (chunk as Extract<ChunkType, { type: "text-delta" }>).payload;
      if (ctx.currentTextPart == null) {
        const newPart = { type: "text" as const, text };
        ctx.setCurrentTextPart(newPart);
        (ctx.message.parts as unknown[]).push(newPart);
      } else {
        ctx.currentTextPart.text += text;
      }
      await ctx.updateMessage();
    },

    // ========== Agent: 推理 ==========
    "reasoning-delta": async (chunk) => {
      const { text } = (chunk as Extract<ChunkType, { type: "reasoning-delta" }>).payload;
      if (ctx.currentReasoningTextDetail == null) {
        const newDetail = { type: "text" as const, text };
        ctx.setCurrentReasoningTextDetail(newDetail);
        ctx.currentReasoningPart?.details.push(newDetail);
      } else {
        ctx.currentReasoningTextDetail.text += text;
      }
      if (ctx.currentReasoningPart == null) {
        const newPart = {
          type: "reasoning" as const,
          reasoning: text,
          details: [ctx.currentReasoningTextDetail!]
        };
        ctx.setCurrentReasoningPart(newPart);
        (ctx.message.parts as unknown[]).push(newPart);
      } else {
        ctx.currentReasoningPart.reasoning += text;
      }
      (ctx.message as UIMessage & { reasoning?: string }).reasoning =
        ((ctx.message as UIMessage & { reasoning?: string }).reasoning ?? "") + text;
      await ctx.updateMessage();
    },

    // ========== Agent: 步骤开始 ==========
    "step-start": async (chunk) => {
      const { messageId: msgId } = (chunk as Extract<ChunkType, { type: "step-start" }>).payload;
      if (!ctx.message.id) {
        ctx.message.id = msgId || ctx.message.id;
      }
      (ctx.message.parts as unknown[]).push({ type: "step-start" });
      await ctx.updateMessage();
    },

    // ========== Agent: 步骤结束 ==========
    "step-finish": async (chunk) => {
      const c = chunk as Extract<ChunkType, { type: "step-finish" }>;
      const { isContinued, stepResult } = c.payload;
      ctx.setCurrentTextPart(isContinued ? ctx.currentTextPart : undefined);
      ctx.setCurrentReasoningPart(undefined);
      ctx.setCurrentReasoningTextDetail(undefined);

      if (stepResult?.reason === "tool-calls") {
        const toolCalls = (
          c.payload.output as unknown as {
            toolCalls: { toolCallId: string; toolName: string }[];
          }
        )?.toolCalls;

        if (toolCalls?.length) {
          const latestToolCall = toolCalls[0]!;
          const toolPart = ctx.getToolParts().find((p) => p.toolCallId === latestToolCall.toolCallId);
          if (toolPart) {
            ctx.updateToolPart(latestToolCall.toolCallId, toolPart.toolName, { state: "output-available" });
          }
        }
      }

      await ctx.updateMessage();
    },

    // ========== Agent: Tool 调用开始 ==========
    "tool-call-input-streaming-start": async (chunk) => {
      const { toolCallId, toolName } = (chunk as Extract<ChunkType, { type: "tool-call-input-streaming-start" }>)
        .payload;
      ctx.partialToolCalls[toolCallId] = { text: "", toolName };
      ctx.updateToolPart(toolCallId, toolName, { state: "input-streaming", input: undefined });
      await ctx.updateMessage();
    },

    // ========== Agent: Tool 增量 ==========
    "tool-call-delta": async (chunk) => {
      const { toolCallId, argsTextDelta } = (chunk as Extract<ChunkType, { type: "tool-call-delta" }>).payload;
      const partial = ctx.partialToolCalls[toolCallId];
      if (!partial) return;
      partial.text += argsTextDelta;
      const { value: partialInput } = await parsePartialJson(partial.text);
      ctx.updateToolPart(toolCallId, partial.toolName, { state: "input-streaming", input: partialInput });
      await ctx.updateMessage();
    },

    // ========== Agent: 完整 Tool 调用 ==========
    "tool-call": async (chunk) => {
      const { toolCallId, toolName: tn, args } = (chunk as Extract<ChunkType, { type: "tool-call" }>).payload;
      const toolName = ctx.partialToolCalls[toolCallId]?.toolName ?? tn;
      ctx.updateToolPart(toolCallId, toolName, { state: "input-available", input: args });
      await ctx.updateMessage();
      if (ctx.callbacks.onToolCall) {
        const result = await ctx.callbacks.onToolCall({ toolCallId, toolName, args });
        if (result != null) {
          ctx.updateToolPart(toolCallId, toolName, { state: "output-available", input: args, output: result });
          await ctx.updateMessage();
        }
      }
    },

    // ========== Agent: Tool 结果 ==========
    "tool-result": async (chunk) => {
      const { toolCallId, result } = (chunk as Extract<ChunkType, { type: "tool-result" }>).payload;
      const toolPart = ctx.getToolParts().find((p) => p.toolCallId === toolCallId);
      if (!toolPart) return;
      ctx.updateToolPart(toolCallId, toolPart.toolName, { output: result });
      await ctx.updateMessage();
    }
  };
}
