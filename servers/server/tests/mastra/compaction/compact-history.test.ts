import { type MastraDBMessage, MessageList } from "@mastra/core/agent";
import type { ProcessInputArgs } from "@mastra/core/processors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generate: vi.fn(),
  createRecord: vi.fn(),
  findRecords: vi.fn(),
  countTextTokens: vi.fn(),
  getThreadById: vi.fn(),
  saveMessages: vi.fn(),
  updateThread: vi.fn(),
  listMessages: vi.fn()
}));

vi.mock("@/agent-resources/prompts", () => ({ loadPrompt: () => "summary prefix" }));
vi.mock("@/mastra/agents/compaction-summarizer-agent", () => ({
  compactionSummarizerAgent: { generate: mocks.generate }
}));
vi.mock("@/mastra/storage/prisma", () => ({
  prismaClient: { compactionRecord: { create: mocks.createRecord, findMany: mocks.findRecords } }
}));
vi.mock("@/mastra/storage/storage", () => ({
  memory: { getThreadById: mocks.getThreadById, saveMessages: mocks.saveMessages, updateThread: mocks.updateThread },
  storage: { getStore: async () => ({ listMessages: mocks.listMessages }) }
}));
vi.mock("@/mastra/provider/model-registry", () => ({
  getModelConfigSync: () => ({ modelId: "deepseek-v4-flash" })
}));
vi.mock("@/mastra/services/llm-exchange/llm-exchange-token-count", () => ({
  countTextTokens: mocks.countTextTokens
}));

import { compactionConfig } from "@/mastra/lib/compaction/config";
import { splitCurrentTurn } from "@/mastra/lib/compaction/history/activeMessages";
import { compactHistory } from "@/mastra/lib/compaction/history/compactHistory";
import { isCircuitBroken } from "@/mastra/lib/compaction/history/trigger";
import { manualCompact } from "@/mastra/lib/compaction/manualCompact";
import { CompactionProcessor } from "@/mastra/lib/compaction/processors/compaction";

// 熔断与冷却按 threadId 存在模块级状态里，每个用例用独立的 thread 互不干扰。
let threadSeq = 0;
let threadId: string;

const message = (id: string, role: "user" | "assistant", minute: number): MastraDBMessage => ({
  id,
  role,
  threadId,
  resourceId: "resource",
  createdAt: new Date(Date.UTC(2026, 9, 1, 0, minute)),
  content: { format: 2, parts: [{ type: "text", text: `${id} text` }] }
});

const conversation = () => [
  message("u1", "user", 1),
  message("a1", "assistant", 2),
  message("u2", "user", 3),
  message("a2", "assistant", 4)
];

const idsOf = (messages: MastraDBMessage[]) => messages.map(({ id }) => id);

const savedSummary = (): MastraDBMessage => mocks.saveMessages.mock.calls[0][0].messages[0];

const overThreshold = () => ({ metadata: { lastUsage: { inputTokens: compactionConfig.history.triggerTokens + 1 } } });

beforeEach(() => {
  vi.clearAllMocks();
  threadId = `thread-${++threadSeq}`;
  mocks.generate.mockResolvedValue({ text: "new summary" });
  mocks.findRecords.mockResolvedValue([]);
  mocks.createRecord.mockResolvedValue({});
  mocks.saveMessages.mockResolvedValue(undefined);
  mocks.getThreadById.mockResolvedValue({ id: threadId, title: "t", metadata: {} });
  mocks.countTextTokens.mockImplementation(async (text: string) => ({
    total: text.includes("<conversation-summary>") ? 10 : 100,
    estimated: false,
    tokenizer: "test-tokenizer"
  }));
  vi.spyOn(console, "info").mockImplementation(() => {});
});

describe("切出当前这轮", () => {
  it("从最后一条 user 消息开始的部分保留，之前的进入摘要", () => {
    const messages = [...conversation(), message("u3", "user", 5), message("a3", "assistant", 6)];
    const { history, currentTurn } = splitCurrentTurn(messages);
    expect(idsOf(history)).toEqual(["u1", "a1", "u2", "a2"]);
    expect(idsOf(currentTurn)).toEqual(["u3", "a3"]);
  });

  it("没有 user 消息时全部视为历史", () => {
    const messages = [message("a1", "assistant", 1)];
    expect(splitCurrentTurn(messages)).toEqual({ history: messages, currentTurn: [] });
  });
});

describe("compactHistory", () => {
  it("保存摘要、记录隐藏 ID 与前后消息数，并清空 lastUsage", async () => {
    const history = conversation();
    const summary = await compactHistory({ threadId, resourceId: "resource", history, keptCount: 2 });

    expect(summary).toBe(savedSummary());
    expect(summary).toMatchObject({ role: "assistant", threadId, createdAt: history[3].createdAt });
    expect(mocks.createRecord).toHaveBeenCalledWith({
      data: {
        threadId,
        compactedMessageIds: ["u1", "a1", "u2", "a2"],
        summaryMessageId: summary.id,
        messageCountBefore: 6,
        messageCountAfter: 3
      }
    });
    expect(mocks.updateThread).toHaveBeenCalledWith(expect.objectContaining({ metadata: { lastUsage: undefined } }));
    expect(mocks.countTextTokens).toHaveBeenCalledWith(
      expect.stringContaining("<conversation-summary>\nnew summary\n</conversation-summary>"),
      "deepseek-v4-flash"
    );
  });

  it("消息 ID 重复时在调用摘要模型前失败，不写任何数据", async () => {
    const history = conversation();
    history[1].id = history[0].id;
    await expect(compactHistory({ threadId, history })).rejects.toThrow("重复");
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.saveMessages).not.toHaveBeenCalled();
    expect(mocks.createRecord).not.toHaveBeenCalled();
  });

  it("连续失败达到上限后熔断", async () => {
    mocks.generate.mockRejectedValue(new Error("model failed"));
    for (let i = 0; i < compactionConfig.history.circuitBreakerFailures; i++) {
      await expect(compactHistory({ threadId, history: conversation() })).rejects.toThrow("model failed");
    }
    expect(isCircuitBroken(threadId)).toBe(true);
    expect(mocks.saveMessages).not.toHaveBeenCalled();
  });
});

describe("自动压缩处理器", () => {
  const run = async (list: MessageList) =>
    new CompactionProcessor().processInput({
      messageList: list,
      messages: list.get.input.db()
    } as unknown as ProcessInputArgs);

  const listWithCurrentTurn = () => {
    const list = new MessageList({ threadId, resourceId: "resource" });
    list.add(conversation(), "memory");
    list.add(message("current", "user", 5), "input");
    return list;
  };

  it("memory 召回的已压缩消息移出模型视图；未到阈值不压缩", async () => {
    mocks.findRecords.mockResolvedValue([{ compactedMessageIds: ["u1", "a1"] }]);
    const list = listWithCurrentTurn();
    await run(list);
    expect(idsOf(list.get.all.db())).toEqual(["u2", "a2", "current"]);
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it("超过阈值时历史换成一条摘要，当前这轮保留在最后且不被压缩", async () => {
    mocks.getThreadById.mockResolvedValue(overThreshold());
    const list = listWithCurrentTurn();
    await run(list);

    const summaryId = savedSummary().id;
    expect(idsOf(list.get.all.db())).toEqual([summaryId, "current"]);
    expect(idsOf(list.get.input.db())).toEqual(["current"]);
    expect(mocks.generate.mock.calls[0][0][0].content).not.toContain("current text");
    expect(mocks.createRecord.mock.calls[0][0].data.compactedMessageIds).toEqual(["u1", "a1", "u2", "a2"]);
  });

  it("压缩成功后进入冷却，下一轮即使超阈值也不再压缩", async () => {
    mocks.getThreadById.mockResolvedValue(overThreshold());
    await run(listWithCurrentTurn());
    await run(listWithCurrentTurn());
    expect(mocks.generate).toHaveBeenCalledOnce();
  });

  it("摘要失败时保留原历史", async () => {
    mocks.getThreadById.mockResolvedValue(overThreshold());
    mocks.generate.mockRejectedValue(new Error("model failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const list = listWithCurrentTurn();
    await run(list);
    expect(idsOf(list.get.all.db())).toEqual(["u1", "a1", "u2", "a2", "current"]);
  });
});

describe("手动压缩", () => {
  it("全部活跃历史替换为一条摘要", async () => {
    mocks.findRecords.mockResolvedValue([{ compactedMessageIds: ["old"] }]);
    mocks.listMessages.mockResolvedValue({
      messages: [message("old", "user", 0), ...conversation(), message("u3", "user", 5)]
    });
    expect(await manualCompact(threadId, "resource")).toEqual({
      compacted: true,
      messageCountBefore: 5,
      messageCountAfter: 1
    });
    expect(mocks.createRecord.mock.calls[0][0].data.compactedMessageIds).toEqual(["u1", "a1", "u2", "a2", "u3"]);
  });

  it("活跃消息过少时不压缩", async () => {
    mocks.listMessages.mockResolvedValue({ messages: conversation() });
    expect(await manualCompact(threadId, "resource")).toEqual({ compacted: false, reason: "消息数量过少，无需压缩" });
    expect(mocks.generate).not.toHaveBeenCalled();
  });
});
