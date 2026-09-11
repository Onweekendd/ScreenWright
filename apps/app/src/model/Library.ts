import type { BaseEntity } from "./BaseEntity";

export interface ScreenModuleReq {
  size: number;
  current: number;
  stockType: number;
}

export interface ScreenItem {
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  id: number;
  userId: number;
  moduleId: number | null;
  config: string | null;
  name: string;
  detail: string; // JSON string, can be parsed to ScreenDetail
  backgroundUrl: string;
  sceneInfo: string | null;
  type: number;
  stockType: number;
  groupId: number;
  password: string | null;
  hasPassword: boolean | null;
  invitationCode: string;
  status: boolean;
  expirationTime: string | null;
  hasExpirationTime: boolean | null;
  sort: number;
  versionCode: string | null;
  versionDesc: string | null;
  minioIds: (number | null)[] | null;
  dataFilterArr: any[] | null;
  aniFrameSet: any | null;
  newApplication: any | null;
  encodedControl: any | null;
}

export interface ScreenModule {
  countId: number | null;
  current: number;
  maxLimit: number;
  optimizeCountSql: boolean;
  orders: any[];
  pages: number;
  searchCount: boolean;
  size: number;
  total: number;
  records: ScreenItem[];
}

export interface ModuleInfo {
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  id: number;
  userId: number | null;
  type: number;
  status: number;
  firstLevelMenu: string;
  secondLevelMenu: string;
  javaScript: string;
  template: string;
  name: string;
  thumbnail: string;
}

export interface LayersAggReq {
  moduleId: number;
  largeId: number;
  status: boolean;
  isSaved: number;
  applicationCode: string;
}

export interface updateLayersAggReq {
  config: string;
  dataJson?: string;
  id: number;
  minioIds?: string;
  moduleId?: number;
  status: boolean;
}

export type ScreenModuleRes = BaseEntity<ScreenModule>;
export type ModuleInfoRes = BaseEntity<ModuleInfo>;
