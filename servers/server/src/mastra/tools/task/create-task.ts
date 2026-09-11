import { createTool } from "@mastra/core/tools";
import z from "zod";

import { TaskSchema } from "@/task-management";

import { createTaskManager } from "./create-task-manager";

export const createTask = createTool({
  id: "create-task",
  description:
    "创建一个新任务，返回 { id, taskListId }。委派给子 agent 时，必须把返回的 taskListId 嵌入 <delegation><task_list_id> 中，子 agent 才能跨 thread 认领该任务",
  inputSchema: z.object({
    taskData: TaskSchema.omit({ id: true }).describe("任务数据（ID 由系统生成）")
  }),
  execute: async ({ taskData }, context) => {
    const threadId = context.agent?.threadId;
    if (!threadId) {
      throw new Error("createTask 工具必须在 Agent 执行上下文中调用");
    }

    const manager = createTaskManager(threadId);
    const id = await manager.createTask({
      ...taskData,
      blocks: taskData.blocks ?? [],
      blockedBy: taskData.blockedBy ?? []
    });
    return { id, taskListId: threadId };
  }
});
