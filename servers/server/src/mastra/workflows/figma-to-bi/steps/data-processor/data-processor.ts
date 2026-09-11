import type { StructuralNode } from "@screenwright/figma-helper/shared";
import { isComponentNode, StructuralProcessor } from "@screenwright/figma-helper/shared";

import type { FigmaFileType, FigmaNode } from "@/mastra/types/figma-type";

/**
 * DataProcessor — 服务端 Figma 节点数据处理器
 *
 * 继承 StructuralProcessor，在其结构合并逻辑之上增加：
 * - 坐标归一化（将各 merge 帧子节点坐标转为相对坐标）
 * - 子节点顺序反转（修正 Figma API 返回顺序）
 * - 组件节点分离
 *
 * 任务概览：
 * 1. 将多个标记了 merge 的兄弟 frame 处理为 公共节点 + 状态节点
 * 2. 清空 -image 节点的子节点
 * 3. 跨 frame 的 -subtab 节点去重，只保留一个为公共节点
 * 4. -panel 跨 frame 找到对应的 -panel 后，如果两个 -panel 结构一致
 *    且含有同名 -panel 子节点，则需要嵌套合并
 */
export class DataProcessor extends StructuralProcessor {
  /** 根节点数据 */
  root: FigmaNode | null = null;
  componentNodes: FigmaNode[] = [];
  globalVars: FigmaFileType["globalVars"] | null = null;
  fileKey: string = "";

  /**
   * 接收一个根为展项的 figma 文件并初始化处理器
   * @param figmaType Figma 文件数据
   */
  constructor(figmaType: FigmaFileType) {
    super();
    const root = figmaType.nodes[0];

    if (!root) {
      return;
    }

    this.globalVars = figmaType.globalVars;

    if (figmaType.fileKey) {
      this.fileKey = figmaType.fileKey;
    }

    this.componentNodes = root.children?.filter((node) => node.name && isComponentNode(node.name)) ?? [];

    root.children = root.children?.filter((node) => !node.name || !isComponentNode(node.name)) ?? [];

    // 反转所有节点的子节点顺序（修正 Figma API 返回层序与视觉顺序的差异）
    this.reverseChildrenOrder(root);

    this.root = root;
  }

  /**
   * 将处理后的节点数据重新组装为 FigmaFileType
   */
  assembleFullFigmaData(): FigmaFileType {
    return {
      nodes: [this.root!],
      globalVars: this.globalVars!,
      fileKey: this.fileKey
    };
  }

  /**
   * 处理的入口，对 root 进行结构合并处理
   */
  public startProcessNode(): void {
    this.process(this.root!);
  }

  /**
   * 合并多个 -merge 帧（公开入口，内部调用 mergeStructure）
   * 坐标归一化由 mergeStructure override 自动完成。
   * @param frames -merge 帧列表
   */
  public mergeFrame(frames: FigmaNode[]) {
    return this.mergeStructure(frames as StructuralNode[]);
  }

  /**
   * 删除 -image 节点的子节点（工作流专用，减少传输数据量）
   * @param node 要处理的节点
   */
  removeImageNodeChildren(node: FigmaNode): void {
    if (node.name && node.name.endsWith("-image")) {
      node.children = [];
      return;
    }

    if (node.children) {
      for (const child of node.children) {
        this.removeImageNodeChildren(child);
      }
    }
  }

  /**
   * 覆写：将 status 帧自身当作唯一状态处理时（没有 -merge 包装层），复用同一套坐标归一化逻辑，
   * 使其效果对齐"有 -merge 包装"分支——子孙坐标变为相对 status 帧原点。
   */
  protected override normalizeFrameOrigin(frame: StructuralNode): void {
    this.normalizeFrameChildrenToRelative(frame as FigmaNode);
  }

  /**
   * 覆写：按 globalVars 中记录的实际宽高比较面积，选出更大的那个 layout key，
   * 用于让动态面板取"各状态里最大的那个"尺寸，而不是无意义的后者覆盖前者。
   */
  protected override pickLargerLayout(current: string | undefined, candidate: string | undefined): string | undefined {
    if (!candidate) {
      return current;
    }
    if (!current) {
      return candidate;
    }
    if (!this.globalVars) {
      return candidate;
    }

    const currentStyle = this.globalVars.styles[current];
    const candidateStyle = this.globalVars.styles[candidate];
    if (!currentStyle || !candidateStyle) {
      return candidate;
    }

    const currentArea = (currentStyle.dimensions?.width ?? 0) * (currentStyle.dimensions?.height ?? 0);
    const candidateArea = (candidateStyle.dimensions?.width ?? 0) * (candidateStyle.dimensions?.height ?? 0);

    return candidateArea >= currentArea ? candidate : current;
  }

  /**
   * 重写 mergeStructure，在结构合并前先对每个帧进行坐标归一化，
   * 合并完成后将合并帧的坐标归零。
   */
  protected override mergeStructure(frames: StructuralNode[]): ReturnType<StructuralProcessor["mergeStructure"]> {
    // 坐标归一化：将各帧子节点坐标转为相对于该帧的坐标
    (frames as FigmaNode[]).forEach((frame) => {
      this.normalizeFrameChildrenToRelative(frame);
    });

    const result = super.mergeStructure(frames);

    // 确保合并后的 frame 位置为原点
    const mergedLayoutKey = result.mergedFrame.layout ?? "";
    if (this.globalVars && mergedLayoutKey && this.globalVars.styles[mergedLayoutKey]) {
      this.globalVars.styles[mergedLayoutKey].absolutePosition = { x: 0, y: 0 };
    }

    return result;
  }

  /**
   * 递归反转节点的子节点顺序（修正 Figma API 返回顺序）
   * @param node 要处理的节点
   */
  private reverseChildrenOrder(node: FigmaNode): void {
    if (node.children && node.children.length > 0) {
      node.children.reverse();
      for (const child of node.children) {
        this.reverseChildrenOrder(child);
      }
    }
  }

  /**
   * 将 frame 子节点的 absolutePosition 转换为相对于该 frame 的相对坐标，
   * 并将 frame 自身的 absolutePosition 重置为原点。
   * 合并前对每个 frame 调用，确保合并后所有子节点坐标已归一化。
   */
  private normalizeFrameChildrenToRelative(mergedFrame: FigmaNode): void {
    const layoutKey = mergedFrame.layout ?? "";
    if (!this.globalVars || !this.globalVars.styles[layoutKey]) {
      return;
    }

    const frameStyle = this.globalVars.styles[layoutKey];
    const offset = frameStyle.absolutePosition ?? { x: 0, y: 0 };

    if (offset.x !== 0 || offset.y !== 0) {
      // visited 用于跳过共享同一 layout key 的重复节点，避免多次相减
      const visited = new Set<string>([layoutKey]);
      this.shiftNodePositions(mergedFrame.children ?? [], offset, visited);
    }

    frameStyle.absolutePosition = { x: 0, y: 0 };
  }

  /**
   * 递归将节点列表中所有节点的 absolutePosition 减去 offset。
   * visited 记录已处理的 layout key，防止多个节点共享同一 key 时被重复相减。
   */
  private shiftNodePositions(nodes: FigmaNode[], offset: { x: number; y: number }, visited: Set<string>): void {
    for (const node of nodes) {
      const layoutKey = node.layout ?? "";
      if (layoutKey && !visited.has(layoutKey) && this.globalVars && this.globalVars.styles[layoutKey]) {
        visited.add(layoutKey);
        const style = this.globalVars.styles[layoutKey];
        if (style.absolutePosition) {
          style.absolutePosition = {
            x: style.absolutePosition.x - offset.x,
            y: style.absolutePosition.y - offset.y
          };
        }
      }
      if (node.children && node.children.length > 0) {
        this.shiftNodePositions(node.children, offset, visited);
      }
    }
  }
}
