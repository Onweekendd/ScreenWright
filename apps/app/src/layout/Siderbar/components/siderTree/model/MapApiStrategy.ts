import { addSceneGroup, deleteSceneGroup, updateSceneGroup } from "@/api/dataSource";

import type { ApiStrategy } from "./ApiStrategy";

// 对应 /map 路径的策略类
export class MapApiStrategy implements ApiStrategy {
  async addApi(param: any): Promise<any> {
    return await addSceneGroup(param);
  }

  async delApi(param: any): Promise<any> {
    return await deleteSceneGroup(param);
  }

  async updateApi(param: any): Promise<any> {
    return await updateSceneGroup(param);
  }
}
