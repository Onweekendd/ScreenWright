import { createTool } from "@mastra/core/tools";
import z from "zod";

import { TaskSchema } from "@/task-management";

import { createTaskManager } from "./create-task-manager";

export const updateTask = createTool({
  id: "update-task",
  description:
    "更新任务的字段（状态、owner、描述等），任务不存在时返回 null。子 agent 被委派时必传 taskListId（从 <delegation><task_list_id> 取），否则默认用当前 agent 的 threadId 更新不到主 agent 创建的任务",
  inputSchema: z.object({
    taskId: z.string().describe("要更新的任务 ID"),
    updates: TaskSchema.omit({ id: true }).partial().describe("要更新的字段（部分更新）"),
    taskListId: z
      .string()
      .optional()
      .describe(
        "任务列表 ID。子 agent 被委派时必传：从 <delegation><task_list_id> 取值。不传则默认用当前 agent 的 threadId"
      )
  }),
  execute: async ({ taskId, updates, taskListId }, context) => {
    const effectiveTaskListId = taskListId ?? context.agent?.threadId;
    if (!effectiveTaskListId) {
      throw new Error("updateTask 工具必须在 Agent 执行上下文中调用，或显式传入 taskListId");
    }
    const manager = createTaskManager(effectiveTaskListId);
    const task = await manager.updateTask(taskId, updates);
    return { task };
  }
});
