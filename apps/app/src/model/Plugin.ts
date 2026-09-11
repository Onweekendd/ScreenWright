import type { BaseEntity } from "./BaseEntity";

export interface getPluginReq {
  current: number;
  size: number;
  name: string;
}

export interface itemPluginResponse {
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  id: number;
  userId: number;
  name: string;
  type: string;
  orderNum: number;
  status: number;
  thumbnailPath: string;
  plugPath: string;
}
export interface getPluginResponse {
  total: number;
  records: itemPluginResponse[];
  pages: number;
  size: number;
}
export type getPluginRes = BaseEntity<getPluginResponse>;
