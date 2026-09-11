import { createTool } from "@mastra/core/tools";
import z from "zod";

import { createTaskManager } from "./create-task-manager";

export const getTask = createTool({
  id: "get-task",
  description:
    "根据任务 ID 查询单个任务，不存在时返回 null。子 agent 被委派时必传 taskListId（从 <delegation><task_list_id> 取），否则默认用当前 agent 的 threadId 查不到主 agent 创建的任务",
  inputSchema: z.object({
    taskId: z.string().describe("任务 ID"),
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
      throw new Error("getTask 工具必须在 Agent 执行上下文中调用，或显式传入 taskListId");
    }
    const manager = createTaskManager(effectiveTaskListId);
    const task = await manager.getTask(taskId);
    return { task };
  }
});
