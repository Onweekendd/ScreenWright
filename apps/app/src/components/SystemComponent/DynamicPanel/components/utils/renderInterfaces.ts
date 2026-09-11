/**
 * 渐进式渲染相关的接口和实现类
 */

// 抽象日志接口，便于测试
export interface Logger {
  log(message: string): void;
}

// 抽象调度器接口，便于测试
export interface Scheduler<T = any> {
  schedule(callback: () => T, delay: number): ScheduledTask;
  cancelAll(): void;
}

export interface ScheduledTask {
  cancel(): void;
}

// 默认日志实现
export class DefaultLogger implements Logger {
  log(message: string): void {
    console.log(message);
  }
}

// 默认调度器实现
export class DefaultScheduler implements Scheduler {
  private timers = new Set<NodeJS.Timeout>();

  schedule(callback: () => void, delay: number): ScheduledTask {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      callback();
    }, delay);

    this.timers.add(timer);

    return {
      cancel: () => {
        clearTimeout(timer);
        this.timers.delete(timer);
      }
    };
  }

  cancelAll(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }
}
