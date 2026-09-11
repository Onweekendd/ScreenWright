import type { Handler } from "./ChainCollector";
import { ChainExecutionMode } from "./ChainCollector";

/**
 * 责任链执行器（框架无关）。
 */
export class ChainExecutor {
  private chainHead: Handler | null = null;

  setChain(chainHead: Handler | null): void {
    this.chainHead = chainHead;
  }

  execute(mode: ChainExecutionMode = ChainExecutionMode.TRADITIONAL): boolean {
    if (!this.chainHead) {
      return false;
    }

    return this.chainHead.handle(mode);
  }

  hasChain(): boolean {
    return this.chainHead !== null;
  }

  clear(): void {
    this.chainHead = null;
  }
}
