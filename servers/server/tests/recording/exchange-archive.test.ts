import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const recordIndexMock = vi.hoisted(() => ({
  indexLlmExchange: vi.fn<(input: unknown) => Promise<void>>().mockResolvedValue(undefined)
}));

vi.mock("@/recording/record-index", () => recordIndexMock);

const SSE_RESPONSE = [
  'data: {"choices":[{"delta":{"reasoning_content":"想一下"}}]}',
  'data: {"choices":[{"delta":{"content":"好的"}}]}',
  'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","function":{"name":"queryTable","arguments":"{}"}}]}}]}',
  'data: {"usage":{"prompt_tokens":30,"completion_tokens":5,"total_tokens":35}}',
  "data: [DONE]"
].join("\n");

let recordDir: string;

beforeEach(() => {
  recordDir = fs.mkdtempSync(path.join(os.tmpdir(), "llm-records-"));
  vi.stubEnv("RECORD_LLM", "true");
  vi.stubEnv("RECORD_SINK", "fs");
  vi.stubEnv("LLM_RECORD_DIR", recordDir);
  vi.resetModules();
  recordIndexMock.indexLlmExchange.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  fs.rmSync(recordDir, { recursive: true, force: true });
});

async function readRecord(...segments: string[]): Promise<Record<string, unknown>> {
  // recordStore 落盘时会补上业务前缀 RECORD_PREFIX（默认 llm-records）
  const file = path.join(recordDir, "llm-records", ...segments);
  return vi.waitFor(() => JSON.parse(fs.readFileSync(file, "utf-8")) as Record<string, unknown>);
}

function createHead() {
  return {
    url: "https://api.deepseek.com/chat/completions",
    status: 200,
    ok: true,
    model: "deepseek-chat",
    request: { model: "deepseek-chat", messages: [{ role: "user", content: "订单表有几行" }] },
    requestStartedAt: Date.now() - 1_200
  };
}

describe("ExchangeArchive", () => {
  it("在 turn 上下文中开档时，应写进该 turn 文件夹并保持档案字段顺序", async () => {
    // Arrange
    const { ExchangeArchive } = await import("@/recording/exchange-archive");
    const { withRecordingTurn } = await import("@/recording/recording-scope");

    // Act
    const key = await withRecordingTurn({ threadId: "thread-1", runId: "run-1" }, async () => {
      const exchange = new ExchangeArchive("pi").open(createHead());
      exchange.commit(SSE_RESPONSE);
      return exchange.key;
    });
    const record = await readRecord("thread-1", "turn_00", "step_00.json");

    // Assert
    expect(key).toBe("thread-1/turn_00/step_00.json");
    expect(Object.keys(record)).toEqual([
      "step",
      "at",
      "startedAt",
      "threadId",
      "runId",
      "url",
      "status",
      "ok",
      "request",
      "completedAt",
      "generationTimeMs",
      "tokenUsage",
      "summary",
      "response",
      "formatVersion",
      "source"
    ]);
    expect(record).toMatchObject({
      step: 0,
      threadId: "thread-1",
      runId: "run-1",
      status: 200,
      ok: true,
      formatVersion: 1,
      source: "pi",
      tokenUsage: { promptTokens: 30, completionTokens: 5, totalTokens: 35 },
      summary: {
        reasoning: "想一下",
        text: "好的",
        toolCalls: [{ id: "call_1", name: "queryTable", arguments: "{}" }]
      }
    });
    expect(record.generationTimeMs).toBeGreaterThanOrEqual(1_200);
  });

  it("同一 turn 内连续开档时，step 序号应递增", async () => {
    // Arrange
    const { ExchangeArchive } = await import("@/recording/exchange-archive");
    const { withRecordingTurn } = await import("@/recording/recording-scope");
    const archive = new ExchangeArchive("mastra");

    // Act
    const keys = await withRecordingTurn({ threadId: "thread-2" }, async () => [
      archive.open(createHead()).key,
      archive.open(createHead()).key
    ]);

    // Assert
    expect(keys).toEqual(["thread-2/turn_00/step_00.json", "thread-2/turn_00/step_01.json"]);
  });

  it("回调里 await 之后再开档，仍应落在同一个 turn（模型往返发生在消费流时）", async () => {
    // Arrange
    const { ExchangeArchive } = await import("@/recording/exchange-archive");
    const { withRecordingTurn } = await import("@/recording/recording-scope");

    // Act
    const key = await withRecordingTurn({ threadId: "thread-4" }, async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return new ExchangeArchive("mastra").open(createHead()).key;
    });

    // Assert
    expect(key).toBe("thread-4/turn_00/step_00.json");
  });

  it("未开启 RECORD_LLM 时，withRecordingTurn 应直接执行且不建立 turn 上下文", async () => {
    // Arrange
    vi.stubEnv("RECORD_LLM", "false");
    const { ExchangeArchive } = await import("@/recording/exchange-archive");
    const { withRecordingTurn } = await import("@/recording/recording-scope");

    // Act
    const key = await withRecordingTurn(
      { threadId: "thread-off" },
      async () => new ExchangeArchive("mastra").open(createHead()).key
    );

    // Assert
    expect(key).toBe("step_-1.json");
  });

  it("没有 turn 上下文时，应落在根前缀下的 step_-1.json 而不是丢弃记录", async () => {
    // Arrange
    const { ExchangeArchive } = await import("@/recording/exchange-archive");

    // Act
    const exchange = new ExchangeArchive("mastra").open(createHead());
    exchange.commit(SSE_RESPONSE);
    const record = await readRecord("step_-1.json");

    // Assert
    expect(exchange.key).toBe("step_-1.json");
    expect(record).toMatchObject({ step: -1, source: "mastra" });
  });

  it("收尾时应同时写一行可查询索引", async () => {
    // Arrange
    const { ExchangeArchive } = await import("@/recording/exchange-archive");
    const { withRecordingTurn } = await import("@/recording/recording-scope");

    // Act
    await withRecordingTurn({ threadId: "thread-3" }, async () => {
      new ExchangeArchive("pi").open(createHead()).commit(SSE_RESPONSE);
    });

    // Assert
    await vi.waitFor(() => expect(recordIndexMock.indexLlmExchange).toHaveBeenCalledTimes(1));
    expect(recordIndexMock.indexLlmExchange.mock.calls[0][0]).toMatchObject({
      key: "thread-3/turn_00/step_00.json",
      threadId: "thread-3",
      turnIndex: 0,
      step: 0,
      model: "deepseek-chat",
      toolNames: ["queryTable"],
      promptTokens: 30,
      totalTokens: 35
    });
  });
});

describe("countToolFailures", () => {
  // 工具结果不在发起调用的那一步，而在下一步请求的消息尾巴上。这个数是「到本步为止的累计」，
  // 消费方（evals/harness/metrics.ts）按分支取最大值——所以这里数准了，L2 才准。
  const toolResult = (payload: unknown) => ({ role: "tool", content: JSON.stringify(payload) });

  it("数 role=tool 且 success 为 false 的结果", async () => {
    const { countToolFailures } = await import("@/recording/exchange-archive");

    const failures = countToolFailures({
      messages: [toolResult({ success: false, message: "第一次" }), toolResult({ success: false, message: "第二次" })]
    });

    expect(failures).toBe(2);
  });

  it("成功的返回、非 JSON 文本、非 tool 角色都不算失败", async () => {
    const { countToolFailures } = await import("@/recording/exchange-archive");

    const failures = countToolFailures({
      messages: [
        toolResult({ success: true, message: "建好了" }),
        { role: "tool", content: "纯文本结果，不是 JSON" },
        // 宁可少报也不要误判：assistant 复述了一句 success:false 不代表工具失败了
        { role: "assistant", content: JSON.stringify({ success: false }) }
      ]
    });

    expect(failures).toBe(0);
  });

  it("请求体不是对象、或没有 messages 时返回 0 而不是抛错", async () => {
    const { countToolFailures } = await import("@/recording/exchange-archive");

    expect(countToolFailures(undefined)).toBe(0);
    expect(countToolFailures({ model: "m" })).toBe(0);
    expect(countToolFailures("这不是 JSON 请求体")).toBe(0);
  });
});
