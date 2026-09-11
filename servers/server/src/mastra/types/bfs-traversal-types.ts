import { z } from "zod";

import { normalizedNodeSchema } from "./normalized-node-types";

/**
 * 扁平化节点项 Schema
 */
export const bfsTraversalStepOutputNode = z.object({
  node: normalizedNodeSchema.describe("归一化节点（不含子节点）"),
  parentId: z.string().nullable().describe("父节点 ID，根节点为 null"),
  annotateSkip: z.boolean().optional().describe("是否跳过注解"),
  depth: z.number().describe("节点深度，根节点为 0"),
  zIndex: z.number().optional().describe("节点在 z 轴上的层级，用于设置 zIndex"),
  childrenIds: z.array(z.string()).describe("子节点 ID 数组"),
  subtreeSize: z.number().describe("子树中的节点数量（包括当前节点）"),
  maxDepth: z.number().describe("整棵树的最大深度")
});

export type BfsTraversalStepNode = z.infer<typeof bfsTraversalStepOutputNode>;
