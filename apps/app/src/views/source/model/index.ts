import type { DataForm } from "../type";
import { DataSourceType } from "../type";
import { Api } from "./apiData";
import { Db } from "./dbData";
import { Local } from "./localData";
import { TcpUdp } from "./tcpUdp";

// apiSourceModel 类定义
class apiSourceModel {
  private info: any;
  private dataSourceType: DataSourceType;
  private local: Local;
  private api: Api;
  private tcpUdp: TcpUdp;
  private db: Db;
  constructor(info: any, dataSourceType: DataSourceType) {
    this.info = info;
    this.dataSourceType = dataSourceType;
    this.local = new Local(this.info);
    this.api = new Api(this.info);
    this.tcpUdp = new TcpUdp(this.info);
    this.db = new Db(this.info);
  }

  public async addApi(info: DataForm): Promise<any> {
    if (this.dataSourceType === DataSourceType.LOCAL) {
      return this.local.addApi(info);
    } else if (this.dataSourceType === DataSourceType.API || this.dataSourceType === DataSourceType.WEBSOCKET) {
      return this.api.addApi(info);
    } else if (this.dataSourceType === DataSourceType.TCPUDP) {
      return this.tcpUdp.addApi(info);
    } else if (this.dataSourceType === DataSourceType.DB) {
      return this.db.addApi(info);
    }
  }

  public async editApi(info: DataForm): Promise<any> {
    if (this.dataSourceType === DataSourceType.LOCAL) {
      return this.local.editApi(info);
    } else if (this.dataSourceType === DataSourceType.API || this.dataSourceType === DataSourceType.WEBSOCKET) {
      return this.api.editApi(info);
    } else if (this.dataSourceType === DataSourceType.TCPUDP) {
      return this.tcpUdp.editApi(info);
    } else if (this.dataSourceType === DataSourceType.DB) {
      return this.db.editApi(info);
    }
  }

  public async delApi(id: number): Promise<any> {
    if (this.dataSourceType === DataSourceType.LOCAL) {
      return this.local.delApi(id);
    } else if (this.dataSourceType === DataSourceType.API || this.dataSourceType === DataSourceType.WEBSOCKET) {
      return this.api.delApi(id);
    } else if (this.dataSourceType === DataSourceType.TCPUDP) {
      return this.tcpUdp.delApi(id);
    } else if (this.dataSourceType === DataSourceType.DB) {
      return this.db.delApi(id);
    }
  }
}
export { apiSourceModel };
