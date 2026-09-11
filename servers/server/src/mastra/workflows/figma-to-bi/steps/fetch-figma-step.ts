import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { assetStore } from "@/lib/storage";
import { prismaClient } from "@/mastra/storage/prisma";
import { StepEnum } from "@/mastra/types";
import { figmaFileSchema } from "@/mastra/types/figma-type";

const inputSchema = z.object({
  workflowId: z.string().describe("工作流唯一 ID"),
  nodeId: z.string().describe("Figma 节点 ID"),
  fileKey: z.string().describe("Figma 文件 Key")
});

/**
 * Figma 数据获取步骤
 *
 * 从 URL 解析 fileKey + nodeId，查询 FigmaNodeJson 表获取 MinIO 映射，
 * 从 MinIO 下载简化后的 JSON 文件并解析返回
 */
export const fetchFigmaStep = createStep({
  id: StepEnum.FETCH_FIGMA,
  description: "从 MinIO 读取已简化的 Figma 节点数据",
  inputSchema,
  outputSchema: figmaFileSchema,
  stateSchema: z.object({
    fileKey: z.string().optional().describe("Figma 文件 Key")
  }),
  execute: async ({ inputData, setState }) => {
    const { nodeId, fileKey } = inputData;

    // 1. 查询 FigmaNodeJson 表获取 MinIO 存储信息
    const record = await prismaClient.figmaNodeJson.findUnique({
      where: { fileKey_nodeId: { fileKey, nodeId } }
    });

    if (!record) {
      throw new Error(`[FetchFigma] 未找到 fileKey=${fileKey}, nodeId=${nodeId} 对应的 JSON 记录`);
    }

    // 2. 从对象存储下载 JSON 文件
    let jsonString: string;
    try {
      jsonString = await assetStore().getText(record.objectKey);

      // 3. 解析 JSON 并校验 schema
      const parsedData = JSON.parse(jsonString);
      const { nodes, globalVars } = figmaFileSchema.parse(parsedData);
      await setState({ fileKey });

      return { nodes, globalVars, fileKey };
    } catch (err) {
      throw new Error(`[FetchFigma] 下载文件失败: ${record.objectKey}, ${err}`);
    }
  }
});
