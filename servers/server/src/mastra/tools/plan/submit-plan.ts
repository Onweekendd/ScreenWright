import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { AgentMode, type CustomStorageThreadType } from "@/mastra/types/bi-chat";

import { memory } from "../../storage/storage";
import { SuspendDefs, SuspendType } from "../../types/suspend";
import { getPlan, getPlanFilePath } from "../../utils/plan-file";

export const submitPlanTool = createTool({
  id: "submit-plan",
  description: `在计划模式下完成计划编写后，调用此工具向用户提交审批。
此工具自动读取计划文件内容展示给用户，无需再次传入计划内容（先调用 create-plan 写入文件）。
仅在规划了具体实施步骤后使用，纯研究性探索不需要调用此工具。
不要用 AskUserQuestion 询问"计划是否合适"——提交计划审批正是此工具的用途。`,
  inputSchema: z.object({
    summary: z.string().describe("计划摘要（一句话，供用户快速了解方案要点）")
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    feedback: z.string().optional().describe("用户的修改意见（拒绝时提供）")
  }),
  suspendSchema: SuspendDefs[SuspendType.SubmitPlan].suspend,
  resumeSchema: SuspendDefs[SuspendType.SubmitPlan].resume,
  execute: async ({ summary }, context) => {
    const { suspend, resumeData } = context?.agent ?? {};
    const threadId = context?.agent?.threadId ?? "default";

    if (!resumeData) {
      const thread = (await memory.getThreadById({ threadId })) as CustomStorageThreadType;
      if (!thread || thread.metadata.mode !== AgentMode.PLAN) {
        throw new Error("当前不在计划模式中，无法提交计划审批。请先调用 enter-plan-mode 进入计划模式。");
      }

      const plan = await getPlan(threadId);
      if (!plan) {
        throw new Error("未找到计划文件，请先调用 create-plan 写入计划内容。");
      }
      const filePath = getPlanFilePath(threadId);
      return suspend?.({ type: SuspendType.SubmitPlan, summary, plan, filePath }) as never;
    }

    const { action, feedback } = resumeData;

    if (action === "auto_edit" || action === "ask_before_edit") {
      const mode = action === "auto_edit" ? AgentMode.AUTO_EDIT : AgentMode.ASK_BEFORE_EDIT;

      // metadata.mode 只对「下一个请求」生效（handleBiChat 在入口读 metadata 构造 requestContext）。
      // 本次 resume run 的 requestContext 在 execute 跑起来之前就已定为 plan，必须同步改写，
      // 否则 ModeGuard 会继续按 plan 剥掉写工具与 agent-swExecutorAgent，导致刚批准就用不了。
      context?.requestContext?.set("mode", mode);

      const thread = (await memory.getThreadById({ threadId })) as CustomStorageThreadType;
      if (thread) {
        const prevMeta = (thread.metadata as Record<string, unknown>) ?? {};
        await memory.updateThread({
          ...thread,
          title: thread.title ?? "",
          metadata: { ...prevMeta, mode }
        });
      }
      return { approved: true };
    }

    return { approved: false, feedback };
  }
});
