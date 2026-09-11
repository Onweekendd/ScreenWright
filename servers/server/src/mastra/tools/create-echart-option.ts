import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { saveEchartOption } from "../utils/echart-option-file";

export const createEchartOptionTool = createTool({
  id: "create-echart-option",
  description: `将 ECharts option 配置写入工作区文件，返回文件路径。
文件内容必须是合法的 TypeScript：import type { EChartsOption } from "echarts"; export const option: EChartsOption = { ... };
每次调用生成独立 UUID 文件，同一 thread 下的多份 option 互不覆盖。`,
  inputSchema: z.object({
    content: z
      .string()
      .describe(
        'ECharts option 的 TypeScript 文件内容，必须包含 EChartsOption 类型声明。示例：import type { EChartsOption } from "echarts"; export const option: EChartsOption = { ... };'
      )
  }),
  outputSchema: z.object({
    filePath: z.string().describe("写入的 .ts 文件绝对路径"),
    message: z.string()
  }),
  execute: async ({ content }, context) => {
    const threadId = context?.agent?.threadId ?? "default";
    try {
      const filePath = await saveEchartOption(threadId, content);
      return {
        filePath,
        message: `ECharts option 已写入 ${filePath}。可用 tsc --noEmit 对其做类型检查。`
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`写入 ECharts option 文件失败：${message}`);
    }
  }
});
