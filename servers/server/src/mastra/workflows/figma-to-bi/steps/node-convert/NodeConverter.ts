import { z } from "zod";

import { workflowStateRegistry } from "@/mastra/state";
import type {
  ComponentConversionEntry,
  ComponentConversionState,
  ConvertedComponent
} from "@/mastra/state/componentConversionState";
import type { NodeClassification, NodeClassificationState } from "@/mastra/state/nodeClassificationState";
import type { ComponentType } from "@/mastra/types";
import { ComponentSchema } from "@/mastra/types";
import type { BfsTraversalStepNode } from "@/mastra/types/bfs-traversal-types";

import type { NodeClassificationOutput } from "../classification/rule-based-classification-step";
import { ConversionStrategyFactory } from "./strategies/ConversionStrategyFactory";
import type { ConvertResult } from "./strategies/types";

// ============================================
// Output Schema（由 node-convert-step 和 output-step 使用）
// ============================================

export const nodeConvertOutputSchema = z.object({
  nodeId: z.string().describe("原始节点 ID"),
  targetType: z.string().describe("目标组件类型"),
  success: z.boolean().describe("转换是否成功"),
  message: z.string().describe("转换消息"),
  skipped: z.boolean().default(false).describe("是否跳过（merge 类型）"),
  component: ComponentSchema.nullable().describe("转换后的组件")
});

export interface NodeConvertOutput {
  nodeId: string;
  targetType: string;
  success: boolean;
  message: string;
  skipped: boolean;
  component: ComponentType | null;
}

// ============================================
// 内部类型
// ============================================

interface ParentInfo {
  parentClassificationNode: NodeClassification | null;
  parentNodeId: string | null;
  stateIndex?: number;
}

// ============================================
// NodeConverter 类
// ============================================

/**
 * 节点转换器
 *
 * 封装单个节点从 Figma 分类结果到低代码组件的完整转换逻辑，包括：
 * - 从 stateManager 获取所需状态（依赖由上游 bfsTraversalStep / nodeClassificationStep 填充）
 * - 节点查找与校验
 * - 父节点解析（支持跳过 merge 层级）
 * - 按类型分发转换策略
 * - 结果保存与父子关系建立
 */
export class NodeConverter {
  private readonly flattenNodeList: BfsTraversalStepNode[];
  private readonly classificationState: NodeClassificationState;
  private readonly conversionState: ComponentConversionState;

  /**
   * 创建节点转换器实例
   * @param workflowId - 工作流唯一标识符
   * @throws {Error} 当 ComponentConversionState 或 NodeClassificationState 未找到时抛出错误
   */
  constructor(private readonly workflowId: string) {
    const { flattenedNodesState, componentConversionState, nodeClassificationState } =
      workflowStateRegistry.get(workflowId);
    this.flattenNodeList = flattenedNodesState.getAllNodes();
    this.conversionState = componentConversionState;
    this.classificationState = nodeClassificationState;
  }

  /**
   * 执行节点转换的主流程
   * @param classification - 节点分类输出结果，包含节点 ID 和目标类型
   * @returns 转换输出结果，包含成功状态、消息和生成的组件 ID
   */
  async convert(classification: NodeClassificationOutput): Promise<NodeConvertOutput> {
    const node = this.fetchNode(classification.nodeId);
    if (!node) {
      return this.errorResponse(classification);
    }

    if (classification.targetType === "merge" || classification.targetType === "root") {
      return this.skippedResponse(classification);
    }

    const parentInfo = this.resolveParent(node);

    const result = await this.convertByStrategy(classification, node);
    if (!result.component) {
      return this.failedResponse(classification, result.message);
    }

    this.save(classification, parentInfo, result.component, node.childrenIds);

    return this.successResponse(classification, result.component, result.message);
  }

  /**
   * 从扁平化节点列表中查找指定节点
   * @param nodeId - 节点唯一标识符
   * @returns 找到的节点对象，未找到时返回 null
   */
  private fetchNode(nodeId: string): BfsTraversalStepNode | null {
    return this.flattenNodeList.find((item) => item.node.id === nodeId) ?? null;
  }

  /**
   * 解析节点的父节点信息
   * 跳过 merge 类型的父节点，找到第一个可合并的父节点
   * @param node - BFS 遍历步骤节点
   * @returns 父节点信息，包含父分类节点、父节点 ID 和状态索引
   */
  private resolveParent(node: BfsTraversalStepNode): ParentInfo {
    const parentNodeId = node.parentId ?? null;
    if (!parentNodeId) {
      return { parentClassificationNode: null, parentNodeId: null };
    }

    const parentClassificationNode = this.findMergeableParent(parentNodeId);
    return { parentClassificationNode, parentNodeId, stateIndex: node.node.stateIndex };
  }

  /**
   * 递归向上查找第一个可作为父容器的祖先节点（跳过 merge 和 root 类型）
   * @param currentParentId - 当前父节点的 ID
   * @returns 找到的有效父节点，未找到时返回 null
   */
  private findMergeableParent(currentParentId: string): NodeClassification | null {
    const parentClassification = this.classificationState.get().find((item) => item.nodeId === currentParentId);
    if (!parentClassification) {
      return null;
    }

    const skippedTypes = ["merge", "root"];
    if (!skippedTypes.includes(parentClassification.targetType)) {
      return parentClassification;
    }

    const parentNode = this.flattenNodeList.find((item) => item.node.id === currentParentId);
    if (!parentNode?.parentId) {
      return null;
    }
    return this.findMergeableParent(parentNode.parentId);
  }

  /**
   * 根据目标类型使用相应的转换策略进行节点转换
   * @param classification - 节点分类输出结果
   * @param node - BFS 遍历步骤节点
   * @returns 转换结果，包含生成的组件和消息
   */
  private async convertByStrategy(
    classification: NodeClassificationOutput,
    node: BfsTraversalStepNode
  ): Promise<ConvertResult> {
    const { targetType, nodeId } = classification;

    const strategy = ConversionStrategyFactory.create(targetType);
    if (!strategy) {
      return { component: null, message: `未知的目标类型: ${targetType}` };
    }

    try {
      // FIXME: 确认是否需要 fileKey
      return await strategy.convert({ node, workflowId: this.workflowId, fileKey: "" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ 转换节点 ${nodeId} 失败:`, errorMessage);
      return { component: null, message: `转换失败: ${errorMessage}` };
    }
  }

  /**
   * 保存转换结果到组件转换状态，并更新父子关系
   * @param classification - 节点分类输出结果
   * @param parentInfo - 父节点信息
   * @param component - 转换后的组件
   * @param childrenIds - 子节点 ID 列表
   */
  private save(
    classification: NodeClassificationOutput,
    parentInfo: ParentInfo,
    component: ConvertedComponent,
    childrenIds: string[]
  ): void {
    const entry: ComponentConversionEntry = {
      nodeId: classification.nodeId,
      parentId: parentInfo.parentClassificationNode?.nodeId ?? null,
      targetType: classification.targetType,
      component,
      depth: this.flattenNodeList.find((item) => item.node.id === classification.nodeId)?.depth ?? 0,
      childrenIds,
      convertedAt: Date.now()
    };

    this.conversionState.addComponent(entry);

    if (parentInfo.parentClassificationNode) {
      const currentNode = this.fetchNode(classification.nodeId);
      this.conversionState.updateParentWithChild(
        parentInfo.parentClassificationNode.nodeId,
        component,
        currentNode?.node.stateIndex
      );
    } else {
      console.log(`\n🌳 根节点，无需更新父组件`);
    }
  }

  /**
   * 生成成功转换的响应对象
   * @param classification - 节点分类输出结果
   * @param component - 转换后的组件
   * @param message - 转换消息
   * @returns 成功的转换输出结果
   */
  private successResponse(
    classification: NodeClassificationOutput,
    component: ConvertedComponent,
    message: string
  ): NodeConvertOutput {
    return {
      nodeId: classification.nodeId,
      targetType: classification.targetType,
      success: true,
      message,
      skipped: false,
      component: component as ComponentType
    };
  }

  /**
   * 生成错误响应对象（未找到节点数据）
   * @param classification - 节点分类输出结果
   * @returns 错误的转换输出结果
   */
  private errorResponse(classification: NodeClassificationOutput): NodeConvertOutput {
    console.error(`\n❌ 错误: 未找到节点的原始数据`);
    console.log(`${"=".repeat(80)}\n`);
    return {
      nodeId: classification.nodeId,
      targetType: classification.targetType,
      success: false,
      message: `未找到节点的原始 Figma 数据`,
      skipped: false,
      component: null
    };
  }

  /**
   * 生成跳过转换的响应对象（merge 类型节点）
   * @param classification - 节点分类输出结果
   * @returns 跳过的转换输出结果
   */
  private skippedResponse(classification: NodeClassificationOutput): NodeConvertOutput {
    console.log(`\n⏭️  跳过转换（merge 类型）`);
    console.log(`${"=".repeat(80)}\n`);
    return {
      nodeId: classification.nodeId,
      targetType: classification.targetType,
      success: true,
      message: "跳过 merge 类型节点",
      skipped: true,
      component: null
    };
  }

  /**
   * 生成转换失败的响应对象
   * @param classification - 节点分类输出结果
   * @param errorMessage - 错误消息
   * @returns 失败的转换输出结果
   */
  private failedResponse(classification: NodeClassificationOutput, errorMessage: string): NodeConvertOutput {
    console.error(`\n❌ 转换失败: ${errorMessage}`);
    console.log(`${"=".repeat(80)}\n`);
    return {
      nodeId: classification.nodeId,
      targetType: classification.targetType,
      success: false,
      message: errorMessage,
      skipped: false,
      component: null
    };
  }
}
