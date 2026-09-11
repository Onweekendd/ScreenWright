import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { ArtifactAppPiAgentRunner, PiAgentRunnerSession } from "@/artifact-app/agent/pi-agent-runner";
import type { ArtifactAppPiSessionFactory } from "@/artifact-app/agent/sessions/pi-session-factory";
import { buildTaskBranchName } from "@/artifact-app/application/app-task-branch";
import { InMemoryAppWriteLock } from "@/artifact-app/application/app-write-lock";
import { ArtifactAppService } from "@/artifact-app/application/artifact-app-service";
import type { AppCodeExecutionResult } from "@/artifact-app/contracts";
import { AppCodeTaskError } from "@/artifact-app/contracts";
import type { AppSandbox, SandboxCommandResult } from "@/artifact-app/sandbox/app-sandbox";
import type { SandboxManager } from "@/artifact-app/sandbox/sandbox-manager";
import { type Task, TaskManager } from "@/task-management";

const temporaryDirectories: string[] = [];

interface GitSandboxStub extends AppSandbox {
  readonly commands: string[];
  markDirty(): void;
}

interface CreateServiceFixtureOptions {
  readonly taskStatus?: Task["status"];
  readonly owner?: string;
  readonly attemptCount?: number;
  readonly runnerResult?: "completed" | "failed";
}

async function createServiceFixture(options: CreateServiceFixtureOptions = {}) {
  const taskStorageRoot = await mkdtemp(path.join(tmpdir(), "screenwright-artifact-service-"));
  temporaryDirectories.push(taskStorageRoot);
  const taskListId = "task-list-001";
  const taskManager = new TaskManager({ taskListId, storageRoot: taskStorageRoot });
  const taskId = await taskManager.createTask(
    createTaskData({
      status: options.taskStatus ?? "pending",
      owner: options.owner,
      attemptCount: options.attemptCount
    })
  );
  const taskIdentifier = { taskListId, taskId };
  const sandbox = createGitSandboxStub(buildTaskBranchName(taskIdentifier));
  const acquire = vi.fn<SandboxManager["acquire"]>().mockResolvedValue(sandbox);
  const release = vi.fn<SandboxManager["release"]>().mockResolvedValue();
  const sandboxManager: SandboxManager = { acquire, release };
  const session = createSessionStub();
  const getOrCreate = vi.fn<ArtifactAppPiSessionFactory["getOrCreate"]>().mockResolvedValue(session);
  const piSessionFactory: ArtifactAppPiSessionFactory = { getOrCreate };
  const run = vi.fn<ArtifactAppPiAgentRunner["run"]>().mockImplementation(async () => {
    sandbox.markDirty();
    return createRunnerResult({ taskListId, taskId, status: options.runnerResult ?? "completed" });
  });
  const piAgentRunner: ArtifactAppPiAgentRunner = { run };
  const service = new ArtifactAppService({
    taskStorageRoot,
    sandboxManager,
    piSessionFactory,
    piAgentRunner,
    appWriteLock: new InMemoryAppWriteLock()
  });

  return {
    service,
    taskManager,
    taskIdentifier,
    sandbox,
    acquire,
    release,
    getOrCreate,
    run
  };
}

function createTaskData(overrides: Partial<Omit<Task, "id">> = {}): Omit<Task, "id"> {
  return {
    subject: "实现登录页",
    description: "创建登录表单",
    status: "pending",
    blocks: [],
    blockedBy: [],
    metadata: {
      task_kind: "artifact-app-code",
      appId: "app-001",
      screenId: "screen-001",
      acceptanceCriteria: ["类型检查通过"]
    },
    ...overrides
  };
}

function createSessionStub(): PiAgentRunnerSession {
  return {
    sessionId: "session-001",
    prompt: async () => {},
    subscribe: () => () => {}
  };
}

interface CreateRunnerResultInput {
  taskListId: string;
  taskId: string;
  status: "completed" | "failed";
}

function createRunnerResult(input: CreateRunnerResultInput): AppCodeExecutionResult {
  const { taskListId, taskId, status } = input;

  if (status === "failed") {
    return {
      taskListId,
      taskId,
      appId: "app-001",
      sessionId: "session-001",
      status,
      summary: "模型执行失败",
      changedFiles: ["src/App.ts"],
      checks: [],
      error: { code: AppCodeTaskError.AGENT_EXECUTION_FAILED, message: "model unavailable" }
    };
  }

  return {
    taskListId,
    taskId,
    appId: "app-001",
    sessionId: "session-001",
    status,
    summary: "登录页已经完成",
    changedFiles: ["src/App.ts"],
    checks: [{ name: "pnpm typecheck", status: "passed" }]
  };
}

function createGitSandboxStub(initialBranch: string): GitSandboxStub {
  let currentBranch = initialBranch;
  let dirty = false;
  const branches = new Set([initialBranch]);
  const commands: string[] = [];

  return {
    appId: "app-001",
    workspacePath: "D:/artifact-apps/app-001",
    commands,
    markDirty() {
      dirty = true;
    },
    async run({ script }) {
      commands.push(script);

      if (script === "git branch --show-current") {
        return createCommandResult({ stdout: `${currentBranch}\n` });
      }

      if (script.startsWith("git show-ref --verify --quiet refs/heads/")) {
        const branchName = script.replace("git show-ref --verify --quiet refs/heads/", "");
        return createCommandResult({ exitCode: branches.has(branchName) ? 0 : 1 });
      }

      if (script === "git status --porcelain --untracked-files=normal") {
        return createCommandResult({ stdout: dirty ? " M src/App.ts\n" : "" });
      }

      if (script.startsWith("git switch -c ")) {
        currentBranch = script.replace("git switch -c ", "");
        branches.add(currentBranch);
        return createCommandResult();
      }

      if (script.startsWith("git switch ")) {
        currentBranch = script.replace("git switch ", "");
        return createCommandResult();
      }

      if (script.includes(" commit -m ")) {
        dirty = false;
      }

      return createCommandResult();
    }
  };
}

function createCommandResult(overrides: Partial<SandboxCommandResult> = {}): SandboxCommandResult {
  return {
    exitCode: 0,
    stdout: "",
    stderr: "",
    termination: "exited",
    ...overrides
  };
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("ArtifactAppService", () => {
  it("executeCodeTask：待处理任务执行成功时，应完成任务、提交分支并释放 Sandbox", async () => {
    // Arrange
    const fixture = await createServiceFixture();

    // Act
    const result = await fixture.service.executeCodeTask(fixture.taskIdentifier);
    const task = await fixture.taskManager.getTask(fixture.taskIdentifier.taskId);

    // Assert
    expect({ result, task, released: fixture.release.mock.calls.length }).toMatchObject({
      result: { status: "completed", summary: "登录页已经完成" },
      task: { status: "completed", owner: "artifact-app-pi", attemptCount: 1 },
      released: 1
    });
    expect(fixture.sandbox.commands).toContain(
      'git -c user.name="screenwright Pi Agent" -c user.email="pi-agent@screenwright.local" commit -m "artifact-app completed pi/task-list-001/task-1"'
    );
  });

  it("executeCodeTask：Pi 执行失败时，应保留修改并将任务标记为可重试的 failed", async () => {
    // Arrange
    const fixture = await createServiceFixture({ runnerResult: "failed" });

    // Act
    const result = await fixture.service.executeCodeTask(fixture.taskIdentifier);
    const task = await fixture.taskManager.getTask(fixture.taskIdentifier.taskId);

    // Assert
    expect({ result, task }).toMatchObject({
      result: { status: "failed" },
      task: { status: "failed", attemptCount: 1, lastError: "model unavailable" }
    });
  });

  it("executeCodeTask：失败任务再次执行时，应复用同一任务并增加尝试次数", async () => {
    // Arrange
    const fixture = await createServiceFixture({
      taskStatus: "failed",
      owner: "artifact-app-pi",
      attemptCount: 1
    });

    // Act
    const result = await fixture.service.executeCodeTask(fixture.taskIdentifier);
    const task = await fixture.taskManager.getTask(fixture.taskIdentifier.taskId);

    // Assert
    expect({ result, task }).toMatchObject({
      result: { status: "completed" },
      task: { status: "completed", attemptCount: 2 }
    });
  });

  it("executeCodeTask：发现同执行者遗留的 in_progress 任务时，应按意外中止恢复后重试", async () => {
    // Arrange
    const fixture = await createServiceFixture({
      taskStatus: "in_progress",
      owner: "artifact-app-pi",
      attemptCount: 1
    });

    // Act
    const result = await fixture.service.executeCodeTask(fixture.taskIdentifier);
    const task = await fixture.taskManager.getTask(fixture.taskIdentifier.taskId);

    // Assert
    expect({ result, task }).toMatchObject({
      result: { status: "completed" },
      task: { status: "completed", attemptCount: 2 }
    });
  });

  it("executeCodeTask：任务已经完成时，应返回失败结果且不获取 Sandbox", async () => {
    // Arrange
    const fixture = await createServiceFixture({ taskStatus: "completed" });

    // Act
    const result = await fixture.service.executeCodeTask(fixture.taskIdentifier);

    // Assert
    expect(result).toMatchObject({
      status: "failed",
      error: { code: AppCodeTaskError.TASK_ALREADY_COMPLETED }
    });
    expect(fixture.acquire).not.toHaveBeenCalled();
  });

  it("executeCodeTask：任务已经取消时，应返回失败结果且不获取 Sandbox", async () => {
    // Arrange
    const fixture = await createServiceFixture({ taskStatus: "cancelled" });

    // Act
    const result = await fixture.service.executeCodeTask(fixture.taskIdentifier);

    // Assert
    expect(result).toMatchObject({
      status: "failed",
      error: { code: AppCodeTaskError.TASK_CANCELLED }
    });
    expect(fixture.acquire).not.toHaveBeenCalled();
  });

  it("executeCodeTask：同一任务仍在执行时，应拒绝第二次启动 Pi", async () => {
    // Arrange
    const fixture = await createServiceFixture();
    let finishRun!: (result: AppCodeExecutionResult) => void;
    const pendingRun = new Promise<AppCodeExecutionResult>((resolve) => {
      finishRun = resolve;
    });
    fixture.run.mockReset().mockReturnValue(pendingRun);
    const firstExecution = fixture.service.executeCodeTask(fixture.taskIdentifier);
    await vi.waitFor(() => expect(fixture.run).toHaveBeenCalledOnce());

    // Act
    const duplicateResult = await fixture.service.executeCodeTask(fixture.taskIdentifier);
    finishRun(
      createRunnerResult({
        ...fixture.taskIdentifier,
        status: "completed"
      })
    );
    const firstResult = await firstExecution;

    // Assert
    expect(duplicateResult).toMatchObject({
      status: "failed",
      error: { code: AppCodeTaskError.TASK_ALREADY_RUNNING }
    });
    expect(firstResult.status).toBe("completed");
    expect(fixture.run).toHaveBeenCalledOnce();
  });

  it("executeCodeTask：切换到新任务前，应提交上一个失败任务留下的修改作为检查点", async () => {
    // Arrange
    const fixture = await createServiceFixture({
      taskStatus: "failed",
      owner: "artifact-app-pi",
      attemptCount: 1
    });
    const nextTaskId = await fixture.taskManager.createTask(createTaskData());
    const nextTaskIdentifier = {
      taskListId: fixture.taskIdentifier.taskListId,
      taskId: nextTaskId
    };
    fixture.sandbox.markDirty();
    fixture.run.mockReset().mockImplementation(async () => {
      fixture.sandbox.markDirty();
      return createRunnerResult({ ...nextTaskIdentifier, status: "completed" });
    });

    // Act
    const result = await fixture.service.executeCodeTask(nextTaskIdentifier);

    // Assert
    expect(result.status).toBe("completed");
    expect(fixture.sandbox.commands).toContain(
      'git -c user.name="screenwright Pi Agent" -c user.email="pi-agent@screenwright.local" commit -m "artifact-app checkpoint pi/task-list-001/task-1"'
    );
    expect(fixture.sandbox.commands).toContain("git switch -c pi/task-list-001/task-2");
  });

  it("executeCodeTask：Session 创建失败时，应标记任务失败并释放 Sandbox", async () => {
    // Arrange
    const fixture = await createServiceFixture();
    fixture.getOrCreate.mockRejectedValueOnce(new Error("session unavailable"));

    // Act
    const result = await fixture.service.executeCodeTask(fixture.taskIdentifier);
    const task = await fixture.taskManager.getTask(fixture.taskIdentifier.taskId);

    // Assert
    expect({ result, task }).toMatchObject({
      result: {
        status: "failed",
        error: { code: AppCodeTaskError.AGENT_SESSION_FAILED }
      },
      task: { status: "failed", lastError: "session unavailable" }
    });
    expect(fixture.release).toHaveBeenCalledOnce();
  });
});
