import type { ComponentType, PanelState } from "@screenwright/types";

import { BaseCommand } from "./BaseCommand";

/**
 * 一个被重建的子组件：原始数据（含旧 id）与服务端重建后的新组件（含新 id）。
 */
export interface RecreatedPanelStateChild {
  /** 删除前捕获的原始组件（旧 id） */
  original: ComponentType;
  /** 服务端重建后的新组件（新 id） */
  created: ComponentType;
}

/**
 * 删除动态面板状态命令（框架无关，依赖注入副作用）。
 *
 * 背景：删除一个状态是“组合操作”——既删掉状态内 N 个子组件（服务端硬删除、重建发新 id），
 * 又把状态本身从 panelData 中摘除（纯本地）。响应拦截器只能看见 N 个匿名删除请求、看不见
 * panelData 的结构变化，天然拼不回“删状态”的语义。因此这条命令在“意图边界”捕获，
 * 由调用方在删除发生后压入历史栈（addCommand 不会自动执行）。
 *
 * 因为后端不保留原始 id、每次重建都发新 id，所以：
 * - undo（恢复状态）：重建子组件 → 用新组件拼出状态 → 插回 panelData 原索引 →
 *   通过 onAfterUndo 把整条历史栈里的旧 id 重映射成新 id；
 * - redo（再次删除）：把状态摘除 → 删除当前的子组件（注意是上一次 undo 重建出的新 id）。
 *
 * 副作用全部通过构造函数注入；本类只持有数据与编排顺序，不触碰任何框架/DOM/网络。
 *
 * @example
 * ```typescript
 * const command = new DeletePanelStateCommand({
 *   statusIndex,
 *   stateMeta,          // PanelState 去掉 config
 *   children,           // 删除前捕获的子组件（旧 id）
 *   recreateChildrenFn, // 服务端重建，返回 {original, created}[]
 *   deleteChildrenFn,   // 服务端硬删除（内部应传 SKIP，避免拦截器重复记账）
 *   insertStateFn,      // 把状态 splice 回 panelData[statusIndex] 并持久化
 *   removeStateFn,      // 把状态从 panelData 摘除并持久化
 *   onAfterUndo,        // 逐对调用 commandManager.updateComponentIdInHistory(old, new)
 *   description: "删除动态面板状态"
 * });
 * commandManager.addCommand(command);
 * ```
 */
export class DeletePanelStateCommand extends BaseCommand {
  /** 状态在 panelData 中的索引 */
  private statusIndex: number;

  /** 状态容器元数据（PanelState 去掉 config，跨 undo/redo 周期不变） */
  private stateMeta: Omit<PanelState, "config">;

  /**
   * 当前子组件列表。
   * 初始为删除前捕获的原始组件（旧 id）；每次 undo 重建后替换为新组件（新 id），
   * 以保证后续 redo 删除的是正确的 id。
   */
  private children: ComponentType[];

  /** 重建子组件（服务端创建、返回新旧组件配对） */
  private recreateChildrenFn: (children: ComponentType[]) => Promise<RecreatedPanelStateChild[]>;

  /** 删除子组件（服务端硬删除；实现内部应使用 SKIP 历史类型） */
  private deleteChildrenFn: (componentIds: string[]) => Promise<void>;

  /** 把状态插回 panelData 指定索引并持久化 */
  private insertStateFn: (statusIndex: number, state: PanelState) => Promise<void>;

  /** 把状态从 panelData 指定索引摘除并持久化 */
  private removeStateFn: (statusIndex: number) => Promise<void>;

  /** undo 重建后回调：用于把历史栈里的旧 id 重映射为新 id */
  private onAfterUndo: (recreated: RecreatedPanelStateChild[]) => void;

  constructor({
    statusIndex,
    stateMeta,
    children,
    recreateChildrenFn,
    deleteChildrenFn,
    insertStateFn,
    removeStateFn,
    onAfterUndo,
    description
  }: {
    statusIndex: number;
    stateMeta: Omit<PanelState, "config">;
    children: ComponentType[];
    recreateChildrenFn: (children: ComponentType[]) => Promise<RecreatedPanelStateChild[]>;
    deleteChildrenFn: (componentIds: string[]) => Promise<void>;
    insertStateFn: (statusIndex: number, state: PanelState) => Promise<void>;
    removeStateFn: (statusIndex: number) => Promise<void>;
    onAfterUndo: (recreated: RecreatedPanelStateChild[]) => void;
    description?: string;
  }) {
    super(description || `删除动态面板状态: ${stateMeta.name ?? stateMeta.id}`);

    this.statusIndex = statusIndex;
    this.stateMeta = stateMeta;
    this.children = children;
    this.recreateChildrenFn = recreateChildrenFn;
    this.deleteChildrenFn = deleteChildrenFn;
    this.insertStateFn = insertStateFn;
    this.removeStateFn = removeStateFn;
    this.onAfterUndo = onAfterUndo;
  }

  /**
   * 撤销删除（恢复被删除的状态）。
   * @returns 撤销结果（恢复出的状态与新旧组件配对）
   */
  protected async doUndo(): Promise<{ restoredState: PanelState; recreated: RecreatedPanelStateChild[] }> {
    const recreated = await this.recreateChildrenFn(this.children);

    if (recreated.length === 0) {
      throw new Error("撤销删除状态失败: 没有成功恢复任何子组件");
    }

    // 用重建出的新组件拼出状态，插回原索引
    const restoredState: PanelState = {
      ...this.stateMeta,
      config: recreated.map((item) => item.created)
    };
    await this.insertStateFn(this.statusIndex, restoredState);

    // 用新组件（新 id）替换内部引用，保证后续 redo 删除正确的 id
    this.children = recreated.map((item) => item.created);

    // 把历史栈里其它命令引用的旧 id 重映射为新 id（本命令自身已是新 id，重映射对其为 no-op）
    this.onAfterUndo(recreated);

    return { restoredState, recreated };
  }

  /**
   * 重做删除（再次删除状态及其当前子组件）。
   * @returns 重做结果
   */
  protected async doRedo(): Promise<{ statusIndex: number; deletedComponentIds: string[] }> {
    await this.removeStateFn(this.statusIndex);

    const deletedComponentIds = this.children.map((component) => `${component.id}`);
    await this.deleteChildrenFn(deletedComponentIds);

    return { statusIndex: this.statusIndex, deletedComponentIds };
  }

  /**
   * 更新命令内部持有的子组件 id（撤销/重做产生新 id 时由历史管理器统一调用）。
   * @param oldComponentId 旧的组件ID
   * @param newComponentId 新的组件ID
   */
  updateComponentId(oldComponentId: string, newComponentId: string): void {
    if (oldComponentId === newComponentId) {
      return;
    }

    this.children.forEach((component) => {
      if (`${component.id}` === oldComponentId) {
        component.id = parseInt(newComponentId);
      }
    });
  }
}
