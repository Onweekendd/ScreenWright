/**
 * TreeTraversalService 服务类
 * 负责 Figma 节点树的遍历与查找
 */

import type { Bounds } from "../types/index";
import { BoundsCalculator } from "./BoundsCalculator";

export class TreeTraversalService {
  /**
   * 查找祖先 -merge frame
   */
  findAncestorMergeFrame(node: BaseNode): FrameNode | null {
    let current: BaseNode | null = node.parent;
    while (current) {
      if (current.type === "FRAME" && (current as FrameNode).name.endsWith("-merge")) {
        return current as FrameNode;
      }
      current = current.parent;
    }
    return null;
  }

  /**
   * 获取从祖先到节点的名称路径
   */
  getNamePath(ancestor: BaseNode, node: BaseNode): string[] {
    const path: string[] = [];
    let current: BaseNode | null = node;
    while (current && current.id !== ancestor.id) {
      path.unshift((current as SceneNode).name);
      current = current.parent;
    }
    return path;
  }

  /**
   * 在指定深度按名称查找节点
   */
  findNodeByNameAtDepth(
    root: SceneNode,
    name: string,
    targetDepth: number,
    currentDepth: number = 0
  ): SceneNode | null {
    if (currentDepth === targetDepth) {
      return root.name === name ? root : null;
    }
    if (!("children" in root)) return null;
    for (const child of (root as ChildrenMixin).children) {
      const found = this.findNodeByNameAtDepth(child as SceneNode, name, targetDepth, currentDepth + 1);
      if (found) return found;
    }
    return null;
  }

  /**
   * 在指定深度按边界查找节点（用于疑似匹配）
   */
  findNodeByBoundsAtDepth(
    root: SceneNode,
    anchor: SceneNode,
    targetBounds: Bounds,
    excludeName: string,
    targetDepth: number,
    currentDepth: number = 0
  ): SceneNode | null {
    if (currentDepth === targetDepth) {
      if (root.name === excludeName) return null;
      const bounds = BoundsCalculator.getRelativeBounds(root, anchor);
      return bounds && BoundsCalculator.areBoundsClose(targetBounds, bounds) ? root : null;
    }
    if (!("children" in root)) return null;
    for (const child of (root as ChildrenMixin).children) {
      const found = this.findNodeByBoundsAtDepth(
        child as SceneNode,
        anchor,
        targetBounds,
        excludeName,
        targetDepth,
        currentDepth + 1
      );
      if (found) return found;
    }
    return null;
  }

  /**
   * 获取兄弟 -merge frames
   */
  getSiblingMergeFrames(node: SceneNode): FrameNode[] {
    const parent = node.parent;
    if (!parent || !("children" in parent)) return [];
    return (parent as ChildrenMixin).children.filter(
      (c): c is FrameNode => c.type === "FRAME" && c.name.endsWith("-merge") && c.id !== node.id
    );
  }
}
