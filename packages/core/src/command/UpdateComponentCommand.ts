import type { ComponentType } from "@screenwright/types";

import { BaseCommand } from "./BaseCommand";

/**
 * 更新组件命令
 * 负责处理单个或批量组件更新操作的撤销和重做
 * 用于历史记录管理，不执行实际的更新操作
 *
 * @example
 * ```typescript
 * // 记录单个组件更新
 * const command = new UpdateComponentCommand(
 *   [updatedComponent],
 *   [originalComponent],
 *   executeUpdateFn,
 *   getCacheStateFn
 * )
 *
 * // 撤销更新操作
 * await command.undo()
 *
 * // 重做更新操作
 * await command.redo()
 * ```
 */
export class UpdateComponentCommand extends BaseCommand {
  /** 更新后的组件列表 */
  private updatedComponents: ComponentType[];

  /** 更新前的组件列表 */
  private originalComponents: ComponentType[];

  /** 执行更新的函数 */
  private executeUpdateFn: (components: ComponentType[], selectIds: string[]) => Promise<void>;

  constructor({
    updatedComponents,
    originalComponents,
    executeUpdateFn,
    description
  }: {
    updatedComponents: ComponentType[];
    originalComponents: ComponentType[];
    executeUpdateFn: (components: ComponentType[], selectIds: string[]) => Promise<void>;
    description: string;
  }) {
    const defaultDescription = `更新组件: ${updatedComponents.map((c) => c.id).join(", ")}`;
    super(description || defaultDescription);

    this.updatedComponents = updatedComponents;
    this.originalComponents = originalComponents;
    this.executeUpdateFn = executeUpdateFn;
  }

  /**
   * 撤销更新操作
   * @returns 撤销结果
   */
  protected async doUndo(): Promise<any> {
    const selectIds = this.originalComponents.map((c) => c.id.toString());

    console.log("撤销组件更新:", {
      componentIds: selectIds,
      count: this.originalComponents.length
    });

    await this.executeUpdateFn(this.originalComponents, selectIds);

    return {
      originalComponents: this.originalComponents,
      selectIds
    };
  }

  /**
   * 重做更新操作
   * @returns 重做结果
   */
  protected async doRedo(): Promise<any> {
    const selectIds = this.updatedComponents.map((c) => c.id.toString());

    console.log("重做组件更新:", {
      componentIds: selectIds,
      count: this.updatedComponents.length
    });

    await this.executeUpdateFn(this.updatedComponents, selectIds);

    return {
      updatedComponents: this.updatedComponents,
      selectIds
    };
  }

  /**
   * 获取更新的组件列表
   * @returns 更新的组件列表
   */
  getUpdatedComponents(): ComponentType[] {
    return [...this.updatedComponents];
  }

  /**
   * 获取原始组件列表
   * @returns 原始组件列表
   */
  getOriginalComponents(): ComponentType[] {
    return [...this.originalComponents];
  }

  /**
   * 更新组件ID
   * 用于在撤销或重做操作产生新组件ID时更新命令内部的组件引用
   * @param oldComponentId 旧的组件ID
   * @param newComponentId 新的组件ID
   */
  updateComponentId(oldComponentId: string, newComponentId: string): void {
    // 更新原始组件列表中的组件ID
    this.originalComponents.forEach((component) => {
      if (component.id.toString() === oldComponentId) {
        component.id = parseInt(newComponentId);
      }
    });

    // 更新更新后组件列表中的组件ID
    this.updatedComponents.forEach((component) => {
      if (component.id.toString() === oldComponentId) {
        component.id = parseInt(newComponentId);
      }
    });
  }
}
