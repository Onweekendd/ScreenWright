import { FolderEnum, InteractiveEnum, MediaEnum, PanelEnum, TextEnum } from "@screenwright/types";

import type { ImageCandidate } from "@/mastra/state/imageCandidatesState";
import { ImageCandidatesState } from "@/mastra/state/imageCandidatesState";
import type { NodeClassification } from "@/mastra/state/nodeClassificationState";
import { NodeClassificationState } from "@/mastra/state/nodeClassificationState";
import { generateFileName } from "@/mastra/tools/utils";
import type { BfsTraversalStepNode } from "@/mastra/types/bfs-traversal-types";
import type { fillType } from "@/mastra/types/figma-type";
import type { NormalizedNode } from "@/mastra/types/normalized-node-types";
import {
  isExhibitionNode,
  isGroupNode,
  isImageNode,
  isMergeNode,
  isPanelNode,
  isStatusNode,
  isSubtabNode
} from "@/mastra/workflows/figma-to-bi/utils/naming-rules";

/**
 * 基于规则的节点分类器
 *
 * 根据 Figma 转 BI 规范，使用命名规则和节点类型
 * 进行分类决策，无需 AI Agent
 *
 * @example
 * ```typescript
 * // 创建新实例
 * const classifier = new RuleBasedNodeClassifier(flattenedNodes);
 *
 * // 或使用已有状态
 * const classifier = new RuleBasedNodeClassifier(
 *   flattenedNodes,
 *   existingClassificationState,
 *   existingImageCandidatesState
 * );
 *
 * const classifications = classifier.classifyNodes(annotations);
 *
 * // 获取状态
 * const classificationState = classifier.getClassificationState();
 * const imageCandidatesState = classifier.getImageCandidatesState();
 * ```
 */
export class RuleBasedNodeClassifier {
  private classificationState: NodeClassificationState;
  private imageCandidatesState: ImageCandidatesState;
  private flattenedNodes: Map<string, BfsTraversalStepNode>;

  /**
   * 构造函数
   *
   * @param flattenedNodes 扁平化的节点列表
   * @param existingClassificationState 现有的分类状态（可选）
   * @param existingImageCandidatesState 现有的图片候选状态（可选）
   */
  constructor(
    flattenedNodes: BfsTraversalStepNode[],
    existingClassificationState?: NodeClassificationState,
    existingImageCandidatesState?: ImageCandidatesState
  ) {
    // 使用传入的状态或创建新实例
    this.classificationState = existingClassificationState || new NodeClassificationState();
    this.imageCandidatesState = existingImageCandidatesState || new ImageCandidatesState();

    // 构建扁平化节点映射
    this.flattenedNodes = new Map();
    for (const node of flattenedNodes) {
      this.flattenedNodes.set(node.node.id, node);
    }
  }

  /**
   * 批量分类节点
   *
   * @param nodes 扁平化的节点列表
   * @returns 分类结果数组
   */
  classifyNodes(nodes: BfsTraversalStepNode[]): NodeClassification[] {
    const results: NodeClassification[] = [];

    for (const bfsNode of nodes) {
      // 验证节点是否存在于扁平化节点列表中
      if (!this.flattenedNodes.has(bfsNode.node.id)) {
        throw new Error(`节点 ${bfsNode.node.id} 未在扁平化节点列表中找到`);
      }

      // 检查是否被跳过（父节点已转为图片）
      if (this.imageCandidatesState.isNodeSkipped(bfsNode.node.id)) {
        console.log(`[RuleBasedClassifier] 节点 ${bfsNode.node.id} 被跳过（父节点已转为图片）`);
        continue;
      }

      // 获取父节点分类
      const parentClassification = bfsNode.parentId
        ? this.classificationState.getClassificationById(bfsNode.parentId)
        : undefined;

      // 分类单个节点
      const classification = this.classifyNode(bfsNode, parentClassification);

      // 保存分类结果到状态
      this.classificationState.addClassification(classification);
      results.push(classification);
    }

    return results;
  }

  /**
   * 分类单个节点
   *
   * @param bfsNode 扁平化节点
   * @param parentClassification 父节点分类
   * @returns 节点分类结果
   */
  private classifyNode(bfsNode: BfsTraversalStepNode, parentClassification?: NodeClassification): NodeClassification {
    // 确定目标类型
    const targetType = this.determineTargetType(bfsNode);

    // 计算动态面板深度
    const dynamicPanelDepth = this.calculateDynamicPanelDepth(targetType, parentClassification);

    // 生成分类结果
    const classification: NodeClassification = {
      nodeId: bfsNode.node.id,
      originalType: bfsNode.node.type,
      targetType,
      dynamicPanelDepth,
      complexity: 0, // 基于规则分类不需要复杂度评分
      reason: this.generateReason(bfsNode)
    };

    // 如果是图片节点，收集图片候选
    if (targetType === MediaEnum.FtImg) {
      this.collectImageCandidate(bfsNode, classification);
    }

    // 如果是 subtab 节点，标记子节点为跳过
    if (targetType === InteractiveEnum.Subtabs) {
      this.markChildrenAsSkipped(bfsNode.node.id);
    }

    return classification;
  }

  /**
   * 确定目标组件类型
   *
   * @param bfsNode 扁平化节点
   * @returns 目标组件类型
   */
  private determineTargetType(bfsNode: BfsTraversalStepNode): NodeClassification["targetType"] {
    const name = bfsNode.node.name;
    const figmaType = bfsNode.node.type;

    // 优先级 1: 检查命名后缀
    if (isExhibitionNode(name)) {
      return "root"; // exhibition 作为特殊的动态面板处理
    }

    if (isSubtabNode(name)) {
      return InteractiveEnum.Subtabs;
    }

    if (isPanelNode(name) && figmaType === "FRAME") {
      return PanelEnum.dynamicPanel;
    }

    if (isStatusNode(name) && figmaType === "FRAME") {
      return "merge"; // status 节点标记为 merge，由后续步骤处理
    }

    if (isMergeNode(name) && figmaType === "FRAME") {
      return "merge";
    }

    if (isImageNode(name)) {
      // 只有标记为 -image 的节点才转为图片
      return MediaEnum.FtImg;
    }

    if (isGroupNode(name)) {
      return FolderEnum.group;
    }

    // 优先级 2: 检查节点类型
    if (this.isTextNode(bfsNode.node)) {
      return TextEnum.FtRichtext;
    }

    // 优先级 3: 默认规则
    // 未打标记的 FRAME 容器节点默认识别为动态面板
    if (figmaType === "FRAME") {
      return PanelEnum.dynamicPanel;
    }

    // 其余未打标记的非文本节点（GROUP/VECTOR/RECTANGLE/INSTANCE 等）统一收敛为图片
    return MediaEnum.FtImg;
  }

  /**
   * 计算动态面板深度
   *
   * @param targetType 目标类型
   * @param parentClassification 父节点分类
   * @returns 动态面板深度
   */
  private calculateDynamicPanelDepth(
    targetType: NodeClassification["targetType"],
    parentClassification?: NodeClassification
  ): number {
    // 如果当前节点是动态面板，深度加 1
    if (targetType === PanelEnum.dynamicPanel) {
      return (parentClassification?.dynamicPanelDepth || 0) + 1;
    }

    // 否则继承父节点深度
    return parentClassification?.dynamicPanelDepth || 0;
  }

  /**
   * 生成决策原因说明
   *
   * @param bfsNode 扁平化节点
   * @returns 决策原因
   */
  private generateReason(bfsNode: BfsTraversalStepNode): string {
    const name = bfsNode.node.name;
    const figmaType = bfsNode.node.type;

    if (isExhibitionNode(name)) {
      return `节点名称以 "-exhibition" 结尾，识别为展项根节点`;
    }

    if (isSubtabNode(name)) {
      return `节点名称以 "-subtab" 结尾，识别为选项卡组件`;
    }

    if (isPanelNode(name) && figmaType === "FRAME") {
      return `节点名称以 "-panel" 结尾且类型为 FRAME，识别为动态面板`;
    }

    if (isStatusNode(name) && figmaType === "FRAME") {
      return `节点名称以 "-status" 结尾，标记为状态节点（合并处理）`;
    }

    if (isMergeNode(name) && figmaType === "FRAME") {
      return `节点名称以 "-merge" 结尾，标记为合并层`;
    }

    if (isImageNode(name)) {
      return `节点名称以 "-image" 结尾，识别为图片组件`;
    }

    if (isGroupNode(name) && figmaType === "GROUP") {
      return `节点名称以 "-group" 结尾且类型为 GROUP，识别为分组组件`;
    }

    if (this.isTextNode(bfsNode.node)) {
      return `节点类型为 TEXT，识别为富文本组件`;
    }

    if (figmaType === "FRAME") {
      return `未打标记的 FRAME 节点，默认识别为动态面板`;
    }

    return `未打标记的非容器节点，默认识别为图片组件`;
  }

  /**
   * 收集图片候选
   *
   * @param bfsNode 扁平化节点
   * @param classification 分类结果
   */
  private collectImageCandidate(bfsNode: BfsTraversalStepNode, classification: NodeClassification): void {
    // 从节点的 fills 中提取 imageRef
    const imageRef = this.extractImageRefFromFills(bfsNode.node);

    // 如果节点有子节点，获取所有后代节点 ID 用于标记跳过
    const allDescendants = bfsNode.childrenIds.length > 0 ? this.getAllDescendantIds(bfsNode.node.id) : [];

    // 生成唯一的文件名
    const fileName = generateFileName("png");

    // 构建图片候选对象
    const candidate: ImageCandidate = {
      nodeId: bfsNode.node.id,
      fileName,
      format: "png",
      reason: classification.reason,
      imageRef
    };

    // 添加到图片候选状态（会自动标记子节点为跳过）
    this.imageCandidatesState.addCandidate(candidate, allDescendants);

    // 日志输出
    if (allDescendants.length > 0) {
      console.log(
        `[RuleBasedClassifier] 节点 ${bfsNode.node.id} 转为图片，标记 ${allDescendants.length} 个子节点为跳过 -> ${fileName}`
      );
    } else if (imageRef) {
      console.log(
        `[RuleBasedClassifier] 节点 ${bfsNode.node.id} (${bfsNode.node.name}) 转为图片 [原始图片填充: ${imageRef}] -> ${fileName}`
      );
    } else {
      console.log(`[RuleBasedClassifier] 叶子节点 ${bfsNode.node.id} (${bfsNode.node.name}) 转为图片 -> ${fileName}`);
    }
  }

  /**
   * 标记子节点为跳过（用于 subtab 等组件）
   *
   * @param nodeId 父节点 ID
   */
  private markChildrenAsSkipped(nodeId: string): void {
    const node = this.flattenedNodes.get(nodeId);
    if (!node) {
      return;
    }

    const allDescendants = this.getAllDescendantIds(nodeId);

    if (allDescendants.length === 0) {
      return;
    }

    // 通过添加一个特殊的 candidate 来标记所有子节点为跳过
    // 使用父节点 ID 作为 candidate 的 nodeId，并传递所有子节点 ID
    this.imageCandidatesState.addCandidate(
      {
        nodeId,
        fileName: "",
        format: "png",
        reason: `父节点 ${nodeId} 标记子节点为跳过（subtab 或其他容器组件）`
      },
      allDescendants
    );

    console.log(`[RuleBasedClassifier] 节点 ${nodeId} 标记为选项卡，标记 ${allDescendants.length} 个子节点为跳过`);
  }

  /**
   * 获取所有后代节点 ID
   *
   * @param nodeId 当前节点 ID
   * @returns 所有后代节点 ID 数组
   */
  private getAllDescendantIds(nodeId: string): string[] {
    const descendants: string[] = [];
    const node = this.flattenedNodes.get(nodeId);

    if (!node) {
      return descendants;
    }

    const queue = [...node.childrenIds];

    while (queue.length > 0) {
      const childId = queue.shift()!;
      descendants.push(childId);

      const childNode = this.flattenedNodes.get(childId);
      if (childNode && childNode.childrenIds.length > 0) {
        queue.push(...childNode.childrenIds);
      }
    }

    return descendants;
  }

  /**
   * 从节点的 fills 中提取 imageRef
   *
   * @param node 归一化节点
   * @returns imageRef 或 undefined
   */
  private extractImageRefFromFills(node: NormalizedNode): string | undefined {
    const fills = (node as any).fills as fillType[] | undefined;

    if (!fills || !Array.isArray(fills)) {
      return undefined;
    }

    for (const fill of fills) {
      if (fill && typeof fill === "object" && "type" in fill && "imageRef" in fill) {
        if (fill.type === "IMAGE" && typeof fill.imageRef === "string") {
          return fill.imageRef;
        }
      }
    }

    return undefined;
  }

  // ==================== 节点类型检查方法 ====================

  /**
   * 检查是否为文本节点
   */
  private isTextNode(node: NormalizedNode): boolean {
    return node.type === "TEXT";
  }

  // ==================== 公共访问方法 ====================

  /**
   * 获取分类状态
   *
   * @returns 分类状态对象
   */
  getClassificationState(): NodeClassificationState {
    return this.classificationState;
  }

  /**
   * 获取图片候选状态
   *
   * @returns 图片候选状态对象
   */
  getImageCandidatesState(): ImageCandidatesState {
    return this.imageCandidatesState;
  }

  /**
   * 获取所有分类结果
   *
   * @returns 所有节点分类数组
   */
  getAllClassifications(): NodeClassification[] {
    return this.classificationState.getAllClassifications();
  }

  /**
   * 获取所有图片候选
   *
   * @returns 图片候选数组
   */
  getAllImageCandidates(): ImageCandidate[] {
    return this.imageCandidatesState.getAllCandidates();
  }

  /**
   * 获取指定节点的分类
   *
   * @param nodeId 节点 ID
   * @returns 节点分类，如果不存在则返回 undefined
   */
  getClassificationById(nodeId: string): NodeClassification | undefined {
    return this.classificationState.getClassificationById(nodeId);
  }

  /**
   * 获取指定节点的图片候选
   *
   * @param nodeId 节点 ID
   * @returns 图片候选，如果不存在则返回 undefined
   */
  getImageCandidateById(nodeId: string): ImageCandidate | undefined {
    return this.imageCandidatesState.getCandidate(nodeId);
  }

  /**
   * 检查节点是否被跳过
   *
   * @param nodeId 节点 ID
   * @returns 是否被跳过
   */
  isNodeSkipped(nodeId: string): boolean {
    return this.imageCandidatesState.isNodeSkipped(nodeId);
  }
}
