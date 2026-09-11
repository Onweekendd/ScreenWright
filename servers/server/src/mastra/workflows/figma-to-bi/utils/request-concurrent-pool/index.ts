/**
 * 网络请求并发池
 * 用于控制同时进行的网络请求数量，避免资源耗尽
 */
import { Task } from "./task";

export interface TaskFnOptions {
  cancel: () => void; // 取消当前任务的函数
}

/**
 * add 方法的返回值
 */
export interface AddResult<T> {
  id: string; // 任务 ID
  promise: Promise<T>; // 任务结果 Promise
}

/**
 * 网络请求并发池
 * 用于控制同时进行的网络请求数量，避免资源耗尽
 */
export class RequestConcurrentPool {
  private maxConcurrency = 5;

  private waitingTasks = new Map<string, Task>();
  private runningTasks = new Map<string, Task>();
  private taskIdCounter = 0;

  /**
   * 创建一个并发池实例
   * @param maxConcurrency - 最大并发数，默认为 5
   */
  constructor(maxConcurrency: number = 5) {
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * 添加一个请求到池中
   * 如果当前并发数未达上限，立即执行；否则加入等待队列
   * @param requestFn - 请求函数，接收 TaskFnOptions 参数，返回 Promise
   * @returns AddResult<T> - 包含任务 ID 和 Promise 的对象
   *
   * @example
   * ```typescript
   * // 不使用取消功能
   * const { promise } = pool.add(async () => {
   *   const response = await fetch('/api/data');
   *   return response.json();
   * });
   *
   * // 使用取消功能（fetch）
   * const { id, promise } = pool.add(async ({ cancel }) => {
   *   const controller = new AbortController();
   *   cancel = () => controller.abort(); // 重新绑定 cancel
   *   const response = await fetch('/api/data', { signal: controller.signal });
   *   return response.json();
   * });
   *
   * // 取消任务
   * pool.cancel(id);
   * ```
   */
  add<T>(requestFn: (options: TaskFnOptions) => Promise<T>): AddResult<T> {
    const taskId = `task-${++this.taskIdCounter}`;
    const task = new Task<T>(taskId, () => requestFn({ cancel: () => this.cancel(taskId) }));

    const promise = new Promise<T>((resolve, reject) => {
      task.setPromiseHandlers(resolve, reject);

      // 设置完成回调，触发下一个任务
      task.onComplete(() => {
        this.runningTasks.delete(taskId);
        this.next();
      });

      if (this.runningTasks.size < this.maxConcurrency) {
        // 立即执行
        task.markRunning();
        this.runningTasks.set(taskId, task);
        task.execute();
      } else {
        // 加入等待队列
        this.waitingTasks.set(taskId, task);
      }
    });

    return {
      id: taskId,
      promise
    };
  }

  /**
   * 取消指定任务
   * @param taskId - 任务 ID
   * @returns boolean - 是否成功取消
   */
  cancel(taskId: string): boolean {
    // 1. 尝试取消等待中的任务
    const waitingTask = this.waitingTasks.get(taskId);
    if (waitingTask) {
      this.waitingTasks.delete(taskId);
      waitingTask.cancel();
      return true;
    }

    // 2. 尝试取消运行中的任务
    const runningTask = this.runningTasks.get(taskId);
    if (runningTask) {
      runningTask.cancel();
      return true;
    }

    return false; // 任务不存在或已完成
  }

  /**
   * 开始执行下一个请求（从队列中取出）
   */
  private next(): void {
    if (this.runningTasks.size >= this.maxConcurrency) {
      return;
    }
    if (this.waitingTasks.size === 0) {
      return;
    }

    // 从等待队列取出一个任务
    const nextTask = this.waitingTasks.entries().next().value;
    if (!nextTask) {
      return;
    }

    const [taskId, task] = nextTask;
    this.waitingTasks.delete(taskId);

    // 移到运行队列
    task.markRunning();
    this.runningTasks.set(taskId, task);

    task.execute();
  }

  /**
   * 获取当前正在执行的请求数量
   */
  getRunningCount(): number {
    return this.runningTasks.size;
  }

  /**
   * 获取当前等待队列中的请求数量
   */
  getWaitingCount(): number {
    return this.waitingTasks.size;
  }

  /**
   * 清空等待队列，取消所有等待的请求
   */
  clear(): void {
    this.waitingTasks.forEach((task) => {
      task.cancel();
    });
    this.waitingTasks.clear();
  }

  /**
   * 销毁并发池，清空队列并拒绝所有等待的请求
   */
  destroy(): void {
    // 取消所有运行中的任务
    this.runningTasks.forEach((task) => {
      task.cancel();
    });

    // 取消所有等待中的任务
    this.waitingTasks.forEach((task) => {
      task.cancel();
    });

    this.runningTasks.clear();
    this.waitingTasks.clear();
  }
}

// 导出 Task 类供外部使用（如果需要）
export { Task };
