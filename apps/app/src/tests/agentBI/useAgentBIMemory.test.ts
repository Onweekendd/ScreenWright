import { beforeEach, describe, expect, it, vi } from "vitest";

import { computed, ref, shallowRef } from "vue";

import { AgentMode, type CustomStorageThreadType } from "@screenwright/server/rpc";
import type { UIMessage } from "ai";

// --- Mock 函数声明（hoisted）---
const { mockCreateThread, mockThreadMessages, mockUpdateThread } = vi.hoisted(() => ({
  mockCreateThread: vi.fn(),
  mockThreadMessages: vi.fn(),
  mockUpdateThread: vi.fn()
}));

// --- Mocks ---

vi.mock("@screenwright/server/rpc", () => ({
  AgentMode: { ASK_BEFORE_EDIT: "ask_before_edit", AUTO_EDIT: "auto_edit", PLAN: "plan" },
  apiClient: {
    customApi: {
      "bi-chat": {
        "create-thread": { $post: mockCreateThread },
        "thread-messages": { $post: mockThreadMessages },
        "update-thread": { $post: mockUpdateThread }
      }
    }
  }
}));

vi.mock("element-plus", () => ({
  ElMessage: { error: vi.fn() }
}));

// --- 被测模块 ---
import { useAgentBIMemory } from "@/views/build/components/agentBI/hooks/useAgentBIMemory";

/** 构造 AgentBISharedState（memoryThreads 由 useAgentBIThreadList 注入，这里用桩 ref 替代） */
const makeMemory = () => {
  const messages = shallowRef<UIMessage[]>([]);
  const lastUsage = ref<any>(null);
  const resourceId = computed(() => "screen-23595");
  const memoryThreads = ref<CustomStorageThreadType[]>([]);
  const updateMessagesBy = (fn: () => UIMessage[]) => {
    messages.value = fn();
  };

  const memory = useAgentBIMemory({ messages, updateMessagesBy, resourceId, lastUsage, memoryThreads });

  return { memory, messages, lastUsage, resourceId, memoryThreads };
};

// ---------------------------------------------------------------------------
// ensureActiveThread
// ---------------------------------------------------------------------------

describe("ensureActiveThread", () => {
  let ctx: ReturnType<typeof makeMemory>;

  beforeEach(() => {
    ctx = makeMemory();
    mockCreateThread.mockReset();
  });

  it("ensureActiveThread，activeThreadId 已有值，不调用 createMemoryThread", async () => {
    ctx.memory.activeThreadId.value = "t-exist";

    await ctx.memory.ensureActiveThread();

    expect(mockCreateThread).not.toHaveBeenCalled();
  });

  it("ensureActiveThread，activeThreadId 为空，调用 createMemoryThread 并设置新 id，新线程推入共享列表", async () => {
    const newThread = { id: "t-new", title: "新对话" };
    mockCreateThread.mockResolvedValue({ json: () => Promise.resolve(newThread) });

    await ctx.memory.ensureActiveThread();

    expect(mockCreateThread).toHaveBeenCalledWith({
      json: { title: "新对话", resourceId: "screen-23595", metadata: { mode: "auto_edit" } }
    });
    expect(ctx.memory.activeThreadId.value).toBe("t-new");
    // 推入的是注入的共享 memoryThreads
    expect(ctx.memoryThreads.value).toContainEqual(newThread);
  });

  it("ensureActiveThread，带预选模型，随建对话一起提交", async () => {
    mockCreateThread.mockResolvedValue({ json: () => Promise.resolve({ id: "t-new", title: "新对话" }) });

    await ctx.memory.ensureActiveThread({ reasoning: "reasoning-2" });

    expect(mockCreateThread.mock.calls[0][0].json.models).toEqual({ reasoning: "reasoning-2" });
  });
});

// ---------------------------------------------------------------------------
// loadThreadMessages
// ---------------------------------------------------------------------------

describe("loadThreadMessages", () => {
  let ctx: ReturnType<typeof makeMemory>;

  beforeEach(() => {
    ctx = makeMemory();
    mockThreadMessages.mockReset();
    // @ts-expect-error - UIMessage doesn't have content field in new version
    ctx.messages.value = [{ id: "old", role: "user", content: "old", parts: [] }];
  });

  it("loadThreadMessages，API 返回消息列表，messages 更新为转换后的数组", async () => {
    const apiMessages = [{ id: "m-1", role: "user", content: "hi", parts: [{ type: "text", text: "hi" }] }];
    mockThreadMessages.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messages: apiMessages })
    });

    await ctx.memory.loadThreadMessages({
      id: "t-1",
      title: "对话",
      resourceId: "screen-23595",
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {}
    });

    expect(ctx.memory.activeThreadId.value).toBe("t-1");
    expect(ctx.messages.value).toHaveLength(1);
  });

  it("loadThreadMessages，API 抛出异常，messages 清空", async () => {
    mockThreadMessages.mockRejectedValue(new Error("fail"));

    await ctx.memory.loadThreadMessages({
      id: "t-1",
      title: "对话",
      resourceId: "screen-23595",
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {}
    });

    expect(ctx.messages.value).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// startNewChat
// ---------------------------------------------------------------------------

describe("startNewChat", () => {
  it("startNewChat，调用后 activeThreadId 清空且 messages 清空", () => {
    const ctx = makeMemory();
    ctx.memory.activeThreadId.value = "t-1";
    ctx.memory.currentMode.value = AgentMode.PLAN;
    // @ts-expect-error - UIMessage doesn't have content field in new version
    ctx.messages.value = [{ id: "m-1", role: "user", content: "hi", parts: [] }];

    ctx.memory.startNewChat();

    expect(ctx.memory.activeThreadId.value).toBeUndefined();
    expect(ctx.memory.currentMode.value).toBe("auto_edit");
    expect(ctx.messages.value).toEqual([]);
    expect(ctx.lastUsage.value).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      reasoningTokens: 0
    });
  });
});
