/**
 * 过滤器处理器实现（框架无关）。
 */
import type { Filter } from "@screenwright/types";

import { BaseHandler } from "./BaseHandler";
import { getCompiledFunctionCache } from "./CompiledFunctionCache";

// 过滤器执行结果
export interface FilterResult {
  success: boolean;
  data: any[];
  error?: Error;
  filterName?: string;
}

/**
 * 单个过滤器处理器。
 */
export class SingleFilterHandler extends BaseHandler {
  private result: FilterResult | null = null;
  private hasExecuted = false;

  constructor(
    private data: any[],
    private callbackArgs: any,
    private filer: Filter
  ) {
    super();
  }

  canHandle(): boolean {
    return true;
  }

  doHandle(): boolean {
    // 标记为已执行
    this.hasExecuted = true;

    try {
      // 使用缓存获取编译后的函数，避免重复编译开销
      const cache = getCompiledFunctionCache();
      const executableFunction = cache.getOrCompile(this.filer);

      // 执行过滤器，传入当前数据和回调参数
      const processedData = executableFunction(this.data, this.callbackArgs);

      // 保存处理结果
      this.result = {
        success: true,
        data: processedData,
        filterName: this.filer.name
      };

      this.setNextHandleData();

      return true;
    } catch (error) {
      // 创建包含过滤器名称的错误信息
      const enhancedError = new Error(
        `'${this.filer.name}' 执行失败: ${error instanceof Error ? error.message : String(error)}`
      );
      enhancedError.name = `FilterError:${this.filer.name}`;

      // 保存失败结果
      this.result = {
        success: false,
        data: [], // 失败时返回空数组
        error: enhancedError,
        filterName: this.filer.name
      };

      // 在顺序执行模式下，返回 false 会终止整个链
      return false;
    }
  }

  setNextHandleData() {
    const nextHandler = this.getNextHandler();
    if (nextHandler) {
      nextHandler.setInputData(this.result?.data || []);
    }
  }

  getFilterName(): string {
    return this.filer.name;
  }

  getInputData(): any[] {
    return this.data;
  }

  // 获取处理结果
  getResult(): FilterResult {
    return (
      this.result || {
        success: false,
        data: [],
        error: new Error(`"${this.filer.name}" 未执行`),
        filterName: this.filer.name
      }
    );
  }

  // 检查过滤器是否已执行
  hasBeenExecuted(): boolean {
    return this.hasExecuted;
  }

  // 设置输入数据（用于链式传递）
  setInputData(data: any[]): void {
    this.data = data;
  }

  // 获取下一个处理器（用于数据传递）
  getNextHandler(): SingleFilterHandler | null {
    return this.nextHandler as SingleFilterHandler | null;
  }
}

/**
 * 过滤器责任链构建器。
 */
export class FilterChainBuilder {
  private handlers: SingleFilterHandler[] = [];

  addFilter(handler: SingleFilterHandler): FilterChainBuilder {
    this.handlers.push(handler);
    return this;
  }

  buildChain(): SingleFilterHandler | null {
    if (this.handlers.length === 0) {
      return null;
    }

    for (let i = 0; i < this.handlers.length - 1; i++) {
      this.handlers[i].setNext(this.handlers[i + 1]);
    }

    return this.handlers[0];
  }

  getHandlers(): SingleFilterHandler[] {
    return this.handlers;
  }

  clear(): void {
    this.handlers = [];
  }
}
