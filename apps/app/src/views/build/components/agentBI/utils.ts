import type { ClientTool } from "@mastra/client-js";
import type { UIMessage } from "ai";
import { generateId } from "ai";

/**
 * 从用户输入或 UIMessage 中提取文本内容
 */
export const extractUserText = (userMessageOrText?: string | UIMessage, fallbackText: string = ""): string => {
  if (typeof userMessageOrText === "object" && userMessageOrText !== null) {
    return ((userMessageOrText.parts?.find((p: any) => p.type === "text") as any)?.text ?? "") || fallbackText;
  }
  return (userMessageOrText ?? fallbackText).toString().trim();
};

/**
 * 构造用户消息
 */
export const buildUserMessage = (text: string): UIMessage => {
  return {
    id: generateId(),
    role: "user",
    // @ts-expect-error - UIMessage doesn't have content field in new version
    content: text,
    parts: [{ type: "text", text }]
  };
};

/**
 * 从消息中提取 workflow 相关的 parts
 */
export const extractWorkflowParts = (msg: UIMessage) => {
  return (msg.parts as any[]).filter((p) => p.type === "data-tool-workflow");
};

/**
 * 从消息中提取待处理的客户端工具
 */
export const extractPendingClientTools = (msg: UIMessage, availableToolNames: Set<string>) => {
  return msg.parts
    .filter((p) => p.type?.startsWith("tool-") && (p as any).state === "input-available")
    .map((p) => ({
      ...p,
      toolName: (p.type as string).slice("tool-".length)
    }))
    .filter((p) => availableToolNames.has(p.toolName));
};

/**
 * 合并消息中的工具执行结果
 */
export const mergeToolResultsIntoMessage = (
  message: UIMessage,
  toolResults: Array<{ toolCallId: string; result: unknown }>
): UIMessage => {
  return {
    ...message,
    parts: message.parts.map((p) => {
      const result = toolResults.find((r) => r.toolCallId === (p as any).toolCallId);
      if (!result) {
        return p;
      }
      return { ...p, state: "output-available", output: result.result };
    }) as any
  };
};

/**
 * 尝试解析 SSE 流中的 JSON 行
 */
export const tryParseSSELine = (line: string): any | null => {
  if (!line.startsWith("data: ") || line === "data: [DONE]") {
    return null;
  }
  try {
    const res = JSON.parse(line.slice(6));
    return res;
  } catch (error) {
    console.error("[tryParseSSELine] error parsing line", line, error);
    return null;
  }
};

/**
 * 将 SSE 流式 Response 解析为 ReadableStream，逐行提取 JSON 数据，遇到 `data: [DONE]` 终止流
 * @param response - 后端返回的 SSE Response 对象
 */
export const parseChatSseStream = (response: Response): ReadableStream => {
  let buffer = "";
  return response.body!.pipeThrough(new TextDecoderStream()).pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line === "data: [DONE]") {
            controller.terminate();
            return;
          }
          const data = tryParseSSELine(line);
          if (data) {
            controller.enqueue(data);
          }
        }
      },
      flush(controller) {
        if (buffer === "data: [DONE]") {
          return;
        }
        const data = tryParseSSELine(buffer);
        if (data) {
          controller.enqueue(data);
        }
      }
    })
  );
};

/**
 * 判断是否为 UIMessage 对象
 */
export const isUIMessage = (value: unknown): value is UIMessage => {
  return typeof value === "object" && value !== null && "parts" in value;
};

/**
 * 更新消息列表中的特定消息
 */
export const updateMessageById = (
  messages: UIMessage[],
  targetId: string,
  updater: (msg: UIMessage) => UIMessage
): UIMessage[] => {
  return messages.map((m) => (m.id === targetId ? updater(m) : m));
};

/**
 * 检查是否应该继续处理（不在流式传输中或者有现有消息）
 */
export const shouldContinueProcessing = (isStreaming: boolean, hasExistingMessages: boolean): boolean => {
  return !isStreaming || hasExistingMessages;
};

/**
 * 从工具定义中提取 schema（移除 execute 函数）
 */
export const stripExecuteFromTools = (tools: Record<string, ClientTool>) => {
  return Object.fromEntries(
    Object.entries(tools).map(([name, tool]) => {
      const { execute: _execute, id: _id, ...schema } = tool;
      return [name, schema];
    })
  );
};

/**
 * 解析 workflow 步骤变化（对比前后状态）
 */
export const detectStepStatusChange = (
  prevStepStatus: string | undefined,
  currStepStatus: string,
  targetStepId: string,
  currentStepId: string
): boolean => {
  return currentStepId === targetStepId && currStepStatus === "success" && prevStepStatus !== "success";
};
