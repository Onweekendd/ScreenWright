import type { WorkflowFinishCallbackResult, WorkflowRunStatus } from "@mastra/core/workflows";

import { workflowStateRegistry } from "@/mastra/state";

const TERMINAL_STATUSES = new Set<WorkflowRunStatus>(["success", "failed", "tripwire", "canceled", "bailed"]);

type WorkflowCleanupContext = Pick<WorkflowFinishCallbackResult, "state" | "status">;

/**
 * 清理工作流在进程内 registry 中的临时状态。
 * 暂停、等待等可恢复状态不能清理，否则恢复执行时会丢失节点转换上下文。
 */
export function cleanupWorkflowRegistryState({ state, status }: WorkflowCleanupContext): void {
  if (!TERMINAL_STATUSES.has(status)) {
    return;
  }

  const workflowId = state.workflowId;
  if (typeof workflowId === "string" && workflowId.length > 0) {
    workflowStateRegistry.cleanup(workflowId);
  }
}
