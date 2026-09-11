interface RegionNode {
  label: string;
  value: string;
  children?: RegionNode[];
  parent?: RegionNode; // 父节点引用
}

// 构建 ID 到节点的映射表
function buildIdMap(data: RegionNode[]): Map<string, RegionNode> {
  const idMap = new Map<string, RegionNode>();

  function traverse(node: RegionNode, parent?: RegionNode) {
    node.parent = parent;
    idMap.set(node.value, node);
    node.children?.forEach((child) => traverse(child, node));
  }

  data.forEach((root) => traverse(root));
  return idMap;
}

// 获取节点及其所有父节点的完整路径
export function getRegionPath(id: string, data: RegionNode[]): { name: string; adcode: string }[] {
  const idMap = buildIdMap(data);
  const node = idMap.get(id);

  if (!node) return [];

  // 从目标节点向上遍历到根节点
  const path: RegionNode[] = [];
  let current: RegionNode | undefined = node;

  while (current) {
    path.unshift(current); // 插入到数组开头，保证顺序从根到叶
    current = current.parent;
  }

  // 转换为所需的格式
  return path.map((item) => ({
    name: item.label,
    adcode: item.value
  }));
}
