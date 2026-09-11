import path from "node:path";

import type {
  AgentSession,
  CreateAgentSessionOptions,
  ModelRuntime,
  ResourceLoader,
  SessionManager,
  ToolDefinition
} from "@earendil-works/pi-coding-agent";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencyMocks = vi.hoisted(() => ({
  createAgentSession: vi.fn(),
  continueRecent: vi.fn(),
  createPiResourceLoader: vi.fn(),
  createSandboxBashTool: vi.fn()
}));

vi.mock("@earendil-works/pi-coding-agent", () => ({
  createAgentSession: dependencyMocks.createAgentSession,
  SessionManager: {
    continueRecent: dependencyMocks.continueRecent
  }
}));

vi.mock("@/artifact-app/agent/resources/pi-resource-loader", () => ({
  createPiResourceLoader: dependencyMocks.createPiResourceLoader
}));

vi.mock("@/artifact-app/agent/tools/sandbox-bash-tool", () => ({
  createSandboxBashTool: dependencyMocks.createSandboxBashTool
}));

import {
  PiBuiltInTool,
  PiSessionFactory,
  resolvePiSessionDirectory
} from "@/artifact-app/agent/sessions/pi-session-factory";
import type { AppSandbox } from "@/artifact-app/sandbox/app-sandbox";

type PiModel = NonNullable<CreateAgentSessionOptions["model"]>;

const SESSIONS_ROOT = "D:/pi-sessions";
const EXPECTED_SESSION_DIRECTORY = path.join(
  path.resolve(SESSIONS_ROOT),
  "app-YXBwLTAwMQ",
  "task-list-dGFzay1saXN0LTAwMQ"
);

beforeEach(() => {
  dependencyMocks.createAgentSession.mockReset();
  dependencyMocks.continueRecent.mockReset();
  dependencyMocks.createPiResourceLoader.mockReset();
  dependencyMocks.createSandboxBashTool.mockReset();

  dependencyMocks.continueRecent.mockReturnValue({} as SessionManager);
  dependencyMocks.createPiResourceLoader.mockResolvedValue({} as ResourceLoader);
  dependencyMocks.createSandboxBashTool.mockReturnValue({ name: "bash" } as ToolDefinition);
});

describe("resolvePiSessionDirectory", () => {
  it("给定业务标识时，应返回位于持久化根目录下的安全编码路径", () => {
    // Arrange
    const input = {
      sessionsRoot: SESSIONS_ROOT,
      appId: "app-001",
      taskListId: "task-list-001"
    };

    // Act
    const result = resolvePiSessionDirectory(input);

    // Assert
    expect(result).toBe(EXPECTED_SESSION_DIRECTORY);
  });
});

describe("PiSessionFactory", () => {
  it("相同 appId 和 taskListId 顺序获取时，应返回同一个 Session", async () => {
    // Arrange
    const session = createAgentSessionStub("session-001");
    dependencyMocks.createAgentSession.mockResolvedValue({ session });
    const factory = createFactory();
    const input = createGetOrCreateInput();

    // Act
    const firstSession = await factory.getOrCreate(input);
    const secondSession = await factory.getOrCreate(input);

    // Assert
    expect({ firstSession, secondSession, createCount: dependencyMocks.createAgentSession.mock.calls.length }).toEqual({
      firstSession: session,
      secondSession: session,
      createCount: 1
    });
  });

  it("相同业务 key 并发获取时，应复用同一次 Session 创建", async () => {
    // Arrange
    const session = createAgentSessionStub("session-001");
    dependencyMocks.createAgentSession.mockResolvedValue({ session });
    const factory = createFactory();
    const input = createGetOrCreateInput();

    // Act
    const [firstSession, secondSession] = await Promise.all([factory.getOrCreate(input), factory.getOrCreate(input)]);

    // Assert
    expect({ firstSession, secondSession, createCount: dependencyMocks.createAgentSession.mock.calls.length }).toEqual({
      firstSession: session,
      secondSession: session,
      createCount: 1
    });
  });

  it("appId 不同时，应创建相互隔离的 Session", async () => {
    // Arrange
    const firstSession = createAgentSessionStub("session-001");
    const secondSession = createAgentSessionStub("session-002");
    dependencyMocks.createAgentSession
      .mockResolvedValueOnce({ session: firstSession })
      .mockResolvedValueOnce({ session: secondSession });
    const factory = createFactory();

    // Act
    const firstResult = await factory.getOrCreate(createGetOrCreateInput());
    const secondResult = await factory.getOrCreate(createGetOrCreateInput({ sandbox: createSandboxStub("app-002") }));

    // Assert
    expect([firstResult, secondResult]).toEqual([firstSession, secondSession]);
  });

  it("taskListId 不同时，应创建相互隔离的 Session", async () => {
    // Arrange
    const firstSession = createAgentSessionStub("session-001");
    const secondSession = createAgentSessionStub("session-002");
    dependencyMocks.createAgentSession
      .mockResolvedValueOnce({ session: firstSession })
      .mockResolvedValueOnce({ session: secondSession });
    const factory = createFactory();

    // Act
    const firstResult = await factory.getOrCreate(createGetOrCreateInput());
    const secondResult = await factory.getOrCreate(createGetOrCreateInput({ taskListId: "task-list-002" }));

    // Assert
    expect([firstResult, secondResult]).toEqual([firstSession, secondSession]);
  });

  it("创建 Session 失败后再次获取时，应清除失败缓存并重新创建", async () => {
    // Arrange
    const recoveredSession = createAgentSessionStub("session-002");
    dependencyMocks.createAgentSession
      .mockRejectedValueOnce(new Error("session create failed"))
      .mockResolvedValueOnce({ session: recoveredSession });
    const factory = createFactory();
    const input = createGetOrCreateInput();

    // Act
    const firstAttempt = factory.getOrCreate(input);

    // Assert
    await expect(firstAttempt).rejects.toThrow("session create failed");
    await expect(factory.getOrCreate(input)).resolves.toBe(recoveredSession);
    expect(dependencyMocks.createAgentSession).toHaveBeenCalledTimes(2);
  });

  it("创建 Session 时，应使用 Sandbox 工作目录和稳定的持久化目录", async () => {
    // Arrange
    const session = createAgentSessionStub("session-001");
    dependencyMocks.createAgentSession.mockResolvedValue({ session });
    const factory = createFactory();

    // Act
    await factory.getOrCreate(createGetOrCreateInput());

    // Assert
    expect(dependencyMocks.continueRecent).toHaveBeenCalledWith("D:/artifact-apps/app-001", EXPECTED_SESSION_DIRECTORY);
  });
});

function createFactory(): PiSessionFactory {
  return new PiSessionFactory({
    agentDir: "D:/pi-agent",
    sessionsRoot: SESSIONS_ROOT,
    modelRuntime: {} as ModelRuntime,
    model: {} as PiModel,
    builtInTools: [PiBuiltInTool.Read]
  });
}

interface GetOrCreateInputOverrides {
  readonly sandbox?: AppSandbox;
  readonly taskListId?: string;
}

function createGetOrCreateInput(overrides: GetOrCreateInputOverrides = {}) {
  return {
    sandbox: overrides.sandbox ?? createSandboxStub("app-001"),
    taskListId: overrides.taskListId ?? "task-list-001"
  };
}

function createSandboxStub(appId: string): AppSandbox {
  return {
    appId,
    workspacePath: `D:/artifact-apps/${appId}`,
    run: async () => ({
      exitCode: 0,
      stdout: "",
      stderr: "",
      termination: "exited"
    })
  };
}

function createAgentSessionStub(sessionId: string): AgentSession {
  return { sessionId } as AgentSession;
}
