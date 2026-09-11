import { createTool } from "@mastra/core/tools";
import z from "zod";

import { SuspendDefs, SuspendType } from "../types/suspend";

const optionSchema = z.object({
  label: z.string().describe("选项显示文本，简洁明了（1-5个词）"),
  description: z.string().describe("选项说明，解释选择此项的含义或影响")
});

const questionSchema = z.object({
  question: z.string().describe("完整的问题文本，以问号结尾"),
  header: z.string().describe("简短标签，用于显示为标题（最多15字）"),
  options: z.array(optionSchema).min(2).max(4),
  multiSelect: z.boolean().default(false).describe("是否允许多选")
});

export const askUserQuestionTool = createTool({
  id: "ask-user-question",
  description:
    "向用户提出结构化的多选题，等待用户回答后继续执行。适用于需要用户做出决策的场景，例如选择技术栈、确认操作方向、选择配置项等。每次最多提 4 个问题，每题 2-4 个选项。",

  inputSchema: z.object({
    questions: z.array(questionSchema).min(1).max(4).describe("要提问的问题列表（1-4个）")
  }),

  outputSchema: z.object({
    answers: z.record(z.string(), z.string()).describe("问题文本到答案的映射，多选答案用逗号分隔")
  }),

  suspendSchema: SuspendDefs[SuspendType.AskUserQuestion].suspend,
  resumeSchema: SuspendDefs[SuspendType.AskUserQuestion].resume,

  execute: async ({ questions }, context) => {
    const { suspend, resumeData } = context?.agent ?? {};

    if (resumeData?.answers) {
      return { answers: resumeData.answers };
    }

    return suspend!({ type: SuspendType.AskUserQuestion, questions }) as never;
  }
});
