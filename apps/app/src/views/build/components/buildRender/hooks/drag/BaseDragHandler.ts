/**
 * 拖拽策略上下文
 * 管理和执行拖拽策略的上下文类
 */
import type { DragContext } from "./DragContext";
import type { DragStrategy } from "./DragHandler";
import { EncodePanelStrategy, NonDynamicPanelStrategy, RegularDynamicPanelStrategy } from "./DragHandlers";

export class DragStrategyContext {
  private strategies: DragStrategy[] = [];

  constructor() {
    // 注册所有可用的拖拽策略
    this.registerStrategy(new NonDynamicPanelStrategy());
    this.registerStrategy(new RegularDynamicPanelStrategy());
    this.registerStrategy(new EncodePanelStrategy());
  }

  /**
   * 注册拖拽策略
   * @param strategy 拖拽策略实例
   */
  registerStrategy(strategy: DragStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * 移除拖拽策略
   * @param strategyClass 策略类构造函数
   */
  removeStrategy(strategyClass: new () => DragStrategy): void {
    this.strategies = this.strategies.filter((strategy) => !(strategy instanceof strategyClass));
  }

  /**
   * 执行拖拽处理
   * 找到第一个能处理当前上下文的策略并执行
   * @param context 拖拽上下文
   * @returns 处理是否成功
   */
  async execute(context: DragContext): Promise<boolean> {
    for (const strategy of this.strategies) {
      if (strategy.canHandle(context)) {
        return await strategy.execute(context);
      }
    }

    console.warn("没有找到合适的拖拽策略处理当前上下文:", context);
    return false;
  }

  /**
   * 获取能处理当前上下文的策略
   * @param context 拖拽上下文
   * @returns 匹配的策略，如果没有则返回 null
   */
  getStrategy(context: DragContext): DragStrategy | null {
    return this.strategies.find((strategy) => strategy.canHandle(context)) || null;
  }

  /**
   * 获取所有注册的策略
   * @returns 策略数组的副本
   */
  getAllStrategies(): DragStrategy[] {
    return [...this.strategies];
  }
}
