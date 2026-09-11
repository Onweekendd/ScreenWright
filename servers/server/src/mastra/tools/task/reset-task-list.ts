import { createTool } from "@mastra/core/tools";
import z from "zod";

import { createTaskManager } from "./create-task-manager";

export const resetTaskList = createTool({
  id: "reset-task-list",
  description: "清空任务列表中的所有任务，保留高水位以防止 ID 复用",
  inputSchema: z.object({
    taskListId: z
      .string()
      .optional()
      .describe(
        "任务列表 ID。子 agent 被委派时必传：从 <delegation><task_list_id> 取值。不传则默认用当前 agent 的 threadId"
      )
  }),
  execute: async ({ taskListId }, context) => {
    const effectiveTaskListId = taskListId ?? context.agent?.threadId;
    if (!effectiveTaskListId) {
      throw new Error("resetTaskList 工具必须在 Agent 执行上下文中调用，或显式传入 taskListId");
    }
    const manager = createTaskManager(effectiveTaskListId);
    await manager.resetTaskList();
    return { success: true };
  }
});
