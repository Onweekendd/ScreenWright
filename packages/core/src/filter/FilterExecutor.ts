/**
 * 过滤器执行器（框架无关）。
 * 专门负责过滤器责任链的构建和执行。
 */
import type { Filter } from "@screenwright/types";

import { ChainExecutionMode } from "./ChainCollector";
import { ChainExecutor } from "./ChainExecutor";
import { FilterChainBuilder, SingleFilterHandler } from "./FilterHandler";
import type { ResultCollectItem } from "./types";

export interface FilterExecutionProps {
  dataFilter: Record<string, Filter>;
  listenArgs: Array<{
    callbackFields: any[];
    filterName: string;
    usageStatus: boolean;
  }>;
  data: any[];
  callbackArgs: Record<string, any>;
}

/**
 * 过滤器执行器类：负责构建和执行过滤器责任链。
 */
export class FilterExecutor {
  private chainBuilder: FilterChainBuilder;
  private executor: ChainExecutor;
  private failureError: Error | null = null;
  private inputData: any[] = [];

  constructor() {
    this.chainBuilder = new FilterChainBuilder();
    this.executor = new ChainExecutor();
  }

  /** 构建过滤器责任链。 */
  private buildFilterChain(
    listenArgs: FilterExecutionProps["listenArgs"],
    dataFilter: FilterExecutionProps["dataFilter"],
    callbackArgs: FilterExecutionProps["callbackArgs"]
  ): boolean {
    // 清空之前的构建器状态
    this.chainBuilder.clear();

    for (const arg of listenArgs) {
      if (arg.usageStatus) {
        const filterName = arg.filterName;
        const filter = dataFilter[filterName];

        if (filter) {
          const handler = new SingleFilterHandler([], callbackArgs, filter);
          this.chainBuilder.addFilter(handler);
        }
      }
    }

    return this.chainBuilder.getHandlers().length > 0;
  }

  /** 执行过滤器责任链。 */
  private executeFilterChain(inputData: any[]): any[] {
    // 重置失败错误状态
    this.failureError = null;

    const chainHead = this.chainBuilder.buildChain();
    if (!chainHead) {
      return inputData;
    }

    this.executor.setChain(chainHead);

    // 设置第一个过滤器的输入数据
    const handlers = this.chainBuilder.getHandlers();
    if (handlers.length > 0) {
      handlers[0].setInputData(inputData);
    }

    // 使用顺序执行模式：不出错就一直往下执行，出错就终止
    const success = this.executor.execute(ChainExecutionMode.SEQUENTIAL);

    if (!success) {
      // 找到第一个失败的过滤器错误
      this.captureFailureError(handlers);
      return [];
    }

    // 获取最终处理结果
    return this.extractFinalResult(handlers, inputData);
  }

  /** 捕获第一个失败的过滤器错误。 */
  private captureFailureError(handlers: SingleFilterHandler[]): void {
    for (const handler of handlers) {
      if (handler.hasBeenExecuted()) {
        const result = handler.getResult();
        if (!result.success && result.error) {
          this.failureError = result.error;
          break;
        }
      }
    }
  }

  /** 提取最终处理结果。 */
  private extractFinalResult(handlers: SingleFilterHandler[], fallbackData: any[]): any[] {
    const finalHandler = handlers[handlers.length - 1];
    if (finalHandler) {
      const result = finalHandler.getResult();
      return result.data;
    }
    return fallbackData;
  }

  /** 设置输入数据。 */
  setInputData(data: any[]): void {
    this.inputData = data;
  }

  /** 执行过滤器处理逻辑。 */
  execute(props: FilterExecutionProps): any[] {
    const { listenArgs, dataFilter, data, callbackArgs } = props;

    try {
      // 构建过滤器责任链
      const hasFilters = this.buildFilterChain(listenArgs, dataFilter, callbackArgs);

      if (!hasFilters) {
        // 如果没有过滤器，直接返回原数据
        return data;
      }

      // 执行过滤器责任链
      return this.executeFilterChain(data);
    } catch (error) {
      console.error("过滤器责任链执行失败:", error);
      // 如果出错，返回空数组
      return [];
    }
  }

  getProcessorsData(): ResultCollectItem[] {
    const handles = this.chainBuilder.getHandlers();
    const res: ResultCollectItem[] = [];

    // 如果没有过滤器，返回模拟的原始数据项
    if (handles.length === 0) {
      const mockData: ResultCollectItem = {
        filterName: "",
        inputData: this.inputData,
        outputData: this.inputData,
        success: true,
        error: undefined,
        executed: true
      };
      res.push(mockData);
      return res;
    }

    for (const handle of handles) {
      const result = handle.getResult();
      let errorToUse = result.error;

      // 如果过滤器未执行且存在失败错误，使用失败错误
      if (!handle.hasBeenExecuted() && this.failureError) {
        errorToUse = this.failureError;
      }

      const singleHandleData: ResultCollectItem = {
        filterName: handle.getFilterName(),
        inputData: handle.getInputData(),
        outputData: result.data,
        // 添加执行状态和错误信息
        success: handle.hasBeenExecuted() ? result.success : false,
        error: errorToUse,
        executed: handle.hasBeenExecuted()
      };
      res.push(singleHandleData);
    }

    // 数据收集完成后清空输入数据
    this.inputData = [];

    return res;
  }

  /** 清理资源。 */
  dispose(): void {
    this.chainBuilder.clear();
    this.executor.clear();
    this.failureError = null;
    this.inputData = [];
  }
}
