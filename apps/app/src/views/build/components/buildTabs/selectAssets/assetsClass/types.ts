import type { assetItem, assetLayerItem } from "@/model/Assets";
import type { FileTypeEnum, ResourceTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";

/**
 * 素材资源项接口
 */
export type AssetItem = assetItem;

/**
 * 图层资源项接口
 */
export type AssetLayerItem = assetLayerItem;

/**
 * 分组项接口
 */
export interface GroupItem {
  /** 分组ID */
  id: number | string;
  /** 分组名称 */
  name: string;
  /** 显示标题 */
  title: string;
  /** 分组ID（用于API调用） */
  groupId?: number | string;
}

/**
 * 分页参数接口
 */
export interface PaginationParams {
  /** 当前页码 */
  current: number;
  /** 每页大小 */
  size: number;
  /** 总数 */
  total?: number;
}

/**
 * API调用参数接口
 */
export interface ApiParams extends PaginationParams {
  /** 分组ID */
  groupId?: number | string;
  /** 大屏ID */
  largeId?: string | string[];
  /** 文件类型 */
  fileType?: FileTypeEnum;
  /** 类型标识 */
  type?: number;
  /** 时间标识 */
  time?: number;
  /** 应用编码 */
  applicationCode?: string;
}

/**
 * 上传文件参数接口
 */
export interface UploadParams {
  /** 文件名称 */
  name: string;
  /** 资源类型 */
  resourceType: ResourceTypeEnum;
  /** 文件类型 */
  fileType: FileTypeEnum;
  /** 分组ID */
  groupId?: number | string;
  /** 上传文件 */
  file: File;
  /** 封面文件 */
  coverFile?: File | null;
  /** 应用编码 */
  applicationCode?: string;
  /** 大屏ID */
  largeId?: string;
  /** 资源ID（用于编辑） */
  id?: number | string;
}
