import type { ComponentType } from "@screenwright/types";

import { BaseCommand } from "./BaseCommand";

/**
 * 添加组件命令
 * 负责处理组件添加操作的撤销和重做
 * 用于历史记录管理，不执行实际的添加操作
 *
 * @example
 * ```typescript
 * // 记录组件添加操作
 * const command = new AddComponentCommand(
 *   componentToAdd,
 *   moduleId,
 *   executeAddFn,
 *   executeDeleteFn,
 *   getCacheStateFn
 * )
 *
 * // 撤销添加操作
 * await command.undo()
 *
 * // 重做添加操作
 * await command.redo()
 * ```
 */
export class AddComponentCommand extends BaseCommand {
  /** 要添加的组件 */
  private componentToAdd: ComponentType;

  /** 模块ID */
  private moduleId: number;

  /** 执行添加的函数 */
  private executeAddFn: (component: ComponentType, moduleId: number) => Promise<ComponentType | null>;

  /** 执行删除的函数 */
  private executeDeleteFn: (componentId: string, showConfirm?: boolean) => Promise<boolean>;

  /** 撤销后回调 */
  private onAfterUndo: (deletedComponent: ComponentType) => void;

  /** 重做后回调 */
  private onAfterRedo: (oldComponent: ComponentType, newComponent: ComponentType) => void;

  constructor({
    componentToAdd,
    moduleId,
    executeAddFn,
    executeDeleteFn,
    onAfterUndo,
    onAfterRedo,
    description
  }: {
    componentToAdd: ComponentType;
    moduleId: number;
    executeAddFn: (component: ComponentType, moduleId: number) => Promise<ComponentType | null>;
    executeDeleteFn: (componentId: string, showConfirm?: boolean) => Promise<boolean>;
    onAfterUndo: (oldComponent: ComponentType) => void;
    onAfterRedo: (oldComponent: ComponentType, newComponent: ComponentType) => void;
    description: string;
  }) {
    const defaultDescription = `添加组件: ${componentToAdd.id} (${componentToAdd.title || "Unknown"})`;
    super(description || defaultDescription);

    this.componentToAdd = componentToAdd;
    this.moduleId = moduleId;
    this.executeAddFn = executeAddFn;
    this.executeDeleteFn = executeDeleteFn;
    this.onAfterUndo = onAfterUndo;
    this.onAfterRedo = onAfterRedo;
  }

  /**
   * 撤销添加操作（删除已添加的组件）
   * @returns 撤销结果
   */
  protected async doUndo(): Promise<any> {
    console.log("撤销组件添加:", {
      componentId: this.componentToAdd.id,
      title: this.componentToAdd.title
    });

    const success = await this.executeDeleteFn(this.componentToAdd.id.toString(), false);

    if (!success) {
      throw new Error(`撤销添加失败: ${this.componentToAdd.id}`);
    }

    this.onAfterUndo(this.componentToAdd);

    return {
      deletedComponent: this.componentToAdd,
      originalComponent: this.componentToAdd
    };
  }

  /**
   * 重做添加操作
   * 重新添加组件，但可能会生成新的ID
   * @returns 重做结果
   */
  protected async doRedo(): Promise<any> {
    console.log("重做组件添加:", {
      componentId: this.componentToAdd.id,
      moduleId: this.moduleId
    });

    const addedComponent = await this.executeAddFn(this.componentToAdd, this.moduleId);

    if (!addedComponent) {
      throw new Error(`重做添加组件失败: ${this.componentToAdd.id}`);
    }

    this.onAfterRedo(this.componentToAdd, addedComponent);

    this.componentToAdd = {
      ...this.componentToAdd,
      id: addedComponent.id
    };

    return {
      originalComponent: this.componentToAdd,
      addedComponent,
      moduleId: this.moduleId
    };
  }

  /**
   * 获取要添加的组件
   * @returns 要添加的组件
   */
  getComponentToAdd(): ComponentType {
    return this.componentToAdd;
  }

  updateComponentId(oldComponentId: string, newComponentId: string): void {
    if (oldComponentId === newComponentId) {
      return;
    }

    if (this.componentToAdd.id.toString() === oldComponentId) {
      this.componentToAdd.id = parseInt(newComponentId);
    }
  }

  /**
   * 获取模块ID
   * @returns 模块ID
   */
  getModuleId(): number {
    return this.moduleId;
  }
}
