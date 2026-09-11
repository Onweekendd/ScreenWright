/**
 * BI Chat 请求/响应相关类型
 */

import type { UIMessage } from "ai";

import type { SuspendType } from "../../types/bi-chat";

/** 请求参数 */
export interface BIChatRequest {
  messages: UIMessage[];
  clientTools: Record<string, { description: string; inputSchema?: Record<string, unknown> }>;
  threadId?: string;
  resourceId?: string;
  runId?: string;
  toolCallId?: string;
  suspendType?: SuspendType;
  resumeData?: Record<string, unknown>;
}
