/**
 * 任务状态
 */
export type TaskStatus = "waiting" | "running" | "completed" | "cancelled";

/**
 * 任务类 - 封装单个任务的执行和状态管理
 */
export class Task<T = any> {
  readonly id: string;
  private _status: TaskStatus;
  private fn: () => Promise<T>;
  private resolve?: (value: T) => void;
  private reject?: (reason: unknown) => void;
  private onCancelCallbacks: Set<() => void> = new Set();
  private completeCallback?: () => void; // 任务完成回调

  constructor(id: string, fn: () => Promise<T>) {
    this.id = id;
    this._status = "waiting";
    this.fn = fn;
  }

  /**
   * 获取当前状态
   */
  get status(): TaskStatus {
    return this._status;
  }

  /**
   * 设置 Promise 的 resolve/reject
   */
  setPromiseHandlers(resolve: (value: T) => void, reject: (reason: unknown) => void): void {
    this.resolve = resolve;
    this.reject = reject;
  }

  /**
   * 设置完成回调（任务完成时调用）
   */
  onComplete(callback: () => void): void {
    this.completeCallback = callback;
  }

  /**
   * 注册取消回调
   * @returns 清除函数
   */
  onCancel(callback: () => void): () => void {
    this.onCancelCallbacks.add(callback);
    return () => this.onCancelCallbacks.delete(callback);
  }

  /**
   * 标记为运行中
   */
  markRunning(): void {
    this._status = "running";
  }

  /**
   * 执行任务
   */
  async execute(): Promise<void> {
    try {
      const result = await this.fn();

      if (this._status !== "cancelled") {
        this._status = "completed";
        this.resolve?.(result);
      }
    } catch (error) {
      if (this._status !== "cancelled") {
        this.reject?.(error);
      }
    } finally {
      // 任务完成后，触发回调以处理下一个任务
      this.completeCallback?.();
    }
  }

  /**
   * 取消任务
   */
  cancel(): void {
    if (this._status === "completed") {
      return;
    }

    this._status = "cancelled";

    // 触发所有取消回调
    this.onCancelCallbacks.forEach((cb) => cb());
    this.onCancelCallbacks.clear();

    // 拒绝 Promise
    this.reject?.(new Error("Task cancelled"));

    // 如果任务正在运行，也需要触发完成回调以清理资源
    this.completeCallback?.();
  }
}
