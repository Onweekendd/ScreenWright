/**
 * 全局 ResizeObserver 管理器
 * 优化性能：避免为每个组件创建单独的 ResizeObserver 实例
 * 所有组件共享同一个 ResizeObserver 实例
 */
class GlobalResizeManager {
  private observer: ResizeObserver;
  private callbacks = new Map<Element, Set<() => void>>();

  constructor() {
    this.observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const callbacks = this.callbacks.get(entry.target);
        if (callbacks) {
          callbacks.forEach((cb) => cb());
        }
      });
    });
  }

  /**
   * 观察元素的尺寸变化
   * @param element 要观察的DOM元素
   * @param callback 尺寸变化时的回调函数
   * @returns 清理函数，调用后停止观察
   */
  observe(element: Element, callback: () => void): () => void {
    if (!this.callbacks.has(element)) {
      this.callbacks.set(element, new Set());
      this.observer.observe(element);
    }
    this.callbacks.get(element)!.add(callback);

    // 返回清理函数
    return () => {
      const callbacks = this.callbacks.get(element);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.callbacks.delete(element);
          this.observer.unobserve(element);
        }
      }
    };
  }

  /**
   * 停止观察所有元素（用于全局清理）
   */
  disconnect(): void {
    this.observer.disconnect();
    this.callbacks.clear();
  }
}

// 导出单例实例
export const globalResizeManager = new GlobalResizeManager();
