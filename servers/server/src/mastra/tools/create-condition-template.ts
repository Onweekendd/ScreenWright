import { createTool } from "@mastra/core/tools";
import { ConditionCompareEnum, ConditionTypeEnum } from "@screenwright/types";
import { templateConditions } from "@screenwright/types/templates";
import z from "zod";

export const ConditionInputSchema = z.object({
  type: z
    .enum([ConditionTypeEnum.Field, ConditionTypeEnum.Custom])
    .optional()
    .describe("条件类型：field-字段条件，custom-自定义JS代码条件，默认 field"),
  field: z.string().optional().describe("字段名，type=field 时填写"),
  compare: z
    .enum([
      ConditionCompareEnum.Equal,
      ConditionCompareEnum.NotEqual,
      ConditionCompareEnum.LessThan,
      ConditionCompareEnum.GreaterThan,
      ConditionCompareEnum.LessThanOrEqual,
      ConditionCompareEnum.GreaterThanOrEqual,
      ConditionCompareEnum.Include,
      ConditionCompareEnum.Exclude
    ])
    .optional()
    .describe("比较运算符，默认 =="),
  expected: z.string().optional().describe("期望值，type=field 时填写"),
  code: z.string().default("return data").describe("自定义JS代码体，type=custom 时填写")
});

export const createConditionTemplate = createTool({
  id: "createConditionTemplate",
  description:
    "⚠️ 仅用于向【已有事件】追加 condition 时生成模板。**新建事件请直接把 { type, field, compare, expected, code } 数组作为 conditions[] 传给 createEventTemplate，不要先调本工具预览**——createEventTemplate 内部已自动调用 templateConditions，重复调用纯属浪费。",
  inputSchema: ConditionInputSchema,
  execute: async ({ type, field, compare, expected, code }) => {
    const template = templateConditions();

    if (type !== undefined) {
      template.type = type;
    }
    if (field !== undefined) {
      template.field = field;
    }
    if (compare !== undefined) {
      template.compare = compare;
    }
    if (expected !== undefined) {
      template.expected = expected;
    }
    if (code !== undefined) {
      template.code = code;
    }

    return template;
  }
});
