import type { ChildComponent, ComponentType, DbItem, Filter } from "@screenwright/types";
import { ElMessage } from "element-plus";

import { BaseFilter } from "./baseFilter";
import { executeSql } from "./ports";

class sqlFilter extends BaseFilter {
  async run(filterConfig: Record<string, Filter>, target: ComponentType | ChildComponent): Promise<any[]> {
    const transformData = await this.transformDataByFilter(filterConfig, target);
    return transformData;
  }
  async getInputData(target: ComponentType): Promise<any[]> {
    const sourceConfig = (target.dataSource as DbItem).config ? JSON.parse((target.dataSource as DbItem).config!) : {};
    if (Object.keys(sourceConfig).length === 0 || !sourceConfig.url) {
      return Promise.resolve(target.data);
    }
    const res = await executeSql({
      jdbcUrl: sourceConfig.url,
      password: sourceConfig.password,
      username: sourceConfig.username,
      sql: target.sql
    });
    if (!res.success) {
      ElMessage.error(res.message);
      return [];
    }
    return res.result as unknown as any[];
  }
}

export { sqlFilter };
