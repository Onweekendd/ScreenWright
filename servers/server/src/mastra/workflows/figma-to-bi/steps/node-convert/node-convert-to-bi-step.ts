import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { workflowStateRegistry } from "@/mastra/state";
import { StepEnum } from "@/mastra/types";

import { NodeConverter, nodeConvertOutputSchema } from "./NodeConverter";

// 从独立的类型文件导入，避免循环依赖
export type { NormalizedNode } from "../../../../types/normalized-node-types";
export { normalizedNodeSchema, normalizedNodeSchemaWithoutChild } from "../../../../types/normalized-node-types";

export { nodeConvertOutputSchema };
export type { NodeConvertOutput } from "./NodeConverter";

/**
 * 节点转换步骤
 *
 * 职责：
 * 1. 从状态管理器获取所有节点分类结果
 * 2. 逐个委托给 NodeConverter 执行转换流程
 *
 * 依赖（由上游 step 填充到 stateManager）：
 * - FLATTENED_NODES（由 bfsTraversalStep 填充）
 * - NODE_CLASSIFICATIONS（由 ruleBasedClassificationStep 填充）
 * - COMPONENT_CONVERSIONS（由 stateManager 初始化）
 */
export const nodeConvertToBIStep = createStep({
  id: StepEnum.NODE_CONVERT_TO_BI,
  description: "将分类后的节点转换为低代码组件",
  inputSchema: z.any().describe("接收上游步骤输出（实际不使用，从状态管理器获取数据）"),
  outputSchema: z.array(nodeConvertOutputSchema).describe("转换结果列表"),
  stateSchema: z.object({
    workflowId: z.string().describe("工作流 ID")
  }),

  execute: async ({ state, writer }) => {
    const {
      nodeClassificationState: classificationState,
      componentConversionState: conversionState,
      flattenedNodesState
    } = workflowStateRegistry.get(state.workflowId);

    const classifications = classificationState.getAllClassifications();
    const converter = new NodeConverter(state.workflowId);

    // 将 BFS 顺序重排为 DFS 顺序（父节点先于子节点，且同一父节点下的子节点连续排列）
    const allNodes = flattenedNodesState?.getAllNodes() ?? [];
    const nodeMap = new Map(allNodes.map((n) => [n.node.id, n]));
    const classificationMap = new Map(classifications.map((c) => [c.nodeId, c]));
    const dfsOrdered: typeof classifications = [];

    const dfsVisit = (nodeId: string) => {
      const classification = classificationMap.get(nodeId);
      if (classification) {
        dfsOrdered.push(classification);
      }
      const node = nodeMap.get(nodeId);
      if (node) {
        for (const childId of node.childrenIds) {
          dfsVisit(childId);
        }
      }
    };

    for (const rootNode of allNodes.filter((n) => n.parentId === null)) {
      dfsVisit(rootNode.node.id);
    }

    console.log(`\n🔄 开始转换节点: ${dfsOrdered.length} 个（深度优先顺序）`);

    // 顺序处理，确保父节点先于子节点转换并写入
    const results: Awaited<ReturnType<typeof converter.convert>>[] = [];
    for (const classification of dfsOrdered) {
      const conversionResult = await converter.convert(classification);
      const result = conversionState?.getByNodeId(classification.nodeId);
      if (!result) {
        continue;
      }
      const component = result.component;

      const nodeId = conversionResult.nodeId;
      const bfsNode = flattenedNodesState?.getNodeById(nodeId);
      const stateIndex = bfsNode?.node.stateIndex;
      const parentNodeId = conversionState?.getByNodeId(nodeId)?.parentId ?? null;

      await writer.custom({
        type: "data-node-conversion",
        data: {
          component: structuredClone({
            ...conversionResult.component,
            left: component.left,
            top: component.top
          }),
          nodeId,
          parentNodeId,
          moduleId: component.moduleId,
          stateIndex
        }
      });
      results.push(conversionResult);
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;
    const skippedCount = results.filter((r) => r.skipped).length;

    console.log(`\n✅ 节点转换完成:`);
    console.log(`   成功: ${successCount} 个`);
    console.log(`   跳过: ${skippedCount} 个 (merge 类型)`);
    console.log(`   失败: ${failedCount} 个`);

    return results;
  }
});
