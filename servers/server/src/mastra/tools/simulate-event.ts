/**
 * 事件干跑工具：给定触发组件、事件类型、抛出值，真跑一遍事件链路，报出三段结论。
 *
 * 逻辑全在 `services/event-simulation.ts`，这里只是把它挂成工具。
 * 之前是命令行脚本 `scripts/simulateEvent.ts`，agent 调一次要在沙箱里摸 shell 语法、
 * 读源码看用法、再跟 cmd.exe 的引号转义搏斗——实测一轮 7 次调用才跑通一次。
 * 做成工具后入参就是 JSON，一次调用。
 */

import { createTool } from "@mastra/core/tools";
import { EventTypeEnum } from "@screenwright/types";
import { z } from "zod";

import { simulateEvent as runSimulation } from "@/mastra/services/event-simulation";

const InputSchema = z.object({
  screenId: z.string().min(1).describe('大屏目录标识，格式 "{screenId}_{versionCode}"，如 "9001_1"'),
  componentId: z.number().int().positive().describe("触发事件的源组件 id"),
  triggerType: z
    .enum(Object.values(EventTypeEnum) as [string, ...string[]])
    .describe("事件类型，如 click / dataChange。用 listAvailableEvents 查该组件支持哪些"),
  throwValue: z
    .union([z.record(z.string(), z.any()), z.array(z.any())])
    .describe(
      "抛出对象：就是该组件渲染数据的一项，形状 = 它 data[0] 的形状。" +
        "dataChange 可传整表（数组）。这是必填项，从触发组件的 data 字段取真实数据，不要编"
    )
});

export const simulateEvent = createTool({
  // id 必须与 agent 里的注册键一致：常驻工具在模型眼里的名字取自 tools 对象的键
  id: "simulateEvent",
  description:
    "事件干跑：在 Node 里真跑一遍「条件求值 → 动作规划 → 抛回调 → 消费方重算过滤器」，" +
    "输出三段——事件（trigger 匹配情况、条件是否满足）、动作（哪些组件会响应）、" +
    "回调参数（消费方真算出来的过滤结果）。动作本身不执行（没有 DOM），显隐/动画/跳转只报告会被触发；" +
    "过滤结果是真算出来的，可直接作为「回调参数配没配对」的依据。" +
    "配完事件或数据流之后用它自检，不要去跑 scripts/ 下的脚本。",
  inputSchema: InputSchema,

  outputSchema: z.object({
    summary: z.string().describe("人话版三段结论，直接读这个"),
    eventCount: z.number(),
    events: z.array(
      z.object({
        name: z.string(),
        conditionSatisfied: z.boolean(),
        plannedActions: z.number(),
        note: z.string().optional()
      })
    ),
    actions: z.array(
      z.object({
        actionType: z.string(),
        targets: z.array(z.object({ id: z.number(), name: z.string() })),
        conditionSatisfied: z.boolean(),
        scopeSize: z.number()
      })
    ),
    callbacks: z.array(
      z.object({
        callbackName: z.string(),
        consumer: z.object({ id: z.number(), name: z.string() }),
        rowCount: z.number().nullable(),
        rows: z.any()
      })
    )
  }),

  execute: async (input) => {
    const { screenId, componentId, triggerType, throwValue } = input as unknown as z.infer<typeof InputSchema>;
    const result = await runSimulation({
      screenKey: screenId,
      componentId,
      triggerType: triggerType as EventTypeEnum,
      throwValue
    });
    return {
      summary: result.summary,
      eventCount: result.eventCount,
      events: result.events,
      actions: result.actions,
      callbacks: result.callbacks
    };
  }
});
