import type { CommandResult, ICommand } from "./BaseCommand";

/**
 * 命令管理器（框架无关）。
 * 负责管理命令的历史记录、撤销和重做操作
 * 不执行实际命令，只管理历史记录
 *
 * 响应式说明：core 内部用普通数组维护撤销/重做栈，不依赖任何 UI 框架。
 * 栈发生变化时通过 `subscribe` 通知订阅者；Vue 适配层据此把 `canUndo/canRedo`
 * 包成 `computed`（原 `getCanUndo/getCanRedo` 的职责移到适配层）。
 *
 * @example
 * ```typescript
 * // 创建命令管理器
 * const commandManager = new CommandManager()
 *
 * // 添加命令到历史记录
 * const command = new UpdateComponentCommand(...)
 * commandManager.addCommand(command)
 *
 * // 撤销操作
 * if (commandManager.canUndo()) {
 *   await commandManager.undo()
 * }
 *
 * // 重做操作
 * if (commandManager.canRedo()) {
 *   await commandManager.redo()
 * }
 * ```
 */
export class CommandManager {
  /** 撤销历史记录栈 */
  private undoStack: ICommand[];

  /** 重做历史记录栈 */
  private redoStack: ICommand[];

  /** 最大历史记录数量 */
  private maxHistorySize: number;

  /** 当前是否正在执行命令（用于防止递归） */
  private isExecuting = false;

  /** 栈变化订阅者（供适配层桥接响应式） */
  private listeners = new Set<() => void>();

  constructor(maxHistorySize = 100) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * 订阅历史栈变化。返回取消订阅函数。
   * @param listener 栈变化时的回调
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** 通知所有订阅者历史栈发生变化。 */
  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * 添加命令到历史记录
   * 用于记录已完成的操作，不执行实际命令
   * @param command 要添加的命令
   */
  addCommand(command: ICommand): void {
    // 添加到撤销栈
    this.addToUndoStack(command);

    // 清空重做栈
    this.redoStack = [];

    console.log("命令已添加到历史记录:", {
      command: command.getDescription(),
      undoStackSize: this.undoStack.length
    });

    this.notify();
  }

  /**
   * 撤销最后一个命令
   * @returns 撤销结果
   */
  async undo(): Promise<CommandResult> {
    if (this.undoStack.length === 0) {
      return {
        success: false,
        error: "没有可撤销的操作"
      };
    }

    if (this.isExecuting) {
      return {
        success: false,
        error: "正在执行其他命令，请稍后再试"
      };
    }

    this.isExecuting = true;

    try {
      const command = this.undoStack[this.undoStack.length - 1];
      const result = await command.undo();

      if (result.success) {
        // 撤销成功，从撤销栈移除，添加到重做栈
        this.undoStack = this.undoStack.slice(0, -1);
        this.addToRedoStack(command);

        console.log("命令撤销成功:", {
          command: command.getDescription(),
          undoStackSize: this.undoStack.length,
          redoStackSize: this.redoStack.length
        });

        this.notify();
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * 重做最后一个撤销的命令
   * @returns 重做结果
   */
  async redo(): Promise<CommandResult> {
    if (this.redoStack.length === 0) {
      return {
        success: false,
        error: "没有可重做的操作"
      };
    }

    if (this.isExecuting) {
      return {
        success: false,
        error: "正在执行其他命令，请稍后再试"
      };
    }

    this.isExecuting = true;

    try {
      const command = this.redoStack[this.redoStack.length - 1];
      const result = await command.redo();

      if (result.success) {
        // 重做成功，从重做栈移除，添加到撤销栈
        this.redoStack = this.redoStack.slice(0, -1);
        this.addToUndoStack(command);

        console.log("命令重做成功:", {
          command: command.getDescription(),
          undoStackSize: this.undoStack.length,
          redoStackSize: this.redoStack.length
        });

        this.notify();
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * 添加命令到撤销栈
   * @param command 命令
   */
  private addToUndoStack(command: ICommand): void {
    this.undoStack = [...this.undoStack, command];

    // 限制历史记录数量
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack = this.undoStack.slice(-this.maxHistorySize);
    }
  }

  /**
   * 添加命令到重做栈
   * @param command 命令
   */
  private addToRedoStack(command: ICommand): void {
    this.redoStack = [...this.redoStack, command];

    // 限制历史记录数量
    if (this.redoStack.length > this.maxHistorySize) {
      this.redoStack = this.redoStack.slice(-this.maxHistorySize);
    }
  }

  /**
   * 检查是否可以撤销
   * @returns 是否可以撤销
   */
  canUndo(): boolean {
    return this.undoStack.length > 0 && !this.isExecuting;
  }

  /**
   * 检查是否可以重做
   * @returns 是否可以重做
   */
  canRedo(): boolean {
    return this.redoStack.length > 0 && !this.isExecuting;
  }

  /**
   * 获取撤销栈大小
   * @returns 撤销栈大小
   */
  getUndoStackSize(): number {
    return this.undoStack.length;
  }

  /**
   * 获取重做栈大小
   * @returns 重做栈大小
   */
  getRedoStackSize(): number {
    return this.redoStack.length;
  }

  /**
   * 获取历史记录概要
   * @returns 历史记录概要
   */
  getHistorySummary() {
    return {
      undoStack: this.undoStack.map((cmd) => cmd.getDescription()),
      redoStack: this.redoStack.map((cmd) => cmd.getDescription()),
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      isExecuting: this.isExecuting
    };
  }

  /**
   * 清空所有历史记录
   */
  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];

    console.log("历史记录已清空");

    this.notify();
  }

  /**
   * 获取最后执行的命令描述
   * @returns 最后执行的命令描述，如果没有则返回null
   */
  getLastCommandDescription(): string | null {
    if (this.undoStack.length === 0) {
      return null;
    }

    return this.undoStack[this.undoStack.length - 1].getDescription();
  }

  /**
   * 更新历史记录中的组件ID
   * 用于在撤销或重做操作产生新组件ID时更新历史记录
   * @param oldComponentId 旧的组件ID
   * @param newComponentId 新的组件ID
   */
  updateComponentIdInHistory(oldComponentId: string, newComponentId: string): void {
    if (oldComponentId === newComponentId) {
      return;
    }

    console.log(`更新历史记录中的组件ID: ${oldComponentId} -> ${newComponentId}`);

    // 更新撤销栈中的组件ID
    this.undoStack.forEach((command) => {
      command.updateComponentId(oldComponentId, newComponentId);
    });

    // 更新重做栈中的组件ID
    this.redoStack.forEach((command) => {
      command.updateComponentId(oldComponentId, newComponentId);
    });
  }
}
