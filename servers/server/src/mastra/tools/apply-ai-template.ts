import { createTool } from "@mastra/core/tools";
import z from "zod";

import { getAgentWorkspacePath } from "@/agent-resources/workspace-path";

import { SuspendDefs, SuspendType } from "../types/suspend";
import { ChangeSchema, readCreatedChange } from "./change-report";

export const applyAiTemplateTool = createTool({
  id: "apply_ai_template",
  description: `把候选 AI 模板交给用户确认并应用到当前大屏。

调用时机：用户明确要套用某个已知的 AI 模板搭建/扩展大屏时，把模板 id 传给本工具，弹窗让用户确认。

行为：
- 弹出候选卡片弹窗（每张含模板封面截图 + 适用场景说明），用户从中选择一个并应用到当前大屏。
- 应用过程由前端完成：服务端深度复制模板组件 → 重映射为新 id → 合入当前画布 → 回写范式描述到 workspace。
- 用户应用返回 { applied:true, templateId, describePath }；取消返回 { applied:false, canceled:true }。

应用成功后：请用 read_file 读取返回的 describePath（template-{screenId}.json，里面的组件 id 已是应用后画布上的真实新 id），据此理解新画布的范式结构，再按用户的具体需求继续修改（替换文案/数据、调整布局、增删组件等）。`,

  inputSchema: z.object({
    templateIds: z.array(z.number()).min(1).describe("候选 AI 模板 id 列表（按相关度排序，建议 1-4 个）")
  }),

  outputSchema: z.object({
    applied: z.boolean(),
    templateId: z.number().optional(),
    describePath: z.string().optional().describe("应用后已同步的范式描述文件路径，读取它以继续按需求修改"),
    canceled: z.boolean().optional(),
    change: z.array(ChangeSchema).optional()
  }),

  suspendSchema: SuspendDefs[SuspendType.ApplyAiTemplate].suspend,
  resumeSchema: SuspendDefs[SuspendType.ApplyAiTemplate].resume,

  execute: async ({ templateIds }, context) => {
    const { suspend, resumeData } = context?.agent ?? {};

    // resume 重跑：直接回传前端给的结果，外加一条改动回执。
    // 模板应用会往画布上合入整批组件，逐个报没有意义（也报不出来——组件是前端重映射 id 后
    // 合进去的），所以只指向 describePath：那里面的 id 已是应用后的真实新 id。
    if (resumeData) {
      const applied = resumeData as { applied?: boolean; describePath?: string };
      if (!applied.applied || !applied.describePath) {
        return resumeData;
      }
      const describe = await readCreatedChange(
        getAgentWorkspacePath(),
        applied.describePath,
        "模板组件已整批合入画布，这份范式描述里的组件 id 是应用后的真实新 id"
      );
      return describe ? { ...resumeData, change: [describe] } : resumeData;
    }

    return suspend!({ type: SuspendType.ApplyAiTemplate, templateIds }) as never;
  }
});
