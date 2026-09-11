/**
 * 静态数据源过滤器（框架无关）。
 *
 * 取数就是读组件自己的 `data`，没有任何 IO——因此它是唯一能**内置在 core** 的数据源策略。
 * 其余数据源（api / sql / csv / websocket）都要真实 IO，实现留在 @screenwright/composables，
 * 由宿主启动时通过 {@link registerFilterStrategy} 注册进来。
 *
 * Node 侧（Screenwright 后端 / eval）跑过滤器走的正是这一条：起点大屏用静态数据源，
 * 连 ports 都不必注入，`dataFormatter` 就能在确定的输入上跑出确定的结果。
 */
import type { ChildComponent, ComponentType, Filter } from "@screenwright/types";

import { BaseFilter } from "./BaseFilter";

class StaticDataFilter extends BaseFilter {
  async run(filterConfig: Record<string, Filter>, target: ComponentType | ChildComponent): Promise<any[]> {
    return await this.transformDataByFilter(filterConfig, target);
  }

  async getInputData(target: ComponentType): Promise<any[]> {
    return Promise.resolve(target.data);
  }
}

export { StaticDataFilter };
