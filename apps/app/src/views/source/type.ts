import type { dbModelReq } from "@/model/DataModel";

export enum DataSourceType {
  LOCAL = "local",
  DB = "db",
  API = "api",
  TCPUDP = "tcpudp",
  WEBSOCKET = "websocket"
}
export enum statusReflectionType {
  all = -2,
  grouped = -1,
  ungrouped = 0
}

export type ApiFunction = (params: dbModelReq) => Promise<any>;

export interface DataForm {
  name: string;
  type: string;
  description: string;
  charsetName: string;
  fileName: any;
  group: number | string;
  baseUrl: string;
  id?: number;
  config?: string;
  username: string;
  password: string;
  url: string;
  desIp: string;
  desPort: string;
  jsonFile?: any;
  localPort?: string; // 本地端口
  swaggerUrl?: string;
}
