/**
 * ImageExportService 服务类
 * 负责批量导出图片、进度通知、错误处理
 */

import type { UIMessage } from "../types/index";
import { UUIDGenerator } from "./UUIDGenerator";

export class ImageExportService {
  // 用于等待 UI 确认上传完成的 Promise resolve 函数
  private minioUploadResolve: (() => void) | null = null;
  // 记录跳过的节点
  private skippedNodes: { nodeId: string; nodeName: string }[] = [];

  constructor(private uiMessenger: (msg: UIMessage) => void) {}

  /**
   * 批量导出图片
   */
  async export(nodeIds: string[]): Promise<void> {
    await this.exportInternal(nodeIds, "exportImageData");
  }

  /**
   * 批量导出图片（给 Minio 上传流程使用）
   */
  async exportForMinio(nodeIds: string[], fileKey: string | null): Promise<void> {
    this.skippedNodes = [];
    await this.exportInternal(nodeIds, "exportImagesForMinioData", fileKey);
    // 上传结束后通知 UI 跳过的节点
    if (this.skippedNodes.length > 0) {
      const names = this.skippedNodes.map((n) => n.nodeName).join("、");
      this.uiMessenger({
        type: "minioUploadSkipped",
        skipped: this.skippedNodes,
        message: `以下 ${this.skippedNodes.length} 个节点导出超时已跳过：${names}`
      });
    }
  }

  /**
   * UI 上传完一张后调用此方法，解除内部的等待
   */
  notifyMinioUploadDone(): void {
    if (this.minioUploadResolve) {
      this.minioUploadResolve();
      this.minioUploadResolve = null;
    }
  }

  private async exportInternal(
    nodeIds: string[],
    dataMessageType: "exportImageData" | "exportImagesForMinioData",
    fileKey: string | null = null
  ): Promise<void> {
    const total = nodeIds.length;
    const isMinio = dataMessageType === "exportImagesForMinioData";
    const TIMEOUT_MS = 6000;
    this.notifyProgress(0, total);

    for (let i = 0; i < nodeIds.length; i++) {
      const nodeId = nodeIds[i];

      // 对整个单张导出（含 Minio 上传等待）包一层超时
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const timeoutPromise = new Promise<"timeout">((resolve) => {
        timeoutId = setTimeout(() => resolve("timeout"), TIMEOUT_MS);
      });

      // 单张完整流程：导出 + （Minio 模式下等待 UI 上传完成）
      const singleFlow = async (): Promise<"done"> => {
        await this.exportSingleImage(nodeId, i, total, dataMessageType, fileKey);
        if (isMinio) {
          // 等待 UI 确认上传完成
          await new Promise<void>((resolve) => {
            this.minioUploadResolve = resolve;
          });
        }
        return "done";
      };

      const result = await Promise.race([singleFlow(), timeoutPromise]);

      if (timeoutId !== null) clearTimeout(timeoutId);

      if (result === "timeout") {
        // 超时：查找节点名称用于提示
        const node = await figma.getNodeByIdAsync(nodeId).catch(() => null);
        const nodeName =
          node && "name" in node ? (node as SceneNode).name : nodeId;
        console.warn(`[Export] Node "${nodeName}" timed out after ${TIMEOUT_MS}ms, skipping`);
        this.skippedNodes.push({ nodeId, nodeName });
        this.notifyProgress(i + 1, total);
        // 清理 minioUploadResolve，避免后续错误触发
        this.minioUploadResolve = null;
      }
    }

    console.log(`[Export] All exports completed`);
  }

  private async exportSingleImage(
    nodeId: string,
    index: number,
    total: number,
    dataMessageType: "exportImageData" | "exportImagesForMinioData" = "exportImageData",
    fileKey: string | null = null
  ): Promise<void> {
    console.log(`[Export] Processing ${index + 1}/${total}: ${nodeId}`);

    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node || !("exportAsync" in node)) {
      console.warn(`[Export] Node ${nodeId} cannot be exported, skipping`);
      return;
    }

    // 注意：用原始 node（而非 exportable）判定是否"图片自身导出"。resolveExportableNode
    // 在 INSTANCE 节点会替换成 mainComponent，主组件的名字/填充往往对不上，用
    // exportable 判会漏判。命名后缀和原生 image 填充两种情形都算"图片自身导出"，
    // 否则会误把图片内已有的文字当普通面板文字隐藏掉。
    const originalIsImage =
      ("name" in node && (node as SceneNode).name?.endsWith("-image") === true) ||
      this.hasImageFill(node);

    const exportable = this.resolveExportableNode(node);
    const nodeName =
      "name" in exportable ? (exportable as SceneNode).name : "unknown";

    try {
      const bytes = await this.performExport(exportable, nodeName, originalIsImage);
      const fileName = UUIDGenerator.generateFileName();
      this.sendImageData(nodeId, fileName, bytes, dataMessageType, fileKey);
      this.notifyProgress(index + 1, total);
    } catch (error) {
      console.error(`[Export] Failed to export ${nodeName}:`, error);
      // 异常由外层 exportInternal 的超时兜底处理
      throw error;
    }
  }

  /**
   * 判断节点是否带有可见的 image 填充（原生图片节点）。
   * mixed（多段填充）视为非纯图片，返回 false。
   * 判定口径与 ImageCollectionService/AutoNamingService 保持一致。
   */
  private hasImageFill(node: BaseNode): boolean {
    if (!("fills" in node)) return false;
    const fills = (node as GeometryMixin).fills;
    if (fills === figma.mixed) return false;
    return fills.some((paint) => paint.type === "IMAGE" && paint.visible !== false);
  }

  private resolveExportableNode(node: BaseNode): SceneNode & ExportMixin {
    if (node.type === "INSTANCE") {
      const instance = node as InstanceNode;
      if (instance.mainComponent) {
        return instance.mainComponent as SceneNode & ExportMixin;
      } else {
        console.warn(
          `[Export] Instance has no mainComponent, exporting instance itself`
        );
      }
    }
    return node as SceneNode & ExportMixin;
  }

  private async performExport(
    exportable: SceneNode & ExportMixin,
    nodeName: string,
    originalIsImage: boolean
  ): Promise<Uint8Array> {
    console.log(`[Export] Starting export for: ${nodeName}`);
    const startTime = Date.now();

    // 阴影：始终递归隐藏整树，导出完用 backup 还原（外阴影会溢出 PNG 边缘）
    // 文字：当导出根本身就是 -image 时跳过——图片内部的文字属设计内容，不能抹掉
    const shadowBackup = this.hideShadows(exportable);
    const textBackup = originalIsImage ? new Map<string, boolean>() : this.hideTextNodes(exportable);
    const clipBackup = this.forceClipContent(exportable);

    try {
      const bytes = await exportable.exportAsync({
        format: "PNG",
        constraint: { type: "SCALE", value: 1 },
        contentsOnly: true,
      });
      const duration = Date.now() - startTime;
      console.log(
        `[Export] Completed ${nodeName} in ${duration}ms, size: ${bytes.length} bytes`
      );
      return bytes;
    } finally {
      await this.restoreShadows(shadowBackup);
      await this.restoreTextNodes(textBackup);
      await this.restoreClipContent(clipBackup);
    }
  }

  /** 临时把根节点的 clipsContent 设为 true，让导出严格裁剪到节点自身尺寸 */
  private forceClipContent(root: BaseNode): { id: string; original: boolean } | null {
    if (!("clipsContent" in root)) return null;
    const frame = root as FrameNode;
    const original = frame.clipsContent;
    if (original) return null;
    frame.clipsContent = true;
    return { id: frame.id, original };
  }

  /** 恢复 clipsContent */
  private async restoreClipContent(backup: { id: string; original: boolean } | null): Promise<void> {
    if (!backup) return;
    const node = await figma.getNodeByIdAsync(backup.id);
    if (node && "clipsContent" in node) {
      (node as FrameNode).clipsContent = backup.original;
    }
  }

  /** 遍历节点树，隐藏所有 TEXT 类型节点（背景图导出不应包含文字），返回备份用于恢复。
   *  调用方需自行决定是否在 -image 自导出时跳过本函数。 */
  private hideTextNodes(root: BaseNode): Map<string, boolean> {
    const backup = new Map<string, boolean>();
    const visit = (node: BaseNode) => {
      if (node.type === "TEXT" && "visible" in node) {
        const textNode = node as TextNode;
        backup.set(textNode.id, textNode.visible);
        textNode.visible = false;
      }
      if ("children" in node) {
        for (const child of (node as ChildrenMixin).children) {
          visit(child);
        }
      }
    };
    visit(root);
    return backup;
  }

  /** 根据备份恢复 TEXT 节点的 visible 状态 */
  private async restoreTextNodes(backup: Map<string, boolean>): Promise<void> {
    for (const [id, originalVisible] of backup) {
      const node = await figma.getNodeByIdAsync(id);
      if (node && "visible" in node) {
        (node as SceneNode).visible = originalVisible;
      }
    }
  }

  /** 遍历节点树，隐藏所有阴影 effect，返回备份用于恢复。
   *  始终递归整树——外阴影会溢出 PNG 边缘污染相邻像素，导出完后由 restoreShadows 还原。 */
  private hideShadows(root: BaseNode): Map<string, readonly Effect[]> {
    const backup = new Map<string, readonly Effect[]>();
    const visit = (node: BaseNode) => {
      if ("effects" in node) {
        const n = node as SceneNode & { effects: readonly Effect[] };
        const hasShadow = n.effects.some(
          (e) =>
            (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") && e.visible
        );
        if (hasShadow) {
          backup.set(node.id, n.effects);
          (n as unknown as { effects: Effect[] }).effects = n.effects.map((e) =>
            e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW"
              ? { ...e, visible: false }
              : e
          );
        }
      }
      if ("children" in node) {
        for (const child of (node as ChildrenMixin).children) {
          visit(child);
        }
      }
    };
    visit(root);
    return backup;
  }

  /** 根据备份恢复所有节点的阴影 effect */
  private async restoreShadows(
    backup: Map<string, readonly Effect[]>
  ): Promise<void> {
    for (const [id, effects] of backup) {
      const node = await figma.getNodeByIdAsync(id);
      if (node && "effects" in node) {
        (node as unknown as { effects: readonly Effect[] }).effects = effects;
      }
    }
  }

  private sendImageData(
    nodeId: string,
    fileName: string,
    bytes: Uint8Array,
    type: "exportImageData" | "exportImagesForMinioData" = "exportImageData",
    fileKey: string | null = null
  ): void {
    const items = [{ nodeId, fileName, bytes: Array.from(bytes) }];
    if (type === "exportImagesForMinioData") {
      this.uiMessenger({ type, fileKey, items });
    } else {
      this.uiMessenger({ type, items });
    }
  }

  private notifyProgress(current: number, total: number): void {
    this.uiMessenger({ type: "exportProgress", current, total });
  }
}
