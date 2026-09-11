import type { ComponentType, PanelState } from "@screenwright/types";

import { BaseCommand } from "./BaseCommand";

/**
 * 一个被重建的子组件：源组件（旧 id，属于源状态）与复制出的新组件（新 id）。
 */
export interface RecreatedPanelStateCopy {
  /** 源状态中的组件（旧 id，跨 undo/redo 周期不变） */
  original: ComponentType;
  /** 本轮复制产生的新组件（新 id） */
  created: ComponentType;
}

/**
 * 复制动态面板状态命令（框架无关，依赖注入副作用）。
 *
 * 是 DeletePanelStateCommand 的镜像：复制状态是"组合操作"——先复制状态内 N 个子组件
 * （服务端各自新建、发新 id），再把复制出的状态插入 panelData。区别在于本命令构造时，
 * "复制"这一原始动作已经先执行过一次（与 DeletePanelStateCommand 里"删除"已先发生一致），
 * 因此：
 * - doUndo（撤销复制）：摘除复制出的状态 → 硬删除其当前子组件（当前 id）；
 * - doRedo（重做复制）：对源状态重新跑一遍复制流程（产生新 id）→ 插回 panelData →
 *   通过 onAfterRedo 把历史栈里的旧 id 重映射成新 id。
 *
 * @example
 * ```typescript
 * const command = new CopyPanelStateCommand({
 *   sourceStatus,       // 复制源状态（子组件旧 id，跨 undo/redo 周期不变）
 *   copiedState,        // 本轮复制产生的状态（子组件当前 id）
 *   rebuildFn,          // 重新执行一次复制，返回新状态与新旧组件配对
 *   teardownFn,         // 从 panelData 摘除该状态并硬删除其当前子组件
 *   onAfterRedo,        // 逐对调用 commandManager.updateComponentIdInHistory(old, new)
 *   description: "复制动态面板状态"
 * });
 * commandManager.addCommand(command);
 * ```
 */
export class CopyPanelStateCommand extends BaseCommand {
  /** 复制源状态（子组件 id 跨 undo/redo 周期保持不变，用于每次 redo 重新复制） */
  private sourceStatus: PanelState;

  /**
   * 当前复制出的状态。
   * 初始为业务代码已经执行完的复制结果（当前 id）；每次 redo 重新复制后替换为最新结果，
   * 以保证后续 undo 删除的是正确的 id。
   */
  private copiedState: PanelState;

  /** 重新执行一次复制（服务端创建、返回新状态与新旧组件配对） */
  private rebuildFn: (sourceStatus: PanelState) => Promise<{ newState: PanelState; pairs: RecreatedPanelStateCopy[] }>;

  /** 从 panelData 摘除状态并硬删除其当前子组件（实现内部应使用 SKIP 历史类型） */
  private teardownFn: (state: PanelState) => Promise<void>;

  /** redo 重建后回调：把历史栈里的旧子组件 id 重映射为新 id */
  private onAfterRedo: (pairs: RecreatedPanelStateCopy[]) => void;

  constructor({
    sourceStatus,
    copiedState,
    rebuildFn,
    teardownFn,
    onAfterRedo,
    description
  }: {
    sourceStatus: PanelState;
    copiedState: PanelState;
    rebuildFn: (sourceStatus: PanelState) => Promise<{ newState: PanelState; pairs: RecreatedPanelStateCopy[] }>;
    teardownFn: (state: PanelState) => Promise<void>;
    onAfterRedo: (pairs: RecreatedPanelStateCopy[]) => void;
    description?: string;
  }) {
    super(description || `复制动态面板状态: ${copiedState.name ?? copiedState.id}`);

    this.sourceStatus = sourceStatus;
    this.copiedState = copiedState;
    this.rebuildFn = rebuildFn;
    this.teardownFn = teardownFn;
    this.onAfterRedo = onAfterRedo;
  }

  protected async doUndo(): Promise<{ removedState: PanelState }> {
    await this.teardownFn(this.copiedState);
    return { removedState: this.copiedState };
  }

  protected async doRedo(): Promise<{ newState: PanelState; pairs: RecreatedPanelStateCopy[] }> {
    const { newState, pairs } = await this.rebuildFn(this.sourceStatus);

    if (!newState || pairs.length === 0) {
      throw new Error("重做复制状态失败: 没有成功复制任何子组件");
    }

    this.onAfterRedo(pairs);
    this.copiedState = newState;

    return { newState, pairs };
  }

  /**
   * 更新命令内部持有的子组件 id（撤销/重做产生新 id 时由历史管理器统一调用）。
   * 注意：sourceStatus 引用的是源状态的组件 id，不随复制结果变化，因此不参与重映射。
   */
  updateComponentId(oldComponentId: string, newComponentId: string): void {
    if (oldComponentId === newComponentId) {
      return;
    }

    this.copiedState.config.forEach((component) => {
      if (`${component.id}` === oldComponentId) {
        component.id = parseInt(newComponentId);
      }
    });
  }
}
