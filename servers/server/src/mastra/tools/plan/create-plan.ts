import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { savePlan } from "../../utils/plan-file";

export const createPlanTool = createTool({
  id: "create-plan",
  description: `将实施计划写入计划文件。在规划阶段完成代码库探索后调用。
计划内容必须完整明确，包含目标、关键文件、实施步骤和注意事项。
调用 submit-plan 提交审批前必须先调用此工具。`,
  inputSchema: z.object({
    content: z.string().describe("完整的实施计划（Markdown 格式，包含目标、分析、步骤、注意事项）")
  }),
  outputSchema: z.object({
    filePath: z.string().describe("计划文件路径"),
    message: z.string()
  }),
  execute: async ({ content }, context) => {
    const threadId = context?.agent?.threadId ?? "default";
    const filePath = await savePlan(threadId, content);
    return {
      filePath,
      message: `计划已写入 ${filePath}。确认内容无误后，调用 submit-plan 提交用户审批。`
    };
  }
});
