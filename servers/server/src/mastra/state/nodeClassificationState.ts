import { FolderEnum, InteractiveEnum, MediaEnum, PanelEnum, TextEnum } from "@screenwright/types";
import { z } from "zod";

import type { IValueStore } from "./stateManager";

/**
 * 节点分类决策输出类型
 */
export const nodeClassificationSchema = z.object({
  nodeId: z.string().describe("节点 ID"),
  originalType: z.string().describe("原始 Figma 节点类型"),
  targetType: z
    .enum([
      PanelEnum.dynamicPanel,
      FolderEnum.group,
      MediaEnum.SwImg,
      TextEnum.SwRichtext,
      InteractiveEnum.Subtabs,
      "merge",
      "root"
    ])
    .describe("目标低代码组件类型"),
  dynamicPanelDepth: z.number().default(0).describe("从根到当前节点的动态面板层数"),
  complexity: z.number().default(0).describe("复杂度评分 (0-100)"),
  reason: z.string().describe("决策原因的详细说明")
});

export type NodeClassification = z.infer<typeof nodeClassificationSchema>;

/**
 * 节点分类状态管理器
 *
 * 基于新的 StateManager 系统实现，实现 IValueStore 接口
 * 用于在循环的 step 执行过程中保持和共享节点分类决策状态
 * 解决 workflow state 在循环中无法正确更新的问题
 */
export class NodeClassificationState implements IValueStore<Array<NodeClassification>> {
  private store: Array<NodeClassification>;

  constructor() {
    // 创建内部数组存储
    this.store = new Array<NodeClassification>();
  }

  /**
   * 获取内部存储（实现 IValueStore 接口）
   */
  get(): Array<NodeClassification> {
    return this.store;
  }

  /**
   * 设置内部存储（实现 IValueStore 接口）
   */
  set(value: Array<NodeClassification>): void {
    this.store = value;
  }

  /**
   * 更新内部存储（实现 IValueStore 接口）
   */
  update(updater: (prev: Array<NodeClassification> | undefined) => Array<NodeClassification>): void {
    this.store = updater(this.store);
  }

  /**
   * 检查是否有值（实现 IValueStore 接口）
   */
  hasValue(): boolean {
    return this.store !== undefined && this.store.length > 0;
  }

  /**
   * 清空所有分类（实现 IStateStore 接口）
   * 通常在开始新的工作流执行时调用
   */
  clear(): void {
    this.store.length = 0;
  }

  /**
   * 添加一个节点分类
   * @param classification 节点分类对象
   */
  addClassification(classification: NodeClassification): void {
    this.store.push(classification);
  }

  /**
   * 批量添加节点分类
   * @param classifications 节点分类数组
   */
  addClassifications(classifications: NodeClassification[]): void {
    classifications.forEach((classification) => {
      this.store.push(classification);
    });
  }

  /**
   * 根据节点 ID 获取分类
   * @param nodeId 节点 ID
   * @returns 节点分类，如果不存在则返回 undefined
   */
  getClassificationById(nodeId?: string | null): NodeClassification | undefined {
    return this.store.find((classification) => classification.nodeId === nodeId);
  }

  /**
   * 检查节点是否已有分类
   * @param nodeId 节点 ID
   * @returns 如果存在返回 true，否则返回 false
   */
  hasClassification(nodeId: string): boolean {
    return this.store.some((classification) => classification.nodeId === nodeId);
  }

  /**
   * 根据目标类型获取所有节点分类
   * @param targetType 目标类型
   * @returns 符合条件的节点分类数组
   */
  getClassificationsByTargetType(targetType: NodeClassification["targetType"]): NodeClassification[] {
    return this.store.filter((classification) => classification.targetType === targetType);
  }

  /**
   * 根据动态面板层数获取所有节点分类
   * @param depth 动态面板层数
   * @returns 符合条件的节点分类数组
   */
  getClassificationsByDepth(depth: number): NodeClassification[] {
    return this.store.filter((classification) => classification.dynamicPanelDepth === depth);
  }

  /**
   * 根据复杂度范围获取节点分类
   * @param minComplexity 最小复杂度（包含）
   * @param maxComplexity 最大复杂度（包含）
   * @returns 符合条件的节点分类数组
   */
  getClassificationsByComplexity(minComplexity: number, maxComplexity: number): NodeClassification[] {
    return this.store.filter(
      (classification) => classification.complexity >= minComplexity && classification.complexity <= maxComplexity
    );
  }

  /**
   * 获取所有分类
   * @returns 所有节点分类数组
   */
  getAllClassifications(): NodeClassification[] {
    return this.store.slice();
  }

  /**
   * 获取分类总数
   * @returns 分类数量
   */
  getCount(): number {
    return this.store.length;
  }

  /**
   * 删除指定节点的分类
   * @param nodeId 节点 ID
   * @returns 如果删除成功返回 true，否则返回 false
   */
  deleteClassification(nodeId: string): boolean {
    const initialLength = this.store.length;
    this.store = this.store.filter((classification) => classification.nodeId !== nodeId);
    return this.store.length < initialLength;
  }

  /**
   * 获取分类统计信息
   * @returns 各类型的统计信息
   */
  getStatistics(): Record<NodeClassification["targetType"], number> {
    const stats: Record<string, number> = {};
    this.store.forEach((classification) => {
      const type = classification.targetType;
      stats[type] = (stats[type] || 0) + 1;
    });
    return stats as Record<NodeClassification["targetType"], number>;
  }

  /**
   * 导出所有分类为 JSON
   * @returns JSON 字符串
   */
  exportToJson(): string {
    return JSON.stringify(this.store, null, 2);
  }

  /**
   * 从 JSON 导入分类
   * @param json JSON 字符串
   */
  importFromJson(json: string): void {
    try {
      this.store = JSON.parse(json);
    } catch (error) {
      console.error("导入节点分类失败:", error);
      throw new Error("无效的 JSON 格式");
    }
  }
}
