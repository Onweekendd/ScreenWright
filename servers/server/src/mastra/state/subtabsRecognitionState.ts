import { z } from "zod";

import type { IValueStore } from "./stateManager";

/**
 * Subtabs 识别结果 Schema
 */
export const subtabsRecognitionSchema = z.object({
  nodeId: z.string().describe("选项卡节点 ID"),
  nodeName: z.string().describe("节点名称"),
  tabCount: z.number().describe("选项卡数量"),
  layoutType: z.enum(["horizontal", "vertical", "grid"]).describe("布局类型"),
  hasImages: z.boolean().describe("是否包含背景图片"),
  hasActiveState: z.boolean().describe("是否识别到激活状态"),
  componentId: z.string().optional().describe("转换后的组件 ID"),
  timestamp: z.number().optional().describe("识别时间戳")
});

export type SubtabsRecognition = z.infer<typeof subtabsRecognitionSchema>;

/**
 * Subtabs 识别状态管理器
 *
 * 用于在 workflow 中保持和共享选项卡识别状态
 * 记录哪些节点被识别为 Subtabs 组件，以及相关的识别元数据
 */
export class SubtabsRecognitionState implements IValueStore<Array<SubtabsRecognition>> {
  private store: Array<SubtabsRecognition>;

  constructor() {
    this.store = new Array<SubtabsRecognition>();
  }

  /**
   * 获取内部存储（实现 IValueStore 接口）
   */
  get(): Array<SubtabsRecognition> {
    return this.store;
  }

  /**
   * 设置内部存储（实现 IValueStore 接口）
   */
  set(value: Array<SubtabsRecognition>): void {
    this.store = value;
  }

  /**
   * 更新内部存储（实现 IValueStore 接口）
   */
  update(updater: (prev: Array<SubtabsRecognition> | undefined) => Array<SubtabsRecognition>): void {
    this.store = updater(this.store);
  }

  /**
   * 检查是否有值（实现 IValueStore 接口）
   */
  hasValue(): boolean {
    return this.store !== undefined && this.store.length > 0;
  }

  /**
   * 清空所有识别记录
   */
  clear(): void {
    this.store.length = 0;
  }

  /**
   * 添加一个 Subtabs 识别记录
   * @param recognition Subtabs 识别对象
   */
  addRecognition(recognition: SubtabsRecognition): void {
    // 添加时间戳
    if (!recognition.timestamp) {
      recognition.timestamp = Date.now();
    }
    this.store.push(recognition);
  }

  /**
   * 批量添加 Subtabs 识别记录
   * @param recognitions Subtabs 识别数组
   */
  addRecognitions(recognitions: SubtabsRecognition[]): void {
    recognitions.forEach((recognition) => {
      this.addRecognition(recognition);
    });
  }

  /**
   * 根据节点 ID 获取识别记录
   * @param nodeId 节点 ID
   * @returns Subtabs 识别记录，如果不存在则返回 undefined
   */
  getRecognitionById(nodeId?: string | null): SubtabsRecognition | undefined {
    if (!nodeId) {
      return undefined;
    }
    return this.store.find((recognition) => recognition.nodeId === nodeId);
  }

  /**
   * 检查节点是否已被识别为 Subtabs
   * @param nodeId 节点 ID
   * @returns 如果已识别返回 true，否则返回 false
   */
  hasRecognition(nodeId: string): boolean {
    return this.store.some((recognition) => recognition.nodeId === nodeId);
  }

  /**
   * 根据布局类型获取所有识别记录
   * @param layoutType 布局类型
   * @returns 符合条件的识别记录数组
   */
  getRecognitionsByLayoutType(layoutType: SubtabsRecognition["layoutType"]): SubtabsRecognition[] {
    return this.store.filter((recognition) => recognition.layoutType === layoutType);
  }

  /**
   * 获取包含图片的所有 Subtabs
   * @returns 包含图片的识别记录数组
   */
  getRecognitionsWithImages(): SubtabsRecognition[] {
    return this.store.filter((recognition) => recognition.hasImages);
  }

  /**
   * 获取具有激活状态的所有 Subtabs
   * @returns 具有激活状态的识别记录数组
   */
  getRecognitionsWithActiveState(): SubtabsRecognition[] {
    return this.store.filter((recognition) => recognition.hasActiveState);
  }

  /**
   * 更新识别记录的组件 ID
   * @param nodeId 节点 ID
   * @param componentId 组件 ID
   * @returns 如果更新成功返回 true，否则返回 false
   */
  updateComponentId(nodeId: string, componentId: string): boolean {
    const recognition = this.getRecognitionById(nodeId);
    if (recognition) {
      recognition.componentId = componentId;
      return true;
    }
    return false;
  }

  /**
   * 获取所有识别记录
   * @returns 所有 Subtabs 识别记录数组
   */
  getAllRecognitions(): SubtabsRecognition[] {
    return this.store.slice();
  }

  /**
   * 获取识别记录总数
   * @returns 识别记录数量
   */
  getCount(): number {
    return this.store.length;
  }

  /**
   * 删除指定节点的识别记录
   * @param nodeId 节点 ID
   * @returns 如果删除成功返回 true，否则返回 false
   */
  deleteRecognition(nodeId: string): boolean {
    const initialLength = this.store.length;
    this.store = this.store.filter((recognition) => recognition.nodeId !== nodeId);
    return this.store.length < initialLength;
  }

  /**
   * 获取识别统计信息
   * @returns 各布局类型的统计信息
   */
  getStatistics(): {
    total: number;
    byLayout: Record<SubtabsRecognition["layoutType"], number>;
    withImages: number;
    withActiveState: number;
  } {
    const byLayout: Record<string, number> = {};
    let withImages = 0;
    let withActiveState = 0;

    this.store.forEach((recognition) => {
      // 统计布局类型
      byLayout[recognition.layoutType] = (byLayout[recognition.layoutType] || 0) + 1;

      // 统计图片使用
      if (recognition.hasImages) {
        withImages++;
      }

      // 统计激活状态
      if (recognition.hasActiveState) {
        withActiveState++;
      }
    });

    return {
      total: this.store.length,
      byLayout: byLayout as Record<SubtabsRecognition["layoutType"], number>,
      withImages,
      withActiveState
    };
  }

  /**
   * 导出所有识别记录为 JSON
   * @returns JSON 字符串
   */
  exportToJson(): string {
    return JSON.stringify(this.store, null, 2);
  }

  /**
   * 从 JSON 导入识别记录
   * @param json JSON 字符串
   */
  importFromJson(json: string): void {
    try {
      const data = JSON.parse(json);
      this.store = Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("导入 Subtabs 识别记录失败:", error);
      throw new Error("无效的 JSON 格式");
    }
  }
}
