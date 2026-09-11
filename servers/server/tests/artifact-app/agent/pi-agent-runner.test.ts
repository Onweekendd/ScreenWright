import type { AgentSessionEvent } from "@earendil-works/pi-coding-agent";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTaskPrompt, PiAgentRunner, type PiAgentRunnerSession } from "@/artifact-app/agent/pi-agent-runner";
import type { AppCodeTask } from "@/artifact-app/contracts";
import { AppCodeTaskError } from "@/artifact-app/contracts";
import type { AppSandbox } from "@/artifact-app/sandbox/app-sandbox";

// 录制上下文会去列举已落地的 turn（fs 或 MinIO），单测里换成直通实现。
// 「未开启录制时不做任何列举」由 withRecordingTurn 自己保证，见 tests/recording。
const recordingScopeMocks = vi.hoisted(() => ({
  withRecordingTurn: vi.fn(<T>(_ctx: unknown, fn: () => Promise<T>) => fn())
}));

vi.mock("@/recording/recording-scope", () => recordingScopeMocks);

beforeEach(() => {
  recordingScopeMocks.withRecordingTurn.mockClear();
});

describe("PiAgentRunner", () => {
  it("createTaskPrompt：给定编码任务时，应包含任务说明和验收标准", () => {
    // Arrange
    const task = createTask();

    // Act
    const prompt = createTaskPrompt(task);

    // Assert
    expect(prompt).toContain("任务：实现登录页\n\n创建登录表单。\n\n验收标准：\n1. 可以提交登录信息\n2. 类型检查通过");
  });

  it("run：Agent 正常完成任务时，应返回最终摘要和执行标识", async () => {
    // Arrange
    const session = createSessionStub({
      events: [createAssistantMessageEvent("登录页已经完成。")]
    });
    const runner = new PiAgentRunner();

    // Act
    const result = await runner.run(createRunInput(session));

    // Assert
    expect(result).toMatchObject({
      taskListId: "task-list-001",
      taskId: "task-001",
      appId: "app-001",
      sessionId: "session-001",
      status: "completed",
      summary: "登录页已经完成。"
    });
  });

  it("run：Agent 成功修改文件并执行命令时，应收集修改文件和检查结果", async () => {
    // Arrange
    const session = createSessionStub({
      events: [
        createToolStartEvent("edit-1", "edit", { path: "src/Login.vue" }),
        createToolEndEvent("edit-1", "edit", false),
        createToolStartEvent("bash-1", "bash", { command: "pnpm test" }),
        createToolEndEvent("bash-1", "bash", false, "10 tests passed")
      ]
    });
    const runner = new PiAgentRunner();

    // Act
    const result = await runner.run(createRunInput(session));

    // Assert
    expect(result).toMatchObject({
      changedFiles: ["src/Login.vue"],
      checks: [
        {
          name: "pnpm test",
          status: "passed",
          output: "10 tests passed"
        }
      ]
    });
  });

  it("run：Agent 执行抛出异常时，应返回失败结果并取消事件订阅", async () => {
    // Arrange
    const session = createSessionStub({ error: new Error("model unavailable") });
    const runner = new PiAgentRunner();

    // Act
    const result = await runner.run(createRunInput(session));

    // Assert
    expect({ result, unsubscribed: session.unsubscribed }).toMatchObject({
      result: {
        status: "failed",
        error: {
          code: AppCodeTaskError.AGENT_EXECUTION_FAILED,
          message: "model unavailable"
        }
      },
      unsubscribed: true
    });
  });

  it("run：应把整次执行包进一个以 app + 任务列表命名的录制 turn", async () => {
    // Arrange
    const session = createSessionStub({ events: [createAssistantMessageEvent("完成。")] });
    const runner = new PiAgentRunner();

    // Act
    const result = await runner.run(createRunInput(session));

    // Assert
    expect(recordingScopeMocks.withRecordingTurn).toHaveBeenCalledTimes(1);
    expect(recordingScopeMocks.withRecordingTurn.mock.calls[0][0]).toEqual({
      threadId: "pi-app-001-task-list-001"
    });
    expect(result.status).toBe("completed");
  });
});

interface SessionStub extends PiAgentRunnerSession {
  readonly prompts: string[];
  readonly unsubscribed: boolean;
}

interface CreateSessionStubOptions {
  readonly events?: readonly AgentSessionEvent[];
  readonly error?: Error;
}

function createSessionStub(options: CreateSessionStubOptions = {}): SessionStub {
  let listener: ((event: AgentSessionEvent) => void) | undefined;
  let unsubscribed = false;
  const prompts: string[] = [];

  return {
    sessionId: "session-001",
    prompts,
    get unsubscribed() {
      return unsubscribed;
    },
    subscribe(nextListener) {
      listener = nextListener;
      return () => {
        unsubscribed = true;
      };
    },
    async prompt(prompt) {
      prompts.push(prompt);

      for (const event of options.events ?? []) {
        listener?.(event);
      }

      if (options.error) {
        throw options.error;
      }
    }
  };
}

function createRunInput(session: PiAgentRunnerSession) {
  return {
    taskListId: "task-list-001",
    task: createTask(),
    sandbox: createSandboxStub(),
    session
  };
}

function createTask(): AppCodeTask {
  return {
    id: "task-001",
    subject: "实现登录页",
    description: "创建登录表单。",
    status: "in_progress",
    blocks: [],
    blockedBy: [],
    metadata: {
      task_kind: "artifact-app-code",
      appId: "app-001",
      screenId: "screen-001",
      acceptanceCriteria: ["可以提交登录信息", "类型检查通过"]
    }
  };
}

function createSandboxStub(): AppSandbox {
  return {
    appId: "app-001",
    workspacePath: "D:/artifact-apps/app-001",
    run: async () => ({
      exitCode: 0,
      stdout: "",
      stderr: "",
      termination: "exited"
    })
  };
}

function createAssistantMessageEvent(text: string): AgentSessionEvent {
  return {
    type: "message_end",
    message: {
      role: "assistant",
      content: [{ type: "text", text }],
      api: "openai-completions",
      provider: "deepseek",
      model: "deepseek-v4-flash",
      usage: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        totalTokens: 0,
        cost: {
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
          total: 0
        }
      },
      stopReason: "stop",
      timestamp: 0
    }
  };
}

function createToolStartEvent(toolCallId: string, toolName: string, args: Record<string, unknown>): AgentSessionEvent {
  return {
    type: "tool_execution_start",
    toolCallId,
    toolName,
    args
  };
}

function createToolEndEvent(
  toolCallId: string,
  toolName: string,
  isError: boolean,
  output?: string
): AgentSessionEvent {
  return {
    type: "tool_execution_end",
    toolCallId,
    toolName,
    result: {
      content: output ? [{ type: "text", text: output }] : []
    },
    isError
  };
}
