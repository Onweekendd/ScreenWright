/**
 * 从工作区文件路径推导组件嵌套位置
 *
 * 路径规则：
 *   component/{id}.json                         → 根目录，无父级
 *   component/.../{groupId}/{id}.json           → 分组（最近目录为纯数字）
 *   component/.../{panelId}/{stateId}/{id}.json → 动态面板（最近目录非数字，上一级为纯数字）
 */
export type ComponentPlacement =
  | { parentId: number; parentType: "group" }
  | { parentId: number; parentType: "dynamicPanel"; stateId: string };

export function parsePlacementFromPath(relativePath: string): ComponentPlacement | null {
  const normalized = relativePath.replace(/\\/g, "/");
  const marker = "/component/";
  const idx = normalized.lastIndexOf(marker);
  if (idx === -1) return null;

  const parts = normalized.slice(idx + marker.length).split("/");
  const dirs = parts.slice(0, -1); // 去掉文件名

  if (dirs.length === 0) return null; // 根目录，无父级

  const nearest = dirs[dirs.length - 1];
  const nearestNum = parseInt(nearest, 10);
  const nearestIsNum = !isNaN(nearestNum) && String(nearestNum) === nearest;

  if (nearestIsNum) {
    return { parentId: nearestNum, parentType: "group" };
  }

  // 最近目录非数字（stateId），检查上一级是否为纯数字（动态面板 ID）
  if (dirs.length >= 2) {
    const panelDir = dirs[dirs.length - 2];
    const panelNum = parseInt(panelDir, 10);
    if (!isNaN(panelNum) && String(panelNum) === panelDir) {
      return { parentId: panelNum, parentType: "dynamicPanel", stateId: nearest };
    }
  }

  return null;
}
