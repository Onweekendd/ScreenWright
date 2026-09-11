import type { ComponentType } from "@screenwright/types";

import { BaseCommand } from "./BaseCommand";

/**
 * 删除组件参数
 */
interface DeleteComponentInfo {
  /** 要删除的组件 */
  component: ComponentType;
  /** 模块ID */
  moduleId: number;
}

/**
 * 删除组件命令
 * 负责处理单个或批量组件删除操作的撤销和重做
 * 用于历史记录管理，不执行实际的删除操作
 *
 * @example
 * ```typescript
 * // 记录单个组件删除
 * const command = new DeleteComponentCommand(
 *   [{ component: componentToDelete, moduleId: 75 }],
 *   executeDeleteFn,
 *   executeAddFn,
 *   getCacheStateFn
 * )
 *
 * // 撤销删除操作
 * await command.undo()
 *
 * // 重做删除操作
 * await command.redo()
 * ```
 *
 * @example
 * ```typescript
 * // 记录批量删除组件
 * const deleteInfos = [
 *   { component: component1, moduleId: 75 },
 *   { component: component2, moduleId: 76 }
 * ]
 *
 * const command = new DeleteComponentCommand(
 *   deleteInfos,
 *   executeDeleteFn,
 *   executeAddFn,
 *   getCacheStateFn
 * )
 *
 * // 撤销删除操作
 * await command.undo()
 * ```
 */
export class DeleteComponentCommand extends BaseCommand {
  /** 要删除的组件信息列表 */
  private deleteComponentInfos: DeleteComponentInfo[];

  /** 执行删除的函数 */
  private executeDeleteFn: (componentIds: string[], showConfirm?: boolean) => Promise<boolean>;

  /** 执行添加的函数 */
  private executeAddFn: (component: ComponentType, moduleId: number) => Promise<ComponentType | null>;

  /** 撤销后回调 */
  private onAfterUndo: (
    addedComponents: Array<{ originalComponent: ComponentType; newComponent: ComponentType }>
  ) => void;

  /** 重做后回调 */
  private onAfterRedo: (deletedComponents: Array<ComponentType>) => void;

  constructor({
    deleteComponentInfos,
    executeDeleteFn,
    executeAddFn,
    onAfterUndo,
    onAfterRedo,
    description
  }: {
    deleteComponentInfos: DeleteComponentInfo[];
    executeDeleteFn: (componentIds: string[], showConfirm?: boolean) => Promise<boolean>;
    executeAddFn: (component: ComponentType, moduleId: number) => Promise<ComponentType | null>;
    onAfterUndo: (addedComponents: Array<{ originalComponent: ComponentType; newComponent: ComponentType }>) => void;
    onAfterRedo: (deletedComponents: Array<ComponentType>) => void;
    description: string;
  }) {
    const componentIds = deleteComponentInfos.map((info) => info.component.id).join(", ");
    const defaultDescription = `删除组件: ${componentIds}`;
    super(description || defaultDescription);

    this.deleteComponentInfos = deleteComponentInfos;
    this.executeDeleteFn = executeDeleteFn;
    this.executeAddFn = executeAddFn;
    this.onAfterUndo = onAfterUndo;
    this.onAfterRedo = onAfterRedo;
  }

  /**
   * 撤销删除操作（重新添加已删除的组件）
   * @returns 撤销结果
   */
  protected async doUndo(): Promise<any> {
    console.log("撤销组件删除:", {
      componentCount: this.deleteComponentInfos.length
    });

    const addedComponents: Array<{ originalComponent: ComponentType; newComponent: ComponentType; moduleId: number }> =
      [];

    for (const { component: freezedComponent, moduleId } of this.deleteComponentInfos) {
      try {
        const restoredComponent = await this.executeAddFn(freezedComponent, moduleId);

        if (!restoredComponent) {
          console.error(`撤销删除失败: 无法重新添加组件 ${freezedComponent.id}`);
          continue;
        }

        addedComponents.push({ originalComponent: freezedComponent, newComponent: restoredComponent, moduleId });

        console.log(`撤销删除成功: 重新添加组件 ${freezedComponent.id} -> ${restoredComponent.id}`);
      } catch (error) {
        console.error(`撤销删除失败: 组件 ${freezedComponent.id}`, error);
      }
    }

    if (addedComponents.length === 0) {
      throw new Error("撤销删除失败: 没有成功恢复任何组件");
    }

    addedComponents.forEach((info, index) => {
      this.deleteComponentInfos[index] = {
        ...this.deleteComponentInfos[index],
        component: {
          ...this.deleteComponentInfos[index].component,
          id: info.newComponent.id
        }
      };
    });

    this.onAfterUndo(addedComponents);

    console.log("撤销栈:", this.deleteComponentInfos);

    return {
      originalComponents: this.deleteComponentInfos.map((info) => info.component),
      restoredComponents: addedComponents
    };
  }

  /**
   * 重做删除操作
   * 删除在撤销时重新添加的组件
   * @returns 重做结果
   */
  protected async doRedo(): Promise<any> {
    if (this.deleteComponentInfos.length === 0) {
      throw new Error("没有可重做的删除操作");
    }

    const componentIds = this.deleteComponentInfos.map((component) => component.component.id.toString());

    console.log("重做组件删除:", {
      componentIds,
      count: this.deleteComponentInfos.length
    });

    const success = await this.executeDeleteFn(componentIds, false);

    if (!success) {
      throw new Error(`重做删除失败: ${componentIds.join(", ")}`);
    }

    this.onAfterRedo(this.deleteComponentInfos.map((info) => info.component));

    return {
      redoDeletedComponents: this.deleteComponentInfos,
      componentIds
    };
  }

  /**
   * 获取要删除的组件信息列表
   * @returns 删除组件信息列表
   */
  getDeleteComponentInfos(): DeleteComponentInfo[] {
    return this.deleteComponentInfos.map((info) => ({
      component: JSON.parse(JSON.stringify(info.component)),
      moduleId: info.moduleId
    }));
  }

  /**
   * 获取恢复的组件列表
   * @returns 恢复的组件列表
   */
  getRestoredComponents(): ComponentType[] {
    return this.deleteComponentInfos.map((info) => info.component);
  }

  /**
   * 创建删除组件信息
   * @param component 要删除的组件
   * @param moduleId 模块ID
   * @returns 删除组件信息
   */
  static createDeleteInfo(component: ComponentType, moduleId: number): DeleteComponentInfo {
    return {
      component: JSON.parse(JSON.stringify(component)),
      moduleId
    };
  }

  updateComponentId(oldComponentId: string, newComponentId: string): void {
    if (oldComponentId === newComponentId) {
      return;
    }

    this.deleteComponentInfos.forEach((info) => {
      if (info.component.id.toString() === oldComponentId) {
        info.component.id = parseInt(newComponentId);
      }
    });
  }
}
