import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { AgentMode, type CustomStorageThreadType } from "@/mastra/types/bi-chat";

import { memory } from "../../storage/storage";
import { SuspendDefs, SuspendType } from "../../types/suspend";

export const enterPlanModeTool = createTool({
  id: "enter-plan-mode",
  description: `当即将开始一个非简单的实现任务时主动调用，在编写代码前取得用户认可，避免返工。
满足以下任一条件时使用：新功能实现、存在多种可行方案、涉及架构决策、需要修改多个文件、需求不清晰需要先探索。
单行修改、明确需求的小改动无需调用此工具。`,
  inputSchema: z.object({
    reason: z.string().describe("需要进入计划模式的原因，说明任务的复杂性或不确定性")
  }),
  outputSchema: z.object({
    entered: z.boolean(),
    message: z.string()
  }),
  suspendSchema: SuspendDefs[SuspendType.EnterPlanMode].suspend,
  resumeSchema: SuspendDefs[SuspendType.EnterPlanMode].resume,
  execute: async ({ reason }, context) => {
    const { suspend, resumeData } = context?.agent ?? {};
    const threadId = context?.agent?.threadId;
    if (!threadId) {
      return { entered: false, message: "无法获取线程 ID，无法进入计划模式。" };
    }
    const thread = (await memory.getThreadById({ threadId })) as CustomStorageThreadType;

    if (!thread) {
      return { entered: false, message: "无法获取线程信息，无法进入计划模式。" };
    }

    if (!resumeData) {
      return suspend?.({ type: SuspendType.EnterPlanMode, reason }) as never;
    }

    if (!resumeData.approved) {
      return { entered: false, message: "用户拒绝进入计划模式，请直接执行任务。" };
    }

    const currentModel = thread.metadata.mode;
    if (currentModel === AgentMode.PLAN) {
      return { entered: true, message: "已经在计划模式中，无需重复进入。" };
    }

    const prevMeta = (thread.metadata as Record<string, unknown>) ?? {};
    await memory.updateThread({
      ...thread,
      title: thread.title ?? "",
      metadata: { ...prevMeta, mode: AgentMode.PLAN }
    });

    // 同步当前 run 的 requestContext，让本次 resume 余下步骤立即按 plan 剥写工具；
    // 只改 metadata 的话要等下一个请求才生效（见 submit-plan 同处注释）。
    context?.requestContext?.set("mode", AgentMode.PLAN);

    return {
      entered: true,
      message:
        "已进入计划模式。请使用只读工具探索代码库，完成分析后调用 create-plan 写入计划，再调用 submit-plan 提交审批。"
    };
  }
});
