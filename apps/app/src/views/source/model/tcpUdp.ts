import { assign } from "lodash-es";

import { addTcpUdpData, delTcpUdpData, editTcpUdpData } from "@/api/dataSource";

import type { DataForm } from "../type";
import { modelData } from "./modelData";

class TcpUdp extends modelData {
  constructor(initData: any) {
    super(initData);
  }
  private getParamsData = (info: DataForm) => {
    const addParams = {
      charsetName: info.charsetName,
      desIp: info.desIp,
      desPort: info.desPort,
      config: `{"type":"${info.type}"}`,
      dataGroupId: info.group,
      groupId: info.group
    };
    const params = assign({}, this.defaultData, addParams);
    return params;
  };

  async addApi(info: DataForm): Promise<any> {
    const params = this.getParamsData(info);
    return addTcpUdpData(params);
  }

  async editApi(info: DataForm): Promise<any> {
    const params = this.getParamsData(info);
    return editTcpUdpData(params);
  }

  async delApi(id: number): Promise<any> {
    return delTcpUdpData(id);
  }
}

export { TcpUdp };
