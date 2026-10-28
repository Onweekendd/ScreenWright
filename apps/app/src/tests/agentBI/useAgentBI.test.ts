import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UIMessage } from "ai";

// --- Mock 函数声明（vi.hoisted 与 vi.mock 一起提升到顶部）---
const {
  mockConsumeSSEResponse,
  mockCallGenerateTitle,
  mockBiChatPost,
  mockEnsureActiveThread,
  mockStartNewChat,
  mockUploadAllAndGetParts,
  mockToolExecute,
  mockRequestCompact,
  sideEffectOptions
} = vi.hoisted(() => ({
  mockConsumeSSEResponse: vi.fn(),
  mockCallGenerateTitle: vi.fn().mockResolvedValue(undefined),
  mockBiChatPost: vi.fn().mockResolvedValue({}),
  mockEnsureActiveThread: vi.fn().mockResolvedValue(undefined),
  mockStartNewChat: vi.fn(),
  mockUploadAllAndGetParts: vi.fn().mockResolvedValue([]),
  mockToolExecute: vi.fn().mockResolvedValue({ success: true }),
  mockRequestCompact: vi.fn(),
  /** 最近一次建会话时传给 useChunkSideEffects 的参数：拿 onCompaction 模拟后端推来的 data-compaction */
  sideEffectOptions: { last: undefined as { onCompaction?: (data: unknown) => void } | undefined }
}));

// --- Mocks (hoisted) ---

vi.mock("@/views/build/components/agentBI/hooks/stream/useAgentBIStream", () => ({
  useAgentBIStream: () => ({
    consumeSSEResponse: mockConsumeSSEResponse
  })
}));

vi.mock("@/views/build/components/agentBI/hooks/session/useGenerateTitle", () => ({
  useGenerateTitle: () => ({
    callGenerateTitle: mockCallGenerateTitle
  })
}));

vi.mock("@/views/build/components/agentBI/hooks/stream/useChunkSideEffects", () => ({
  useChunkSideEffects: (options: { onCompaction?: (data: unknown) => void }) => {
    sideEffectOptions.last = options;
    return { createSideEffectTransform: vi.fn(() => new TransformStream()) };
  }
}));

vi.mock("@/views/build/components/agentBI/hooks/stream/useBackgroundTask", () => ({
  useBackgroundTask: () => ({
    splitBackgroundTaskChunkFromMainStream: vi.fn(() => () => new TransformStream()),
    backgroundTasks: { value: [] },
    runningTaskCount: { value: 0 }
  })
}));

vi.mock("@/views/build/components/agentBI/hooks/session/useContextWindow", () => ({
  useContextWindow: () => ({
    compacting: { value: false },
    contextColor: { value: "#7c4dff" },
    contextPercentage: { value: 0 },
    contextTooltip: { value: "" },
    lastUsage: { value: null },
    requestCompact: mockRequestCompact
  })
}));

vi.mock("@/views/build/components/agentBI/hooks/session/useAgentBIThreadList", () => ({
  useAgentBIThreadList: () => ({
    memoryThreads: { value: [] },
    isLoadingMemory: { value: false },
    queryMemory: vi.fn(),
    updateThreadTitle: vi.fn(),
    reset: vi.fn()
  })
}));

vi.mock("@/views/build/components/agentBI/hooks/attachment/useAgentAttachment", () => ({
  useAgentAttachment: () => ({
    addFiles: vi.fn(),
    addMedia: vi.fn(),
    attachments: { value: [] },
    clearAttachments: vi.fn(),
    removeAttachment: vi.fn(),
    uploadAllAndGetParts: mockUploadAllAndGetParts
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

vi.mock("@/views/build/components/agentBI/hooks/session/useAgentBIMemory", () => ({
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

vi.mock("@/views/build/components/agentBI/hooks/session/useAgentBISystemContext", () => ({
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

vi.mock("element-plus", () => ({
  ElMessage: { error: vi.fn(), warning: vi.fn() }
}));

// --- 被测模块（所有 mock 必须在此行之前声明）---
import { createAgentBISession } from "@/views/build/components/agentBI/useAgentBI";

const agent = createAgentBISession();

const resetState = () => {
  agent.messages.value = [];
  agent.isStreaming.value = false;
  agent.inputText.value = "";
  agent.attachments.value = [];
  mockUploadAllAndGetParts.mockReset().mockResolvedValue([]);
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

  it("没有文字时也能上传并发送图片附件", async () => {
    agent.attachments.value = [
      {
        id: "image-1",
        file: new File(["image"], "paste.png", { type: "image/png" }),
        filename: "paste.png",
        mediaType: "image/png",
        previewUrl: "blob:preview",
        status: "pending"
      }
    ];
    const filePart = {
      type: "file",
      mediaType: "image/png",
      url: "https://example.com/paste.png",
      filename: "paste.png"
    };
    mockUploadAllAndGetParts.mockResolvedValue([filePart]);
    mockConsumeSSEResponse.mockResolvedValue({ finalMessage: null, currentMessageId: "msg-image" });

    await agent.sendMessage();

    expect(mockUploadAllAndGetParts).toHaveBeenCalledWith("thread-1");
    expect(mockBiChatPost).toHaveBeenCalledTimes(1);
    expect(agent.messages.value[0].parts).toContainEqual(filePart);
  });

  it("纯图片上传全部失败时不发送空消息", async () => {
    agent.attachments.value = [
      {
        id: "image-1",
        file: new File(["image"], "paste.png", { type: "image/png" }),
        filename: "paste.png",
        mediaType: "image/png",
        previewUrl: "blob:preview",
        status: "pending"
      }
    ];

    await agent.sendMessage();

    expect(mockUploadAllAndGetParts).toHaveBeenCalledTimes(1);
    expect(mockBiChatPost).not.toHaveBeenCalled();
    expect(agent.messages.value).toHaveLength(0);
  });

  it("没有文字时可以发送视频 URL，消息中不包含视频文件 part", async () => {
    agent.attachments.value = [
      {
        id: "video-1",
        filename: "clip.mp4",
        mediaType: "video/mp4",
        previewUrl: "",
        remoteUrl: "https://example.com/clip.mp4",
        status: "pending"
      }
    ];
    const part = {
      type: "text",
      text: '<attached-videos>\n  <video filename="clip.mp4" media-type="video/mp4" url="https://example.com/clip.mp4" />\n</attached-videos>'
    };
    mockUploadAllAndGetParts.mockResolvedValue([part]);
    mockConsumeSSEResponse.mockResolvedValue({ finalMessage: null, currentMessageId: "msg-video" });
    await agent.sendMessage();
    expect(mockBiChatPost).toHaveBeenCalledTimes(1);
    expect(agent.messages.value[0].parts).toContainEqual(part);
    expect(agent.messages.value[0].parts.some((item) => item.type === "file")).toBe(false);
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

  it("sendMessage，chat 抛出异常，isStreaming 重置并显示错误原因", async () => {
    mockBiChatPost.mockRejectedValue(new Error("network error"));

    await agent.sendMessage("你好");

    expect(agent.messages.value).toHaveLength(2);
    expect(agent.messages.value[0].role).toBe("user");
    expect(agent.messages.value[1]).toMatchObject({
      role: "assistant",
      parts: [{ type: "text", text: "请求失败：network error" }]
    });
    expect(agent.isStreaming.value).toBe(false);
  });

  it("sendMessage，流中途失败，在已有回复后显示错误且不新增另一条回复", async () => {
    mockConsumeSSEResponse.mockImplementation(async (_response, _initial, _transforms, options) => {
      const message = { id: "partial-answer", role: "assistant", parts: [{ type: "text", text: "部分回复" }] };
      options.messages.value = [...options.messages.value, message];
      options.state.currentMessageId = message.id;
      throw new Error("模型连接中断");
    });

    await agent.sendMessage("你好");

    expect(agent.messages.value).toHaveLength(2);
    expect(agent.messages.value[1].parts).toEqual([
      { type: "text", text: "部分回复" },
      { type: "text", text: "请求失败：模型连接中断" }
    ]);
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

// ---------------------------------------------------------------------------
// 上下文压缩：冻结对话 + 完成后把摘要放进对话
// ---------------------------------------------------------------------------

describe("上下文压缩", () => {
  const summary = {
    id: "summary-1",
    role: "assistant",
    metadata: { kind: "compaction_summary" },
    parts: [{ type: "text", text: "<!-- compaction-summary-v1 -->\n摘要" }]
  } satisfies UIMessage;
  const history = () =>
    [
      { id: "u1", role: "user", parts: [] },
      { id: "a1", role: "assistant", parts: [] },
      { id: "u-current", role: "user", parts: [] }
    ] satisfies UIMessage[];

  /** 新建一个会话，并拿到它注册给 useChunkSideEffects 的压缩回调 */
  const newSession = () => {
    const session = createAgentBISession();
    const onCompaction = sideEffectOptions.last!.onCompaction!;
    return { session, onCompaction };
  };

  beforeEach(() => {
    mockConsumeSSEResponse.mockReset();
    mockBiChatPost.mockReset().mockResolvedValue({});
    mockEnsureActiveThread.mockReset().mockResolvedValue(undefined);
    mockCallGenerateTitle.mockReset().mockResolvedValue(undefined);
    mockRequestCompact.mockReset();
  });

  it("自动压缩开始时冻结；完成后解冻，摘要插到当前这轮之前", () => {
    const { session, onCompaction } = newSession();
    session.messages.value = history();

    onCompaction({ status: "started" });
    expect(session.compacting.value).toBe(true);

    onCompaction({ status: "completed", summary, keptFromMessageId: "u-current" });
    expect(session.compacting.value).toBe(false);
    expect(session.messages.value.map((m) => m.id)).toEqual(["u1", "a1", "summary-1", "u-current"]);
  });

  it("自动压缩失败：解冻并提示，本轮照常继续", async () => {
    const { ElMessage } = await import("element-plus");
    const { session, onCompaction } = newSession();
    session.messages.value = history();

    onCompaction({ status: "started" });
    onCompaction({ status: "failed" });

    expect(session.compacting.value).toBe(false);
    expect(session.messages.value).toHaveLength(3);
    expect(ElMessage.warning).toHaveBeenCalled();
  });

  it("压缩中不能发起新一轮", async () => {
    const { session } = newSession();
    session.compacting.value = true;

    await session.sendMessage("继续");

    expect(mockConsumeSSEResponse).not.toHaveBeenCalled();
    expect(session.messages.value).toHaveLength(0);
  });

  it("压缩中途断流收不到完成帧：流结束时解冻", async () => {
    const { session, onCompaction } = newSession();
    mockConsumeSSEResponse.mockImplementation(async () => {
      onCompaction({ status: "started" });
      throw new DOMException("aborted", "AbortError");
    });

    await session.sendMessage("你好");

    expect(session.compacting.value).toBe(false);
  });

  it("手动压缩：摘要追加在对话最后", async () => {
    const { session } = newSession();
    session.messages.value = history();
    mockRequestCompact.mockResolvedValue({ messageCountBefore: 3, messageCountAfter: 1, summary });

    const result = await session.requestCompact({ threadId: "thread-1", resourceId: "23595" });

    expect(result.messageCountAfter).toBe(1);
    expect(session.messages.value.map((m) => m.id)).toEqual(["u1", "a1", "u-current", "summary-1"]);
  });
});
