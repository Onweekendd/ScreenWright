import type { PanelState } from "@screenwright/types";

import { BaseCommand } from "./BaseCommand";

/**
 * 动态面板状态排序命令（框架无关，依赖注入副作用）。
 *
 * 拖拽排序不产生新 id、不涉及服务端重建，只是 panelData 数组顺序的整体替换，
 * 因此直接保存排序前后两份快照，doUndo/doRedo 分别整体覆盖并持久化即可。
 *
 * @example
 * ```typescript
 * const command = new ReorderPanelStateCommand({
 *   oldOrder, // 拖拽前的 panelData 快照
 *   newOrder, // 拖拽后的 panelData 快照
 *   applyOrderFn, // (order) => Promise<void>，整体覆盖 panelData 并持久化
 *   description: "调整动态面板状态顺序"
 * });
 * commandManager.addCommand(command);
 * ```
 */
export class ReorderPanelStateCommand extends BaseCommand {
  /** 排序前的状态顺序快照 */
  private oldOrder: PanelState[];

  /** 排序后的状态顺序快照 */
  private newOrder: PanelState[];

  /** 整体覆盖 panelData 顺序并持久化 */
  private applyOrderFn: (order: PanelState[]) => Promise<void>;

  constructor({
    oldOrder,
    newOrder,
    applyOrderFn,
    description
  }: {
    oldOrder: PanelState[];
    newOrder: PanelState[];
    applyOrderFn: (order: PanelState[]) => Promise<void>;
    description?: string;
  }) {
    super(description || "调整动态面板状态顺序");

    this.oldOrder = oldOrder;
    this.newOrder = newOrder;
    this.applyOrderFn = applyOrderFn;
  }

  protected async doRedo(): Promise<{ order: PanelState[] }> {
    await this.applyOrderFn(this.newOrder);
    return { order: this.newOrder };
  }

  protected async doUndo(): Promise<{ order: PanelState[] }> {
    await this.applyOrderFn(this.oldOrder);
    return { order: this.oldOrder };
  }

  /** 排序不产生新组件 id，不涉及组件 id 重映射，no-op。 */
  updateComponentId(_oldComponentId: string, _newComponentId: string): void {
    // 排序不产生新组件 id，无需处理
  }
}
