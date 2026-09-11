/**
 * 图片候选节点信息
 */
export interface ImageCandidate {
  /** 节点 ID */
  nodeId: string;
  /** 导出的文件名 */
  fileName: string;
  /** 图片格式 */
  format: "png" | "svg";
  /** 转换为图片的原因 */
  reason: string;
  /** 图片引用 hash（仅当节点使用图片填充时存在） */
  imageRef?: string;
}

/**
 * 序列化后的状态数据
 */
export interface SerializedImageCandidatesState {
  candidates: ImageCandidate[];
  skippedNodeIds: string[];
}

import type { IValueStore } from "./stateManager";

/**
 * 图片候选状态管理器
 *
 * 用于跟踪哪些节点需要转换为图片，以及哪些子节点应该被跳过处理。
 *
 * 主要功能：
 * 1. 存储需要整体转换为图片的节点
 * 2. 标记应该跳过处理的子节点
 * 3. 支持序列化和反序列化
 */
export class ImageCandidatesState implements IValueStore<SerializedImageCandidatesState> {
  /** 图片候选映射 nodeId -> ImageCandidate */
  private candidates = new Map<string, ImageCandidate>();

  /** 被跳过的节点 ID 集合（转为图片的节点的子节点） */
  private skippedNodeIds = new Set<string>();

  // ==================== IValueStore 接口实现 ====================

  /**
   * 获取序列化后的状态
   */
  get(): SerializedImageCandidatesState {
    return this.serialize();
  }

  /**
   * 从序列化数据设置状态
   */
  set(value: SerializedImageCandidatesState): void {
    this.clear();

    // 恢复候选
    for (const candidate of value.candidates) {
      this.candidates.set(candidate.nodeId, candidate);
    }

    // 恢复跳过列表
    for (const nodeId of value.skippedNodeIds) {
      this.skippedNodeIds.add(nodeId);
    }
  }

  /**
   * 更新状态
   */
  update(updater: (prev: SerializedImageCandidatesState | undefined) => SerializedImageCandidatesState): void {
    const current = this.serialize();
    const updated = updater(current);
    this.set(updated);
  }

  /**
   * 检查是否有值（有候选或跳过的节点）
   */
  hasValue(): boolean {
    return this.candidates.size > 0 || this.skippedNodeIds.size > 0;
  }

  // ==================== 核心方法 ====================

  /**
   * 添加图片候选
   *
   * @param candidate - 图片候选信息
   * @param childrenIds - 可选的子节点 ID 列表，这些节点将被标记为跳过
   */
  addCandidate(candidate: ImageCandidate, childrenIds?: string[]): void {
    this.candidates.set(candidate.nodeId, candidate);

    // 如果提供了子节点列表，标记它们为跳过
    if (childrenIds && childrenIds.length > 0) {
      for (const childId of childrenIds) {
        this.skippedNodeIds.add(childId);
      }
    }
  }

  /**
   * 批量添加图片候选
   *
   * @param candidates - 图片候选数组
   */
  addCandidates(candidates: ImageCandidate[]): void {
    for (const candidate of candidates) {
      this.addCandidate(candidate);
    }
  }

  /**
   * 检查节点是否为图片候选
   *
   * @param nodeId - 节点 ID
   * @returns 是否为图片候选
   */
  hasCandidate(nodeId: string): boolean {
    return this.candidates.has(nodeId);
  }

  /**
   * 获取指定节点的图片候选信息
   *
   * @param nodeId - 节点 ID
   * @returns 图片候选信息，如果不存在则返回 undefined
   */
  getCandidate(nodeId: string): ImageCandidate | undefined {
    return this.candidates.get(nodeId);
  }

  /**
   * 获取所有图片候选
   *
   * @returns 图片候选数组
   */
  getAllCandidates(): ImageCandidate[] {
    return Array.from(this.candidates.values());
  }

  /**
   * 获取图片候选数量
   *
   * @returns 候选数量
   */
  getCandidateCount(): number {
    return this.candidates.size;
  }

  /**
   * 移除指定的图片候选
   *
   * @param nodeId - 节点 ID
   * @returns 是否成功移除
   */
  removeCandidate(nodeId: string): boolean {
    return this.candidates.delete(nodeId);
  }

  /**
   * 检查节点是否应该被跳过处理
   *
   * 当一个节点的父节点被整体转换为图片时，该节点应该被跳过
   *
   * @param nodeId - 节点 ID
   * @returns 是否应该跳过
   */
  isNodeSkipped(nodeId: string): boolean {
    return this.skippedNodeIds.has(nodeId);
  }

  /**
   * 获取被跳过的节点数量
   *
   * @returns 被跳过的节点数量
   */
  getSkippedCount(): number {
    return this.skippedNodeIds.size;
  }

  /**
   * 清空所有状态
   */
  clear(): void {
    this.candidates.clear();
    this.skippedNodeIds.clear();
  }

  /**
   * 序列化状态
   *
   * @returns 序列化后的状态数据
   */
  serialize(): SerializedImageCandidatesState {
    return {
      candidates: this.getAllCandidates(),
      skippedNodeIds: Array.from(this.skippedNodeIds)
    };
  }

  /**
   * 从序列化数据恢复状态
   *
   * @param data - 序列化后的状态数据
   * @returns 恢复后的状态实例
   */
  static deserialize(data: SerializedImageCandidatesState): ImageCandidatesState {
    const state = new ImageCandidatesState();

    // 恢复候选
    for (const candidate of data.candidates) {
      state.candidates.set(candidate.nodeId, candidate);
    }

    // 恢复跳过列表
    for (const nodeId of data.skippedNodeIds) {
      state.skippedNodeIds.add(nodeId);
    }

    return state;
  }

  /**
   * 导出所有图片候选数据为 JSON
   * @returns JSON 字符串
   */
  exportToJson(): string {
    return JSON.stringify(this.serialize(), null, 2);
  }

  /**
   * 从 JSON 导入图片候选数据
   * @param json JSON 字符串
   */
  importFromJson(json: string): void {
    try {
      const data = JSON.parse(json) as SerializedImageCandidatesState;
      this.set(data);
    } catch (error) {
      console.error("导入图片候选数据失败:", error);
      throw new Error("无效的 JSON 格式");
    }
  }
}
