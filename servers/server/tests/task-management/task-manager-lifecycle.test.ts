import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { type Task, TaskManager } from "@/task-management";

const temporaryDirectories: string[] = [];

async function createTaskManager() {
  const storageRoot = await mkdtemp(path.join(tmpdir(), "screenwright-task-manager-"));
  temporaryDirectories.push(storageRoot);
  return new TaskManager({ taskListId: "task-list-001", storageRoot });
}

function createTaskData(overrides: Partial<Omit<Task, "id">> = {}): Omit<Task, "id"> {
  return {
    subject: "实现登录页",
    description: "创建登录表单",
    status: "pending",
    blocks: [],
    blockedBy: [],
    metadata: {},
    ...overrides
  };
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("TaskManager 任务生命周期", () => {
  it("claimTask：认领待处理任务时，应原子写入执行者、进行中状态和首次尝试次数", async () => {
    // Arrange
    const manager = await createTaskManager();
    const taskId = await manager.createTask(createTaskData());

    // Act
    const result = await manager.claimTask({ taskId, claimantAgentId: "artifact-app-pi" });

    // Assert
    expect(result).toMatchObject({
      success: true,
      task: { owner: "artifact-app-pi", status: "in_progress", attemptCount: 1 }
    });
  });

  it("claimTask：同一执行者重试失败任务时，应重新进入进行中并增加尝试次数", async () => {
    // Arrange
    const manager = await createTaskManager();
    const taskId = await manager.createTask(
      createTaskData({
        owner: "artifact-app-pi",
        status: "failed",
        attemptCount: 1,
        lastError: "model unavailable"
      })
    );

    // Act
    const result = await manager.claimTask({ taskId, claimantAgentId: "artifact-app-pi" });

    // Assert
    expect(result).toMatchObject({
      success: true,
      task: { status: "in_progress", attemptCount: 2, lastError: undefined }
    });
  });

  it("claimTask：任务已经进行中时，应拒绝重复启动", async () => {
    // Arrange
    const manager = await createTaskManager();
    const taskId = await manager.createTask(
      createTaskData({ owner: "artifact-app-pi", status: "in_progress", attemptCount: 1 })
    );

    // Act
    const result = await manager.claimTask({ taskId, claimantAgentId: "artifact-app-pi" });

    // Assert
    expect(result).toMatchObject({ success: false, reason: "already_running" });
  });

  it("claimTask：任务已经取消时，应拒绝重新认领", async () => {
    // Arrange
    const manager = await createTaskManager();
    const taskId = await manager.createTask(createTaskData({ status: "cancelled" }));

    // Act
    const result = await manager.claimTask({ taskId, claimantAgentId: "artifact-app-pi" });

    // Assert
    expect(result).toMatchObject({ success: false, reason: "already_resolved" });
  });

  it("claimTask：前置任务尚未完成时，应拒绝认领被阻塞的任务", async () => {
    // Arrange
    const manager = await createTaskManager();
    const blockerId = await manager.createTask(createTaskData());
    const blockedTaskId = await manager.createTask(createTaskData({ blockedBy: [blockerId] }));

    // Act
    const result = await manager.claimTask({ taskId: blockedTaskId, claimantAgentId: "artifact-app-pi" });

    // Assert
    expect(result).toMatchObject({
      success: false,
      reason: "blocked",
      blockedByTasks: [blockerId]
    });
  });
});
