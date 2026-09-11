import type { NormalizedNode } from "@/mastra/types/normalized-node-types";

/**
 * 节点类型判断工具集
 *
 * 提供一系列类型守卫函数，用于判断 Figma 节点的类型和特征
 */

/**
 * 判断是否为文本节点
 *
 * @param params - 节点和上下文信息
 * @param params.node - 规范化的 Figma 节点
 * @returns 如果是文本节点返回 true
 *
 * @example
 * ```typescript
 * const isText = isTextNode({ node: figmaNode });
 * ```
 */
export function isTextNode(params: {
  /** 规范化的节点 */
  node: NormalizedNode;
}): boolean {
  const { node } = params;
  return node.type === "TEXT" || !!node.text;
}

/**
 * 判断是否为简单图片节点
 *
 * 简单图片节点是指已经有本地路径的图片节点，可以直接使用
 *
 * @param params - 节点和上下文信息
 * @param params.node - 规范化的 Figma 节点
 * @returns 如果是简单图片节点返回 true
 *
 * @example
 * ```typescript
 * const isSimpleImg = isSimpleImageNode({ node: figmaNode });
 * ```
 */
export function isSimpleImageNode(params: {
  /** 规范化的节点 */
  node: NormalizedNode;
}): boolean {
  const { node } = params;
  return !!node.imgLocalPath;
}

/**
 * 判断是否为复杂矩形节点（需要渲染为图片）
 *
 * 复杂矩形节点是指包含渐变、描边、阴影等效果的矩形节点，
 * 这些效果无法直接用 CSS 表示，需要先渲染成图片
 *
 * @param params - 节点和上下文信息
 * @param params.node - 规范化的 Figma 节点
 * @returns 如果是复杂矩形节点返回 true
 *
 * @example
 * ```typescript
 * const isComplex = isComplexRectangleNode({ node: figmaNode });
 * ```
 */
export function isComplexRectangleNode(params: {
  /** 规范化的节点 */
  node: NormalizedNode;
}): boolean {
  const { node } = params;

  // 首先必须是矩形类型
  if (node.type !== "RECTANGLE") {
    return false;
  }

  // 检查是否有需要渲染的视觉属性
  const hasFills = node.fills && node.fills.length > 0;
  const hasStrokes = !!node.strokes;
  const hasEffects = !!node.effects;

  // 只要有一个复杂属性就需要渲染为图片
  return !!(hasFills || hasStrokes || hasEffects);
}
