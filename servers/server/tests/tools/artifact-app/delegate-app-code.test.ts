import type { ToolExecutionContext } from "@mastra/core/tools";
import { describe, expect, it, vi } from "vitest";

import type { ArtifactAppService } from "@/artifact-app/application/artifact-app-service";
import { type AppCodeExecutionResult, AppCodeTaskError } from "@/artifact-app/contracts";
import { createDelegateAppCodeTool } from "@/mastra/tools/artifact-app/delegate-app-code";

const toolExecutionContext = {} as ToolExecutionContext;

describe("createDelegateAppCodeTool", () => {
  it("execute：收到任务标识时，应原样委托给 ArtifactAppService 并返回执行结果", async () => {
    // Arrange
    const taskIdentifier = { taskListId: "task-list-001", taskId: "1" };
    const executionResult: AppCodeExecutionResult = {
      ...taskIdentifier,
      appId: "app-001",
      sessionId: "session-001",
      status: "completed",
      summary: "登录页已经完成",
      changedFiles: ["src/App.ts"],
      checks: [{ name: "typecheck", status: "passed" }]
    };
    const executeCodeTask = vi.fn<ArtifactAppService["executeCodeTask"]>().mockResolvedValue(executionResult);
    const tool = createDelegateAppCodeTool({ artifactAppService: { executeCodeTask } });

    // Act
    const result = await tool.execute?.(taskIdentifier, toolExecutionContext);

    // Assert
    expect(executeCodeTask).toHaveBeenCalledWith({ taskListId: "task-list-001", taskId: "1" });
    expect(result).toBe(executionResult);
  });

  it("execute：Artifact App 返回业务失败时，应保留结构化错误而不是抛出异常", async () => {
    // Arrange
    const taskIdentifier = { taskListId: "task-list-001", taskId: "404" };
    const executionResult: AppCodeExecutionResult = {
      ...taskIdentifier,
      status: "failed",
      summary: "任务不存在",
      changedFiles: [],
      checks: [],
      error: {
        code: AppCodeTaskError.TASK_NOT_FOUND,
        message: "任务不存在"
      }
    };
    const executeCodeTask = vi.fn<ArtifactAppService["executeCodeTask"]>().mockResolvedValue(executionResult);
    const tool = createDelegateAppCodeTool({ artifactAppService: { executeCodeTask } });

    // Act
    const result = await tool.execute?.(taskIdentifier, toolExecutionContext);

    // Assert
    expect(result).toEqual(executionResult);
  });
});
