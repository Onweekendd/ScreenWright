import { createStep } from "@mastra/core/workflows";
import z from "zod";

import { workflowStateRegistry } from "@/mastra/state";
import { prismaClient } from "@/mastra/storage/prisma";
import { StepEnum } from "@/mastra/types";
import { bfsTraversalStepOutputNode } from "@/mastra/types/bfs-traversal-types";

/**
 * 输出 schema：已添加图片路径的扁平化节点列表
 */
const outputSchema = z.array(bfsTraversalStepOutputNode).describe("已添加图片路径的扁平化节点列表");

/**
 * Mastra Step: 解析图片资源
 *
 * 此步骤融合了图片下载和图片匹配的逻辑：
 * 1. 从 ImageCandidatesState 获取所有图片候选节点
 * 2. 从 FigmaNodeAsset 数据库查询这些节点的 url
 * 3. 将 url 匹配到 FlattenedNodesState 中的节点
 * 4. 为每个节点添加 imgLocalPath
 */
export const resolveImagesStep = createStep({
  id: StepEnum.RESOLVE_IMAGES,
  description: "解析图片资源：从 FigmaNodeAsset 数据库查询并匹配到节点",
  inputSchema: z.any(),
  outputSchema,
  stateSchema: z.object({
    workflowId: z.string().describe("工作流唯一 ID，格式: YYYYMMDD_HHmmss_uuid")
  }),
  execute: async ({ state }) => {
    const { imageCandidatesState, flattenedNodesState } = workflowStateRegistry.get(state.workflowId);

    // 获取所有扁平化节点
    const flattenNodeList = flattenedNodesState.getAllNodes();

    const imageCandidates = imageCandidatesState.getAllCandidates();
    if (imageCandidates.length === 0) {
      console.log(`[ResolveImages] 无图片候选，跳过解析`);
      return flattenNodeList;
    }

    console.log(`[ResolveImages] 开始解析: 候选 ${imageCandidates.length} 个，节点 ${flattenNodeList.length} 个`);

    // 从数据库查询图片 url
    const assetUrlMap = await queryAssetUrls(imageCandidates.map((c) => c.nodeId));
    console.log(`[ResolveImages] 查询完成: 匹配 ${assetUrlMap.size} 个节点`);

    // 为扁平化节点添加 imgLocalPath
    const updatedFlattenNodeList = flattenNodeList.map((nodeItem) => {
      const imgLocalPath = assetUrlMap.get(nodeItem.node.id);
      if (!imgLocalPath) {
        return nodeItem;
      }

      return {
        ...nodeItem,
        node: {
          ...nodeItem.node,
          imgLocalPath
        }
      };
    });

    // 更新状态管理器
    flattenedNodesState.set(updatedFlattenNodeList);

    return updatedFlattenNodeList;
  }
});

/**
 * 从数据库分批查询图片资源 url
 * @param nodeIds 节点 ID 列表
 * @returns nodeId → url 映射表
 */
async function queryAssetUrls(nodeIds: string[]): Promise<Map<string, string>> {
  const CHUNK_SIZE = 500;
  const assetUrlMap = new Map<string, string>();

  for (let i = 0; i < nodeIds.length; i += CHUNK_SIZE) {
    const chunk = nodeIds.slice(i, i + CHUNK_SIZE);

    const records = await prismaClient.figmaNodeAsset.findMany({
      where: { nodeId: { in: chunk } },
      select: { nodeId: true, url: true }
    });

    records.forEach((record) => {
      if (record.url) {
        assetUrlMap.set(record.nodeId, record.url);
      }
    });
  }

  return assetUrlMap;
}
