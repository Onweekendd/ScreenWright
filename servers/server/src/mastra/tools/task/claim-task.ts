import { createTool } from "@mastra/core/tools";
import z from "zod";

import { createTaskManager } from "./create-task-manager";

export const claimTask = createTool({
  id: "claim-task",
  description:
    "原子认领任务：设置 owner 和 in_progress、增加 attemptCount，并清除旧 lastError。支持检查 agent 是否已有进行中的任务（checkAgentBusy）。子 agent 被委派时必须传入 taskListId（从 <delegation><task_list_id> 取），否则默认用当前 agent 的 threadId 找不到主 agent 创建的任务",
  inputSchema: z.object({
    taskId: z.string().describe("要认领的任务 ID"),
    agentId: z.string().describe("认领方的 agent ID"),
    checkAgentBusy: z.boolean().optional().describe("是否检查 agent 当前是否已有进行中任务，默认 false"),
    taskListId: z
      .string()
      .optional()
      .describe(
        "任务列表 ID。子 agent 被委派时必传：从 <delegation><task_list_id> 取值。不传则默认用当前 agent 的 threadId，跨 agent 委派场景会找不到任务"
      )
  }),
  execute: async ({ taskId, agentId, checkAgentBusy, taskListId }, context) => {
    const effectiveTaskListId = taskListId ?? context.agent?.threadId;
    if (!effectiveTaskListId) {
      throw new Error("claimTask 工具必须在 Agent 执行上下文中调用，或显式传入 taskListId");
    }
    // 并发委派场景下，多个子 agent 实例传入的 agentId 字面量相同（如都硬编码
    // "sw-executor-agent"），导致 owner 判重 / busy 检查把不同实例误判为同一个认领方。
    // Mastra 为每次委派分配的 threadId 是框架生成的唯一值（父 threadId + randomUUID），
    // 拼到 agentId 后面才是真正能区分"实例"的认领标识。
    const claimantId = context.agent?.threadId ? `${agentId}:${context.agent.threadId}` : agentId;
    const manager = createTaskManager(effectiveTaskListId);
    const result = await manager.claimTask({ taskId, claimantAgentId: claimantId, checkAgentBusy });
    return result;
  }
});
