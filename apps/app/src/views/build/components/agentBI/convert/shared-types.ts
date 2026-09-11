import type { UIMessage } from "ai";

export interface StepResult {
  name: string;
  status: string;
  input: Record<string, unknown> | null;
  output: unknown | null;
  suspendPayload: Record<string, unknown> | null;
  resumePayload: unknown;
}

export interface WorkflowProgress {
  current: number;
  total: number;
  message: string;
}

export interface WorkflowData {
  type: "data-workflow" | "data-tool-workflow";
  id: string;
  data: {
    name: string;
    status: string;
    steps: Record<string, StepResult>;
    output: {
      usage: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
      };
    } | null;
    progress?: WorkflowProgress;
  };
}

export interface NetworkData {
  type: "data-network" | "data-tool-network";
  id: string;
  data: {
    name: string;
    status: string;
    steps: StepResult[];
    usage: any;
    output: unknown;
  };
}

export interface UnifiedStreamCallbacks {
  // Agent 相关
  onUpdate?: (message: UIMessage) => void | Promise<void>;
  onToolCall?: (value: { toolCallId: string; toolName: string; args: any }) => Promise<any | null>;

  // Workflow 相关
  onWorkflowStart?: (data: { runId: string; workflowId: string }) => void | Promise<void>;
  onWorkflowStepStart?: (data: { runId: string; stepId: string; input: any }) => void | Promise<void>;
  onWorkflowStepOutput?: (data: { runId: string; stepId: string; output: any }) => void | Promise<void>;
  onWorkflowStepResult?: (data: { runId: string; stepId: string; output: any }) => void | Promise<void>;
  onWorkflowStepSuspended?: (data: { runId: string; stepId: string; suspendPayload: any }) => void | Promise<void>;
  onWorkflowFinish?: (data: {
    runId: string;
    workflowId: string;
    status: string;
    steps: Record<string, StepResult>;
    output: any;
  }) => void | Promise<void>;

  // Network 相关
  onNetworkStart?: (data: { runId: string; name: string }) => void | Promise<void>;
  onNetworkAgentStart?: (data: { runId: string; agentId: string }) => void | Promise<void>;
  onNetworkAgentEnd?: (data: { runId: string; agentId: string; output: any }) => void | Promise<void>;
  onNetworkFinish?: (data: { runId: string; status: string; steps: any[]; output: any }) => void | Promise<void>;

  // 通用
  onFinish?: (options: { message: UIMessage; finishReason: string; usage: any }) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
}

/** 内部 tool part 类型，覆盖所有可能的状态 */
export interface InternalToolPart {
  type: `tool-${string}`;
  toolCallId: string;
  toolName: string;
  state:
    | "input-streaming"
    | "input-available"
    | "approval-requested"
    | "approval-responded"
    | "output-available"
    | "output-error"
    | "output-denied";
  input: unknown;
  output?: unknown;
}

/** dispatch map 的处理器函数类型 */
export type ChunkHandlerFn = (chunk: any) => Promise<void>;

/** 工作流流事件的类型（用于封装事件） */
export interface WorkflowStreamEvent {
  type: string;
  runId?: string;
  payload: {
    workflowId?: string;
    id?: string;
    status?: string;
    input?: any;
    output?: any;
    suspendPayload?: any;
    resumePayload?: any;
    workflowStatus?: string;
    [key: string]: any;
  };
}
