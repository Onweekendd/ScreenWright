import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { workflowStateRegistry } from "@/mastra/state";
import type { NodeClassification } from "@/mastra/state/nodeClassificationState";
import { nodeClassificationSchema } from "@/mastra/state/nodeClassificationState";
import { StepEnum } from "@/mastra/types";
import type { BfsTraversalStepNode } from "@/mastra/types/bfs-traversal-types";
import { bfsTraversalStepOutputNode } from "@/mastra/types/bfs-traversal-types";
import { RuleBasedNodeClassifier } from "@/mastra/workflows/figma-to-bi/steps/classification/rule-based-node-classifier";

/**
 * 输入 schema - 接收 BFS 遍历后的按深度分组的节点
 */
const inputSchema = z.array(z.array(bfsTraversalStepOutputNode)).describe("按深度分组的节点列表");

/**
 * 输出 schema - 输出分类结果数组
 */
export const nodeClassificationOutputSchema = z.array(nodeClassificationSchema);

export type NodeClassificationOutput = z.infer<typeof nodeClassificationSchema>;

/**
 * 基于规则的节点分类步骤
 *
 * 使用 RuleBasedNodeClassifier 根据 Figma 命名规则和节点类型
 * 进行分类决策，无需 AI Agent
 *
 * 功能：
 * 1. 从 FlattenedNodesState 获取扁平化节点
 * 2. 构建节点注释
 * 3. 使用 RuleBasedNodeClassifier 进行分类
 * 4. 保存分类结果到 NodeClassificationState
 * 5. 保存图片候选到 ImageCandidatesState
 * 6. 返回分类结果供后续步骤使用
 */
export const ruleBasedClassificationStep = createStep({
  id: StepEnum.RULE_BASED_CLASSIFICATION,
  description: "基于规则的节点分类：使用命名规则和节点类型进行分类决策",
  inputSchema,
  outputSchema: nodeClassificationOutputSchema,
  stateSchema: z.object({ workflowId: z.string() }),
  execute: async ({ inputData: _inputData, state }) => {
    console.log("[RuleBasedClassificationStep] 开始基于规则的节点分类");

    const {
      flattenedNodesState,
      nodeClassificationState: classificationState,
      imageCandidatesState
    } = workflowStateRegistry.get(state.workflowId);

    // 2. 清空状态（支持重新执行）
    classificationState.clear();
    imageCandidatesState.clear();

    // 3. 从 FlattenedNodesState 获取扁平化节点列表
    const flattenedNodes = flattenedNodesState.get() as BfsTraversalStepNode[];
    console.log(`[RuleBasedClassificationStep] 扁平化节点数量: ${flattenedNodes.length}`);

    // 4. 创建基于规则的分类器
    const classifier = new RuleBasedNodeClassifier(flattenedNodes, classificationState, imageCandidatesState);

    // 5. 执行分类
    console.log(`[RuleBasedClassificationStep] 开始分类 ${flattenedNodes.length} 个节点`);
    const startTime = Date.now();
    const classifications = classifier.classifyNodes(flattenedNodes);
    const endTime = Date.now();

    // 6. 统计结果
    const skippedCount = flattenedNodes.length - classifications.length;
    const imageCandidateCount = imageCandidatesState.getCandidateCount();

    console.log(`[RuleBasedClassificationStep] 分类完成:`);
    console.log(`  - 总节点数: ${flattenedNodes.length}`);
    console.log(`  - 已分类: ${classifications.length}`);
    console.log(`  - 跳过: ${skippedCount}`);
    console.log(`  - 图片候选: ${imageCandidateCount}`);
    console.log(`  - 耗时: ${endTime - startTime}ms`);
    console.log(`  - 平均每个节点: ${((endTime - startTime) / flattenedNodes.length).toFixed(3)}ms`);

    // 8. 返回分类结果数组
    return classifications as NodeClassification[];
  }
});
