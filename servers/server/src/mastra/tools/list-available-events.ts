import { createTool } from "@mastra/core/tools";
import type { AllComponentType } from "@screenwright/types";
import { createComponent2EventMapGetter, EventList } from "@screenwright/types";
import z from "zod";

const InputSchema = z.object({
  props: z
    .array(z.string())
    .describe("组件的 prop 标识数组，位于组件JsonSchema的 component.prop字段 如 ['bar', 'line']")
});

export const listAvailableEvents = createTool({
  id: "listAvailableEvents",
  description:
    "在配置交互事件时 使用组件的标识数组(props) 批量列出组件所有可以触发事件的方式，返回 { prop: [{label, value}] } 结构",
  inputSchema: InputSchema,
  execute: async ({ props }) => {
    const component2EventMapGetter = createComponent2EventMapGetter()();

    const result: Record<string, { label: string; value: string }[]> = {};
    for (const prop of props) {
      const eventListStr = component2EventMapGetter.get(prop as AllComponentType);
      const eventList = eventListStr ? eventListStr.split(",") : [];
      result[prop] = eventList
        .map((event) => EventList.find((item) => item.value === event))
        .filter((item) => item !== undefined)
        .map((item) => ({ label: item.label, value: item.value as string }));
    }
    return result;
  }
});
