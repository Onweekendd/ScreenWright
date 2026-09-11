import { assign } from "lodash-es";

import { addLocalData, delLocalData, editLocalData } from "@/api/dataSource";

import type { DataForm } from "../type";
import { modelData } from "./modelData";

class Local extends modelData {
  constructor(initData: any) {
    super(initData);
  }

  private getParamsData = (info: DataForm) => {
    const addParams = {
      file: info.fileName.raw || "",
      charsetName: info.charsetName,
      dataType: "非空间化",
      groupId: info.group
    };
    const params = assign({}, this.defaultData, addParams);
    return params;
  };

  async addApi(info: DataForm): Promise<any> {
    const params = this.getParamsData(info);
    return addLocalData(this.getFormData(params));
  }

  async editApi(info: DataForm): Promise<any> {
    const params = this.getParamsData(info);
    return editLocalData(this.getFormData(params));
  }

  async delApi(id: number): Promise<any> {
    return delLocalData(id);
  }
}

export { Local };
