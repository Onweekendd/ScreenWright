import { assign } from "lodash-es";

import { addApiData, delApiData, editApiData } from "@/api/dataSource";

import type { DataForm } from "../type";
import { modelData } from "./modelData";

// export interface ApiDataForm extends modelDataForm {
//   baseUrl: string
//   config: string
// }
class Api extends modelData {
  constructor(initData: any) {
    super(initData);
  }

  async addApi(info: DataForm): Promise<any> {
    const addParams: {
      baseUrl: string;
      config: string;
      groupId: number | string;
      dataGroupId: number | string;
      fileName?: string;
      jsonFile?: any;
    } = {
      baseUrl: info.baseUrl,
      config: JSON.stringify({ baseUrl: info.baseUrl, type: info.type, ...(info.swaggerUrl ? { swaggerUrl: info.swaggerUrl } : {}) }),
      groupId: info.group,
      dataGroupId: info.group
    };
    if (info.type === "bimPropertyData") {
      addParams.fileName = info.jsonFile.name || "";
      addParams.jsonFile = info.jsonFile.raw || {};
    }
    const params = assign({}, this.defaultData, addParams);
    return addApiData(this.getFormData(params));
  }

  async editApi(info: DataForm): Promise<any> {
    const addParams = {
      baseUrl: info.baseUrl,
      config: JSON.stringify({ baseUrl: info.baseUrl, type: info.type, ...(info.swaggerUrl ? { swaggerUrl: info.swaggerUrl } : {}) }),
      groupId: info.group
    };
    const params = assign({}, this.defaultData, addParams);
    return editApiData(params);
  }

  async delApi(id: number): Promise<any> {
    return delApiData(id);
  }
}

export { Api };
