import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { editPlan } from "../../utils/plan-file";

export const editPlanTool = createTool({
  id: "edit-plan",
  description: `修改已有计划文件中的特定内容。收到用户审批反馈后，
针对性地调整计划中需要修改的部分，然后重新调用 submit-plan 提交审批。
oldContent 必须与文件中的内容完全一致（包括空格和换行）。`,
  inputSchema: z.object({
    oldContent: z.string().describe("要替换的原始内容（与文件完全一致）"),
    newContent: z.string().describe("替换后的新内容")
  }),
  outputSchema: z.object({
    filePath: z.string(),
    message: z.string()
  }),
  execute: async ({ oldContent, newContent }, context) => {
    const threadId = context?.agent?.threadId ?? "default";
    const result = await editPlan(threadId, oldContent, newContent);

    if (!result.success) {
      if (result.occurrences === 0) {
        throw new Error("未找到目标内容，请确认 oldContent 与文件内容完全匹配（包括空格和换行）。");
      }
      throw new Error(`目标内容在计划文件中出现了 ${result.occurrences} 次，无法唯一定位。请提供更多上下文使其唯一。`);
    }

    return {
      filePath: result.filePath,
      message: "计划已更新。调用 submit-plan 重新提交审批。"
    };
  }
});
