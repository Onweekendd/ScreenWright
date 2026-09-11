import { assign } from "lodash-es";

import { addDbData, delDbData, editDbData } from "@/api/dataSource";

import type { DataForm } from "../type";
import { modelData } from "./modelData";

class Db extends modelData {
  constructor(initData: any) {
    super(initData);
  }
  private getParamsData = (info: DataForm) => {
    const getConfigField = (url: string) => {
      const fields = url.split("//")[1];
      return {
        dbname: fields.slice(fields.indexOf("/") + 1),
        dbip: fields.slice(0, fields.indexOf(":"))
      };
    };
    const { dbname, dbip } = getConfigField(info.url);
    const addParams = {
      url: info.url,
      username: info.username,
      password: info.password,
      port: 8088,
      dbType: info.type,
      dataGroupId: info.group,
      group: info.group,
      groupId: info.group,
      config: `{"type":"${info.type}","username":"${info.username}","password":"${info.password}","url":"${info.url}","port":8088,"dbname":"${dbname}","dbip":"${dbip}"}`
    };
    const params = assign({}, this.defaultData, addParams);
    return params;
  };
  async addApi(info: DataForm): Promise<any> {
    const params = this.getParamsData(info);
    return addDbData(params);
  }

  async editApi(info: DataForm): Promise<any> {
    const params = this.getParamsData(info);
    return editDbData(params);
  }

  async delApi(id: number): Promise<any> {
    return delDbData(id);
  }
}

export { Db };
