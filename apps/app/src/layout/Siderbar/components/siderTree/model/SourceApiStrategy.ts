import { addDataManageGroup, delDataManageGroup, updateDataManageGroup } from "@/api/dataSource";

import type { ApiStrategy } from "./ApiStrategy";

// 对应 /source 路径的策略类
export class SourceApiStrategy implements ApiStrategy {
  async addApi(param: any): Promise<any> {
    return await addDataManageGroup(param);
  }

  async delApi(param: any): Promise<any> {
    return await delDataManageGroup(param);
  }
  async updateApi(param: any): Promise<any> {
    return await updateDataManageGroup(param);
  }
}
