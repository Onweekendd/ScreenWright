import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { workflowStateRegistry } from "@/mastra/state";
import { StepEnum } from "@/mastra/types";
import { type BfsTraversalStepNode, bfsTraversalStepOutputNode } from "@/mastra/types/bfs-traversal-types";
import type { NormalizedNode } from "@/mastra/types/normalized-node-types";
import { outputSchema as normalizedLayoutOutputSchema } from "@/mastra/workflows/figma-to-bi/steps/normalize-layout-step";
import { groupNodesByDepth } from "@/mastra/workflows/figma-to-bi/utils";

export const bfsTraversalStepOutputSchema = z.array(z.array(bfsTraversalStepOutputNode)).describe("按照深度归类");

/**
 * BFS 遍历结果（不含 subtreeSize 和最终 maxDepth）
 */
interface BfsTraversalResult {
  nodes: Array<BfsTraversalStepNode>;
  maxDepth: number;
  nodeIndexMap: Map<string, number>;
}

/**
 * 阶段1：BFS 广度优先遍历树
 * @param root 根节点
 * @returns 扁平化节点列表、最大深度、节点索引映射
 */
export function bfsTraverse(root: NormalizedNode): BfsTraversalResult {
  const nodes: Array<BfsTraversalStepNode> = [];
  const nodeIndexMap = new Map<string, number>();

  let maxDepth = 0;
  let zIndex = 0;

  const queue: Array<{ node: NormalizedNode; parentId: string | null; depth: number }> = [
    { node: root, parentId: null, depth: 0 }
  ];

  while (queue.length > 0) {
    const { node, parentId, depth } = queue.shift()!;

    maxDepth = Math.max(maxDepth, depth);
    zIndex += 1;

    const children = node.children;
    const childrenIds = children?.map((child) => child.id) || [];

    // 子节点入队（保证同一父节点的子节点连续）
    if (children?.length) {
      for (const child of children) {
        queue.push({ node: child, parentId: node.id, depth: depth + 1 });
      }
    }

    // 记录节点索引，用于后续 O(1) 查找
    nodeIndexMap.set(node.id, nodes.length);

    nodes.push({
      node: {
        ...node,
        isLeaf: childrenIds.length === 0
      },
      childrenIds,
      zIndex,
      parentId,
      depth,
      subtreeSize: 1, // 叶子节点默认值，非叶子节点在阶段2计算
      maxDepth: 0 // 占位，阶段3统一设置
    });
  }

  // 反转 zIndex：第一个遍历到的节点 zIndex 最大
  const total = nodes.length;
  for (const node of nodes) {
    if (node.zIndex !== undefined) {
      node.zIndex = total - node.zIndex + 1;
    }
  }

  return { nodes, maxDepth, nodeIndexMap };
}

/**
 * 阶段2：反向遍历计算 subtreeSize
 * 使用 Map 优化查找，时间复杂度 O(n)
 * @param nodes 扁平化节点列表
 * @param nodeIndexMap 节点 ID 到索引的映射
 */
function computeSubtreeSizes(nodes: Array<BfsTraversalStepNode>, nodeIndexMap: Map<string, number>): void {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const current = nodes[i];
    if (current.childrenIds.length === 0) {
      continue;
    }

    let childrenSubtreeSize = 0;
    for (const childId of current.childrenIds) {
      const childIndex = nodeIndexMap.get(childId);
      if (childIndex !== undefined) {
        childrenSubtreeSize += nodes[childIndex].subtreeSize;
      }
    }
    current.subtreeSize = 1 + childrenSubtreeSize;
  }
}

/**
 * 阶段3：设置所有节点的最终 maxDepth
 * @param nodes 扁平化节点列表
 * @param maxDepth 整棵树的最大深度
 */
function setFinalMaxDepth(nodes: Array<BfsTraversalStepNode>, maxDepth: number): void {
  for (const node of nodes) {
    node.maxDepth = maxDepth;
  }
}

/**
 * 对根节点执行完整的 BFS 遍历三阶段处理：
 * 1. BFS 广度优先遍历
 * 2. 计算 subtreeSize
 * 3. 设置最终 maxDepth
 * @param root 根节点
 * @returns 完整处理后的扁平化节点列表
 */
export function buildTraversalNodes(root: NormalizedNode): Array<BfsTraversalStepNode> {
  const { nodes, maxDepth, nodeIndexMap } = bfsTraverse(root);
  computeSubtreeSizes(nodes, nodeIndexMap);
  setFinalMaxDepth(nodes, maxDepth);
  return nodes;
}

/**
 * 标记所有选项卡节点的子节点为跳过注解
 * @param nodes 大屏的节点列表
 */
export const removeSubtabChildNode = (nodes: Array<BfsTraversalStepNode>) => {
  const subtabSets = new Set<string>();
  const childSets = new Set<string>();
  for (const bfsNode of nodes) {
    const { node, parentId } = bfsNode;
    if (node.name.endsWith("-subtab")) {
      subtabSets.add(node.id);
    }

    if ((parentId && subtabSets.has(parentId)) || childSets.has(parentId!)) {
      childSets.add(node.id);
    }
  }
  for (const bfsNode of nodes) {
    if (childSets.has(bfsNode.node.id)) {
      bfsNode.annotateSkip = true;
    }
  }
  return nodes;
};

/**
 * BFS 广度优先遍历组件树
 */
export const bfsTraversalStep = createStep({
  id: StepEnum.BFS_TRAVERSAL,
  description: "对归一化节点树进行 BFS 广度优先遍历，输出按深度和父节点分组的扁平化节点列表",
  inputSchema: normalizedLayoutOutputSchema,
  outputSchema: bfsTraversalStepOutputSchema,
  stateSchema: z.object({ workflowId: z.string() }),
  execute: async ({ inputData, state }) => {
    const { flattenedNodesState } = workflowStateRegistry.get(state.workflowId);

    // 清空之前的数据
    flattenedNodesState.clear();

    // 边界检查
    if (!inputData.nodes?.length) {
      return [];
    }

    const root = inputData.nodes[0];

    const nodes = buildTraversalNodes(root);

    // 将打平节点存储到状态管理器
    flattenedNodesState.set(nodes);

    // 按深度分组（返回从深到浅的二维数组）
    return groupNodesByDepth(removeSubtabChildNode(nodes));
  }
});
