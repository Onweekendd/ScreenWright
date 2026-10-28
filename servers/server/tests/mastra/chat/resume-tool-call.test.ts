import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * resume 必须带着 toolCallId 一路传到 swAgent.resumeStream。
 *
 * 不传时 Mastra 只能自己猜回执交给哪个挂起调用：实测一个 create_component 挂起等审批时，
 * 后台任务完成的续接把对话带过去了，它就一直挂在 suspendedTools 里；此后每次 create_component
 * 拿到的都是上一次调用的回执（传「左侧云石」报「不存在 天空底图」）。
 */
const mocks = vi.hoisted(() => ({
  resumeStream: vi.fn(),
  stream: vi.fn(),
  getThreadById: vi.fn(),
  getThreadModels: vi.fn()
}));

vi.mock("@/mastra/runtime", () => ({
  swAgent: { resumeStream: mocks.resumeStream, stream: mocks.stream }
}));
vi.mock("@/mastra/storage/storage", () => ({
  memory: { getThreadById: mocks.getThreadById }
}));
vi.mock("@/mastra/index", () => ({ mastra: {} }));
vi.mock("@/mastra/services/version/version-history", () => ({
  commitScreenSnapshot: vi.fn().mockResolvedValue(undefined)
}));
vi.mock("@/mastra/services/ai-model/thread-model.server", () => ({
  getThreadModels: mocks.getThreadModels
}));

import { createBIChatTurnStream } from "@/mastra/services/chat/bi-chat-turn-stream";
import { handleBiChatResume } from "@/mastra/services/chat/handle-bi-chat";
import { sessionRegistry } from "@/mastra/services/chat/session-registry";

const emptyStream = () => ({
  fullStream: new ReadableStream({
    start(controller) {
      controller.close();
    }
  })
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getThreadById.mockResolvedValue({ id: "thread-1", metadata: {} });
  // 默认没选过模型：各角色走默认
  mocks.getThreadModels.mockResolvedValue({});
  mocks.resumeStream.mockResolvedValue(emptyStream());
  mocks.stream.mockResolvedValue(emptyStream());
});

describe("resume 带 toolCallId", () => {
  it("createBIChatTurnStream 把 toolCallId 交给 resumeStream", async () => {
    await createBIChatTurnStream(
      {
        messages: [],
        clientTools: {},
        threadId: "thread-1",
        resourceId: "resource-1",
        runId: "run-1",
        toolCallId: "call-2",
        resumeData: { approved: true }
      },
      { abortController: new AbortController() }
    ).catch(() => undefined);

    expect(mocks.resumeStream).toHaveBeenCalledWith(
      { approved: true },
      expect.objectContaining({ runId: "run-1", toolCallId: "call-2" })
    );
  });

  it("对话的模型选择按 threadId 查出，放进 requestContext 的 models", async () => {
    mocks.getThreadModels.mockResolvedValue({ reasoning: "reasoning-2" });

    await createBIChatTurnStream(
      { messages: [], clientTools: {}, threadId: "thread-1", resourceId: "resource-1" },
      { abortController: new AbortController() }
    ).catch(() => undefined);

    expect(mocks.getThreadModels).toHaveBeenCalledWith("thread-1");
    const { requestContext } = mocks.stream.mock.calls[0][1];
    expect(requestContext.get("models")).toEqual({ reasoning: "reasoning-2" });
  });

  it("resume 控制端点把前端带来的 toolCallId 传进这一轮", async () => {
    const session = sessionRegistry.getOrCreate("thread-resume", "resource-1");
    const runTurn = vi.spyOn(session, "runTurn").mockResolvedValue(undefined);

    const { piped } = handleBiChatResume({
      threadId: "thread-resume",
      runId: "run-1",
      toolCallId: "call-2",
      suspendType: "canvas_ops" as never,
      resumeData: { approved: true }
    });

    expect(piped).toBe(true);
    expect(runTurn).toHaveBeenCalledWith(expect.objectContaining({ runId: "run-1", toolCallId: "call-2" }));
  });
});
