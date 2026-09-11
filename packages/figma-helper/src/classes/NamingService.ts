/**
 * NamingService 服务类
 * 负责规范后缀的管理和命名操作
 */

import { SPEC_SUFFIXES } from "../constants";
export class NamingService {
  /**
   * 获取基础名称（移除规范后缀）
   */
  getBaseName(name: string, mode: "append" | "replace"): string {
    if (mode === "replace") {
      for (const s of SPEC_SUFFIXES) {
        if (name.endsWith(s)) return name.slice(0, -s.length);
      }
    }
    return name;
  }

  /**
   * 将节点包装为分组
   */
  wrapInGroup(node: SceneNode, groupName: string): GroupNode {
    const parent = node.parent as ChildrenMixin & BaseNode;
    const index = (parent as ChildrenMixin).children.indexOf(node);
    const group = figma.group([node], parent, index);
    group.name = groupName;
    return group;
  }

  /**
   * 应用规范后缀到选中的节点
   */
  applySpecSuffix(suffix: string, mode: "append" | "replace"): number {
    const selection = [...figma.currentPage.selection];
    if (selection.length === 0) return 0;

    // 多选时，统一创建分组
    if (selection.length > 1) {
      return this.createGroupWithSuffix(selection, suffix, mode);
    }

    return this.applySuffixToNodes(selection, suffix, mode);
  }

  private createGroupWithSuffix(selection: SceneNode[], suffix: string, mode: "append" | "replace"): number {
    const firstBaseName = this.getBaseName(selection[0].name, mode);
    const groupName = firstBaseName.endsWith(suffix) ? firstBaseName : firstBaseName + suffix;
    const parent = selection[0].parent as ChildrenMixin & BaseNode;
    const group = figma.group(selection, parent);
    group.name = groupName;
    figma.currentPage.selection = [group];
    return selection.length;
  }

  private applySuffixToNodes(selection: SceneNode[], suffix: string, mode: "append" | "replace"): number {
    const newSelection: SceneNode[] = [];
    for (const node of selection) {
      const baseName = this.getBaseName(node.name, mode);
      const targetName = baseName.endsWith(suffix) ? node.name : baseName + suffix;
      if (suffix === "-group" && node.type !== "GROUP") {
        newSelection.push(this.wrapInGroup(node, targetName));
      } else {
        node.name = targetName;
        newSelection.push(node);
      }
    }
    figma.currentPage.selection = newSelection;
    return selection.length;
  }
}
