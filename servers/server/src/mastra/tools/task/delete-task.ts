import { createTool } from "@mastra/core/tools";
import z from "zod";

import { createTaskManager } from "./create-task-manager";

export const deleteTask = createTool({
  id: "delete-task",
  description: "删除任务，并自动清理其他任务中对该 ID 的 blocks/blockedBy 引用",
  inputSchema: z.object({
    taskId: z.string().describe("要删除的任务 ID"),
    taskListId: z
      .string()
      .optional()
      .describe(
        "任务列表 ID。子 agent 被委派时必传：从 <delegation><task_list_id> 取值。不传则默认用当前 agent 的 threadId"
      )
  }),
  execute: async ({ taskId, taskListId }, context) => {
    const effectiveTaskListId = taskListId ?? context.agent?.threadId;
    if (!effectiveTaskListId) {
      throw new Error("deleteTask 工具必须在 Agent 执行上下文中调用，或显式传入 taskListId");
    }
    const manager = createTaskManager(effectiveTaskListId);
    const success = await manager.deleteTask(taskId);
    return { success };
  }
});
