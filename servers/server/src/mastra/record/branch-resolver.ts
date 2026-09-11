import { getCurrentSpan } from "@mastra/core/observability/context-storage";

import { setBranchResolver } from "@/recording/recording-scope";

/** 把「当前这一步是谁跑的」告诉框架无关的录制模块。 */
export function initMastraRecordingBridge(): void {
  setBranchResolver(() => {
    const span = getCurrentSpan() as { metadata?: { threadId?: unknown } } | undefined;
    const threadId = span?.metadata?.threadId;

    return typeof threadId === "string" ? threadId : undefined;
  });
}
