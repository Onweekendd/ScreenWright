import type { ChunkType } from "@mastra/core/stream";

import type { ChunkHandlerFn, UnifiedStreamCallbacks } from "./shared-types";

export interface WorkflowContext {
  callbacks: UnifiedStreamCallbacks;
}

export function createWorkflowHandlers(ctx: WorkflowContext): Partial<Record<ChunkType["type"], ChunkHandlerFn>> {
  return {
    // ========== 裸的 workflow 事件（workflow 直接调用）==========
    "workflow-start": async (chunk) => {
      const c = chunk as Extract<ChunkType, { type: "workflow-start" }>;
      await ctx.callbacks.onWorkflowStart?.({ runId: c.runId!, workflowId: c.payload.workflowId });
    },

    "workflow-step-start": async (chunk) => {
      const c = chunk as Extract<ChunkType, { type: "workflow-step-start" }>;
      await ctx.callbacks.onWorkflowStepStart?.({ runId: c.runId!, stepId: c.payload.id, input: c.payload.payload });
    },

    "workflow-step-output": async (chunk) => {
      const c = chunk as Extract<ChunkType, { type: "workflow-step-output" }>;
      await ctx.callbacks.onWorkflowStepOutput?.({
        runId: c.runId!,
        stepId: c.payload.stepName as string,
        output: c.payload.output
      });
    },

    "workflow-step-result": async (chunk) => {
      const c = chunk as Extract<ChunkType, { type: "workflow-step-result" }>;
      await ctx.callbacks.onWorkflowStepResult?.({ runId: c.runId!, stepId: c.payload.id, output: c.payload.output });
    },

    "workflow-step-suspended": async (chunk) => {
      const c = chunk as Extract<ChunkType, { type: "workflow-step-suspended" }>;
      await ctx.callbacks.onWorkflowStepSuspended?.({
        runId: c.runId!,
        stepId: c.payload.id,
        suspendPayload: c.payload.suspendPayload
      });
    }
  };
}
