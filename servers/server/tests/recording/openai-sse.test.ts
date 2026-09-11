import { describe, expect, it } from "vitest";

import { extractTokenUsage, formatResponse, summarizeResponse } from "@/recording/openai-sse";

function sse(...payloads: unknown[]): string {
  return payloads
    .map((payload) => `data: ${typeof payload === "string" ? payload : JSON.stringify(payload)}`)
    .join("\n");
}

describe("summarizeResponse", () => {
  it("给定分片下发的 tool_call 时，应按 index 把参数拼回完整 JSON", () => {
    // Arrange
    const raw = sse(
      {
        choices: [
          { delta: { tool_calls: [{ index: 0, id: "call_1", function: { name: "queryTable", arguments: "" } }] } }
        ]
      },
      { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '{"table"' } }] } }] },
      { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: ':"orders"}' } }] } }] },
      "[DONE]"
    );

    // Act
    const summary = summarizeResponse(raw);

    // Assert
    expect(summary.toolCalls).toEqual([{ id: "call_1", name: "queryTable", arguments: '{"table":"orders"}' }]);
  });

  it("给定推理与正文增量时，应分别累积 reasoning 和 text", () => {
    // Arrange
    const raw = sse(
      { choices: [{ delta: { reasoning_content: "先看" } }] },
      { choices: [{ delta: { reasoning_content: "表结构" } }] },
      { choices: [{ delta: { content: "订单" } }] },
      { choices: [{ delta: { content: "共 3 行" } }] }
    );

    // Act
    const summary = summarizeResponse(raw);

    // Assert
    expect(summary).toEqual({ reasoning: "先看表结构", text: "订单共 3 行", toolCalls: [] });
  });

  it("给定非 JSON 的 SSE 片段时，应跳过而不是抛错", () => {
    // Arrange
    const raw = ["data: not-json", ...sse({ choices: [{ delta: { content: "ok" } }] }).split("\n")].join("\n");

    // Act
    const summary = summarizeResponse(raw);

    // Assert
    expect(summary.text).toBe("ok");
  });
});

describe("extractTokenUsage", () => {
  it("给定 SSE 中多份 usage 时，应取最后一份非空的", () => {
    // Arrange
    const raw = sse(
      { choices: [{ delta: { content: "x" } }] },
      {
        usage: {
          prompt_tokens: 100,
          completion_tokens: 20,
          total_tokens: 120,
          prompt_tokens_details: { cached_tokens: 64 },
          completion_tokens_details: { reasoning_tokens: 8 }
        }
      },
      "[DONE]"
    );

    // Act
    const usage = extractTokenUsage(raw);

    // Assert
    expect(usage).toEqual({
      promptTokens: 100,
      completionTokens: 20,
      totalTokens: 120,
      cachedPromptTokens: 64,
      reasoningTokens: 8
    });
  });

  it("给定驼峰命名且缺少 total 的非流式响应时，应换算出总数", () => {
    // Arrange
    const raw = JSON.stringify({ usage: { inputTokens: 7, outputTokens: 3 } });

    // Act
    const usage = extractTokenUsage(raw);

    // Assert
    expect(usage).toMatchObject({ promptTokens: 7, completionTokens: 3, totalTokens: 10 });
  });

  it("给定没有 usage 的响应时，应返回 undefined", () => {
    expect(extractTokenUsage(sse({ choices: [{ delta: { content: "x" } }] }))).toBeUndefined();
    expect(extractTokenUsage("not-json")).toBeUndefined();
  });
});

describe("formatResponse", () => {
  it("给定 SSE 文本时，应拆成 chunk 数组并保留 [DONE] 标记", () => {
    // Arrange
    const raw = sse({ id: "1" }, "[DONE]");

    // Act
    const formatted = formatResponse(raw);

    // Assert
    expect(formatted).toEqual([{ id: "1" }, "[DONE]"]);
  });

  it("给定非 SSE 文本时，应原样解析或原样返回", () => {
    expect(formatResponse('{"ok":true}')).toEqual({ ok: true });
    expect(formatResponse("plain text")).toBe("plain text");
  });
});
