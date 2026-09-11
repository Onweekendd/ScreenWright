import type { BaseEntity } from "./BaseEntity";

export interface TeamListReq {
  size: number;
  current: number;
  largeScreenId: number;
}
export type memberListProp = {
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  id: number;
  userId: number;
  largeScreenId: number;
  memberId: number;
  status: number;
  maxMember: null | number; // 因为值可能为null，所以类型定义为null或number
  name: string;
};

export type memberListRes = BaseEntity<{
  records: memberListProp[];
  pages: number;
  total: number;
  size: number;
}>;

export interface queryPageInvitationReq {
  size: number;
  current: number;
  type: string;
  status: number;
  domain: string;
}

export interface queryPageItemRes {
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  id: number;
  userId: number;
  name: string;
  status: number;
  domain: string;
  startedTime: string;
  finishedTime: string;
  attachmentUrl: string;
  type: string;
  exportType: null | number; // 因为值可能为null，所以类型设为null可空类型
  errorReason: null | string;
}

export type queryPageInvitationRes = BaseEntity<{
  records: queryPageItemRes[];
  pages: number;
  total: number;
  size: number;
}>;
