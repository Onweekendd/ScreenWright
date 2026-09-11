/**
 * PanelMergeAnalyzer 分析器类
 * 负责分析 Panel Merge 的关系和匹配状态
 */

import type { MergeSourceInfo, PanelMatchInfo } from "../types/index";
import type { Bounds } from "../types/index";
import { TreeTraversalService } from "./TreeTraversalService";
import { BoundsCalculator } from "./BoundsCalculator";

export class PanelMergeAnalyzer {
  constructor(private treeTraversal: TreeTraversalService) {}

  /**
   * 分析节点的 Panel Merge 关系
   */
  async analyze(nodeId: string): Promise<{ sourceInfo: MergeSourceInfo | null; matches: PanelMatchInfo[] }> {
    const sourceNode = (await figma.getNodeByIdAsync(nodeId)) as SceneNode | null;
    if (!sourceNode) return { sourceInfo: null, matches: [] };

    if (sourceNode.type === "FRAME" && sourceNode.name.endsWith("-merge")) {
      return this.analyzeMergeFrame(sourceNode);
    }

    if (sourceNode.name.endsWith("-status")) {
      return this.analyzeStatusNode(sourceNode);
    }

    return this.analyzeInnerNode(sourceNode);
  }

  /**
   * 分析 -merge frame（列出所有兄弟 merge 帧）
   */
  private analyzeMergeFrame(sourceNode: SceneNode): { sourceInfo: MergeSourceInfo; matches: PanelMatchInfo[] } {
    const siblings = this.treeTraversal.getSiblingMergeFrames(sourceNode);
    const matches: PanelMatchInfo[] = siblings.map((s) => ({
      mergeFrameId: s.id,
      mergeFrameName: s.name,
      status: "confirmed" as const,
      matchedNodeId: s.id,
      matchedNodeName: s.name
    }));
    return {
      sourceInfo: { mergeFrameName: sourceNode.name, path: [], isMergeFrame: true, mode: "merge" as const },
      matches
    };
  }

  /**
   * 分析 -status 节点（列出所有兄弟 status 节点）
   */
  private analyzeStatusNode(sourceNode: SceneNode): { sourceInfo: MergeSourceInfo; matches: PanelMatchInfo[] } {
    const parent = sourceNode.parent;
    if (!parent || !("children" in parent)) {
      return {
        sourceInfo: { mergeFrameName: sourceNode.name, path: [], isMergeFrame: true, mode: "status" as const },
        matches: []
      };
    }
    const siblings = (parent as ChildrenMixin).children.filter(
      (c) => (c as SceneNode).name.endsWith("-status") && c.id !== sourceNode.id
    ) as SceneNode[];
    const matches: PanelMatchInfo[] = siblings.map((s) => ({
      mergeFrameId: s.id,
      mergeFrameName: s.name,
      status: "confirmed" as const,
      matchedNodeId: s.id,
      matchedNodeName: s.name
    }));
    return {
      sourceInfo: { mergeFrameName: sourceNode.name, path: [], isMergeFrame: true, mode: "status" as const },
      matches
    };
  }

  /**
   * 分析内部节点（按名称路径 + 位置比对）
   */
  private analyzeInnerNode(sourceNode: SceneNode): { sourceInfo: MergeSourceInfo | null; matches: PanelMatchInfo[] } {
    const mergeFrame = this.treeTraversal.findAncestorMergeFrame(sourceNode);
    if (!mergeFrame) return { sourceInfo: null, matches: [] };

    const namePath = this.treeTraversal.getNamePath(mergeFrame, sourceNode);
    const depth = namePath.length;
    const sourceBounds = BoundsCalculator.getRelativeBounds(sourceNode, mergeFrame as SceneNode);
    const selectedName = sourceNode.name;

    const panelParent = mergeFrame.parent;
    if (!panelParent || !("children" in panelParent)) {
      return {
        sourceInfo: { mergeFrameName: mergeFrame.name, path: namePath, isMergeFrame: false, mode: "inner" as const },
        matches: []
      };
    }

    const siblingMergeFrames = (panelParent as ChildrenMixin).children.filter(
      (c): c is FrameNode => c.type === "FRAME" && c.name.endsWith("-merge") && c.id !== mergeFrame.id
    );

    const matches = this.findMatchesInSiblings(siblingMergeFrames, selectedName, depth, sourceBounds);

    return {
      sourceInfo: { mergeFrameName: mergeFrame.name, path: namePath, isMergeFrame: false, mode: "inner" as const },
      matches
    };
  }

  /**
   * 在兄弟 merge frames 中查找匹配节点
   */
  private findMatchesInSiblings(
    siblings: FrameNode[],
    selectedName: string,
    depth: number,
    sourceBounds: Bounds | null
  ): PanelMatchInfo[] {
    return siblings.map((sibling) => {
      const siblingScene = sibling as SceneNode;

      // 优先：同名 + 同深度 → confirmed
      const confirmed = this.treeTraversal.findNodeByNameAtDepth(siblingScene, selectedName, depth, 0);
      if (confirmed) {
        return {
          mergeFrameId: sibling.id,
          mergeFrameName: sibling.name,
          status: "confirmed" as const,
          matchedNodeId: confirmed.id,
          matchedNodeName: confirmed.name
        };
      }

      // 其次：同深度 + 同 bounds，名称不同 → suspected
      if (sourceBounds) {
        const suspected = this.treeTraversal.findNodeByBoundsAtDepth(
          siblingScene,
          siblingScene,
          sourceBounds,
          selectedName,
          depth,
          0
        );
        if (suspected) {
          return {
            mergeFrameId: sibling.id,
            mergeFrameName: sibling.name,
            status: "suspected" as const,
            matchedNodeId: suspected.id,
            matchedNodeName: suspected.name
          };
        }
      }

      // 未找到 → missing
      return {
        mergeFrameId: sibling.id,
        mergeFrameName: sibling.name,
        status: "missing" as const,
        matchedNodeId: null,
        matchedNodeName: null
      };
    });
  }
}
