import type { PanelState } from "@screenwright/types";

import { BaseCommand } from "./BaseCommand";

/**
 * 新增动态面板状态命令（框架无关，依赖注入副作用）。
 *
 * 与 DeletePanelStateCommand / CopyPanelStateCommand 不同：新增的空状态 id 是前端 uuid()
 * 生成、全程不经过服务端重建，不存在 id 漂移问题，因此本命令不需要 id 重映射，
 * 是几个面板状态命令中最简单的一个——doUndo/doRedo 只是对称地插入/摘除同一个状态对象。
 *
 * @example
 * ```typescript
 * const command = new AddPanelStateCommand({
 *   stateIndex,
 *   state: newStatus,
 *   insertStateFn, // (index, state) => Promise<void>，splice 回 panelData 并持久化
 *   removeStateFn, // (index) => Promise<void>，从 panelData 摘除并持久化
 *   description: "新增动态面板状态"
 * });
 * commandManager.addCommand(command);
 * ```
 */
export class AddPanelStateCommand extends BaseCommand {
  /** 状态在 panelData 中的索引 */
  private stateIndex: number;

  /** 新增的状态（id 全程不变） */
  private state: PanelState;

  /** 把状态插回 panelData 指定索引并持久化 */
  private insertStateFn: (stateIndex: number, state: PanelState) => Promise<void>;

  /** 把状态从 panelData 指定索引摘除并持久化 */
  private removeStateFn: (stateIndex: number) => Promise<void>;

  constructor({
    stateIndex,
    state,
    insertStateFn,
    removeStateFn,
    description
  }: {
    stateIndex: number;
    state: PanelState;
    insertStateFn: (stateIndex: number, state: PanelState) => Promise<void>;
    removeStateFn: (stateIndex: number) => Promise<void>;
    description?: string;
  }) {
    super(description || `新增动态面板状态: ${state.name ?? state.id}`);

    this.stateIndex = stateIndex;
    this.state = state;
    this.insertStateFn = insertStateFn;
    this.removeStateFn = removeStateFn;
  }

  protected async doRedo(): Promise<{ stateIndex: number; state: PanelState }> {
    await this.insertStateFn(this.stateIndex, this.state);
    return { stateIndex: this.stateIndex, state: this.state };
  }

  protected async doUndo(): Promise<{ stateIndex: number }> {
    await this.removeStateFn(this.stateIndex);
    return { stateIndex: this.stateIndex };
  }

  /** 状态 id 全程不变，不涉及组件 id 重映射，no-op。 */
  updateComponentId(_oldComponentId: string, _newComponentId: string): void {
    // 新增状态不产生新组件 id，无需处理
  }
}
