import { addScreenGroup, deleteScreenGroup, updateScreenGroup } from "@/api/dataSource";

import type { ApiStrategy } from "./ApiStrategy";

// 对应 /display 路径的策略类，构造函数可接收参数进行初始化设置
export class DisplayApiStrategy implements ApiStrategy {
  async addApi(param: any): Promise<any> {
    return await addScreenGroup(param);
  }
  async delApi(param: any): Promise<any> {
    return await deleteScreenGroup(param);
  }
  async updateApi(param: any): Promise<any> {
    return await updateScreenGroup(param);
  }
}
