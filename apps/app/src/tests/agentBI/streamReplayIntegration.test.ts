/**
 * 流回放集成测试
 *
 * 使用真实录制的 session（822a0cd8-...），驱动 processMessageStream 完整走一遍：
 *   step 0：AI 调用多个工具后 suspend（ask_approval_create_component）
 *   step 1：用户批准 → resume → 工具完成 → 流结束
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ref, shallowRef } from "vue";

import type { UIMessage } from "ai";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const {
  mockAskApprovalCreateComponent,
  mockProcessComponentUpdates,
  mockAddProcessedComponent,
  mockGenerateTitle,
  mockResume
} = vi.hoisted(() => ({
  mockAskApprovalCreateComponent: vi.fn(),
  mockProcessComponentUpdates: vi.fn(),
  mockAddProcessedComponent: vi.fn(),
  mockGenerateTitle: vi.fn(),
  mockResume: vi.fn().mockResolvedValue({ json: async () => ({ piped: true }) })
}));

vi.mock("@/views/build/components/agentBI/hooks/useFigmaToBI", () => ({
  useFigmaToBI: () => ({ addProcessedComponent: mockAddProcessedComponent, finishConversion: vi.fn() })
}));

vi.mock("@/views/build/components/agentBI/hooks/useComponentStreamUpdater", () => ({
  useComponentStreamUpdater: () => ({
    processComponentUpdates: mockProcessComponentUpdates,
    suspendHandlers: new Map([["ask_approval_create_component", mockAskApprovalCreateComponent]])
  })
}));

vi.mock("@screenwright/server/rpc", () => ({
  apiClient: {
    customApi: {
      "bi-chat": {
        "generate-title": { $post: mockGenerateTitle },
        resume: { $post: mockResume }
      }
    }
  },
  SuspendTypeSchema: {
    safeParse: (value: string) => ({ success: true, data: value })
  }
}));

vi.mock("element-plus", () => ({
  ElMessage: { error: vi.fn(), success: vi.fn(), warning: vi.fn() }
}));

// ── 被测模块（必须在 vi.mock 之后 import） ────────────────────────────────────

import { useAgentBIStream } from "@/views/build/components/agentBI/hooks/useAgentBIStream";
import { useChunkSideEffects } from "@/views/build/components/agentBI/hooks/useChunkSideEffects";

import { loadSession, makeStepResponse } from "./streamReplay";

// ── 常量 ──────────────────────────────────────────────────────────────────────

const THREAD_ID = "822a0cd8-7ddd-4859-b0ce-2726320f1b6f";
/** step 0 suspend 的 toolCallId */
const SUSPEND_TOOL_CALL_ID = "functions.pushComponentTool:4";
/** 模拟前端为新组件分配的真实 ID */
const FAKE_COMPONENT_ID = 3102846;

// ── 工具函数 ──────────────────────────────────────────────────────────────────

function makeStreamContext() {
  const messages = shallowRef<UIMessage[]>([]);
  const lastUsage = ref(null);
  const activeThreadId = ref<string | undefined>(THREAD_ID);
  const applyLocalMode = vi.fn();
  const updateMessagesBy = (fn: () => UIMessage[]) => {
    messages.value = fn();
  };

  const { consumeSSEResponse } = useAgentBIStream();
  const { createSideEffectTransform } = useChunkSideEffects({
    applyLocalMode,
    lastUsage,
    activeThreadId,
    sessionId: "test-session"
  });

  const processMessageStream = (response: Response, initialMessages: UIMessage[], mergeIntoId?: string) =>
    consumeSSEResponse(response, initialMessages, [createSideEffectTransform], {
      messages,
      updateMessagesBy,
      mergeIntoId
    });

  return { stream: { processMessageStream }, messages, lastUsage };
}

// ── 测试 ──────────────────────────────────────────────────────────────────────

describe("流回放集成（822a0cd8 session）", () => {
  let session: ReturnType<typeof loadSession>;

  beforeEach(() => {
    session = loadSession(THREAD_ID);
    mockAskApprovalCreateComponent.mockReset();
    mockProcessComponentUpdates.mockReset();
    mockAddProcessedComponent.mockReset();
    mockResume.mockReset().mockResolvedValue({ json: async () => ({ piped: true }) });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("step 0：触发 suspend，state.suspendedTool 包含正确的 toolName 和 toolCallId", async () => {
    // 模拟用户批准并返回新组件 ID
    mockAskApprovalCreateComponent.mockResolvedValue({ componentId: FAKE_COMPONENT_ID });

    const { stream, messages } = makeStreamContext();
    const state = await stream.processMessageStream(makeStepResponse(session, 0), []);

    // 流已产生 assistant 消息
    expect(messages.value.length).toBeGreaterThan(0);

    // suspendedTool 被正确填充
    expect(state.suspendedTool).toBeDefined();
    expect(state.suspendedTool!.toolName).toBe("pushComponentTool");
    expect(state.suspendedTool!.toolCallId).toBe(SUSPEND_TOOL_CALL_ID);
  });

  it("step 0：suspend handler 被调用，suspendPayload.type 为 ask_approval_create_component", async () => {
    mockAskApprovalCreateComponent.mockResolvedValue({ componentId: FAKE_COMPONENT_ID });

    const { stream } = makeStreamContext();
    await stream.processMessageStream(makeStepResponse(session, 0), []);

    expect(mockAskApprovalCreateComponent).toHaveBeenCalledTimes(1);
    const [callArg] = mockAskApprovalCreateComponent.mock.calls[0];
    expect(callArg.suspendPayload.type).toBe("ask_approval_create_component");
    expect(callArg.suspendPayload.component).toBeDefined();
  });

  it("step 0：用户批准后，resumeData 携带 componentId 写入 suspendedTool", async () => {
    mockAskApprovalCreateComponent.mockResolvedValue({ componentId: FAKE_COMPONENT_ID });

    const { stream } = makeStreamContext();
    const state = await stream.processMessageStream(makeStepResponse(session, 0), []);

    expect(state.suspendedTool!.resumeData).toEqual({ componentId: FAKE_COMPONENT_ID });
  });

  it("step 0：resume 请求显式携带 suspendType", async () => {
    mockAskApprovalCreateComponent.mockResolvedValue({ componentId: FAKE_COMPONENT_ID });

    const { stream } = makeStreamContext();
    await stream.processMessageStream(makeStepResponse(session, 0), []);

    expect(mockResume).toHaveBeenCalledWith({
      json: {
        threadId: THREAD_ID,
        runId: expect.any(String),
        toolCallId: SUSPEND_TOOL_CALL_ID,
        suspendType: "ask_approval_create_component",
        resumeData: { componentId: FAKE_COMPONENT_ID }
      }
    });
  });

  it("step 0：用户拒绝（handler 返回 null），suspendedTool 不被设置", async () => {
    mockAskApprovalCreateComponent.mockResolvedValue(null);

    const { stream } = makeStreamContext();
    const state = await stream.processMessageStream(makeStepResponse(session, 0), []);

    expect(state.suspendedTool).toBeUndefined();
  });

  it("step 1：resume 流正常消费，finalMessage 不为 null 且流以 finish 结束", async () => {
    const { stream, messages } = makeStreamContext();

    // step 1 是 resume 流，需要有 existingMessage（mergeIntoId）
    // 先用 step 0 建立 assistant 消息
    mockAskApprovalCreateComponent.mockResolvedValue({ componentId: FAKE_COMPONENT_ID });
    const state0 = await stream.processMessageStream(makeStepResponse(session, 0), []);

    const state1 = await stream.processMessageStream(
      makeStepResponse(session, 1),
      messages.value,
      state0.currentMessageId
    );

    expect(state1.finalMessage).not.toBeNull();
    // resume 流合并到同一条 assistant 消息
    expect(messages.value.find((m) => m.id === state0.currentMessageId)).toBeDefined();
  });

  it("step 1：resume 后 messages 中包含 pushComponentTool 的 tool-output-available part", async () => {
    const { stream, messages } = makeStreamContext();

    mockAskApprovalCreateComponent.mockResolvedValue({ componentId: FAKE_COMPONENT_ID });
    const state0 = await stream.processMessageStream(makeStepResponse(session, 0), []);
    await stream.processMessageStream(makeStepResponse(session, 1), messages.value, state0.currentMessageId);

    const assistantMsg = messages.value.find((m) => m.id === state0.currentMessageId);
    const toolOutputPart = assistantMsg?.parts.find((part) => {
      const toolPart = part as { type?: string; toolCallId?: string; state?: string };
      return (
        toolPart.type === "tool-pushComponentTool" &&
        toolPart.toolCallId === SUSPEND_TOOL_CALL_ID &&
        toolPart.state === "output-available"
      );
    });

    expect(toolOutputPart).toBeDefined();
  });
});
