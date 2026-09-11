import type { ComponentType } from "@screenwright/types";

import { BaseCommand } from "./BaseCommand";

/**
 * 从分组移除单个成员命令（框架无关，依赖注入副作用）。
 *
 * 覆盖场景：删除分组内一个成员、且删除后分组仍保留 >=2 个成员（分组容器本身不受影响，
 * 只需重算包围盒并持久化）。分组仅剩 1 个成员时会触发"自动解散"的复合场景不适用本命令。
 *
 * 与 DeletePanelStateCommand / DeleteGroupCommand 一致：业务逻辑（删除成员、重算分组包围盒）
 * 已经先执行过一次，本命令只在"意图边界"捕获快照、编排后续 undo/redo 的重复执行顺序。
 *
 * @example
 * ```typescript
 * const command = new RemoveGroupMemberCommand({
 *   groupId,
 *   member,          // 删除前捕获的成员快照（旧 id）
 *   recreateMemberFn,// 服务端重建成员（新 id，parent=groupId），并插回分组、重算包围盒
 *   removeMemberFn,  // 服务端硬删除成员，并从分组 children 移除、重算包围盒
 *   onAfterUndo,      // 调用 commandManager.updateComponentIdInHistory(old, new)
 *   description: "删除分组成员"
 * });
 * commandManager.addCommand(command);
 * ```
 */
export class RemoveGroupMemberCommand extends BaseCommand {
  /** 成员所属的分组 id */
  private groupId: string;

  /**
   * 当前成员组件快照。
   * 初始为删除前捕获的原始成员（旧 id）；每次 undo 重建后替换为新组件（新 id），
   * 以保证后续 redo 删除的是正确的 id。
   */
  private member: ComponentType;

  /** 重建成员并插回分组（服务端创建、插回 children、重算分组包围盒并持久化） */
  private recreateMemberFn: (groupId: string, member: ComponentType) => Promise<ComponentType>;

  /** 硬删除成员并从分组移除（服务端硬删除、从 children 摘除、重算分组包围盒并持久化） */
  private removeMemberFn: (groupId: string, memberId: string) => Promise<void>;

  /** undo 重建后回调：把历史栈里的旧成员 id 重映射为新 id */
  private onAfterUndo: (oldMemberId: string, newMember: ComponentType) => void;

  constructor({
    groupId,
    member,
    recreateMemberFn,
    removeMemberFn,
    onAfterUndo,
    description
  }: {
    groupId: string;
    member: ComponentType;
    recreateMemberFn: (groupId: string, member: ComponentType) => Promise<ComponentType>;
    removeMemberFn: (groupId: string, memberId: string) => Promise<void>;
    onAfterUndo: (oldMemberId: string, newMember: ComponentType) => void;
    description?: string;
  }) {
    super(description || `删除分组成员: ${member.id}`);

    this.groupId = groupId;
    this.member = member;
    this.recreateMemberFn = recreateMemberFn;
    this.removeMemberFn = removeMemberFn;
    this.onAfterUndo = onAfterUndo;
  }

  protected async doUndo(): Promise<ComponentType> {
    const oldMemberId = `${this.member.id}`;
    const recreatedMember = await this.recreateMemberFn(this.groupId, this.member);

    if (!recreatedMember) {
      throw new Error(`撤销删除分组成员失败: ${oldMemberId}`);
    }

    this.onAfterUndo(oldMemberId, recreatedMember);
    this.member = recreatedMember;

    return recreatedMember;
  }

  protected async doRedo(): Promise<{ groupId: string; memberId: string }> {
    const memberId = `${this.member.id}`;
    await this.removeMemberFn(this.groupId, memberId);

    return { groupId: this.groupId, memberId };
  }

  /**
   * 更新命令内部持有的 id（分组 id 或成员 id）。
   */
  updateComponentId(oldComponentId: string, newComponentId: string): void {
    if (oldComponentId === newComponentId) {
      return;
    }

    if (this.groupId === oldComponentId) {
      this.groupId = newComponentId;
    }

    if (`${this.member.id}` === oldComponentId) {
      this.member.id = parseInt(newComponentId);
    }
  }
}
