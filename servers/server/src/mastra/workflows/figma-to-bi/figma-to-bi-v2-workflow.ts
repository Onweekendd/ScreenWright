import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { tokenUsageSchema } from "@/mastra/types";
import { bfsTraversalStep } from "@/mastra/workflows/figma-to-bi/steps/bfs-traversal-step";
import { ruleBasedClassificationStep } from "@/mastra/workflows/figma-to-bi/steps/classification/rule-based-classification-step";
import { dataProcessorStep } from "@/mastra/workflows/figma-to-bi/steps/data-processor/data-processor-step";
import { fetchFigmaStep } from "@/mastra/workflows/figma-to-bi/steps/fetch-figma-step";
import { generateWorkflowIdStep } from "@/mastra/workflows/figma-to-bi/steps/generate-workflow-id-step";
import { normalizeLayoutStep } from "@/mastra/workflows/figma-to-bi/steps/normalize-layout-step";
import { resolveStylesStep } from "@/mastra/workflows/figma-to-bi/steps/resolve-styles-step";
import { cleanupWorkflowRegistryState } from "@/mastra/workflows/figma-to-bi/utils/workflow-state-cleanup";

import { type NodeConvertOutput, nodeConvertToBIStep } from "./steps/node-convert/node-convert-to-bi-step";
import { resolveImagesStep } from "./steps/resolve-images-step";

export const figmaToBIV2Workflow = createWorkflow({
  id: "figmaToBIV2Workflow",
  description:
    "把一个 Figma 设计稿节点转换成大屏组件树。入参从用户给的 Figma 链接里提取 nodeId（形如 2:760，链接里的 2-760 要换成冒号）与 fileKey。仅在用户提供 Figma 链接时使用。",
  inputSchema: z.object({
    nodeId: z
      .string()
      .regex(/^\d+:\d+$/, "nodeId 必须是 xxx:xxx 的格式")
      .describe("Figma 节点 ID，格式：xxx:xxx"),
    fileKey: z.string().describe("Figma 文件 Key")
  }),
  outputSchema: z.any(),
  stateSchema: z.object({
    workflowId: z.string().default("").describe("工作流唯一 ID，格式: YYYYMMDD_HHmmss_uuid"),
    rootImageFilePath: z.string().default("").describe("根节点图片文件名"),
    tokenUsage: tokenUsageSchema,
    startTime: z.number().optional().describe("工作流开始时间戳"),
    endTime: z.number().optional().describe("工作流结束时间戳"),
    fileKey: z.string().optional().describe("Figma 文件 Key")
  }),
  options: {
    onFinish: cleanupWorkflowRegistryState
  }
})
  .then(generateWorkflowIdStep)
  .then(fetchFigmaStep)
  // 数据处理：处理多状态节点、面板合并、跨 frame 去重、清空图片节点子节点
  .then(dataProcessorStep)
  .then(resolveStylesStep)
  .then(normalizeLayoutStep)
  .then(bfsTraversalStep)
  // 节点分类：基于规则的分类器（替代 AI Agent）
  .then(ruleBasedClassificationStep)
  // 解析图片资源：从数据库查询并匹配到节点
  .then(resolveImagesStep)
  // 节点转换：从状态管理器获取分类结果并批量转换
  .then(nodeConvertToBIStep)
  .map(async ({ inputData }) => {
    return (inputData as NodeConvertOutput[])
      .filter((item) => Boolean(item.component))
      .map((item) => {
        return {
          name: item.component!.name,
          type: item.component!.component.prop
        };
      });
  })
  .commit();
