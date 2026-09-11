import { describe, expect, it } from "vitest";

import { AppCodeTaskSchema } from "@/artifact-app/contracts";
import { TaskIdentifierSchema } from "@/task-management";

describe("Artifact App 任务契约", () => {
  it("TaskIdentifierSchema：同时提供任务列表 ID 和任务 ID 时，应通过校验", () => {
    // Arrange
    const identifier = { taskListId: "task-list-001", taskId: "1" };

    // Act
    const result = TaskIdentifierSchema.safeParse(identifier);

    // Assert
    expect(result.success).toBe(true);
  });

  it("TaskIdentifierSchema：任一 ID 为空时，应拒绝校验", () => {
    // Arrange
    const identifier = { taskListId: "", taskId: "1" };

    // Act
    const result = TaskIdentifierSchema.safeParse(identifier);

    // Assert
    expect(result.success).toBe(false);
  });

  it("AppCodeTaskSchema：通用任务包含合法 Artifact App metadata 时，应解析为编码任务", () => {
    // Arrange
    const task = {
      id: "1",
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
      }
    };

    // Act
    const result = AppCodeTaskSchema.safeParse(task);

    // Assert
    expect(result.success).toBe(true);
  });

  it("AppCodeTaskSchema：任务类型不是 Artifact App 编码任务时，应拒绝校验", () => {
    // Arrange
    const task = {
      id: "1",
      subject: "实现登录页",
      description: "创建登录表单",
      status: "pending",
      blocks: [],
      blockedBy: [],
      metadata: {
        task_kind: "other-task",
        appId: "app-001",
        screenId: "screen-001",
        acceptanceCriteria: ["类型检查通过"]
      }
    };

    // Act
    const result = AppCodeTaskSchema.safeParse(task);

    // Assert
    expect(result.success).toBe(false);
  });
});
