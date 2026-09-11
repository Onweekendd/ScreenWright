import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { tokenUsageSchema } from "@/mastra/types";
import { analyzeRegionGroupsStep } from "@/mastra/workflows/figma-to-bi/semantic-layout/analyze-region-groups-step";
import { analyzeScreenRegionsStep } from "@/mastra/workflows/figma-to-bi/semantic-layout/analyze-screen-regions-step";
import { assignNodesToRegionsStep } from "@/mastra/workflows/figma-to-bi/semantic-layout/assign-nodes-to-regions-step";
import { codiaPreparationWorkflow } from "@/mastra/workflows/figma-to-bi/semantic-layout/codia-preparation-workflow";
import { rebuildSemanticContainersStep } from "@/mastra/workflows/figma-to-bi/semantic-layout/rebuild-semantic-containers-step";
import { bfsTraversalStep } from "@/mastra/workflows/figma-to-bi/steps/bfs-traversal-step";
import { ruleBasedClassificationStep } from "@/mastra/workflows/figma-to-bi/steps/classification/rule-based-classification-step";
import { generateWorkflowIdStep } from "@/mastra/workflows/figma-to-bi/steps/generate-workflow-id-step";
import {
  type NodeConvertOutput,
  nodeConvertToBIStep
} from "@/mastra/workflows/figma-to-bi/steps/node-convert/node-convert-to-bi-step";
import { cleanupWorkflowRegistryState } from "@/mastra/workflows/figma-to-bi/utils/workflow-state-cleanup";

/**
 * 图片转大屏正式 workflow：
 * 1. Codia 原子节点提取与 Gemini 一级区域识别并发；
 * 2. 代码确定性地把节点分配到区域；
 * 3. 使用 Mastra foreach 并发分析每个区域的一层功能分组；
 * 4. 重建 DynamicPanel / Group 后接入既有 BI 转换 pipeline。
 */
export const codiaToBIWorkflow = createWorkflow({
  id: "codiaToBIWorkflow",
  description:
    "把一整张大屏设计稿图片转换成大屏组件树（走 Codia image_to_design 后接入同一转换 pipeline）。入参 imageUrl 取自 <attached-images> 的 url。仅在用户上传整屏设计稿/看板截图时使用；单个组件的识图走 analyze_image。",
  inputSchema: z.object({
    imageUrl: z.string().describe("待转换的大屏设计稿图片 MinIO URL")
  }),
  outputSchema: z.any(),
  stateSchema: z.object({
    workflowId: z.string().default("").describe("工作流唯一 ID，格式: YYYYMMDD_HHmmss_uuid"),
    rootImageFilePath: z.string().default("").describe("根节点图片文件名"),
    tokenUsage: tokenUsageSchema,
    startTime: z.number().optional().describe("工作流开始时间戳"),
    endTime: z.number().optional().describe("工作流结束时间戳"),
    fileKey: z.string().optional().describe("来源标识")
  }),
  options: {
    onFinish: cleanupWorkflowRegistryState
  }
})
  // generateWorkflowIdStep 仍要求 nodeId/fileKey，用占位值喂给它（图片路不涉及 Figma 标识）
  .map(async () => ({ nodeId: "0:0", fileKey: "" }))
  .then(generateWorkflowIdStep)
  // generateWorkflowIdStep 的输出不带 imageUrl，从工作流初始入参取回
  .map(async ({ getInitData }) => ({ imageUrl: getInitData<{ imageUrl: string }>().imageUrl }))
  // 固定的两个外部分析分支由 Mastra 原生 parallel 调度并自动汇合。
  .parallel([codiaPreparationWorkflow, analyzeScreenRegionsStep])
  .then(assignNodesToRegionsStep)
  // 区域数量运行时才确定，使用 Mastra foreach 的内建并发控制。
  .foreach(analyzeRegionGroupsStep, { concurrency: 4 })
  .then(rebuildSemanticContainersStep)
  .then(bfsTraversalStep)
  .then(ruleBasedClassificationStep)
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
