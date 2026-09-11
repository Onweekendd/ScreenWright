import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ComputedRef } from "vue";
import { ref, shallowRef } from "vue";

import type { UIMessage, UIMessageChunk } from "ai";

// --- Mock 副作用模块 ---

const { mockAddProcessedComponent, mockGenerateTitle } = vi.hoisted(() => ({
  mockAddProcessedComponent: vi.fn(),
  mockGenerateTitle: vi.fn()
}));

vi.mock("@screenwright/server/rpc", () => ({
  apiClient: {
    customApi: {
      "bi-chat": {
        "generate-title": { $post: mockGenerateTitle }
      }
    }
  }
}));

// --- 被测模块 ---
import { type StreamState, useAgentBIStream } from "@/views/build/components/agentBI/hooks/useAgentBIStream";
import { useGenerateTitle } from "@/views/build/components/agentBI/hooks/useGenerateTitle";

// --- Helpers ---

/**
 * 构造 SSE 格式 Response，让 parseChatSseStream 真实运行。
 * AI SDK v6 流协议：
 *   text-start / text-delta(id,delta) / text-end
 *   tool-input-start / tool-input-delta / tool-input-available
 *   data-* 自定义 part（直接推送）
 *   finish
 */
const createMockSseResponse = (chunks: Record<string, unknown>[]): Response => {
  const lines = chunks.map((c) => `data: ${JSON.stringify(c)}`).join("\n") + "\ndata: [DONE]\n";
  const encoder = new TextEncoder();
  return {
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(lines));
        controller.close();
      }
    })
  } as unknown as Response;
};

/** 构造一段完整的文本流 chunks（含 start 设定 messageId） */
const textChunks = (text: string, id = "text-0", messageId = "msg-1") => [
  { type: "start", messageId },
  { type: "text-start", id },
  ...text.split("").map((ch) => ({ type: "text-delta", id, delta: ch })),
  { type: "text-end", id }
];

/** 构造 shared state 并返回 stream 接口 + 响应式 refs */
const makeStream = (_overrides: Record<string, any> = {}) => {
  const messages = shallowRef<UIMessage[]>([]);
  const lastUsage = ref<any>(null);
  const activeThreadId = ref<string | undefined>("thread-1");
  const memoryThreads = ref<any[]>([{ id: "thread-1", title: "新对话" }]);
  const queryMemory = vi.fn();
  const updateMessagesBy = (fn: () => UIMessage[]) => {
    messages.value = fn();
  };

  const { consumeSSEResponse } = useAgentBIStream();
  const { callGenerateTitle } = useGenerateTitle({ activeThreadId, memoryThreads, queryMemory });

  // 内联副作用 transform：处理 data-usage 和 data-node-conversion，其余透传
  const createSideEffectTransform = (_state: StreamState): TransformStream<UIMessageChunk, UIMessageChunk> =>
    new TransformStream({
      async transform(chunk, controller) {
        const c = chunk as { type: string; data?: unknown };
        if (c.type === "data-node-conversion") {
          await mockAddProcessedComponent(c.data);
          return;
        }
        if (c.type === "data-usage") {
          lastUsage.value = c.data;
          return;
        }
        controller.enqueue(chunk);
      }
    });

  const processMessageStream = (response: Response, initialMessages: UIMessage[], mergeIntoId?: string) =>
    consumeSSEResponse(response, initialMessages, [createSideEffectTransform], {
      messages,
      updateMessagesBy,
      mergeIntoId
    });

  const stream = { processMessageStream, callGenerateTitle };
  return { stream, messages, lastUsage, activeThreadId, memoryThreads, queryMemory };
};

// ---------------------------------------------------------------------------
// processMessageStream
// ---------------------------------------------------------------------------

describe("processMessageStream", () => {
  let ctx: ReturnType<typeof makeStream>;

  beforeEach(() => {
    ctx = makeStream();
    mockAddProcessedComponent.mockReset();
  });

  it("processMessageStream，单段文本流，messages 追加新 assistant 消息", async () => {
    const response = createMockSseResponse([...textChunks("Hello"), { type: "finish", finishReason: "stop" }]);

    const state = await ctx.stream.processMessageStream(response, []);

    expect(ctx.messages.value).toHaveLength(1);
    expect(ctx.messages.value[0].role).toBe("assistant");
    expect(state.finalMessage).not.toBeNull();
    expect(state.currentMessageId).toBeTruthy();
  });

  it("processMessageStream，多段文本流，最终消息文本为全部 delta 拼接", async () => {
    const response = createMockSseResponse([
      ...textChunks("Hello"),
      ...textChunks(" World", "text-1"),
      { type: "finish", finishReason: "stop" }
    ]);

    await ctx.stream.processMessageStream(response, []);

    const msg = ctx.messages.value[0];
    const textParts = msg.parts.filter((p: any) => p.type === "text");
    const fullText = textParts.map((p: any) => p.text).join("");
    expect(fullText).toBe("Hello World");
  });

  it("processMessageStream，携带 data-usage chunk，lastUsage 更新为 usage 数据", async () => {
    const usage = { inputTokens: 20, outputTokens: 10, totalTokens: 30, reasoningTokens: 0 };
    const response = createMockSseResponse([
      ...textChunks("hi"),
      { type: "data-usage", id: "usage-0", data: usage },
      { type: "finish", finishReason: "stop" }
    ]);

    await ctx.stream.processMessageStream(response, []);

    expect(ctx.lastUsage.value).toEqual(usage);
  });

  it("processMessageStream，传入 mergeIntoId，结果合并到已有消息而非追加", async () => {
    const existingMsg: UIMessage = {
      id: "msg-exist",
      role: "assistant",
      // @ts-expect-error - UIMessage doesn't have content field in new version
      content: "prev",
      parts: [{ type: "text", text: "prev", state: "done" }]
    };
    ctx.messages.value = [existingMsg];

    const response = createMockSseResponse([
      ...textChunks("continued", "text-0", "msg-exist"),
      { type: "finish", finishReason: "stop" }
    ]);

    const state = await ctx.stream.processMessageStream(response, ctx.messages.value, "msg-exist");

    expect(ctx.messages.value).toHaveLength(1);
    expect(ctx.messages.value[0].id).toBe("msg-exist");
    expect(state.currentMessageId).toBe("msg-exist");
  });

  it("processMessageStream，空 chunk 列表，返回 finalMessage 为 null", async () => {
    const response = createMockSseResponse([]);

    const state = await ctx.stream.processMessageStream(response, []);

    expect(state.finalMessage).toBeNull();
    expect(state.currentMessageId).toBe("");
  });

  it("processMessageStream，携带 data-node-conversion chunk，调用 addProcessedComponent", async () => {
    const nodeData = { nodeId: "node-1", type: "button" };
    const response = createMockSseResponse([
      ...textChunks("ok"),
      { type: "data-node-conversion", id: "nc-0", data: nodeData },
      { type: "finish", finishReason: "stop" }
    ]);

    await ctx.stream.processMessageStream(response, []);

    expect(mockAddProcessedComponent).toHaveBeenCalledWith(nodeData);
  });

  it("processMessageStream，两个不同 nodeId 的 data-node-conversion，addProcessedComponent 各调用一次", async () => {
    // per-event 语义：后端每个节点发一条 chunk，chunk 层每条只到达一次，不再去重
    const nodeA = { nodeId: "node-a", type: "card" };
    const nodeB = { nodeId: "node-b", type: "button" };
    const response = createMockSseResponse([
      { type: "start", messageId: "msg-nodes" },
      { type: "data-node-conversion", id: "nc-0", data: nodeA },
      { type: "data-node-conversion", id: "nc-1", data: nodeB },
      { type: "finish", finishReason: "stop" }
    ]);

    await ctx.stream.processMessageStream(response, []);

    expect(mockAddProcessedComponent).toHaveBeenCalledTimes(2);
    expect(mockAddProcessedComponent).toHaveBeenCalledWith(nodeA);
    expect(mockAddProcessedComponent).toHaveBeenCalledWith(nodeB);
  });

  it("processMessageStream，text part 文本为空白，最终消息 parts 中不含该 part", async () => {
    // text-start 后无 delta，AI SDK 会生成 text 为空字符串的 part，filterEmptyTextParts 应将其过滤掉
    const response = createMockSseResponse([
      { type: "start", messageId: "msg-empty-text" },
      { type: "text-start", id: "text-empty" },
      { type: "text-end", id: "text-empty" },
      ...textChunks("real content", "text-real", "msg-empty-text"),
      { type: "finish", finishReason: "stop" }
    ]);

    await ctx.stream.processMessageStream(response, []);

    const parts = ctx.messages.value[0]?.parts ?? [];
    const emptyTextParts = parts.filter((p: any) => p.type === "text" && !p.text?.trim());
    expect(emptyTextParts).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// callGenerateTitle
// ---------------------------------------------------------------------------

describe("callGenerateTitle", () => {
  let ctx: ReturnType<typeof makeStream>;

  beforeEach(() => {
    ctx = makeStream();
    mockGenerateTitle.mockReset();
  });

  it("callGenerateTitle，当前线程 title 为 '新对话'，调用 generateTitle 并更新 memoryThreads 标题", async () => {
    const newTitle = "测试标题";
    mockGenerateTitle.mockResolvedValue(
      createMockSseResponse([...textChunks(newTitle), { type: "finish", finishReason: "stop" }])
    );

    await ctx.stream.callGenerateTitle([]);

    expect(mockGenerateTitle).toHaveBeenCalled();
    expect(ctx.memoryThreads.value[0].title).toBe(newTitle);
  });

  it("callGenerateTitle，当前线程 title 非 '新对话'，不调用 generateTitle", async () => {
    ctx.memoryThreads.value = [{ id: "thread-1", title: "已有标题" }];

    await ctx.stream.callGenerateTitle([]);

    expect(mockGenerateTitle).not.toHaveBeenCalled();
  });

  it("callGenerateTitle，无 activeThreadId，不调用 generateTitle", async () => {
    ctx.activeThreadId.value = undefined;

    await ctx.stream.callGenerateTitle([]);

    expect(mockGenerateTitle).not.toHaveBeenCalled();
  });

  it("callGenerateTitle，generateTitle 抛出异常，错误被静默吞掉不向外传播", async () => {
    mockGenerateTitle.mockRejectedValue(new Error("network error"));

    await expect(ctx.stream.callGenerateTitle([])).resolves.toBeUndefined();
    expect(mockGenerateTitle).toHaveBeenCalled();
  });
});
