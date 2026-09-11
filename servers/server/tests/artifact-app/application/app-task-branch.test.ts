import { describe, expect, it, vi } from "vitest";

import {
  buildTaskBranchName,
  commitTaskBranchChanges,
  prepareTaskBranch
} from "@/artifact-app/application/app-task-branch";
import type { AppSandbox, SandboxCommandResult } from "@/artifact-app/sandbox/app-sandbox";

function createCommandResult(overrides: Partial<SandboxCommandResult> = {}): SandboxCommandResult {
  return {
    exitCode: 0,
    stdout: "",
    stderr: "",
    termination: "exited",
    ...overrides
  };
}

function createSandbox(run: AppSandbox["run"]): AppSandbox {
  return {
    appId: "app-001",
    workspacePath: "D:/artifact-apps/app-001",
    run
  };
}

describe("任务分支", () => {
  it("buildTaskBranchName：给定合法任务标识时，应生成稳定的任务分支名", () => {
    // Arrange
    const taskIdentifier = { taskListId: "thread-001", taskId: "42" };

    // Act
    const branchName = buildTaskBranchName(taskIdentifier);

    // Assert
    expect(branchName).toBe("pi/thread-001/task-42");
  });

  it("buildTaskBranchName：任务标识包含危险字符时，应生成可安全执行的分支名", () => {
    // Arrange
    const taskIdentifier = { taskListId: "../thread", taskId: "1;shutdown" };

    // Act
    const branchName = buildTaskBranchName(taskIdentifier);

    // Assert
    expect(branchName).toBe("pi/thread-4e529faa/task-1-shutdown-274f3845");
  });

  it("prepareTaskBranch：目标分支不存在且工作区干净时，应从当前 HEAD 创建分支", async () => {
    // Arrange
    const run = vi
      .fn<AppSandbox["run"]>()
      .mockResolvedValueOnce(createCommandResult({ stdout: "main\n" }))
      .mockResolvedValueOnce(createCommandResult({ exitCode: 1 }))
      .mockResolvedValueOnce(createCommandResult())
      .mockResolvedValueOnce(createCommandResult());
    const sandbox = createSandbox(run);

    // Act
    const result = await prepareTaskBranch({
      sandbox,
      taskIdentifier: { taskListId: "thread-001", taskId: "42" }
    });

    // Assert
    expect(result).toEqual({ branchName: "pi/thread-001/task-42", created: true });
    expect(run).toHaveBeenNthCalledWith(4, { script: "git switch -c pi/thread-001/task-42" });
  });

  it("prepareTaskBranch：已经位于目标分支时，应直接复用并保留当前修改", async () => {
    // Arrange
    const run = vi
      .fn<AppSandbox["run"]>()
      .mockResolvedValueOnce(createCommandResult({ stdout: "pi/thread-001/task-42\n" }));
    const sandbox = createSandbox(run);

    // Act
    const result = await prepareTaskBranch({
      sandbox,
      taskIdentifier: { taskListId: "thread-001", taskId: "42" }
    });

    // Assert
    expect(result).toEqual({ branchName: "pi/thread-001/task-42", created: false });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("prepareTaskBranch：目标分支已存在且工作区干净时，应切换到已有分支", async () => {
    // Arrange
    const run = vi
      .fn<AppSandbox["run"]>()
      .mockResolvedValueOnce(createCommandResult({ stdout: "main\n" }))
      .mockResolvedValueOnce(createCommandResult())
      .mockResolvedValueOnce(createCommandResult())
      .mockResolvedValueOnce(createCommandResult());
    const sandbox = createSandbox(run);

    // Act
    const result = await prepareTaskBranch({
      sandbox,
      taskIdentifier: { taskListId: "thread-001", taskId: "42" }
    });

    // Assert
    expect(result).toEqual({ branchName: "pi/thread-001/task-42", created: false });
    expect(run).toHaveBeenNthCalledWith(4, { script: "git switch pi/thread-001/task-42" });
  });

  it("prepareTaskBranch：切换其他任务前存在未提交修改时，应停止分支操作", async () => {
    // Arrange
    const run = vi
      .fn<AppSandbox["run"]>()
      .mockResolvedValueOnce(createCommandResult({ stdout: "main\n" }))
      .mockResolvedValueOnce(createCommandResult({ exitCode: 1 }))
      .mockResolvedValueOnce(createCommandResult({ stdout: " M src/app.ts\n" }));
    const sandbox = createSandbox(run);

    // Act
    const result = prepareTaskBranch({
      sandbox,
      taskIdentifier: { taskListId: "thread-001", taskId: "42" }
    });

    // Assert
    await expect(result).rejects.toThrow("Git 工作区存在未提交修改");
    expect(run).toHaveBeenCalledTimes(3);
  });

  it("commitTaskBranchChanges：任务完成且存在修改时，应提交当前任务分支", async () => {
    // Arrange
    const run = vi
      .fn<AppSandbox["run"]>()
      .mockResolvedValueOnce(createCommandResult({ stdout: "pi/thread-001/task-42\n" }))
      .mockResolvedValueOnce(createCommandResult({ stdout: " M src/app.ts\n" }))
      .mockResolvedValueOnce(createCommandResult())
      .mockResolvedValueOnce(createCommandResult());
    const sandbox = createSandbox(run);

    // Act
    const result = await commitTaskBranchChanges({
      sandbox,
      taskIdentifier: { taskListId: "thread-001", taskId: "42" },
      kind: "completed"
    });

    // Assert
    expect(result).toEqual({ branchName: "pi/thread-001/task-42", committed: true });
    expect(run).toHaveBeenNthCalledWith(4, {
      script:
        'git -c user.name="screenwright Pi Agent" -c user.email="pi-agent@screenwright.local" commit -m "artifact-app completed pi/thread-001/task-42"'
    });
  });

  it("commitTaskBranchChanges：创建中止检查点时，应使用 WIP 提交保留修改", async () => {
    // Arrange
    const run = vi
      .fn<AppSandbox["run"]>()
      .mockResolvedValueOnce(createCommandResult({ stdout: "pi/thread-001/task-42\n" }))
      .mockResolvedValueOnce(createCommandResult({ stdout: "?? src/draft.ts\n" }))
      .mockResolvedValueOnce(createCommandResult())
      .mockResolvedValueOnce(createCommandResult());
    const sandbox = createSandbox(run);

    // Act
    const result = await commitTaskBranchChanges({
      sandbox,
      taskIdentifier: { taskListId: "thread-001", taskId: "42" },
      kind: "checkpoint"
    });

    // Assert
    expect(result).toEqual({ branchName: "pi/thread-001/task-42", committed: true });
    expect(run).toHaveBeenNthCalledWith(4, {
      script:
        'git -c user.name="screenwright Pi Agent" -c user.email="pi-agent@screenwright.local" commit -m "artifact-app checkpoint pi/thread-001/task-42"'
    });
  });

  it("commitTaskBranchChanges：工作区没有修改时，应跳过提交", async () => {
    // Arrange
    const run = vi
      .fn<AppSandbox["run"]>()
      .mockResolvedValueOnce(createCommandResult({ stdout: "pi/thread-001/task-42\n" }))
      .mockResolvedValueOnce(createCommandResult());
    const sandbox = createSandbox(run);

    // Act
    const result = await commitTaskBranchChanges({
      sandbox,
      taskIdentifier: { taskListId: "thread-001", taskId: "42" },
      kind: "completed"
    });

    // Assert
    expect(result).toEqual({ branchName: "pi/thread-001/task-42", committed: false });
    expect(run).toHaveBeenCalledTimes(2);
  });
});
