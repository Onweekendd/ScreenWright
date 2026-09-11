import type { BaseEntity } from "@/model/BaseEntity";

export interface ScreenVersion {
  id: number;
  versionCode: string;
  hasPassword: boolean;
  hasExpirationTime: boolean;
  /** 状态：接口未设置时返回 null */
  status: boolean | null;
  password: string;
  expirationTime: string | null;
  versionDesc?: string | null;
  updatedTime?: string | null;
}

export interface ScreenData {
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  id: number;
  userId: number;
  versionCode: string;
  versionDesc: string;
  largeId: number;
  config: string; // 可能是 JSON 字符串，包含组件 ID 数组
  detail: string; // JSON 字符串，实际上是 ScreenDetail 对象
  dataFilterArr: string; // JSON 字符串，包含过滤器配置
  aniFrameSet: string; // JSON 字符串
  statusAnimation: string; // JSON 字符串
  backgroundUrl: string;
  sceneInfo: null | any;
  status: boolean;
  minioIds: string; // JSON 字符串，可能是数组
}

export interface updateScreenVersion {
  id: number | string;
  versionCode?: number | string;
  versionDesc?: string;
}

export interface CreateVersion {
  /** 封面图 URL：未设置封面时为 null */
  backgroundUrl: string | null;
  config: string;
  detail: string;
  groupId: number | string;
  password: string;
  name: string;
  type: number;
  id: number;
}

export type ScreenVersionRes = BaseEntity<ScreenVersion>;
