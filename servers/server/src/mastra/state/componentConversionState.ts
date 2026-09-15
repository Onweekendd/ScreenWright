import type { ComponentType } from "@screenwright/types";
import { FolderEnum, PanelEnum } from "@screenwright/types";
import { z } from "zod";

import type { SwImg } from "@/mastra/workflows/figma-to-bi/steps/node-convert/strategies/SwImgStrategy";
import {
  createPanelState,
  type FtPanel
} from "@/mastra/workflows/figma-to-bi/steps/node-convert/strategies/FtPanelStrategy";
import type { SwRichtext } from "@/mastra/workflows/figma-to-bi/steps/node-convert/strategies/SwRichtextStrategy";
import type { FtSubtabs } from "@/mastra/workflows/figma-to-bi/steps/node-convert/strategies/FtSubtabStrategy";
import type { Group } from "@/mastra/workflows/figma-to-bi/steps/node-convert/strategies/GroupStrategy";

import { ComponentSchema } from "../types";
import type { IValueStore } from "./stateManager";

/**
 * 支持的组件类型联合
 */
export type ConvertedComponent = SwRichtext | SwImg | Group | FtPanel | FtSubtabs;

/**
 * 组件转换条目
 */
export interface ComponentConversionEntry {
  nodeId: string; // 原始 Figma 节点 ID
  parentId: string | null; // 父节点 ID
  targetType: string; // 目标组件类型
  component: ConvertedComponent; // 转换后的组件
  depth: number; // 节点深度（用于 zIndex）
  childrenIds: string[]; // 子节点 ID 列表
  convertedAt: number; // 转换时间戳
}

export const componentConversionEntrySchema = z.object({
  nodeId: z.string(),
  parentId: z.string().nullable(),
  targetType: z.string(),
  component: ComponentSchema.optional(),
  depth: z.number(),
  childrenIds: z.array(z.string()),
  convertedAt: z.number()
});

/**
 * 组件转换状态管理器
 *
 * 功能：
 * 1. 存储每个节点转换后的组件
 * 2. 按 nodeId 查询组件
 * 3. 按 parentId 查询子组件列表
 * 4. 提供父组件更新方法（添加子组件到 children 或 panelData）
 */
export class ComponentConversionState implements IValueStore<ComponentConversionEntry[]> {
  private store: ComponentConversionEntry[] = [];
  private nodeIdIndex: Map<string, number> = new Map(); // nodeId -> 数组索引
  private parentIdIndex: Map<string, string[]> = new Map(); // parentId -> [childNodeIds]

  // ==================== IValueStore 接口实现 ====================

  get(): ComponentConversionEntry[] {
    return this.store;
  }

  set(value: ComponentConversionEntry[]): void {
    this.store = value;
    this.rebuildIndexes();
  }

  update(updater: (prev: ComponentConversionEntry[] | undefined) => ComponentConversionEntry[]): void {
    this.store = updater(this.store);
    this.rebuildIndexes();
  }

  hasValue(): boolean {
    return this.store.length > 0;
  }

  clear(): void {
    this.store = [];
    this.nodeIdIndex.clear();
    this.parentIdIndex.clear();
  }

  // ==================== 核心方法 ====================

  /**
   * 添加转换后的组件
   */
  addComponent(entry: ComponentConversionEntry): void {
    const index = this.store.length;
    this.store.push(entry);

    // 更新索引
    this.nodeIdIndex.set(entry.nodeId, index);

    // 更新父子关系索引
    const parentKey = entry.parentId || "__root__";
    if (!this.parentIdIndex.has(parentKey)) {
      this.parentIdIndex.set(parentKey, []);
    }
    this.parentIdIndex.get(parentKey)!.push(entry.nodeId);
  }

  /**
   * 根据 nodeId 获取组件
   */
  getByNodeId(nodeId: string): ComponentConversionEntry | undefined {
    const index = this.nodeIdIndex.get(nodeId);
    return index !== undefined ? this.store[index] : undefined;
  }

  /**
   * 根据 parentId 获取所有子组件
   */
  getChildrenByParentId(parentId: string | null): ComponentConversionEntry[] {
    const parentKey = parentId || "__root__";
    const childNodeIds = this.parentIdIndex.get(parentKey) || [];
    return childNodeIds
      .map((id) => this.getByNodeId(id))
      .filter((entry): entry is ComponentConversionEntry => entry !== undefined);
  }

  /**
   * 更新父组件，添加子组件
   *
   * - Group: 添加到 children 数组（如果 Group 在动态面板中，转换为相对于面板的位置）
   * - FtPanel: 添加到 panelData[stateIndex].config 数组（按需创建状态，转换为相对于 Panel 的位置）
   *
   * @param parentNodeId - 父节点 ID
   * @param childComponent - 子组件
   * @param stateIndex - 子节点的 stateIndex（用于动态面板按需创建状态）
   */
  updateParentWithChild(parentNodeId: string, childComponent: ConvertedComponent, stateIndex?: number): boolean {
    const parentEntry = this.getByNodeId(parentNodeId);
    if (!parentEntry) {
      console.warn(`⚠️ 父组件不存在: ${parentNodeId}`);
      return false;
    }

    if (parentEntry.targetType === FolderEnum.group) {
      return this.addChildToGroup(parentEntry, childComponent);
    }

    if (parentEntry.targetType === PanelEnum.dynamicPanel) {
      return this.addChildToPanel(parentEntry, childComponent, stateIndex);
    }

    console.warn(`⚠️ 父组件类型 ${parentEntry.targetType} 不支持添加子组件`);
    return false;
  }

  /**
   * 获取根组件列表（没有父节点的组件）
   */
  getRootComponents(): ComponentConversionEntry[] {
    return this.getChildrenByParentId(null);
  }

  /**
   * 获取统计信息
   */
  getStatistics(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.store.forEach((entry) => {
      stats[entry.targetType] = (stats[entry.targetType] || 0) + 1;
    });
    return stats;
  }

  /**
   * 获取组件总数
   */
  getCount(): number {
    return this.store.length;
  }

  /**
   * 向上查找第一个父动态面板
   * @param nodeId 起始节点 ID
   * @returns 第一个父动态面板条目，如果没有则返回 null
   */
  findFirstParentPanel(nodeId: string): ComponentConversionEntry | null {
    let currentNodeId: string | null = nodeId;

    while (currentNodeId) {
      const entry = this.getByNodeId(currentNodeId);
      if (!entry) {
        return null;
      }

      // 如果当前节点是动态面板，返回它
      if (entry.targetType === PanelEnum.dynamicPanel) {
        return entry;
      }

      // 继续向上查找
      currentNodeId = entry.parentId;
    }

    return null;
  }

  /**
   * 计算组件的绝对位置（递归累加所有父容器的位置）
   * @param nodeId 节点 ID
   * @returns 绝对位置 { left, top }，如果节点不存在则返回 { left: 0, top: 0 }
   */
  getAbsolutePosition(nodeId: string): { left: number; top: number } {
    const entry = this.getByNodeId(nodeId);
    if (!entry) {
      return { left: 0, top: 0 };
    }

    const component = entry.component;
    let absoluteLeft = component.left;
    let absoluteTop = component.top;

    // 递归向上累加所有父容器（动态面板和分组）的位置
    let currentParentId = entry.parentId;
    while (currentParentId) {
      const parentEntry = this.getByNodeId(currentParentId);
      if (!parentEntry) {
        break;
      }

      // 累加动态面板和分组的位置
      if (parentEntry.targetType === PanelEnum.dynamicPanel) {
        const parentComponent = parentEntry.component;
        absoluteLeft += parentComponent.left;
        absoluteTop += parentComponent.top;
      }

      currentParentId = parentEntry.parentId;
    }

    return { left: absoluteLeft, top: absoluteTop };
  }

  /**
   * 导出为 JSON（处理循环引用）
   */
  exportToJson(): string {
    const seen = new WeakSet();
    return JSON.stringify(
      this.store,
      (_key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return "[Circular Reference]";
          }
          seen.add(value);
        }
        return value;
      },
      2
    );
  }

  // ==================== 私有方法 ====================

  private addChildToGroup(parentEntry: ComponentConversionEntry, childComponent: ConvertedComponent): boolean {
    const group = parentEntry.component as Group;
    if (!group.children) {
      group.children = [];
    }

    const parentPanel = this.findFirstParentPanel(parentEntry.nodeId);
    if (parentPanel) {
      const panelAbsolutePos = this.getAbsolutePosition(parentPanel.nodeId);

      childComponent.left = childComponent.left - panelAbsolutePos.left;
      childComponent.top = childComponent.top - panelAbsolutePos.top;
    } else {
      console.log(`      ℹ️  Group 不在动态面板中，保持绝对位置`);
    }

    group.children.push(childComponent as ComponentType);
    group.children.sort((a, b) => this.getDepthByComponent(a) - this.getDepthByComponent(b));
    return true;
  }

  private addChildToPanel(
    parentEntry: ComponentConversionEntry,
    childComponent: ConvertedComponent,
    stateIndex?: number
  ): boolean {
    const panel = parentEntry.component as FtPanel;
    const targetState = this.resolvePanelTargetState(panel, stateIndex);

    const panelAbsolutePos = this.getAbsolutePosition(parentEntry.nodeId);
    childComponent.left = childComponent.left - panelAbsolutePos.left;
    childComponent.top = childComponent.top - panelAbsolutePos.top;

    targetState.config.push(childComponent as ComponentType);
    targetState.config.sort((a, b) => this.getDepthByComponent(a) - this.getDepthByComponent(b));
    return true;
  }

  private resolvePanelTargetState(panel: FtPanel, stateIndex?: number) {
    if (!panel.panelData) {
      panel.panelData = [];
    }

    if (stateIndex !== undefined && stateIndex < panel.panelData.length) {
      return panel.panelData[stateIndex];
    }

    if (stateIndex !== undefined) {
      console.log(`   📝 状态 ${stateIndex} 不存在，创建新状态`);
      const newState = createPanelState(stateIndex);
      while (panel.panelData.length <= stateIndex) {
        panel.panelData.push(null as never);
      }
      panel.panelData[stateIndex] = newState;
      return newState;
    }

    if (panel.panelData.length === 0) {
      console.log(`   📝 没有状态信息，创建默认状态`);
      const newState = createPanelState(0);
      panel.panelData.push(newState);
      panel.activeStatusId = newState.id;
      return newState;
    }

    return panel.panelData[0];
  }

  private getDepthByComponent(component: unknown): number {
    return this.store.find((e) => e.component === component)?.depth ?? 0;
  }

  private rebuildIndexes(): void {
    this.nodeIdIndex.clear();
    this.parentIdIndex.clear();

    this.store.forEach((entry, index) => {
      this.nodeIdIndex.set(entry.nodeId, index);

      const parentKey = entry.parentId || "__root__";
      if (!this.parentIdIndex.has(parentKey)) {
        this.parentIdIndex.set(parentKey, []);
      }
      this.parentIdIndex.get(parentKey)!.push(entry.nodeId);
    });
  }
}
