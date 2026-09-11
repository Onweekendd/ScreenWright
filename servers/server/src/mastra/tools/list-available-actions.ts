import { createTool } from "@mastra/core/tools";
import type { AllComponentType } from "@screenwright/types";
import { ActionList, createComponent2ActionMapGetter } from "@screenwright/types";
import z from "zod";

const InputSchema = z.object({
  props: z
    .array(z.string())
    .describe("组件的 prop 标识数组，位于组件JsonSchema的 component.prop字段 如 ['bar', 'line']")
});

export const listAvailableActions = createTool({
  id: "listAvailableActions",
  description:
    "在配置交互事件时 使用组件的标识数组(props) 批量列出组件所有可以支持的行为，返回 { prop: [{label, value}] } 结构",
  inputSchema: InputSchema,
  execute: async ({ props }) => {
    const component2ActionMapGetter = createComponent2ActionMapGetter()();

    const result: Record<string, { label: string; value: string }[]> = {};
    for (const prop of props) {
      const actionListStr = component2ActionMapGetter.get(prop as AllComponentType);
      const actionList = actionListStr ? actionListStr.split(",") : [];
      result[prop] = actionList
        .map((action) => ActionList.find((item) => item.value === action))
        .filter((item) => item !== undefined)
        .map((item) => ({ label: item.label, value: item.value as string }));
    }
    return result;
  }
});
