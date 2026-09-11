import type { BaseEntity } from "./BaseEntity";

export interface LayerInfo {
  config: string;
  name: string;
  detail: string;
  backgroundUrl: string;
  id: number;
  invitationCode: string;
  status: boolean;
  type: number;
  versionCode: string;
  aniFrameSet: string;
  versionDesc: string | null;
  [key: string]: any;
}

export interface GroupCase {
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  id: number;
  userId: number;
  moduleId: number;
  largeId: number;
  config: string;
  minioIds: string;
  dataJson: string;
  versionCode: string;
}

export type LayerInfoRes = BaseEntity<GroupCase[]>;

export type SingleLayerInfoRes = BaseEntity<GroupCase>;
