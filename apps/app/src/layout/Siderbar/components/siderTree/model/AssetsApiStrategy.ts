import { addAssetsGroup, deleteAssetsGroup, updateAssetsGroupGroup } from "@/api/dataSource";

import type { ApiStrategy } from "./ApiStrategy";

// 对应 /assets 路径的策略类
export class AssetsApiStrategy implements ApiStrategy {
  async addApi(param: any): Promise<any> {
    return await addAssetsGroup(param);
  }

  async delApi(param: any): Promise<any> {
    return await deleteAssetsGroup(param);
  }
  async updateApi(param: any): Promise<any> {
    return await updateAssetsGroupGroup(param);
  }
}
