/**
 * 数据过滤器基类（框架无关，模板方法）。
 *
 * 所有数据源过滤器（static/api/sql/csv/websocket）都继承自它：
 * 子类只实现 getInputData（取数，环境相关 IO 留在 app），基类负责统一编排——
 * 取数 → 出错则收集失败结果 → 跑过滤责任链 → 收集 processorsData。
 *
 * 注意：原 app 版本对 processorsData 调用了 vue 的 toRaw，但 getProcessorsData
 * 返回的是 core 内新建的普通数组（非响应式 proxy），toRaw 对其为恒等操作，
 * 故迁移到 core 后直接去掉，行为不变。
 */
import type { ChildComponent, ComponentType, Filter } from "@screenwright/types";

import { getRuntimeCallbackArgs } from "./CallbackArgsSource";
import { FilterExecutor } from "./FilterExecutor";
import { getFilterResultSink } from "./FilterResultSink";

abstract class BaseFilter {
  private filterExecutor: FilterExecutor;
  protected filterConfig: Record<string, Filter> = {};
  protected target: ComponentType | ChildComponent | null = null;

  constructor() {
    this.filterExecutor = new FilterExecutor();
  }

  // 只保留异步返回 Promise<any[]> 的定义
  abstract getInputData(target: any): Promise<any[]>;

  async transformDataByFilter(filterConfig: Record<string, Filter>, target: ComponentType | ChildComponent) {
    this.filterConfig = filterConfig;
    this.target = target;
    let inputData: Awaited<ReturnType<typeof this.getInputData>>;
    try {
      inputData = await this.getInputData(target);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      const filterResultCollector = getFilterResultSink();
      filterResultCollector.setResults(
        target,
        Object.keys(filterConfig).map((filterName) => ({
          filterName,
          inputData: [],
          outputData: [],
          success: false,
          error: err,
          executed: false
        }))
      );
      return [];
    }
    const callbackArgs = this.getCallbackArgs();
    let result = inputData;

    this.filterExecutor.setInputData(inputData);
    if (target.openFilter) {
      // 设置输入数据用于 getProcessorsData

      const res = this.filterExecutor.execute({
        listenArgs: target.listenArgs,
        dataFilter: filterConfig,
        data: inputData,
        callbackArgs: {
          ...callbackArgs,
          ...getSpecialData()
        }
      });

      result = res;
    }

    const processorsData = this.filterExecutor.getProcessorsData();

    const filterResultCollector = getFilterResultSink();
    filterResultCollector.setResults(target, processorsData);

    return result;

    function getSpecialData() {
      if (target.parentReplicaId) {
        const id = target.parentReplicaId as string;
        const specialData = callbackArgs?.twinPanelIconDetail?.detail[id];
        return specialData;
      }
    }
  }

  getCallbackArgs = () => {
    return getRuntimeCallbackArgs();
  };

  /**
   * 清理资源
   */
  dispose(): void {
    this.filterExecutor.dispose();
  }

  abstract run(filterConfig: Record<string, Filter>, target: ComponentType | ChildComponent): Promise<any[]>;
}

export { BaseFilter };
