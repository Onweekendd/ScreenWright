import type { ComponentType } from "@screenwright/types";

import { BaseCommand } from "./BaseCommand";

/**
 * 一个被重建的组件：原始数据（含旧 id）与服务端重建后的新组件（含新 id）。
 */
export interface RecreatedGroupComponent {
  /** 删除前捕获的原始组件（旧 id） */
  original: ComponentType;
  /** 服务端重建后的新组件（新 id） */
  created: ComponentType;
}

/**
 * 整组重建结果。
 */
export interface RecreatedGroup {
  /** 重建后的分组容器（新 id，children 已挂好重建后的成员） */
  group: ComponentType;
  /** 重建后的成员配对列表（旧 id -> 新 id） */
  members: RecreatedGroupComponent[];
}

/**
 * 删除整个分组命令（框架无关，依赖注入副作用）。
 *
 * 背景：删除"分组本身"是级联硬删除——分组容器和它的全部成员一起从服务端物理删除。
 * 与 DeletePanelStateCommand 面对的问题一致：响应拦截器只能看见 N+1 个匿名删除请求，
 * 拼不出"删整组"的语义，因此在"意图边界"手工捕获快照、构造本命令。
 *
 * 因为服务端不保留原始 id、每次重建都发新 id，所以：
 * - undo（恢复分组）：先重建分组容器（新 id）→ 再逐个重建成员（新 id，parent 指向新分组 id）→
 *   通过 onAfterUndo 把历史栈里的旧 id（分组 + 全部成员）统一重映射为新 id；
 * - redo（再次删除）：级联硬删除当前分组容器与全部成员（注意是上一次 undo 重建出的新 id）。
 *
 * @example
 * ```typescript
 * const command = new DeleteGroupCommand({
 *   groupMeta,     // 分组容器快照（不含 children，避免陈旧引用）
 *   members,       // 删除前捕获的成员快照（旧 id）
 *   recreateFn,    // 服务端重建分组+成员，返回 { group, members }
 *   deleteFn,      // 服务端级联硬删除（内部应传 SKIP，避免拦截器重复记账）
 *   onAfterUndo,   // 逐对调用 commandManager.updateComponentIdInHistory(old, new)
 *   description: "删除分组"
 * });
 * commandManager.addCommand(command);
 * ```
 */
export class DeleteGroupCommand extends BaseCommand {
  /** 分组容器元数据（不含 children，跨 undo/redo 周期外的字段保持不变） */
  private groupMeta: ComponentType;

  /**
   * 当前成员组件列表。
   * 初始为删除前捕获的原始成员（旧 id）；每次 undo 重建后替换为新组件（新 id），
   * 以保证后续 redo 删除的是正确的 id。
   */
  private members: ComponentType[];

  /** 重建分组容器与成员（服务端创建，返回新旧配对） */
  private recreateFn: (groupMeta: ComponentType, members: ComponentType[]) => Promise<RecreatedGroup>;

  /** 级联硬删除分组容器与成员（实现内部应使用 SKIP 历史类型） */
  private deleteFn: (groupId: string, memberIds: string[]) => Promise<void>;

  /** undo 重建后回调：把历史栈里的旧 id（分组 + 成员）重映射为新 id */
  private onAfterUndo: (pairs: RecreatedGroupComponent[]) => void;

  constructor({
    groupMeta,
    members,
    recreateFn,
    deleteFn,
    onAfterUndo,
    description
  }: {
    groupMeta: ComponentType;
    members: ComponentType[];
    recreateFn: (groupMeta: ComponentType, members: ComponentType[]) => Promise<RecreatedGroup>;
    deleteFn: (groupId: string, memberIds: string[]) => Promise<void>;
    onAfterUndo: (pairs: RecreatedGroupComponent[]) => void;
    description?: string;
  }) {
    super(description || `删除分组: ${groupMeta.id}`);

    this.groupMeta = groupMeta;
    this.members = members;
    this.recreateFn = recreateFn;
    this.deleteFn = deleteFn;
    this.onAfterUndo = onAfterUndo;
  }

  protected async doUndo(): Promise<RecreatedGroup> {
    const recreated = await this.recreateFn(this.groupMeta, this.members);

    if (!recreated || !recreated.group || !recreated.members || recreated.members.length === 0) {
      throw new Error(`撤销删除分组失败: ${this.groupMeta.id}`);
    }

    const groupPair: RecreatedGroupComponent = { original: this.groupMeta, created: recreated.group };

    // 把历史栈里其它命令引用的旧 id（分组 + 全部成员）重映射为新 id
    this.onAfterUndo([groupPair, ...recreated.members]);

    this.groupMeta = recreated.group;
    this.members = recreated.members.map((item) => item.created);

    return recreated;
  }

  protected async doRedo(): Promise<{ groupId: string; memberIds: string[] }> {
    const groupId = `${this.groupMeta.id}`;
    const memberIds = this.members.map((component) => `${component.id}`);

    await this.deleteFn(groupId, memberIds);

    return { groupId, memberIds };
  }

  /**
   * 更新命令内部持有的 id（分组或成员 id，撤销/重做产生新 id 时由历史管理器统一调用）。
   */
  updateComponentId(oldComponentId: string, newComponentId: string): void {
    if (oldComponentId === newComponentId) {
      return;
    }

    if (`${this.groupMeta.id}` === oldComponentId) {
      this.groupMeta = { ...this.groupMeta, id: parseInt(newComponentId) };
    }

    this.members.forEach((component) => {
      if (`${component.id}` === oldComponentId) {
        component.id = parseInt(newComponentId);
      }
    });
  }
}
