/**
 * 命令接口
 * 定义了所有命令必须实现的基本方法
 */
export interface ICommand {
  /**
   * 撤销命令
   * @returns 撤销结果的Promise
   */
  undo(): Promise<any>;

  /**
   * 重做命令
   * @returns 重做结果的Promise
   */
  redo(): Promise<any>;

  /**
   * 获取命令描述
   * @returns 命令的描述信息
   */
  getDescription(): string;

  /** 更新组件ID */
  updateComponentId(oldComponentId: string, newComponentId: string): void;
}

/**
 * 命令执行结果
 */
export interface CommandResult {
  /** 是否执行成功 */
  success: boolean;
  /** 执行结果数据 */
  data?: any;
  /** 错误信息 */
  error?: string;
  /** 额外信息 */
  message?: string;
}

/**
 * 抽象命令基类
 * 实现了命令接口的基本结构，子类只需实现具体的undo和redo逻辑
 */
export abstract class BaseCommand implements ICommand {
  /** 命令描述 */
  protected description: string;

  constructor(description: string) {
    this.description = description;
  }

  /**
   * 撤销命令
   * @returns 撤销结果
   */
  async undo(): Promise<CommandResult> {
    try {
      const result = await this.doUndo();
      return {
        success: true,
        data: result,
        message: `${this.description} 撤销成功`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: `${this.description} 撤销失败`
      };
    }
  }

  /**
   * 重做命令
   * @returns 重做结果
   */
  async redo(): Promise<CommandResult> {
    try {
      const result = await this.doRedo();
      return {
        success: true,
        data: result,
        message: `${this.description} 重做成功`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: `${this.description} 重做失败`
      };
    }
  }

  /**
   * 获取命令描述
   * @returns 命令描述
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * 具体的撤销逻辑，由子类实现
   * @returns 撤销结果
   */
  protected abstract doUndo(): Promise<any>;

  /**
   * 具体的重做逻辑，由子类实现
   * @returns 重做结果
   */
  protected abstract doRedo(): Promise<any>;

  /**
   * 更新组件ID
   * @param oldComponentId 旧的组件ID
   * @param newComponentId 新的组件ID
   */
  abstract updateComponentId(oldComponentId: string, newComponentId: string): void;
}
