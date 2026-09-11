/**
 * 过滤器结果收集项（纯类型）。
 * 由 FilterExecutor 产出，供结果收集器（app 侧 FilterResultCollector）存储。
 */
export interface ResultCollectItem {
  filterName: string;
  inputData: any[];
  outputData: any[];
  success?: boolean;
  error?: Error;
  executed?: boolean;
}
