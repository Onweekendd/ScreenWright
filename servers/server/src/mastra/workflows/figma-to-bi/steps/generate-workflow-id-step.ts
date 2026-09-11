import { randomUUID } from "node:crypto";

import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { workflowStateRegistry } from "@/mastra/state";
import { StepEnum } from "@/mastra/types";

const inputSchema = z.object({
  nodeId: z.string().describe("Figma 节点 ID"),
  fileKey: z.string().describe("Figma 文件 Key")
});

const outputSchema = z.object({
  workflowId: z.string().describe("工作流唯一 ID，格式: YYYYMMDD_HHmmss_uuid"),
  nodeId: z.string().describe("Figma 节点 ID"),
  fileKey: z.string().describe("Figma 文件 Key")
});

export function createWorkflowId(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}_${hours}${minutes}${seconds}_${randomUUID()}`;
}

export const generateWorkflowIdStep = createStep({
  id: StepEnum.GENERATE_WORKFLOW_ID,
  description: "生成工作流唯一 ID（格式化日期时间 + UUID）",
  inputSchema,
  outputSchema,
  stateSchema: z.object({
    workflowId: z.string().describe("工作流唯一 ID，格式: YYYYMMDD_HHmmss_uuid"),
    startTime: z.number().optional().describe("工作流开始时间戳")
  }),

  execute: async ({ inputData, setState }) => {
    const { nodeId, fileKey } = inputSchema.parse(inputData);
    const workflowId = createWorkflowId();
    const startTime = Date.now();

    workflowStateRegistry.create(workflowId);
    setState({ workflowId, startTime });

    return {
      nodeId, // 透传节点 ID
      fileKey, // 透传文件 Key
      workflowId
    };
  }
});
