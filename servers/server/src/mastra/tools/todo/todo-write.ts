import { createTool } from "@mastra/core/tools";
import z from "zod";

import { stateManager } from "../../state";
import type { TodoState } from "../../state/todoState";
import { StateKeyEnum } from "../../types";
import { TodoListSchema } from "./types";

const DEFAULT_AGENT_ID = "default";

export const todoWrite = createTool({
  id: "todo-write",
  description:
    "更新当前会话的任务清单。用于追踪多步骤任务的进度。每次调用传入完整的任务数组（全量替换）。" +
    "在开始某项任务前标记为 in_progress，完成后立即标记为 completed。" +
    "同一时间只能有一个任务处于 in_progress 状态。",
  inputSchema: z.object({
    agentId: z.string().optional().describe("Agent ID，用于多 agent 隔离。不传则使用默认 session"),
    todos: TodoListSchema.describe("完整的任务列表（全量替换，非增量）")
  }),
  execute: async ({ agentId, todos }) => {
    const store = stateManager.getStore<TodoState>(StateKeyEnum.TODO);
    if (!store) {
      throw new Error("TodoState not registered in stateManager");
    }

    const key = agentId ?? DEFAULT_AGENT_ID;
    const oldTodos = store.getTodos(key);
    store.setTodos(key, todos);
    const newTodos = store.getTodos(key);

    const allDone = todos.length > 0 && todos.every((t) => t.status === "completed");

    // 验证提醒：完成 3+ 任务但没有任何验证步骤时，提示添加验证环节
    const hasVerificationTask = todos.some((t) => /verify|verification/i.test(t.content));
    const verificationNudgeNeeded = allDone && todos.length >= 3 && !hasVerificationTask;

    const baseMessage =
      "Todos have been modified successfully. Ensure that you continue to use the todo list to track your progress. Please proceed with the current tasks if applicable";

    const nudge = verificationNudgeNeeded
      ? "\n\nNOTE: You just closed out 3+ tasks and none of them was a verification step. Consider adding a verification task to confirm your work is correct before finalizing."
      : "";

    return {
      oldTodos,
      newTodos,
      verificationNudgeNeeded,
      message: baseMessage + nudge
    };
  }
});
