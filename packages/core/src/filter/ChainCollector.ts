/**
 * 责任链收集器与公共接口（框架无关）。
 */

// 责任链执行模式枚举
export enum ChainExecutionMode {
  TRADITIONAL = "traditional", // 传统模式：找到一个能处理的就停止
  SEQUENTIAL = "sequential" // 顺序执行模式：不出错就一直往下执行
}

// 处理器接口
export interface Handler {
  canHandle(): boolean;
  canChainHandle(): boolean;
  handle(mode?: ChainExecutionMode): boolean;
  setNext(handler: Handler): Handler;
}

/**
 * 责任链收集器：收集并构建处理器链。
 */
export class ChainCollector {
  private handlers: Handler[] = [];

  addHandler(handler: Handler): ChainCollector {
    this.handlers.push(handler);
    return this;
  }

  buildChain(): Handler | null {
    if (this.handlers.length === 0) {
      return null;
    }

    for (let i = 0; i < this.handlers.length - 1; i++) {
      this.handlers[i].setNext(this.handlers[i + 1]);
    }

    return this.handlers[0];
  }

  clear(): void {
    this.handlers = [];
  }

  getHandlerCount(): number {
    return this.handlers.length;
  }
}
