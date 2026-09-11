import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mock 函数声明（vi.hoisted 与 vi.mock 一起提升到顶部）---
const {
  mockConsumeSSEResponse,
  mockCallGenerateTitle,
  mockBiChatPost,
  mockEnsureActiveThread,
  mockStartNewChat,
  mockToolExecute
} = vi.hoisted(() => ({
  mockConsumeSSEResponse: vi.fn(),
  mockCallGenerateTitle: vi.fn().mockResolvedValue(undefined),
  mockBiChatPost: vi.fn().mockResolvedValue({}),
  mockEnsureActiveThread: vi.fn().mockResolvedValue(undefined),
  mockStartNewChat: vi.fn(),
  mockToolExecute: vi.fn().mockResolvedValue({ success: true })
}));

// --- Mocks (hoisted) ---

vi.mock("@/views/build/components/agentBI/hooks/useAgentBIStream", () => ({
  useAgentBIStream: () => ({
    consumeSSEResponse: mockConsumeSSEResponse
  })
}));

vi.mock("@/views/build/components/agentBI/hooks/useGenerateTitle", () => ({
  useGenerateTitle: () => ({
    callGenerateTitle: mockCallGenerateTitle
  })
}));

vi.mock("@/views/build/components/agentBI/hooks/useChunkSideEffects", () => ({
  useChunkSideEffects: () => ({
    createSideEffectTransform: vi.fn(() => new TransformStream())
  })
}));

vi.mock("@/views/build/components/agentBI/hooks/useBackgroundTask", () => ({
  useBackgroundTask: () => ({
    splitBackgroundTaskChunkFromMainStream: vi.fn(() => () => new TransformStream()),
    backgroundTasks: { value: [] },
    runningTaskCount: { value: 0 }
  })
}));

vi.mock("@/views/build/components/agentBI/hooks/useContextWindow", () => ({
  useContextWindow: () => ({
    compacting: { value: false },
    contextColor: { value: "#7c4dff" },
    contextPercentage: { value: 0 },
    contextTooltip: { value: "" },
    lastUsage: { value: null },
    requestCompact: vi.fn()
  })
}));

vi.mock("@/views/build/components/agentBI/hooks/useAgentBIThreadList", () => ({
  useAgentBIThreadList: () => ({
    memoryThreads: { value: [] },
    isLoadingMemory: { value: false },
    queryMemory: vi.fn(),
    updateThreadTitle: vi.fn(),
    reset: vi.fn()
  })
}));

vi.mock("@/views/build/components/agentBI/hooks/useAgentAttachment", () => ({
  useAgentAttachment: () => ({
    addFiles: vi.fn(),
    attachments: { value: [] },
    clearAttachments: vi.fn(),
    removeAttachment: vi.fn(),
    uploadAllAndGetParts: vi.fn().mockResolvedValue([])
  })
}));

vi.mock("@screenwright/server/rpc", () => ({
  apiClient: {
    customApi: {
      "bi-chat": {
        $post: mockBiChatPost
      }
    }
  }
}));

vi.mock("@/views/build/components/agentBI/hooks/useAgentBIMemory", () => ({
  useAgentBIMemory: () => ({
    activeThreadId: { value: "thread-1" },
    isLoadingThreadMessages: { value: false },
    ensureActiveThread: mockEnsureActiveThread,
    loadThreadMessages: vi.fn(),
    startNewChat: mockStartNewChat,
    applyLocalMode: vi.fn(),
    currentMode: { value: "AUTO" },
    hasMoreMessages: { value: false },
    isLoadingMoreMessages: { value: false },
    loadOlderMessages: vi.fn(),
    updateThreadMode: vi.fn()
  })
}));

vi.mock("@/views/build/components/agentBI/tools", () => ({
  agentBITools: {
    routeChange: { execute: mockToolExecute }
  }
}));

vi.mock("@/views/build/components/agentBI/hooks/useAgentBISystemContext", () => ({
  useAgentBISystemContext: () => ({
    buildSystemContext: vi.fn(() => "")
  })
}));

vi.mock("@/views/build/useLargeScreenInfo", () => ({
  useLargeScreenInfo: () => ({
    navInfo: { value: { id: 23595, versionCode: "v1" } }
  })
}));

vi.mock("@/api/mastra", () => ({
  mastraClient: {}
}));

vi.mock("@/views/build/components/agentBI/hooks/useWorkflowStreamUpdater", () => ({
  useWorkflowStreamUpdater: vi.fn()
}));

vi.mock("element-plus", () => ({
  ElMessage: { error: vi.fn() }
}));

// --- 被测模块（所有 mock 必须在此行之前声明）---
import { createAgentBISession } from "@/views/build/components/agentBI/useAgentBI";

const agent = createAgentBISession();

const resetState = () => {
  agent.messages.value = [];
  agent.isStreaming.value = false;
  agent.inputText.value = "";
};

// ---------------------------------------------------------------------------
// createAgentBISession 工厂语义（不再是全局单例）
// ---------------------------------------------------------------------------

describe("createAgentBISession", () => {
  it("每个会话都有非空 sessionId，且多次调用产生不同 sessionId", () => {
    const a = createAgentBISession();
    const b = createAgentBISession();

    expect(a.sessionId).toBeTruthy();
    expect(b.sessionId).toBeTruthy();
    expect(a.sessionId).not.toBe(b.sessionId);
  });

  it("不同会话的 messages 互相隔离（非共享同一引用）", () => {
    const a = createAgentBISession();
    const b = createAgentBISession();

    a.messages.value = [{ id: "x", role: "user", parts: [] } as any];

    expect(b.messages.value).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// sendMessage 基础流程
// ---------------------------------------------------------------------------

describe("sendMessage 基础流程", () => {
  beforeEach(() => {
    resetState();
    mockBiChatPost.mockReset().mockResolvedValue({});
    mockConsumeSSEResponse.mockReset();
    mockCallGenerateTitle.mockReset().mockResolvedValue(undefined);
    mockEnsureActiveThread.mockReset().mockResolvedValue(undefined);
    mockToolExecute.mockReset().mockResolvedValue({ success: true });
  });

  it("sendMessage，单次文本响应，consumeSSEResponse 被调用且 isStreaming 重置", async () => {
    mockConsumeSSEResponse.mockResolvedValue({
      finalMessage: { id: "msg-1", role: "assistant", parts: [{ type: "text", text: "Hello" }] },
      currentMessageId: "msg-1"
    });

    await agent.sendMessage("你好");

    // 用户消息被添加
    expect(agent.messages.value).toHaveLength(1);
    expect(agent.messages.value[0].role).toBe("user");
    // consumeSSEResponse 被调用，第二个参数 initialMessages 包含用户消息
    expect(mockConsumeSSEResponse).toHaveBeenCalledTimes(1);
    const pmsCall = mockConsumeSSEResponse.mock.calls[0];
    expect(pmsCall[1]).toHaveLength(1); // initialMessages = [userMsg]
    // callGenerateTitle 在流结束后被调用
    expect(mockCallGenerateTitle).toHaveBeenCalledTimes(1);
    expect(agent.isStreaming.value).toBe(false);
  });

  it("sendMessage，isStreaming 为 true 时调用，直接返回不发送", async () => {
    agent.isStreaming.value = true;

    await agent.sendMessage("你好");

    expect(mockBiChatPost).not.toHaveBeenCalled();
  });

  it("sendMessage，ensureActiveThread 失败，不发送消息且不调用 chat", async () => {
    mockEnsureActiveThread.mockRejectedValue(new Error("thread error"));

    await agent.sendMessage("你好");

    expect(mockBiChatPost).not.toHaveBeenCalled();
    expect(agent.messages.value).toHaveLength(0);
  });

  it("sendMessage，chat 抛出异常，isStreaming 重置且 messages 仅包含用户消息", async () => {
    mockBiChatPost.mockRejectedValue(new Error("network error"));

    await agent.sendMessage("你好");

    expect(agent.messages.value).toHaveLength(1);
    expect(agent.messages.value[0].role).toBe("user");
    expect(agent.isStreaming.value).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sendMessage 客户端工具循环
// ---------------------------------------------------------------------------

describe("sendMessage 客户端工具循环", () => {
  beforeEach(() => {
    resetState();
    mockBiChatPost.mockReset().mockResolvedValue({});
    mockConsumeSSEResponse.mockReset();
    mockCallGenerateTitle.mockReset().mockResolvedValue(undefined);
    mockEnsureActiveThread.mockReset().mockResolvedValue(undefined);
    mockToolExecute.mockReset().mockResolvedValue({ success: true });
  });

  it("sendMessage，AI 请求客户端工具 routeChange，tool.execute 执行后 chat 被调用两次", async () => {
    mockConsumeSSEResponse
      .mockResolvedValueOnce({
        finalMessage: {
          id: "msg-1",
          role: "assistant",
          parts: [
            { type: "tool-routeChange", toolCallId: "tc-1", state: "input-available", input: { targetType: "root" } }
          ]
        },
        currentMessageId: "msg-1"
      })
      .mockResolvedValueOnce({
        finalMessage: {
          id: "msg-1",
          role: "assistant",
          parts: [{ type: "text", text: "已跳转" }]
        },
        currentMessageId: "msg-1"
      });

    await agent.sendMessage("跳转到首页");

    expect(mockBiChatPost).toHaveBeenCalledTimes(2);
    expect(mockToolExecute).toHaveBeenCalledTimes(1);
    expect(mockToolExecute).toHaveBeenCalledWith({ targetType: "root" });
    expect(mockConsumeSSEResponse).toHaveBeenCalledTimes(2);
  });

  it("sendMessage，工具执行失败，错误结果仍合并到消息且循环继续", async () => {
    mockToolExecute.mockResolvedValue({ error: "permission denied" });
    mockConsumeSSEResponse
      .mockResolvedValueOnce({
        finalMessage: {
          id: "msg-1",
          role: "assistant",
          parts: [
            { type: "tool-routeChange", toolCallId: "tc-1", state: "input-available", input: { targetType: "root" } }
          ]
        },
        currentMessageId: "msg-1"
      })
      .mockResolvedValueOnce({
        finalMessage: { id: "msg-1", role: "assistant", parts: [{ type: "text", text: "完成" }] },
        currentMessageId: "msg-1"
      });

    await agent.sendMessage("跳转");

    expect(mockBiChatPost).toHaveBeenCalledTimes(2);
  });
});
