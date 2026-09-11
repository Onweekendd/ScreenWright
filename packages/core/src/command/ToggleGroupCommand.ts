import { BaseCommand } from "./BaseCommand";

/**
 * 建组结果:新分组的 id(总是服务端新分配的 id)。
 */
export interface GroupBuildResult {
  groupId: string;
}

/**
 * 解组结果:被提升回顶层的成员 id 列表(解组不产生新 id，成员用原 id 提升)。
 */
export interface GroupDissolveResult {
  memberIds: string[];
}

/**
 * 分组"创建/解散"命令（框架无关，依赖注入副作用）。
 *
 * 背景：创建分组与解散分组是同一对互逆操作——创建产生一个新的分组容器 id，
 * 解散则把成员用原 id 提升回顶层、并硬删除分组容器。二者互为 undo/redo，
 * 因此用一个 direction 字段区分"哪一个是已经发生的原始动作"：
 * - direction="create"：doRedo=建组（新 id），doUndo=解组（成员原 id 提升）
 * - direction="dissolve"：doRedo=解组，doUndo=建组
 *
 * 与 DeletePanelStateCommand 一致：业务逻辑（handleSelectGroupAction / handleGroupDelete）
 * 已经先执行过一次，本命令只在"意图边界"捕获快照、编排后续 undo/redo 的重复执行顺序。
 *
 * @example
 * ```typescript
 * const command = new ToggleGroupCommand({
 *   direction: "create",
 *   groupId,
 *   memberIds,
 *   buildGroupFn,      // (memberIds) => Promise<{ groupId }>
 *   dissolveGroupFn,   // (groupId) => Promise<{ memberIds }>
 *   onAfterBuild: (oldId, newId) => commandManager.updateComponentIdInHistory(oldId, newId),
 *   description: "创建分组"
 * });
 * commandManager.addCommand(command);
 * ```
 */
export class ToggleGroupCommand extends BaseCommand {
  /** 原始动作方向：create=创建分组已发生，dissolve=解散分组已发生 */
  private direction: "create" | "dissolve";

  /** 当前分组容器 id（分组存在时有效，解组后仅作为历史标识，重新建组会得到新 id） */
  private groupId: string;

  /** 当前分组成员 id 列表（解组/建组均保持稳定，除非分组容器本身被重建） */
  private memberIds: string[];

  /** 建组副作用：按成员 id 建立分组容器，返回新分组 id */
  private buildGroupFn: (memberIds: string[]) => Promise<GroupBuildResult>;

  /** 解组副作用：按分组 id 拆解分组容器，成员提升回顶层，返回成员 id 列表 */
  private dissolveGroupFn: (groupId: string) => Promise<GroupDissolveResult>;

  /** 建组产生新分组 id 后的回调（用于把历史栈里的旧分组 id 重映射为新 id） */
  private onAfterBuild: (oldGroupId: string, newGroupId: string) => void;

  constructor({
    direction,
    groupId,
    memberIds,
    buildGroupFn,
    dissolveGroupFn,
    onAfterBuild,
    description
  }: {
    direction: "create" | "dissolve";
    groupId: string;
    memberIds: string[];
    buildGroupFn: (memberIds: string[]) => Promise<GroupBuildResult>;
    dissolveGroupFn: (groupId: string) => Promise<GroupDissolveResult>;
    onAfterBuild: (oldGroupId: string, newGroupId: string) => void;
    description?: string;
  }) {
    super(description || (direction === "create" ? "创建分组" : "解散分组"));

    this.direction = direction;
    this.groupId = groupId;
    this.memberIds = memberIds;
    this.buildGroupFn = buildGroupFn;
    this.dissolveGroupFn = dissolveGroupFn;
    this.onAfterBuild = onAfterBuild;
  }

  private async performBuild(): Promise<GroupBuildResult> {
    const oldGroupId = this.groupId;
    const result = await this.buildGroupFn(this.memberIds);

    if (!result || !result.groupId) {
      throw new Error("建组失败: 未返回有效的分组 id");
    }

    this.groupId = result.groupId;
    this.onAfterBuild(oldGroupId, result.groupId);

    return result;
  }

  private async performDissolve(): Promise<GroupDissolveResult> {
    const result = await this.dissolveGroupFn(this.groupId);

    if (!result) {
      throw new Error(`解组失败: ${this.groupId}`);
    }

    this.memberIds = result.memberIds;

    return result;
  }

  protected async doRedo(): Promise<GroupBuildResult | GroupDissolveResult> {
    return this.direction === "create" ? this.performBuild() : this.performDissolve();
  }

  protected async doUndo(): Promise<GroupBuildResult | GroupDissolveResult> {
    return this.direction === "create" ? this.performDissolve() : this.performBuild();
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

    this.memberIds = this.memberIds.map((id) => (id === oldComponentId ? newComponentId : id));
  }
}
