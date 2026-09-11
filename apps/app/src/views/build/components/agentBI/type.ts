import type { ComputedRef, Ref, ShallowRef } from "vue";

import type { WorkflowStreamEvent } from "@mastra/core/stream";
import type { CustomStorageThreadType } from "@screenwright/server/rpc";
import type { UIMessage } from "ai";

export type WorkflowStepResult = WorkflowStreamEvent["payload"];

export interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  reasoningTokens: number;
}

export interface AgentBISharedState {
  messages: ShallowRef<UIMessage[]>;
  updateMessagesBy: (fn: () => UIMessage[]) => void;
  resourceId: ComputedRef<string>;
  lastUsage: Ref<UsageInfo | null>;
  /** 共享的历史线程列表（来自 useAgentBIThreadList），供 useAgentBIMemory 推入/同步线程 */
  memoryThreads: Ref<CustomStorageThreadType[]>;
}

export interface WorkflowToolOutput {
  runId?: string;
  result?: string;
  status?: "running" | "success" | "failed";
  /** 各步骤结果，key 为 stepName */
  steps?: Record<string, unknown>;
}
