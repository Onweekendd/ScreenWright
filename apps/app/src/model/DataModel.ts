import type { BaseEntity } from "./BaseEntity";

export interface ListItem {
  name: string;
  count: number;
  id: number;
  projectDataGroupDetails?: ListItem[];
}

export interface DataModel {
  allCount: number;
  unCount: number;
  list: ListItem[];
  groupedCount?: number;
  unGroupedCount?: number;
}

export type DataModelRes = BaseEntity<DataModel>;

export interface DataModelReq {
  applicationCode: string;
  groupId: number | string;
  password: string;
  name: string;
  type: number;
  config: string;
  detail: string;
}

export interface updateModelReq {
  groupId: number | string;
  id: number;
  name: string;
  type: number;
}

export interface dbModelReq {
  current: number;
  size: number;
  groupId: number;
  name: string;
  status: number;
}
export interface DbItem {
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  id: number;
  userId: number;
  name: string;
  description: string;
  type: string;
  url: string;
  dataGroupId: number | null;
  fileName: string;
  size: number;
  charsetName: string;
  layerIds: string;
  config?: string;
  desPort?: string;
}
export interface dbModel {
  records: DbItem[];
  total: number;
  size: number;
  current: number;
  orders: any[]; // 根据实际情况可进一步细化这里的类型，如果不清楚具体结构可先设为any[]
  optimizeCountSql: boolean;
  searchCount: boolean;
  maxLimit: any | null; // 同样可根据实际细化类型，暂设为any | null
  countId: any | null;
  pages: number;
}

export interface TcpUdpReq {
  type: string;
}

export interface DataSceneReq {
  groupId: number | string;
  password: string;
  name: string;
  globalArgs: string;
  defaultScene: string;
  sceneList: string;
  applicationCode: string;
}

export type dbModelRes = dbModel;
