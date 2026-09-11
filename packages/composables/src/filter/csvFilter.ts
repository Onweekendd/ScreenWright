import type { ChildComponent, ComponentType, Filter } from "@screenwright/types";
import { ElMessage } from "element-plus";

import { BaseFilter } from "./baseFilter";
import { getCsvData } from "./ports";

class csvFilter extends BaseFilter {
  async run(filterConfig: Record<string, Filter>, target: ComponentType | ChildComponent): Promise<any[]> {
    const transformData = await this.transformDataByFilter(filterConfig, target);
    return transformData;
  }
  async getInputData(target: ComponentType): Promise<any[]> {
    const sourceConfig = target.dataSource;
    if (Object.keys(sourceConfig).length === 0 || !sourceConfig.id) {
      return Promise.resolve(target.data);
    }
    const res = await getCsvData(sourceConfig.id);
    if (!res.success) {
      ElMessage.error(res.message);
      return [];
    }
    return res.result as unknown as any[];
  }
}

export { csvFilter };
