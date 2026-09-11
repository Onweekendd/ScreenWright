export function getLastLayerChildrenFromArr(chartDataArr: any[], targetKeyList = null) {
  // 存储最终结果的数组
  const result: any[] = [];

  // 1. 先处理顶层数组：遍历每个顶层分类对象
  if (!Array.isArray(chartDataArr)) {
    console.warn("chartData 不是对象数组，请传入正确格式的数据");
    return result;
  }

  // 2. 递归遍历单个分类对象的核心逻辑（复用并封装为内部函数）
  function traverseSingleNode(node: any) {
    // 若当前节点有 children 数组，继续递归子节点
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => traverseSingleNode(child));
    }
    // 若没有 children 但有 moduleId，说明是最后一层图表数据，收集它
    else if (node.moduleId !== undefined) {
      if (targetKeyList && Array.isArray(targetKeyList)) {
        // 只提取指定字段
        const filteredItem: any = {};
        (targetKeyList as any).forEach((key: any) => {
          // eslint-disable-next-line no-prototype-builtins
          if (node.hasOwnProperty(key)) {
            filteredItem[key] = node[key];
          }
        });
        result.push(filteredItem);
      } else {
        // 返回完整对象（浅拷贝避免修改原始数据）
        result.push({ ...node });
      }
    }
  }

  // 3. 遍历顶层数组的每个分类对象，逐个执行递归
  chartDataArr.forEach((topNode) => {
    traverseSingleNode(topNode);
  });

  return result;
}

export const traverseComponentGroups = (groups: any[]): any[] => {
  const result: any[] = [];

  const traverse = (nodes: any[]) => {
    for (const node of nodes) {
      // 先添加当前节点（包括父元素）
      result.push(node);
      // 如果有子节点，递归处理
      if (node.children?.length) {
        traverse(node.children);
      }
    }
  };

  traverse(groups);
  return result;
};
