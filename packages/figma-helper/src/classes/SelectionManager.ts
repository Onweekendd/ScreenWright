/**
 * SelectionManager 管理器类
 * 负责 Figma 节点选择的相关操作
 */

import type { NodeInfo } from "../types/index";

export class SelectionManager {
  /**
   * 获取当前选择的节点信息
   */
  getSelectionInfo(): NodeInfo[] {
    return figma.currentPage.selection.map((node) => ({
      id: node.id,
      name: node.name,
      nodeType: node.type,
      isTopLevel: node.parent?.type === "PAGE"
    }));
  }

  /**
   * 选择指定的节点并滚动到视图
   */
  async selectNodes(nodeIds: string[]): Promise<void> {
    const resolved = await Promise.all(nodeIds.map((id) => figma.getNodeByIdAsync(id)));
    const nodes = resolved.filter((n): n is SceneNode => n !== null && "type" in n) as SceneNode[];
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }

  /**
   * 同步节点名称
   */
  async syncNodeName(nodeId: string, newName: string): Promise<boolean> {
    const node = (await figma.getNodeByIdAsync(nodeId)) as SceneNode | null;
    if (node) {
      node.name = newName;
      return true;
    }
    return false;
  }
}
