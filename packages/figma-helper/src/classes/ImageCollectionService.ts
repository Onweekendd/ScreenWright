/**
 * ImageCollectionService 服务类
 *
 * 负责扫描 Figma 节点并收集所有需要导出的 -image 节点。
 *
 * 工作流程：
 * 1. 将 Figma BaseNode 转换为 StructuralNode（纯 JS 对象拷贝，不修改原节点）
 * 2. 使用 StructuralProcessor.process() 对拷贝进行合并处理（与服务端 DataProcessor 逻辑完全一致）
 * 3. 遍历处理后的树，收集所有 -image 节点，返回 NodeInfo[]
 */

import {
  isExhibitionNode,
  isGroupNode,
  isImageNode,
  isMergeNode,
  isPanelNode,
  isStatusNode,
  isSubtabNode,
  isSubtabStateNode,
  StructuralNode,
  StructuralProcessor
} from "../shared/index";
import type { NodeInfo, StructureTreeNode } from "../types/index";

export class ImageCollectionService {
  private readonly processor = new StructuralProcessor();

  /**
   * 扫描指定节点下的所有 -image 节点
   *
   * 内部先将 Figma 节点树转换为 StructuralNode 拷贝，
   * 再经过与 DataProcessor 相同的合并逻辑处理，
   * 最后从处理结果中收集 -image 节点，确保与工作流使用的合并树完全一致。
   *
   * @param nodeId 起始节点的 Figma ID
   * @returns 所有 -image 节点的信息列表
   */
  async scan(nodeId: string): Promise<NodeInfo[]> {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) return [];

    const structuralRoot = this.toStructuralNode(node);
    this.processor.process(structuralRoot);

    const result: NodeInfo[] = [];
    this.collectImageNodes(structuralRoot, result, []);
    return result;
  }

  /**
   * 扫描指定节点，经过扁平化处理后返回携带语义标签的树状结构。
   * 树的每个节点带有 reason 字段，描述其在 BI 中的角色。
   *
   * @param nodeId 起始节点的 Figma ID
   * @returns 带语义标签的树状结构，若节点不存在则返回 null
   */
  async scanStructureTree(nodeId: string): Promise<StructureTreeNode | null> {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) return null;

    const structuralRoot = this.toStructuralNode(node);
    this.processor.process(structuralRoot);

    const result = this.toStructureTreeNode(structuralRoot);
    if (result) return result;

    // 根节点为 merge 时，创建虚拟根包裹其子节点
    return {
      id: structuralRoot.id ?? "",
      name: structuralRoot.name ?? "merged-root",
      nodeType: structuralRoot.type ?? "",
      reason: "合并根节点",
      stateIndex: -1,
      children: this.processChildren(structuralRoot.children ?? [], false)
    };
  }

  /**
   * 将 StructuralNode 转换为携带语义标签的 StructureTreeNode
   *
   * 规则：
   * - 合并层（-merge）不展示自身，但其子节点需提升到父节点层级
   * - 动态面板（-panel）的子节点拥有 stateIndex 时，reason 附加"状态 N"标注
   * - 图片节点（-image）不递归展开其子节点
   * - 选项卡节点（-subtab）不递归展开其子节点
   * - 选项卡状态节点（-active/-noActive）不递归展开其子节点
   */
  private toStructureTreeNode(node: StructuralNode, parentIsDynamicPanel = false): StructureTreeNode | null {
    const name = node.name ?? "";
    const type = node.type ?? "";

    // 合并层不展示，返回 null，其子节点在 processChildren 中被展开
    if (isMergeNode(name) && type === "FRAME") return null;

    const reason = this.generateReason(node, parentIsDynamicPanel ? (node.stateIndex ?? -1) : -1);

    // 图片节点、subtab 节点、subtab 状态节点、原生 image 填充节点截断子树递归
    const isLeafSemantics =
      isImageNode(name) ||
      isSubtabNode(name) ||
      isSubtabStateNode(name) ||
      (node.hasImageFill === true && !this.isSemanticContainer(name));

    // 判断当前节点是否为动态面板，传递给子节点
    const currentIsDynamicPanel = isPanelNode(name) && type === "FRAME";

    return {
      id: node.id ?? "",
      name,
      nodeType: type,
      reason,
      stateIndex: node.stateIndex ?? -1,
      children: isLeafSemantics
        ? []
        : this.processChildren(node.children ?? [], currentIsDynamicPanel)
    };
  }

  /**
   * 处理子节点列表，展开 merge 节点的子节点
   */
  private processChildren(children: StructuralNode[], parentIsDynamicPanel: boolean): StructureTreeNode[] {
    const result: StructureTreeNode[] = [];
    for (const child of children) {
      const childName = child.name ?? "";
      const childType = child.type ?? "";

      // merge 节点：不展示自身，但其子节点提升到当前层级
      if (isMergeNode(childName) && childType === "FRAME") {
        result.push(...this.processChildren(child.children ?? [], parentIsDynamicPanel));
      } else {
        const node = this.toStructureTreeNode(child, parentIsDynamicPanel);
        if (node) result.push(node);
      }
    }
    return result;
  }

  /**
   * 根据节点名称和类型推断其在 BI 中的语义角色
   *
   * @param node 节点
   * @param stateIndex 父节点是动态面板时传入当前状态索引，-1 表示非状态子节点
   */
  private generateReason(node: StructuralNode, stateIndex = -1): string {
    const name = node.name ?? "";
    const type = node.type ?? "";
    const stateSuffix = stateIndex >= 0 ? `（状态 ${stateIndex + 1}）` : "";

    if (isExhibitionNode(name)) return "展项根节点";
    if (isSubtabNode(name)) return "选项卡组件";
    if (isSubtabStateNode(name)) return "选项卡状态图片";
    if (isPanelNode(name) && type === "FRAME") return "动态面板";
    if (isStatusNode(name) && type === "FRAME") return `状态${stateSuffix}`;
    if (isImageNode(name)) return "图片组件";
    if (node.hasImageFill && !this.isSemanticContainer(name)) return "图片组件（原生填充）";
    if (isGroupNode(name)) return "分组组件";
    if (type === "TEXT") return "富文本组件";
    return `动态面板${stateSuffix}`;
  }

  /**
   * 将 Figma BaseNode 递归转换为 StructuralNode（只读转换，不修改原节点）
   * @param node Figma 原始节点
   */
  private toStructuralNode(node: BaseNode): StructuralNode {
    return {
      id: node.id,
      name: "name" in node ? (node as SceneNode).name : undefined,
      type: node.type,
      hasImageFill: this.hasImageFill(node),
      children:
        "children" in node ? (node as ChildrenMixin).children.map((c) => this.toStructuralNode(c)).reverse() : undefined
    };
  }

  /**
   * 判断节点是否带有可见的 image 填充（原生图片节点）。
   * mixed（多段填充）视为非纯图片，返回 false。
   */
  private hasImageFill(node: BaseNode): boolean {
    if (!("fills" in node)) return false;
    const fills = (node as GeometryMixin).fills;
    if (fills === figma.mixed) return false;
    return fills.some((paint) => paint.type === "IMAGE" && paint.visible !== false);
  }

  /**
   * 判断节点是否为带语义的容器（面板/状态/合并/选项卡/展项）。
   * 这类节点即便带背景图也不能整体当图片收集，否则会吞掉其子节点。
   */
  private isSemanticContainer(name: string): boolean {
    return (
      isPanelNode(name) ||
      isStatusNode(name) ||
      isMergeNode(name) ||
      isSubtabNode(name) ||
      isExhibitionNode(name)
    );
  }

  /**
   * 递归收集处理后树中所有 -image 节点和 subtab 状态节点
   * @param node 处理后的节点树
   * @param result 收集结果数组
   */
  private collectImageNodes(node: StructuralNode, result: NodeInfo[], path: string[]): void {
    const name = node.name ?? "";
    const currentPath = [...path, name];

    // -image 节点
    if (isImageNode(name)) {
      result.push({
        id: node.id ?? "",
        name,
        nodeType: node.type ?? "FRAME",
        parentPath: path.join(" > ")
      });
      return;
    }

    // subtab 的子节点 -active 和 -noActive 作为图片处理
    if (isSubtabStateNode(name)) {
      result.push({
        id: node.id ?? "",
        name,
        nodeType: node.type ?? "FRAME",
        parentPath: path.join(" > ")
      });
      return;
    }

    // 原生 image 填充节点：即便没打 -image 后缀也按图片收集。
    // 仅限非语义容器（避免带背景图的面板整体当图片，从而吞掉子节点）。
    if (node.hasImageFill && !this.isSemanticContainer(name)) {
      result.push({
        id: node.id ?? "",
        name,
        nodeType: node.type ?? "FRAME",
        parentPath: path.join(" > ")
      });
      return;
    }

    for (const child of node.children ?? []) {
      this.collectImageNodes(child, result, currentPath);
    }
  }
}