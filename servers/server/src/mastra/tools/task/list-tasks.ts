import { createTool } from "@mastra/core/tools";
import z from "zod";

import { createTaskManager } from "./create-task-manager";

export const listTasks = createTool({
  id: "list-tasks",
  description:
    "列出指定任务列表中的所有任务。子 agent 被委派时必传 taskListId（从 <delegation><task_list_id> 取），否则默认用当前 agent 的 threadId 列不到主 agent 创建的任务",
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
      throw new Error("listTasks 工具必须在 Agent 执行上下文中调用，或显式传入 taskListId");
    }
    const manager = createTaskManager(effectiveTaskListId);
    const tasks = await manager.listTasks();
    return { tasks };
  }
});
