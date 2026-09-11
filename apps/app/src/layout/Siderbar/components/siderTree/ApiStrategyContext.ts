import type { ApiStrategy } from "./model/ApiStrategy";
import { AssetsApiStrategy } from "./model/AssetsApiStrategy";
import { DisplayApiStrategy } from "./model/DisplayApiStrategy";
import { interfaceApiStrategy } from "./model/interfaceApiStrategy";
import { MapApiStrategy } from "./model/MapApiStrategy";
import { SourceApiStrategy } from "./model/SourceApiStrategy";

export class ApiStrategyContext {
  private strategyMap: Map<string, ApiStrategy> = new Map();
  private currentStrategy: ApiStrategy;

  constructor() {
    // 设置初始策略，可根据实际情况调整默认值
    this.currentStrategy = new DisplayApiStrategy();

    this.initStrategyByRoute();
  }

  // 私有方法，用于根据路由路径更新当前策略
  initStrategyByRoute() {
    // 初始化策略映射关系
    this.strategyMap.set("/display", new DisplayApiStrategy());
    this.strategyMap.set("/source", new SourceApiStrategy());
    this.strategyMap.set("/map", new MapApiStrategy());
    this.strategyMap.set("/assets", new AssetsApiStrategy());
    this.strategyMap.set("/interfaceDebugger", new interfaceApiStrategy());
  }

  setStrategy(strategy: ApiStrategy) {
    this.currentStrategy = strategy;
  }
  // 获取当前策略
  getStrategy(path: string): ApiStrategy {
    return this.strategyMap.get(path) || this.currentStrategy;
  }

  // 调用添加API的方法，内部会根据当前策略执行对应的逻辑
  async add(param: any): Promise<any> {
    return await this.currentStrategy.addApi(param);
  }

  // 调用删除API的方法，内部会根据当前策略执行对应的逻辑
  async del(param: any): Promise<any> {
    return await this.currentStrategy.delApi(param);
  }
  async update(param: any): Promise<any> {
    return await this.currentStrategy.updateApi(param);
  }
}
