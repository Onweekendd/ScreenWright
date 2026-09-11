/**
 * AI SDK Data Stream 格式的流处理器
 *
 * 消费后端返回的 AI SDK Data Stream 格式（行协议）并构建 UIMessage
 *
 * 支持的格式：
 * - `0:` 文本增量
 * - `2:` 数据注解（用于 workflow 事件）
 * - `9:` 完整 tool call
 * - `b:` tool call streaming start
 * - `c:` tool call delta
 * - `d:` finish
 * - `a:` tool result
 * - `3:` error
 *
 * 参考：custom-api-client-tool-guide.md 第六步
 */

import type { UIMessage } from "ai";
import { parsePartialJson } from "ai";

import type { InternalToolPart, UnifiedStreamCallbacks } from "./shared-types";

// ========== 类型定义 ==========

/** 流协议事件名称 */
type StreamEventName =
  | "text-delta"
  | "annotation"
  | "error"
  | "tool-call"
  | "tool-result"
  | "tool-call-start"
  | "tool-call-delta"
  | "finish";

/** 流协议行格式 */
type DataStreamLine = {
  prefix: StreamEventName;
  data: string; // JSON 字符串
};

/** finish 消息数据 */
interface FinishData {
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
  responseMessages?: Array<Record<string, unknown>>; // Agent 本轮生成的消息（含 tool-call 记录）
}

/** workflow 注解数据（从 `2:` 前缀解析） */
interface WorkflowAnnotation {
  type:
    | "workflow-start"
    | "workflow-step-start"
    | "workflow-step-output"
    | "workflow-step-result"
    | "workflow-step-suspended";
  runId?: string;
  workflowId?: string;
  stepId?: string;
  input?: unknown;
  output?: unknown;
  suspendPayload?: unknown;
}

// ========== 工具函数 ==========

/**
 * 从 AI SDK Data Stream 行中解析前缀和数据
 */
function parseDataStreamLine(line: string): DataStreamLine | null {
  if (!line.trim()) return null;

  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) return null;

  const prefix = line.slice(0, colonIdx) as StreamEventName;
  const data = line.slice(colonIdx + 1);

  const validPrefixes: string[] = [
    "text-delta",
    "annotation",
    "error",
    "tool-call",
    "tool-result",
    "tool-call-start",
    "tool-call-delta",
    "finish"
  ];
  if (!validPrefixes.includes(prefix)) {
    return null;
  }

  return { prefix, data };
}

/**
 * 创建 UIMessage 流处理器
 *
 * @param messageId - 初始消息 ID
 * @param callbacks - 回调函数
 */
export function createChunkProcessor(messageId: string, callbacks: UnifiedStreamCallbacks) {
  // ========== Agent 消息（v5 格式） ==========
  const message: UIMessage = {
    id: messageId,
    role: "assistant",
    parts: [] as UIMessage["parts"]
  };

  // ========== Agent 可变状态 ==========
  let currentTextPart: { type: "text"; text: string } | undefined;
  let finishReason = "unknown";
  const usage: Record<string, unknown> = { completionTokens: 0, promptTokens: 0, totalTokens: 0 };

  const partialToolCalls: Record<string, { text: string; toolName: string }> = {};

  // ========== 工具函数 ==========

  async function updateMessage() {
    const copied = structuredClone(message);
    (copied as UIMessage & { revisionId?: string }).revisionId = crypto.randomUUID();
    await callbacks.onUpdate?.(copied);
  }

  function getToolParts(): InternalToolPart[] {
    return message.parts as unknown as InternalToolPart[];
  }

  function updateToolPart(toolCallId: string, toolName: string, update: Partial<InternalToolPart>) {
    const parts = getToolParts();
    const idx = parts.findIndex((p) => p.toolCallId === toolCallId);
    if (idx !== -1) {
      parts[idx] = { ...parts[idx]!, ...update } as InternalToolPart;
    } else {
      parts.push({
        type: `tool-${toolName}` as `tool-${string}`,
        toolCallId,
        toolName,
        state: "input-streaming",
        input: undefined,
        ...update
      } as InternalToolPart);
    }
  }

  // ========== 分发 map ==========

  const handlers: Partial<Record<StreamEventName, (data: string) => Promise<void>>> = {
    // ========== 文本增量 ==========
    "text-delta": async (data) => {
      // text-delta 的 data 是 JSON 编码的字符串
      const text = JSON.parse(data) as string;
      if (currentTextPart == null) {
        const newPart = { type: "text" as const, text };
        currentTextPart = newPart;
        (message.parts as unknown[]).push(newPart);
      } else {
        currentTextPart.text += text;
      }
      await updateMessage();
    },

    // ========== 数据注解（workflow 事件）==========
    annotation: async (data) => {
      try {
        const annotation = JSON.parse(data);
        if (isWorkflowAnnotation(annotation)) {
          await handleWorkflowAnnotation(annotation, callbacks);
        }
      } catch {
        // ignore parse errors
      }
    },

    // ========== 错误 ==========
    error: async (data) => {
      try {
        const errorMsg = JSON.parse(data) as string;
        await callbacks.onError?.(new Error(errorMsg));
      } catch {
        await callbacks.onError?.(new Error(String(data)));
      }
    },

    // ========== Tool 调用开始 ==========
    "tool-call-start": async (data) => {
      try {
        const { toolCallId, toolName } = JSON.parse(data) as {
          toolCallId: string;
          toolName: string;
        };
        partialToolCalls[toolCallId] = { text: "", toolName };
        updateToolPart(toolCallId, toolName, { state: "input-streaming", input: undefined });
        await updateMessage();
      } catch {
        // ignore
      }
    },

    // ========== Tool 增量 ==========
    "tool-call-delta": async (data) => {
      try {
        const { toolCallId, argsTextDelta } = JSON.parse(data) as {
          toolCallId: string;
          argsTextDelta: string;
        };
        const partial = partialToolCalls[toolCallId];
        if (!partial) return;
        partial.text += argsTextDelta;
        const { value: partialInput } = await parsePartialJson(partial.text);
        updateToolPart(toolCallId, partial.toolName, { state: "input-streaming", input: partialInput });
        await updateMessage();
      } catch {
        // ignore
      }
    },

    // ========== 完整 Tool 调用 ==========
    "tool-call": async (data) => {
      try {
        const {
          toolCallId,
          toolName: tn,
          args
        } = JSON.parse(data) as {
          toolCallId: string;
          toolName: string;
          args: Record<string, unknown>;
        };
        const toolName = partialToolCalls[toolCallId]?.toolName ?? tn;
        updateToolPart(toolCallId, toolName, { state: "input-available", input: args });
        await updateMessage();

        if (callbacks.onToolCall) {
          const result = await callbacks.onToolCall({ toolCallId, toolName, args });
          if (result != null) {
            updateToolPart(toolCallId, toolName, { state: "output-available", input: args, output: result });
            await updateMessage();
          }
        }
      } catch {
        // ignore
      }
    },

    // ========== Tool 结果 ==========
    "tool-result": async (data) => {
      try {
        const { toolCallId, result } = JSON.parse(data) as {
          toolCallId: string;
          result: unknown;
        };
        const toolPart = getToolParts().find((p) => p.toolCallId === toolCallId);
        if (!toolPart) return;
        updateToolPart(toolCallId, toolPart.toolName, { output: result });
        await updateMessage();
      } catch {
        // ignore
      }
    },

    // ========== 完成 ==========
    finish: async (data) => {
      try {
        const finishData = JSON.parse(data) as FinishData;
        finishReason = finishData.finishReason;
        if (finishData.usage != null) {
          Object.assign(usage, finishData.usage);
        }
      } catch {
        // ignore parse errors
      }

      await updateMessage();
      await callbacks.onFinish?.({ message: structuredClone(message), finishReason, usage });
    }
  };

  async function processChunk(chunk: DataStreamLine) {
    const handler = handlers[chunk.prefix];
    await handler?.(chunk.data);
  }

  return { processChunk, getFinishInfo: () => ({ message, finishReason, usage }) };
}

/**
 * 解析响应流并调用回调
 */
export async function processAISDKDataStream(
  response: Response,
  callbacks: UnifiedStreamCallbacks
): Promise<{
  finishReason: string;
  toolCalls: Array<{ toolCallId: string; toolName: string; args: Record<string, unknown> }>;
  responseMessages: Array<Record<string, unknown>>;
  usage: Record<string, unknown>;
}> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const toolCalls: Array<{ toolCallId: string; toolName: string; args: Record<string, unknown> }> = [];
  let finishReason = "stop";
  const responseMessages: Array<Record<string, unknown>> = [];
  const usage: Record<string, unknown> = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

  // 创建 chunk processor
  const { processChunk } = createChunkProcessor("", callbacks);

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // 最后一行可能不完整，留到下次

      for (const line of lines) {
        if (!line.trim()) continue;

        const parsed = parseDataStreamLine(line);
        if (!parsed) continue;

        await processChunk(parsed);

        // 提取 finish 信息
        if (parsed.prefix === "finish") {
          try {
            const finishData = JSON.parse(parsed.data) as FinishData;
            finishReason = finishData.finishReason;
            if (finishData.usage != null) {
              Object.assign(usage, finishData.usage);
            }
            responseMessages.splice(0, responseMessages.length, ...(finishData.responseMessages || []));
          } catch {
            // ignore parse errors
          }
        }

        // 提取 tool calls
        if (parsed.prefix === "tool-call") {
          try {
            const toolCall = JSON.parse(parsed.data) as {
              toolCallId: string;
              toolName: string;
              args: Record<string, unknown>;
            };
            toolCalls.push(toolCall);
          } catch {
            // ignore parse errors
          }
        }
      }
    }
  } catch (error) {
    await callbacks.onError?.(error as Error);
    throw error;
  }

  return { finishReason, toolCalls, responseMessages, usage };
}

/**
 * 判断是否为 workflow 注解
 */
function isWorkflowAnnotation(value: unknown): value is WorkflowAnnotation {
  return (
    value !== null &&
    typeof value === "object" &&
    "type" in value &&
    typeof value.type === "string" &&
    value.type.startsWith("workflow-")
  );
}

/**
 * 处理 workflow 注解
 */
async function handleWorkflowAnnotation(
  annotation: WorkflowAnnotation,
  callbacks: UnifiedStreamCallbacks
): Promise<void> {
  switch (annotation.type) {
    case "workflow-start":
      await callbacks.onWorkflowStart?.({
        runId: annotation.runId!,
        workflowId: annotation.workflowId!
      });
      break;

    case "workflow-step-start":
      await callbacks.onWorkflowStepStart?.({
        runId: annotation.runId!,
        stepId: annotation.stepId!,
        input: annotation.input
      });
      break;

    case "workflow-step-output":
      await callbacks.onWorkflowStepOutput?.({
        runId: annotation.runId!,
        stepId: annotation.stepId!,
        output: annotation.output
      });
      break;

    case "workflow-step-result":
      await callbacks.onWorkflowStepResult?.({
        runId: annotation.runId!,
        stepId: annotation.stepId!,
        output: annotation.output
      });
      break;

    case "workflow-step-suspended":
      await callbacks.onWorkflowStepSuspended?.({
        runId: annotation.runId!,
        stepId: annotation.stepId!,
        suspendPayload: annotation.suspendPayload
      });
      break;
  }
}
