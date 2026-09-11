import { createStep } from "@mastra/core/workflows";
import z from "zod";

import { workflowStateRegistry } from "@/mastra/state";
import { prismaClient } from "@/mastra/storage/prisma";
import { StepEnum } from "@/mastra/types";
import { bfsTraversalStepOutputNode } from "@/mastra/types/bfs-traversal-types";

import { outputSchema as figmaDownloadImagesOutputSchema } from "./figma-download-images-step";

// 输入 schema：图片下载步骤的输出
const inputSchema = figmaDownloadImagesOutputSchema;

/**
 * 输出 schema：更新后的扁平化节点列表
 */
const outputSchema = z.array(bfsTraversalStepOutputNode).describe("已添加图片路径的扁平化节点列表");

export const matchImagesStep = createStep({
  id: StepEnum.MATCH_IMAGES,
  description: "将下载的图片匹配到扁平化节点列表",
  inputSchema,
  outputSchema,
  stateSchema: z.object({ workflowId: z.string() }),
  execute: async ({ inputData, state }) => {
    const { flattenedNodesState } = workflowStateRegistry.get(state.workflowId);

    try {
      if (!inputData) {
        throw new Error("Input data not found");
      }

      const flattenNodeList = flattenedNodesState.getAllNodes();

      // 检查输入类型：是图片下载结果还是直接的 figmaFile
      const parsedInput = inputSchema.parse(inputData);

      let figmaImages: Array<{ nodeId: string; filePath: string }> = [];

      // 如果输入包含 downloadedImages 字段，说明是图片下载步骤的输出
      if ("downloadedImages" in parsedInput) {
        figmaImages = parsedInput.downloadedImages;
      }

      // 如果没有图片数据，直接返回原始扁平化列表
      if (figmaImages.length === 0) {
        console.log("没有下载的图片，返回原始扁平化节点列表");
        return flattenNodeList;
      }

      // 创建 nodeId -> filePath 的映射表
      const imageMap = new Map<string, string>();
      figmaImages.forEach((img) => {
        imageMap.set(img.nodeId, img.filePath);
      });

      console.log(`匹配 ${figmaImages.length} 张图片到扁平化节点列表`);

      // 收集所有节点 ID，分批查询 FigmaNodeAsset 表中的 url（SQLite IN 参数上限为 999）
      const allNodeIds = flattenNodeList.map((item) => item.node.id);
      const CHUNK_SIZE = 500;
      const allAssetRecords: Array<{ nodeId: string; url: string | null; updatedAt: Date }> = [];
      for (let i = 0; i < allNodeIds.length; i += CHUNK_SIZE) {
        const chunk = allNodeIds.slice(i, i + CHUNK_SIZE);
        const records = await prismaClient.figmaNodeAsset.findMany({
          where: { nodeId: { in: chunk } },
          select: { nodeId: true, url: true, updatedAt: true },
          orderBy: { updatedAt: "desc" }
        });
        allAssetRecords.push(...records);
      }

      // 构建 nodeId -> url 的映射（优先使用数据库中的 url）
      const assetUrlMap = new Map<string, string>();
      allAssetRecords.forEach((record) => {
        if (record.url) {
          assetUrlMap.set(record.nodeId, record.url);
        }
      });

      // 遍历扁平化节点列表，为匹配的节点添加 imgLocalPath
      // 优先使用 FigmaNodeAsset 表中的 url，其次使用本地下载路径
      const updatedFlattenNodeList = flattenNodeList.map((nodeItem) => {
        const dbUrl = assetUrlMap.get(nodeItem.node.id);
        const localPath = imageMap.get(nodeItem.node.id);
        const imgLocalPath = dbUrl ?? localPath;

        if (imgLocalPath) {
          console.log(
            `节点 ${nodeItem.node.id} (${nodeItem.node.name}) 匹配到图片: ${imgLocalPath}${dbUrl ? " [来自数据库]" : " [来自本地]"}`
          );
          return {
            ...nodeItem,
            node: {
              ...nodeItem.node,
              imgLocalPath
            }
          };
        }

        return nodeItem;
      });

      console.log(`图片匹配完成，更新了 ${figmaImages.length} 个节点`);

      // 更新状态管理器中的数据
      flattenedNodesState.set(updatedFlattenNodeList);

      return updatedFlattenNodeList;
    } catch (error) {
      throw new Error(`Failed to match images: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});
