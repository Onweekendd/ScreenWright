/**
 * 将一维节点数组按照深度分组
 * @param nodes 一维节点数组
 * @returns 按深度分组的二维数组，从深（叶子）到浅（根）
 *
 * 例如：
 * 输入: [depth0_node, depth1_node1, depth1_node2, depth2_node]
 * 输出: [[depth2_node], [depth1_node1, depth1_node2], [depth0_node]]
 */
export function groupNodesByDepth<T extends { depth: number }>(nodes: T[]): T[][] {
  if (nodes.length === 0) {
    return [];
  }

  // 使用 Map 按深度分组
  const depthMap = new Map<number, T[]>();
  for (const node of nodes) {
    if (!depthMap.has(node.depth)) {
      depthMap.set(node.depth, []);
    }
    depthMap.get(node.depth)!.push(node);
  }

  // 按深度从大到小排序（叶子到根）
  const depths = Array.from(depthMap.keys()).sort((a, b) => b - a);
  return depths.map((depth) => depthMap.get(depth)!);
}

/**
 * 将一维节点数组按照深度分组为二维数组
 * 例如： [node4, node3, node2, node1]
 * 树结构：1 (2 3 4)
 * 结果：[[node4, node3, node2], [node1]]
 * @param nodes 得到的一维节点数组
 * @returns 按深度分组的二维节点数组，从子节点开始到根节点
 */
export function groupNodesByDepthAndParent<
  T extends { depth: number; parentId?: string | null | undefined; stateIndex?: number }
>(nodes: T[]): T[][] {
  if (nodes.length === 0) {
    return [];
  }

  const result: T[][] = [];
  let currentGroup: T[] = [];
  let lastDepth: number | null = null;
  let lastParentId: string | null | undefined = undefined;
  let lastStateIndex: number | undefined = undefined;

  // 按(深度+父节点+状态索引)连续分组
  // 如果有 stateIndex，则 depth + parentId + stateIndex 一致的归为一组
  // 如果没有 stateIndex，则 depth + parentId 一致的归为一组
  for (const node of nodes) {
    const hasStateIndex = "stateIndex" in node && node.stateIndex !== undefined;
    const lastHasStateIndex = lastStateIndex !== undefined;

    // 判断是否同一组：
    // 1. 深度必须相同
    // 2. 父节点必须相同
    // 3. 如果当前节点有 stateIndex，则 lastStateIndex 也必须相同
    // 4. 如果当前节点没有 stateIndex，则 lastStateIndex 也必须为 undefined
    const isSameGroup =
      lastDepth === node.depth &&
      lastParentId === node.parentId &&
      (hasStateIndex ? lastStateIndex === node.stateIndex : !lastHasStateIndex);

    if (!isSameGroup && currentGroup.length > 0) {
      // 深度、父节点或状态索引改变，保存当前组并开始新组
      result.push(currentGroup);
      currentGroup = [];
    }

    currentGroup.push(node);
    lastDepth = node.depth;
    lastParentId = node.parentId;
    lastStateIndex = hasStateIndex ? node.stateIndex : undefined;
  }

  // 添加最后一组
  if (currentGroup.length > 0) {
    result.push(currentGroup);
  }

  return result;
}
