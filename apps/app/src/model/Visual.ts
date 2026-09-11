import type { BaseEntity } from "./BaseEntity";

export enum StockType {
  news = 0,
  old = 1
}
export type ScreenReqParams = Pick<ScreenReq, "current" | "size" | "groupId">;
export interface cityScenesReq {
  groupId: number;
  sortType: number;
  isPublish: boolean;
  current: number;
  size: number;
}
export interface ScreenReq {
  id?: number;
  current: number;
  size: number;
  name: string | null;
  groupId: number | string;
  stockType: StockType;
  belong?: number;
  status?: boolean;
}

export interface ScreenDetail {
  width: string;
  height: string;
  scale: number;
  initLoad: boolean;
  mark: {
    show: boolean;
    text: string;
    fontSize: number;
    textStyle: string;
    degree: number;
  };
  backgroundImage: string;
  backgroundColor: string;
  showBackgroundImage: boolean;
  showScreenAdaptation: boolean;
  adaptationNorm: string;
  adaptationType: number;
  showScreenFilter: boolean;
  screenFilterInfo: {
    gaussianBlur: number;
    brightness: number;
    contrast: number;
    grayscale: number;
    hue: number;
    saturate: number;
    invert: number;
    sepia: number;
  };
  showWaterMark: boolean;
  waterMark: {
    text: string;
    fontFamily: string;
    fontSize: number;
    color: string;
    fontStyle: string;
    fontWeight: string;
  };
  gridDistance: number;
  query: Record<string, any>;
  name: string;
  controlWebsocketUrl: string;
  zIndexMap: Record<string, number>;
  minioIds: (number | null)[];
  heartbeatInterval?: number;
  terminalEnableArr?: Record<string, any>;
  sceneId?: number;
  sceneVersionCode?: string;
  isEncodedControl?: boolean;
}

export interface ScreenItem {
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  id: number;
  userId: number;
  moduleId: number | null;
  config: string;
  name: string;
  detail: string; // JSON string, can be parsed to ScreenDetail
  backgroundUrl: string | null;
  sceneInfo: string | null;
  type: number;
  stockType: StockType;
  groupId: number;
  password: string;
  hasPassword: boolean;
  invitationCode: string;
  status: boolean;
  expirationTime: string | null;
  hasExpirationTime: boolean;
  sort: number;
  versionCode: string | null;
  versionDesc: string | null;
  minioIds: (number | null)[] | null;
  dataFilterArr: any[] | null;
  aniFrameSet: any | null;
  newApplication: boolean;
  encodedControl: any | null;
  path?: string;
  publishInfo?: string;
}

/**
 * 大屏基本信息：ScreenItem 去掉 layers 及 config/detail/minioIds/dataFilterArr/aniFrameSet/encodedControl
 * 等重 JSON 字段。对应后端 /largeScreen/meta/:id。
 */
export type ScreenMeta = Omit<
  ScreenItem,
  "config" | "detail" | "minioIds" | "dataFilterArr" | "aniFrameSet" | "encodedControl"
>;

export interface ScreenList {
  records: ScreenItem[];
  total: number;
  size: number;
  current: number;
  orders: any[];
  optimizeCountSql: boolean;
  searchCount: boolean;
  maxLimit: number | null;
  countId: number | null;
  pages: number;
}

export interface ScenePublishReq {
  id: string | number;
  isPublish: boolean;
  publishInfo: string;
  versionCode: string;
}

export interface ScenePublish {
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  id: number;
  userId: number;
  moduleId: null;
  config: null;
  name: string;
  detail: null;
  defaultScene: string;
  sceneList: string;
  backgroundUrl: string;
  type: number;
  stockType: number;
  groupId: number;
  isUsed: boolean;
  sort: number;
  isDeleted: number;
  status: boolean;
  globalArgs: string;
  versionCode: string;
  versionDesc: null;
  path: string;
  publishInfo: string;
  levelInfo: string;
}

export interface quoteScreenReq {
  largeScreenId: string | number;
  quoteId: string | number;
  status: number;
  largeVersion: string;
  quoteVersion: string;
}

// 定义整体数据的类型
export interface mapBuildDetailType {
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  id: number;
  userId: number;
  moduleId: null;
  config: null;
  name: string;
  detail: null;
  defaultScene: string;
  sceneList: string;
  backgroundUrl: string;
  type: number;
  stockType: number;
  groupId: number;
  isUsed: boolean;
  sort: number;
  isDeleted: number;
  status: boolean;
  globalArgs: string;
  versionCode: string;
  versionDesc: null;
  path: null;
  publishInfo: null;
}
export interface sceneObjListData {
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  id: number;
  userId: number;
  versionCode: string;
  versionDesc: null;
  sceneId: number;
  type: "model";
  name: string;
  groupId: number;
  assetType: number;
  assetId: number;
  number: null;
  copyFrom: null;
  isSaved: number;
  isDeleted: null;
}

export interface addSceneObjReq {
  sceneId: string;
  name: string;
  type: string;
  assetType: number;
  assetId: number;
  url: string;
  isSaved: number; // 临时增加 保存时才改为1
}

export interface addSceneObjRes {
  id: number;
  name: string;
  url: string;
}

export interface getPublishedSceneRes {
  sceneInfoEntity: ScenePublish;
  sceneObjectEntityList: sceneObjListData[];
}

export interface responseReq {
  success: boolean;
  message: string;
  code: number;
  result: object;
}

export type BaseAddSceneObjRes = BaseEntity<addSceneObjRes>;

export type ScenePublishRes = BaseEntity<ScenePublish>;

export type ScreenListRes = BaseEntity<ScreenList>;

export type getMapScreenRes = BaseEntity<mapBuildDetailType>;

export type getSceneObjListRes = BaseEntity<sceneObjListData[]>;
