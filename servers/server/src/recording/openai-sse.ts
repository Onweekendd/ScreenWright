/**
 * OpenAI 兼容响应（SSE / JSON）的解析件：把原始响应文本拆成可读结构。
 *
 * 只认 wire 格式，不认任何 agent 框架的内部类型，因此 Mastra 与 Pi 共用同一份实现。
 */
import type { ExchangeSummary, TokenUsage } from "./exchange-record";

/** 把一段 ReadableStream 抽干成文本（记录原始 SSE 响应） */
export async function drainToText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let out = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      out += decoder.decode(value, { stream: true });
    }
  } catch {
    // 录制分支出错不影响主流程
  } finally {
    reader.releaseLock();
  }
  return out;
}

/** 请求体是 JSON 字符串时解析成对象，否则原样返回 */
export function safeParse(body: unknown): unknown {
  if (typeof body !== "string") {
    return body;
  }
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

/** 把 SSE 文本拆成格式化的 JSON 对象数组，非 SSE 原样返回 */
export const formatResponse = (raw: string): unknown => {
  if (!raw.startsWith("data: ")) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  const chunks: unknown[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data: ")) {
      continue;
    }
    const payload = trimmed.slice(6);
    if (payload === "[DONE]") {
      chunks.push("[DONE]");
      continue;
    }
    try {
      chunks.push(JSON.parse(payload));
    } catch {
      chunks.push(payload);
    }
  }
  return chunks;
};

const asTokenCount = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;

/** 从 OpenAI 兼容的 JSON / SSE 响应中提取最后一份非空 token usage。 */
export const extractTokenUsage = (raw: string): TokenUsage | undefined => {
  const payloads: unknown[] = [];

  const lines = raw.split("\n");
  if (lines.some((line) => line.trim().startsWith("data: "))) {
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) {
        continue;
      }
      const payload = trimmed.slice(6);
      if (payload === "[DONE]") {
        continue;
      }
      try {
        payloads.push(JSON.parse(payload));
      } catch {
        // 非 JSON 的 SSE 片段不包含可用 usage，直接跳过。
      }
    }
  } else {
    try {
      payloads.push(JSON.parse(raw));
    } catch {
      return undefined;
    }
  }

  for (let index = payloads.length - 1; index >= 0; index -= 1) {
    const usage = (payloads[index] as { usage?: Record<string, unknown> } | undefined)?.usage;
    if (!usage) {
      continue;
    }

    const promptDetails = usage.prompt_tokens_details as Record<string, unknown> | undefined;
    const completionDetails = usage.completion_tokens_details as Record<string, unknown> | undefined;
    const promptTokens = asTokenCount(
      usage.prompt_tokens ?? usage.input_tokens ?? usage.promptTokens ?? usage.inputTokens
    );
    const completionTokens = asTokenCount(
      usage.completion_tokens ?? usage.output_tokens ?? usage.completionTokens ?? usage.outputTokens
    );
    const tokenUsage: TokenUsage = {
      promptTokens,
      completionTokens,
      totalTokens:
        asTokenCount(usage.total_tokens ?? usage.totalTokens) ??
        (promptTokens !== undefined && completionTokens !== undefined ? promptTokens + completionTokens : undefined),
      cachedPromptTokens: asTokenCount(promptDetails?.cached_tokens),
      reasoningTokens: asTokenCount(completionDetails?.reasoning_tokens)
    };

    if (Object.values(tokenUsage).some((value) => value !== undefined)) {
      return tokenUsage;
    }
  }

  return undefined;
};

/**
 * 从 SSE chunks 中提取可读摘要：累积的 reasoning / text / tool_calls。
 * 输出结构：
 *   { reasoning: "...", text: "...", toolCalls: [{ name, id, arguments }] }
 */
export const summarizeResponse = (raw: string): ExchangeSummary => {
  let reasoning = "";
  let text = "";
  const toolCalls: Array<{ id: string; name: string; arguments: string }> = [];
  const tcArgBuffers = new Map<string, string>();

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data: ")) {
      continue;
    }
    const payload = trimmed.slice(6);
    if (payload === "[DONE]") {
      break;
    }
    let chunk: {
      choices?: Array<{
        delta?: {
          content?: string | null;
          reasoning_content?: string | null;
          tool_calls?: Array<{ index?: number; id?: string; function?: { name?: string; arguments?: string } }>;
        };
      }>;
    };
    try {
      chunk = JSON.parse(payload);
    } catch {
      continue;
    }
    const delta = chunk.choices?.[0]?.delta;
    if (!delta) {
      continue;
    }
    if (delta.reasoning_content) {
      reasoning += delta.reasoning_content;
    }
    if (delta.content) {
      text += delta.content;
    }
    if (Array.isArray(delta.tool_calls)) {
      for (const tc of delta.tool_calls) {
        if (tc.id && tc.function?.name) {
          // 首片：带 id + name
          toolCalls.push({ id: tc.id, name: tc.function.name, arguments: "" });
          tcArgBuffers.set(tc.id, "");
        }
        const args = tc.function?.arguments;
        if (args) {
          // 后续片：只有 index + arguments，没有 id；用 index 查找对应的 toolCall
          if (tc.id) {
            const prev = tcArgBuffers.get(tc.id) ?? "";
            tcArgBuffers.set(tc.id, prev + args);
          } else if (tc.index != null && tc.index < toolCalls.length) {
            const target = toolCalls[tc.index];
            const prev = tcArgBuffers.get(target.id) ?? "";
            tcArgBuffers.set(target.id, prev + args);
          }
        }
      }
    }
  }

  for (const tc of toolCalls) {
    tc.arguments = tcArgBuffers.get(tc.id) ?? tc.arguments;
  }

  return { reasoning, text, toolCalls };
};
