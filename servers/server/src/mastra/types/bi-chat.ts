import type { BackgroundTaskOutputChunk } from "@mastra/core/background-tasks";
import type { StorageThreadType } from "@mastra/core/memory";
import type { LanguageModelUsage, UIMessageChunk } from "ai";
import { z } from "zod";

// ============================================
// BI Chat 消息相关 Schema
// ============================================

/**
 * 线程消息列表请求 Schema
 */
export const ListThreadMessagesRequestSchema = z
  .object({
    threadId: z.string().describe("对话线程 ID"),
    resourceId: z.string().describe("资源 ID（与创建线程时一致）"),
    page: z.number().int().min(0).optional().default(0).describe("页码（0 起始）"),
    perPage: z.number().int().min(1).max(100).optional().default(30).describe("每页条数")
  })
  .describe("获取线程消息请求参数");

export type ListThreadMessagesRequest = z.infer<typeof ListThreadMessagesRequestSchema>;

export enum AgentMode {
  ASK_BEFORE_EDIT = "ask_before_edit",
  AUTO_EDIT = "auto_edit",
  PLAN = "plan"
}

export {
  type AskUserQuestion,
  type QuestionOption,
  type ResumeData,
  SuspendDefs,
  type SuspendPayload,
  SuspendType
} from "./suspend";

export interface CommonRunTimeType {
  mode: AgentMode;
}

/**
 * 子 agent 内部 toolCall 对应的"前置推理"信息。
 * text: 该 toolCall 所在 step 的可见文本
 * reasoning: 该 step 的思考过程（reasoningText 优先，否则拼接 reasoning[]）
 */
export interface SubAgentStepInfo {
  text?: string;
  reasoning?: string;
}

/**
 * 整个 thread 内所有子 agent step 的扁平索引。
 * key: 子 agent 内部 toolCallId（OpenAI call_xxx 等，跨调用唯一）
 * value: SubAgentStepInfo
 *
 * 为什么扁平：data-tool-agent chunk.id 是 sub-agent runId，并不是父工具 toolCallId，
 * 没办法在 injection 时按父 toolCallId 反查；inner toolCallId 本来就唯一，分组没必要。
 */
export type SubAgentSnapshotMap = Record<string, SubAgentStepInfo>;

export type CustomStorageThreadType = StorageThreadType & {
  metadata: {
    lastUsage?: LanguageModelUsage;
    mode?: AgentMode;
    /**
     * 子 agent step 扁平索引，按内层 toolCallId 直查。
     * 兼容旧数据：可能是 Record<outerKey, Record<innerId, string|SubAgentStepInfo>>
     * 或 Record<innerId, string>，读时用 normalizeSubAgentSnapshots 展平。
     */
    subAgentSnapshots?: SubAgentSnapshotMap | Record<string, unknown>;
  };
};

// ============================================
// 后台任务流 chunk（data-background-task-*）
// ============================================

/**
 * 所有 data-background-task-* chunk 共有的任务标识字段。
 * 服务端把 mastra 原生 background-task-* 改名为 data-background-task-*，
 * 原 payload 整体搬到 data 字段后透传给前端，故以下类型描述的都是 chunk 的 data。
 */
export interface BackgroundTaskRef {
  /** 后台任务自身 ID，生命周期分组主键 */
  taskId: string;
  /** 派发的工具名，如 agent-swExecutorAgent */
  toolName: string;
  /** 父 agent 发起委派的 toolCallId */
  toolCallId: string;
}

/** data-background-task-started 的 data：派发成功瞬间，仅有标识字段。 */
export type BackgroundTaskStartedData = BackgroundTaskRef;

/** 后台委派子 agent 的入参（running chunk 携带）。 */
export interface BackgroundTaskArgs {
  prompt: string;
  threadId: string;
  resourceId: string;
}

/** data-background-task-running 的 data：worker 接管任务后，带子 agent 运行信息。 */
export interface BackgroundTaskRunningData extends BackgroundTaskRef {
  /** 执行任务的子 agent id */
  agentId: string;
  /** 后台任务的 runId */
  runId: string;
  /** 任务开始时间（ISO 字符串） */
  startedAt: string;
  /** 委派子 agent 的入参 */
  args: BackgroundTaskArgs;
}

/**
 * data-background-task-output 的 data：子 agent 每个步骤的进度（后端已拍平 + 转 AI-SDK）。
 *
 * 服务端把 mastra 原始的三层 tool-output 套娃压成这一层，并把内层 Mastra chunk 转成
 * AI-SDK 的 UIMessageChunk（reasoning-delta / text-delta / tool-input-* ...），
 * 前端可直接喂 readUIMessageStream 复用主流那套消息累积逻辑。外层 taskId/agentId/runId 省去，
 * 前端用 toolCallId 关联到 started/running 时建立的任务（与外层 taskId 一一对应）。
 * 注：无法映射的 Mastra chunk 转换后为 undefined，此时 output 为空，前端应跳过该帧。
 */
export interface BackgroundTaskOutputData {
  /** 子 agent 增量 chunk 转成的 AI-SDK UIMessageChunk；无法映射时为 undefined */
  output: UIMessageChunk | undefined;
  /** 父 agent 委派的 toolCallId，前端用它关联任务 */
  toolCallId: string;
  /** 工具名，如 agent-swExecutorAgent */
  toolName: string;
}

/**
 * mastra 原生 background-task-output chunk 的 payload（服务端拍平前的内部结构）。
 * @mastra/core 内部有同名 BackgroundTaskOutputPayload 但未从包入口导出，故按其结构本地声明；
 * 内层 payload 复用已导出的 BackgroundTaskOutputChunk（tool-output chunk）。
 * 拍平后透传给前端的形态见上方 BackgroundTaskOutputData。
 */
export interface BackgroundTaskOutputRawPayload {
  taskId: string;
  toolName: string;
  toolCallId: string;
  runId: string;
  agentId: string;
  payload: BackgroundTaskOutputChunk;
}

/**
 * data-background-task-suspended 的 data：子 agent 在后台运行中挂起，等待审批/用户输入。
 * suspendPayload 形态随挂起工具而变（如 ask_approval_create_component 带 component，
 * askUserQuestionTool 带 questions），故宽松建模，前端按 type（或工具名）分发，
 * 与主流的 data-tool-call-suspended 处理方式一致。
 */
export interface BackgroundTaskSuspendedData extends BackgroundTaskRef {
  /** 执行任务的子 agent id */
  agentId: string;
  /** 后台任务的 runId */
  runId: string;
  /** 挂起载荷，按 type（或工具名）分发处理 */
  suspendPayload: { type?: string } & Record<string, unknown>;
  /** 挂起时间（ISO 字符串） */
  suspendedAt: string;
  /** 委派子 agent 的入参 */
  args: BackgroundTaskArgs;
}

/**
 * 后台任务流 chunk 联合类型（按 type 判别）。
 * 注：completed / failed 生命周期事件存在但前端尚未消费，接入时再补对应成员。
 */
export type BackgroundTaskChunk =
  | { type: "data-background-task-started"; data: BackgroundTaskStartedData }
  | { type: "data-background-task-running"; data: BackgroundTaskRunningData }
  | { type: "data-background-task-output"; data: BackgroundTaskOutputData }
  | { type: "data-background-task-suspended"; data: BackgroundTaskSuspendedData };

/**
 * 消息对象 Schema - 支持 AI SDK 标准格式
 */
export const MessageSchema = z
  .object({
    id: z.string().optional().describe("消息ID"),
    role: z.enum(["user", "assistant", "system"]).describe("消息角色"),
    content: z.string().or(z.array(z.any())).describe("消息内容"),
    createdAt: z.date().or(z.string()).optional().describe("创建时间"),
    metadata: z.record(z.string(), z.any()).optional().describe("消息元数据")
  })
  .catchall(z.any())
  .describe("单条消息对象");

export type Message = z.infer<typeof MessageSchema>;

/**
 * 线程消息列表响应 Schema
 */
export const ListThreadMessagesResponseSchema = z
  .object({
    messages: z.array(z.custom<CustomStorageThreadType>()).describe("消息列表"),
    threadId: z.string().optional().describe("线程ID"),
    hasMore: z.boolean().describe("是否还有更早的消息"),
    total: z.number().describe("消息总数")
  })
  .describe("获取线程消息响应");

export type ListThreadMessagesResponse = z.infer<typeof ListThreadMessagesResponseSchema>;

/**
 * 错误响应 Schema
 */
export const BiChatErrorSchema = z
  .object({
    error: z.string().describe("错误信息"),
    code: z.string().optional().describe("错误代码")
  })
  .describe("BI Chat 错误响应");

export type BiChatError = z.infer<typeof BiChatErrorSchema>;
