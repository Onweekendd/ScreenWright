import { countJsonValuesTokens, countToolDefinitionTokens, type ToolTokenUsage } from "./llm-exchange-token-count";

interface LlmMessage {
  role?: string;
  content?: unknown;
  reasoning_content?: unknown;
  tool_calls?: Array<{
    id?: string;
    function?: { name?: string; arguments?: string };
  }>;
  tool_call_id?: string;
}

interface LlmRecordContent {
  step?: number;
  at?: string;
  threadId?: string;
  runId?: string | null;
  url?: string;
  status?: number;
  ok?: boolean;
  request?: {
    model?: string;
    messages?: LlmMessage[];
    tools?: unknown[];
  };
  summary?: {
    reasoning?: string;
    text?: string;
    toolCalls?: Array<{ id: string; name: string; arguments: string }>;
  };
  response?: string;
}

export interface ParsedExchangeMessage {
  role: string;
  content: string;
  toolCalls: Array<{ id?: string; name?: string; arguments?: string }>;
  toolCallId?: string;
}

export interface ParsedLlmExchangeContent {
  meta: {
    step: number | null;
    at: string | null;
    threadId: string | null;
    runId: string | null;
    url: string | null;
    status: number | null;
    ok: boolean | null;
    model: string | null;
    objectKey: string;
    bucket: string;
  };
  messages: ParsedExchangeMessage[];
  toolDefinitions: unknown[];
  toolTokenUsage: ToolTokenUsage;
  messageTokenUsage: {
    total: number;
    byMessage: number[];
    finalOutput: number | null;
    estimated: boolean;
    tokenizer: string | null;
  };
  summary: {
    reasoning: string;
    text: string;
    toolCalls: Array<{ id: string; name: string; arguments: string }>;
  } | null;
  responseText: string | null;
}

function stringifyContent(content: unknown): string {
  if (content == null) {
    return "";
  }
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: string }).text ?? "");
        }
        return JSON.stringify(part);
      })
      .filter(Boolean)
      .join("\n");
  }
  return JSON.stringify(content, null, 2);
}

function messageContentWithReasoning(message: LlmMessage): string {
  const content = stringifyContent(message.content);
  if (message.role !== "assistant") {
    return content;
  }

  const reasoning = stringifyContent(message.reasoning_content).trim();
  if (!reasoning || content.startsWith("<think>")) {
    return content;
  }
  return `<think>${reasoning}</think>${content}`;
}

function parseMessages(messages: LlmMessage[] | undefined): ParsedExchangeMessage[] {
  return (messages ?? []).map((message) => ({
    role: message.role ?? "unknown",
    content: messageContentWithReasoning(message),
    toolCalls: (message.tool_calls ?? []).map((toolCall) => ({
      id: toolCall.id,
      name: toolCall.function?.name,
      arguments: toolCall.function?.arguments
    })),
    toolCallId: message.tool_call_id
  }));
}

function summaryToMessage(summary: LlmRecordContent["summary"]): LlmMessage | null {
  if (!summary || (!summary.reasoning && !summary.text && !summary.toolCalls?.length)) {
    return null;
  }

  const reasoningPrefix = summary.reasoning ? `<think>${summary.reasoning}</think>` : "";
  return {
    role: "assistant",
    content: reasoningPrefix + (summary.text ?? ""),
    tool_calls: (summary.toolCalls ?? []).map((toolCall) => ({
      id: toolCall.id,
      function: { name: toolCall.name, arguments: toolCall.arguments }
    }))
  };
}

export async function parseLlmExchangeContent(
  content: unknown,
  pointer: { bucket: string; objectKey: string }
): Promise<ParsedLlmExchangeContent> {
  const record = (content ?? {}) as LlmRecordContent;
  const request = record.request;
  const messages = request?.messages ?? [];
  const toolDefinitions = request?.tools ?? [];
  const finalOutputMessage = summaryToMessage(record.summary);
  const [toolTokenUsage, rawMessageTokenUsage] = await Promise.all([
    countToolDefinitionTokens(toolDefinitions, request?.model),
    countJsonValuesTokens(finalOutputMessage ? [...messages, finalOutputMessage] : messages, request?.model)
  ]);

  return {
    meta: {
      step: record.step ?? null,
      at: record.at ?? null,
      threadId: record.threadId ?? null,
      runId: record.runId ?? null,
      url: record.url ?? null,
      status: record.status ?? null,
      ok: record.ok ?? null,
      model: request?.model ?? null,
      objectKey: pointer.objectKey,
      bucket: pointer.bucket
    },
    messages: parseMessages(messages),
    toolDefinitions,
    toolTokenUsage,
    messageTokenUsage: {
      total: rawMessageTokenUsage.total,
      byMessage: rawMessageTokenUsage.byItem.slice(0, messages.length),
      finalOutput: finalOutputMessage ? (rawMessageTokenUsage.byItem[messages.length] ?? null) : null,
      estimated: rawMessageTokenUsage.estimated,
      tokenizer: rawMessageTokenUsage.tokenizer
    },
    summary: record.summary
      ? {
          reasoning: record.summary.reasoning ?? "",
          text: record.summary.text ?? "",
          toolCalls: record.summary.toolCalls ?? []
        }
      : null,
    responseText: typeof record.response === "string" ? record.response : null
  };
}
