import type { BfsTraversalStepNode } from "../types/bfs-traversal-types";
import type { IValueStore } from "./stateManager";

/**
 * 打平节点状态管理器
 *
 * 基于 StateManager 系统实现，实现 IValueStore 接口
 * 用于在工作流中保持和共享打平后的节点数据
 * 解决 workflow state 在循环中无法正确更新的问题
 *
 * 特性：
 * - 支持按 ID 快速查找节点
 * - 支持按深度分组获取节点
 * - 支持按父节点 ID 获取子节点
 * - 支持批量操作
 */
export class FlattenedNodesState implements IValueStore<Array<BfsTraversalStepNode>> {
  private store: Array<BfsTraversalStepNode>;
  /** 按节点 ID 索引，用于快速查找 */
  private nodeIndex: Map<string, BfsTraversalStepNode>;
  /** 按深度分组索引 */
  private depthIndex: Map<number, BfsTraversalStepNode[]>;
  /** 按父节点 ID 分组索引 */
  private parentIndex: Map<string | null, BfsTraversalStepNode[]>;

  constructor() {
    this.store = [];
    this.nodeIndex = new Map();
    this.depthIndex = new Map();
    this.parentIndex = new Map();
  }

  /**
   * 获取内部存储（实现 IValueStore 接口）
   */
  get(): Array<BfsTraversalStepNode> {
    return this.store;
  }

  /**
   * 设置内部存储（实现 IValueStore 接口）
   * 同时重建所有索引
   */
  set(value: Array<BfsTraversalStepNode>): void {
    this.store = value;
    this.rebuildIndexes();
  }

  /**
   * 更新内部存储（实现 IValueStore 接口）
   */
  update(updater: (prev: Array<BfsTraversalStepNode> | undefined) => Array<BfsTraversalStepNode>): void {
    this.store = updater(this.store);
    this.rebuildIndexes();
  }

  /**
   * 检查是否有值（实现 IValueStore 接口）
   */
  hasValue(): boolean {
    return this.store !== undefined && this.store.length > 0;
  }

  /**
   * 清空所有数据（实现 IStateStore 接口）
   * 通常在开始新的工作流执行时调用
   */
  clear(): void {
    this.store = [];
    this.nodeIndex.clear();
    this.depthIndex.clear();
    this.parentIndex.clear();
  }

  /**
   * 重建所有索引
   */
  private rebuildIndexes(): void {
    this.nodeIndex.clear();
    this.depthIndex.clear();
    this.parentIndex.clear();

    for (const item of this.store) {
      // 节点 ID 索引
      this.nodeIndex.set(item.node.id, item);

      // 深度索引
      if (!this.depthIndex.has(item.depth)) {
        this.depthIndex.set(item.depth, []);
      }
      this.depthIndex.get(item.depth)!.push(item);

      // 父节点索引
      if (!this.parentIndex.has(item.parentId)) {
        this.parentIndex.set(item.parentId, []);
      }
      this.parentIndex.get(item.parentId)!.push(item);
    }
  }

  // ============================================
  // 添加操作
  // ============================================

  /**
   * 添加一个节点
   * @param node 打平后的节点项
   */
  addNode(node: BfsTraversalStepNode): void {
    this.store.push(node);

    // 更新节点索引
    this.nodeIndex.set(node.node.id, node);

    // 更新深度索引
    if (!this.depthIndex.has(node.depth)) {
      this.depthIndex.set(node.depth, []);
    }
    this.depthIndex.get(node.depth)!.push(node);

    // 更新父节点索引
    if (!this.parentIndex.has(node.parentId)) {
      this.parentIndex.set(node.parentId, []);
    }
    this.parentIndex.get(node.parentId)!.push(node);
  }

  /**
   * 批量添加节点
   * @param nodes 打平后的节点数组
   */
  addNodes(nodes: BfsTraversalStepNode[]): void {
    for (const node of nodes) {
      this.addNode(node);
    }
  }

  // ============================================
  // 查询操作
  // ============================================

  /**
   * 根据节点 ID 获取节点
   * @param nodeId 节点 ID
   * @returns 节点项，如果不存在则返回 undefined
   */
  getNodeById(nodeId: string): BfsTraversalStepNode | undefined {
    return this.nodeIndex.get(nodeId);
  }

  /**
   * 检查节点是否存在
   * @param nodeId 节点 ID
   */
  hasNode(nodeId: string): boolean {
    return this.nodeIndex.has(nodeId);
  }

  /**
   * 根据深度获取所有节点
   * @param depth 节点深度
   * @returns 该深度的所有节点
   */
  getNodesByDepth(depth: number): BfsTraversalStepNode[] {
    return this.depthIndex.get(depth) || [];
  }

  /**
   * 根据父节点 ID 获取所有子节点
   * @param parentId 父节点 ID
   * @returns 所有子节点
   */
  getChildrenByParentId(parentId: string | null): BfsTraversalStepNode[] {
    return this.parentIndex.get(parentId) || [];
  }

  /**
   * 获取所有根节点（parentId 为 null）
   * @returns 根节点数组
   */
  getRootNodes(): BfsTraversalStepNode[] {
    return this.parentIndex.get(null) || [];
  }

  /**
   * 获取所有节点
   * @returns 所有节点的副本
   */
  getAllNodes(): BfsTraversalStepNode[] {
    return [...this.store];
  }

  /**
   * 获取节点总数
   */
  getCount(): number {
    return this.store.length;
  }

  /**
   * 获取所有深度级别
   * @returns 深度数组，按从小到大排序
   */
  getAllDepths(): number[] {
    return Array.from(this.depthIndex.keys()).sort((a, b) => a - b);
  }

  /**
   * 获取最大深度
   */
  getMaxDepth(): number {
    const depths = this.getAllDepths();
    return depths.length > 0 ? depths[depths.length - 1] : -1;
  }

  /**
   * 按深度分组获取节点（二维数组）
   * @returns 按深度分组的节点数组 [[depth0], [depth1], ...]
   */
  getNodesByDepthGroups(): BfsTraversalStepNode[][] {
    const depths = this.getAllDepths();
    return depths.map((depth) => this.getNodesByDepth(depth));
  }

  // ============================================
  // 更新操作
  // ============================================

  /**
   * 更新指定节点
   * @param nodeId 节点 ID
   * @param updater 更新函数
   * @returns 是否更新成功
   */
  updateNode(nodeId: string, updater: (node: BfsTraversalStepNode) => BfsTraversalStepNode): boolean {
    const existingNode = this.nodeIndex.get(nodeId);
    if (!existingNode) {
      return false;
    }

    const updatedNode = updater(existingNode);
    const index = this.store.findIndex((n) => n.node.id === nodeId);
    if (index !== -1) {
      this.store[index] = updatedNode;
      this.rebuildIndexes();
    }

    return true;
  }

  // ============================================
  // 删除操作
  // ============================================

  /**
   * 删除指定节点
   * @param nodeId 节点 ID
   * @returns 是否删除成功
   */
  deleteNode(nodeId: string): boolean {
    const index = this.store.findIndex((n) => n.node.id === nodeId);
    if (index === -1) {
      return false;
    }

    this.store.splice(index, 1);
    this.rebuildIndexes();
    return true;
  }

  /**
   * 批量删除节点
   * @param nodeIds 节点 ID 数组
   * @returns 删除的节点数量
   */
  deleteNodes(nodeIds: string[]): number {
    const nodeIdSet = new Set(nodeIds);
    const initialLength = this.store.length;
    this.store = this.store.filter((n) => !nodeIdSet.has(n.node.id));
    this.rebuildIndexes();
    return initialLength - this.store.length;
  }

  // ============================================
  // 统计和导出
  // ============================================

  /**
   * 获取统计信息
   */
  getStatistics(): {
    totalNodes: number;
    maxDepth: number;
    depthDistribution: Record<number, number>;
    rootCount: number;
  } {
    const depthDistribution: Record<number, number> = {};
    for (const [depth, nodes] of this.depthIndex) {
      depthDistribution[depth] = nodes.length;
    }

    return {
      totalNodes: this.store.length,
      maxDepth: this.getMaxDepth(),
      depthDistribution,
      rootCount: this.getRootNodes().length
    };
  }

  /**
   * 导出为 JSON
   */
  exportToJson(): string {
    return JSON.stringify(this.store, null, 2);
  }

  /**
   * 从 JSON 导入
   * @param json JSON 字符串
   */
  importFromJson(json: string): void {
    try {
      const data = JSON.parse(json);
      this.set(data);
    } catch (error) {
      console.error("导入打平节点数据失败:", error);
      throw new Error("无效的 JSON 格式");
    }
  }
}
