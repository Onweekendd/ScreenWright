import type {
  ChildComponent,
  ComponentType,
  Filter,
} from "@screenwright/types";

import { BaseFilter } from "./baseFilter";

class staticDataFilter extends BaseFilter {
  async run(
    filterConfig: Record<string, Filter>,
    target: ComponentType | ChildComponent,
  ): Promise<any[]> {
    const transformData = await this.transformDataByFilter(
      filterConfig,
      target,
    );
    return transformData;
  }
  async getInputData(target: ComponentType): Promise<any[]> {
    return Promise.resolve(target.data);
  }
}

export { staticDataFilter };
