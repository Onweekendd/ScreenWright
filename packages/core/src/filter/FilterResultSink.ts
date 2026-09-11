/**
 * 过滤器结果收集器（框架无关注入点）。
 *
 * core 的 BaseFilter 产出过滤结果后需要写回一个收集器，但收集器在 app 侧
 * 用 Vue ref 维护响应式版本号——属 UI 关注点。这里只定义最小接口 + 注入点，
 * 由 app 在启动时把具体实现（FilterResultCollector）注入进来。
 */
import type { ChildComponent, ComponentType } from "@screenwright/types";

import type { ResultCollectItem } from "./types";

/** 过滤结果的归属对象。BaseFilter 的 target 就是这个联合类型，收窄成 ComponentType 会漏掉子组件。 */
type FilterTarget = ComponentType | ChildComponent;

/**
 * 过滤器结果收集器接口。app 侧的 FilterResultCollector 已天然满足该签名。
 *
 * `getResults` 是可选的：写入侧（BaseFilter）只需要 setResults，而读取侧
 * （DataFilterManager.getFilterResultsByComponentId）才需要读回来。app 的实现两者都有。
 */
export interface FilterResultSink {
  setResults(component: FilterTarget, results: ResultCollectItem[]): void;
  getResults?(component: FilterTarget): ResultCollectItem[];
}

let currentSink: FilterResultSink | null = null;

/** 注入结果收集器实现（在 app 启动 / 过滤子系统加载时调用一次）。 */
export function setFilterResultSink(sink: FilterResultSink): void {
  currentSink = sink;
}

/** 获取已注入的结果收集器；未注入时返回 no-op，保证 headless（无 app）环境下不崩。 */
export function getFilterResultSink(): FilterResultSink {
  return currentSink ?? { setResults() {} };
}

/**
 * 纯内存的结果收集器（零框架依赖）。
 *
 * 默认的 no-op sink 不崩但**结果也丢了**——Node 侧跑完过滤器读不回来。
 * Screenwright 后端 / eval 装配时注入这个即可；与 {@link MemoryEditorState} 同一用途：
 * headless 直接驱动 core，兼作「core 确实不依赖任何框架」的可执行证明。
 */
export class MemoryFilterResultSink implements FilterResultSink {
  private readonly results = new Map<string, ResultCollectItem[]>();

  setResults(component: FilterTarget, results: ResultCollectItem[]): void {
    this.results.set(String(component?.id), results);
  }

  getResults(component: FilterTarget): ResultCollectItem[] {
    return this.results.get(String(component?.id)) ?? [];
  }

  /** 跑下一个 case / 下一块大屏前清空，避免结果串味。 */
  clear(): void {
    this.results.clear();
  }
}
