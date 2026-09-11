/**
 * BoundsCalculator 工具类
 * 负责边界计算和比对
 */

import type { Bounds } from "../types/index";
import { BOUNDS_TOLERANCE } from "../constants";

export class BoundsCalculator {
  /**
   * 计算节点相对于锚点的边界
   * @param node 要计算的节点
   * @param anchor 锚点节点
   * @returns 相对边界，如果节点无 absoluteBoundingBox 则返回 null
   */
  static getRelativeBounds(node: SceneNode, anchor: SceneNode): Bounds | null {
    const nb = "absoluteBoundingBox" in node ? (node as FrameNode).absoluteBoundingBox : null;
    const ab = "absoluteBoundingBox" in anchor ? (anchor as FrameNode).absoluteBoundingBox : null;
    if (!nb || !ab) return null;
    return { x: nb.x - ab.x, y: nb.y - ab.y, w: nb.width, h: nb.height };
  }

  /**
   * 判断两个边界是否接近（在容差范围内）
   * @param a 第一个边界
   * @param b 第二个边界
   * @returns 如果两个边界都在容差范围内则返回 true
   */
  static areBoundsClose(a: Bounds, b: Bounds): boolean {
    return (
      Math.abs(a.x - b.x) <= BOUNDS_TOLERANCE &&
      Math.abs(a.y - b.y) <= BOUNDS_TOLERANCE &&
      Math.abs(a.w - b.w) <= BOUNDS_TOLERANCE &&
      Math.abs(a.h - b.h) <= BOUNDS_TOLERANCE
    );
  }
}
