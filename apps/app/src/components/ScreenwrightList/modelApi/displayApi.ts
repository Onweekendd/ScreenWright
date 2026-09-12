import { addScreenData, deleteScreenObj } from "@/api/dataSource";
import { getScreenModule } from "@/api/library";
import { updateLargeScreen } from "@/api/library";
import { getScreenVersionList } from "@/api/version";
import { copyScreenObj, getScreenList } from "@/api/visual";
import type { DataModelReq, updateModelReq } from "@/model/DataModel";
import type { ScreenReq } from "@/model/Visual";

import { baseModelApi } from "./baseModelApi";

class DisplayApi extends baseModelApi {
  constructor() {
    super();
  }

  async getScreenModule(data: { size: number; current: number; stockType: number }): Promise<any> {
    return getScreenModule(data);
  }
  async getScreenList(data: ScreenReq): Promise<any> {
    return getScreenList(data);
  }
  async addScreenData(data: DataModelReq): Promise<any> {
    return addScreenData(data);
  }
  // 复制函数
  async copyScreenObj(params: { id: string | number; versionCode: string }): Promise<any> {
    return copyScreenObj(params, "largeScreenAgg");
  }
  // 获取版本列表函数
  async getScreenVersionList(id: string | number): Promise<any> {
    return getScreenVersionList(id, "largeScreen");
  }
  // 编辑函数
  async updateScreenData(data: updateModelReq): Promise<any> {
    return updateLargeScreen(data);
  }
  // 删除函数
  async deleteScreenObj(id: string | number): Promise<any> {
    return deleteScreenObj(id);
  }
}
export { DisplayApi };
