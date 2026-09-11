import type { BaseEntity } from "./BaseEntity";

export interface InterfaceDebuggerReq {
  size: number;
  current: number;
  groupId: number | string;
  name: string;
  time: number;
}

// 单个记录的类型
export type InterfaceItem = {
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  id: number;
  userId: number;
  name: string;
  backgroundUrl: null | string;
  groupId: number;
  path: string;
  renderType: string;
};

// 外层对象的类型
export type InterfaceResult = {
  records: InterfaceItem[];
  total: number;
  size: number;
  current: number;
  orders: [];
  optimizeCountSql: boolean;
  searchCount: boolean;
  maxLimit: null | number;
  countId: null | number;
  pages: number;
};

export interface SaveInterReq {
  name: string;
  groupId: number | string;
  path: string;
  renderType: string;
  id?: number | string;
}

export type InterfaceDebuggerRes = BaseEntity<InterfaceResult>;
