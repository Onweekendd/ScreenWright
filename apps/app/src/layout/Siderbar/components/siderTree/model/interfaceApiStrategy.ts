import { addInterfaceGroup, delInterfaceGroup, updateInterfaceGroup } from "@/api/dataSource";

import type { ApiStrategy } from "./ApiStrategy";

// 对应 /interfaceDebugger 路径的策略类
export class interfaceApiStrategy implements ApiStrategy {
  async addApi(param: any): Promise<any> {
    return await addInterfaceGroup(param);
  }

  async delApi(param: any): Promise<any> {
    return await delInterfaceGroup(param);
  }

  async updateApi(param: any): Promise<any> {
    return await updateInterfaceGroup(param);
  }
}
