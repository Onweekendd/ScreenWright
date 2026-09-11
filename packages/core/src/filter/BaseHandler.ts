import type { Handler } from "./ChainCollector";
import { ChainExecutionMode } from "./ChainCollector";

/**
 * 抽象处理器基类（框架无关）。
 */
export abstract class BaseHandler implements Handler {
  protected nextHandler: Handler | null = null;

  setNext(handler: Handler): Handler {
    this.nextHandler = handler;
    return handler;
  }

  abstract canHandle(): boolean;
  abstract doHandle(): boolean;

  /**
   * 判断整条责任链是否至少有一个处理器可以处理。
   */
  canChainHandle(): boolean {
    if (this.canHandle()) {
      return true;
    }

    if (this.nextHandler) {
      return this.nextHandler.canChainHandle();
    }

    return false;
  }

  /**
   * 根据模式执行处理器。
   */
  handle(mode: ChainExecutionMode = ChainExecutionMode.TRADITIONAL): boolean {
    if (mode === ChainExecutionMode.TRADITIONAL) {
      return this.handleTraditional();
    } else {
      return this.handleSequential();
    }
  }

  /** 传统责任链模式：找到一个能处理的就停止。 */
  private handleTraditional(): boolean {
    if (this.canHandle() && this.doHandle()) {
      return true;
    }

    if (this.nextHandler) {
      return this.nextHandler.handle(ChainExecutionMode.TRADITIONAL);
    }

    return false;
  }

  /** 顺序执行模式：不出错就一直往下执行，出错就终止。 */
  private handleSequential(): boolean {
    if (!this.canHandle()) {
      if (this.nextHandler) {
        return this.nextHandler.handle(ChainExecutionMode.SEQUENTIAL);
      }
    }

    const success = this.doHandle();
    if (!success) {
      return false;
    }

    if (this.nextHandler) {
      return this.nextHandler.handle(ChainExecutionMode.SEQUENTIAL);
    }

    return true;
  }
}
