import { assignOrderedZIndexes } from "@screenwright/core";

import type { ComponentType } from "../type";

export interface LayerMoveOptions {
  direction: -1 | 1;
  moveToBoundary?: boolean;
}

/**
 * 在同级里挪动 target 的层级。
 *
 * @param siblingsDesc 同级组件，上层在前（下标 0 = 最上层），包含 target 自己
 * @returns 没挪动（找不到 / 已在边界）返回 null；否则返回 zIndex 被改动的组件，调用方负责把它们写回
 */
export const moveComponentInList = (
  target: ComponentType,
  siblingsDesc: ComponentType[],
  { direction, moveToBoundary = false }: LayerMoveOptions
): ComponentType[] | null => {
  const currentIndex = siblingsDesc.findIndex((component) => `${component.id}` === `${target.id}`);
  if (currentIndex === -1) {
    return null;
  }

  const boundaryIndex = direction === -1 ? 0 : siblingsDesc.length - 1;
  const destinationIndex = moveToBoundary ? boundaryIndex : currentIndex + direction;
  if (destinationIndex < 0 || destinationIndex >= siblingsDesc.length || destinationIndex === currentIndex) {
    return null;
  }

  // 数组里换位置，再让 core 按新次序理顺 zIndex：只会改动错位的那个，不用逐个和邻居互换
  const reordered = siblingsDesc.filter((component) => component !== siblingsDesc[currentIndex]);
  reordered.splice(destinationIndex, 0, siblingsDesc[currentIndex]);
  return assignOrderedZIndexes(reordered.reverse());
};
