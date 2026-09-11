import type { FileTypeEnum, Form, ResourceTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";

import type { BaseEntity } from "./BaseEntity";

export interface assetItemReq {
  size: number;
  current: number;
  fileType: FileTypeEnum | any;
  groupId: number | string;
  time: number;
  name?: string;
  resourceType?: ResourceTypeEnum | any;
  largeId?: string;
}

export interface assetItem {
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  id: number;
  userId: number;
  url: string;
  fileName: FileTypeEnum;
  resourceType: ResourceTypeEnum;
  auth: null | any; // 如果后续能明确`auth`的类型，替换掉`any`
  fileType?: number;
  largeId: null | any; // 同理，后续明确类型就替换
  groupId: number | null;
  cover: null | any;
  hdrPreviewImg: null | any;
  name: string;
  coverName: null | any;
  resourceSize?: number;
  layerIds?: string;
  largeUseIds?: string;
  vectorDataPreviewImg: null | any;
  type?: number;
  img?: string;
  label?: string;
  // 新增字段
  coverUrl: null | string;
  isDeleted: number;
  sortId: number;
  file?: File;
  coverFile?: File | null;
  applicationCode?: string;
}

// 图层资源项接口
export interface assetLayerItem {
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  id: number;
  userId: number;
  name: string;
  file: File | null;
  coverUrl: string | null;
  groupId: number;
  isDeleted: boolean;
  layerId: string;
  groupLayerId: number | null;
  largeId: string | null;
}
export interface editUserAssetsReq {
  /** 资源名称 */
  name: string;
  /** 资源类型（数字标识） */
  resourceType: number;
  /** 文件类型（数字标识） */
  fileType: number;
  /** 分组ID */
  groupId: number | string;
  /** 应用编码 */
  applicationCode: string;
  /** 大分类ID */
  largeId?: string;
  /** 资源唯一ID */
  id?: number | null;
  /** 文件访问地址 */
  fileUrl: string | null;
  /** 分组名称 */
  groupName: string;
  /** 封面文件（可为null） */
  coverFile: File | null;
}

export interface assetItemListRes<T = assetItem> {
  records: T[];
  total: number;
  size: number;
  current: number;
  orders: any[];
  optimizeCountSql: boolean;
  searchCount: boolean;
  maxLimit: null | number;
  countId: null | number;
  pages: number;
}

export interface LargeUseEntity {
  largeId: string;
  largeName: string;
  versionCode: string;
  versionDesc: string;
}

export type LargeUseRes = BaseEntity<string | Array<LargeUseEntity>>;
export type uploadFileReq = Form & { id?: string; largeId?: string };

export interface systemPageGroupsRes {
  current: number;
  groupIds: Array<number>;
  name: string;
  size: number;
}

export type DetailListRes = BaseEntity<assetItemListRes>;
export type UsedSizeRes = BaseEntity<{ size: string; useSize: string }>;

export interface CodePackageGroup {
  createdBy?: string;
  createdTime?: string;
  updatedBy?: string;
  updatedTime?: string;
  id: number;
  userId?: number;
  name?: string;
  isDelete?: boolean;
}

export interface ResultListCodePackageGroup {
  success: boolean;
  message: string;
  code: number;
  result: CodePackageGroup[];
  timestamp: number;
  requestId: string;
  onlTable: string;
}

export interface CodePackageParamCodePackage {
  size?: number;
  current?: number;
  name?: string;
  groupId?: number | string;
  type?: number;
}

export interface OrderItem {
  column: string;
  asc: boolean;
}

export interface CodePackage {
  createdBy?: string;
  createdTime?: string;
  updatedBy?: string;
  updatedTime?: string;
  id: number;
  userId?: number;
  url: string;
  groupId: number;
  packageName: string;
  file?: File;
}

export interface PageCodePackage {
  records: CodePackage[];
  total: number;
  size: number;
  current: number;
  orders: OrderItem[];
  optimizeCountSql: boolean;
  searchCount: boolean;
  optimizeJoinOfCountSql: boolean;
  maxLimit?: number;
  countId?: string;
  pages: number;
}
