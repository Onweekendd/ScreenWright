import type { UploadFile } from "element-plus";

export interface Props {
  title: string;
  fileType: FileTypeEnum;
  // modelValue: boolean
  option: propOptionType;
  availableResourceType: ResourceTypeEnum[];
  groupId?: number | string;
}

export interface propOptionType {
  resourceType: ResourceTypeEnum;
  id: number | null;
  fileUrl: string | null;
  coverFileUrl: string | null;
  name: string | null;
}

export interface Form {
  name: string;
  resourceType: ResourceTypeEnum;
  groupId: number | string;
  fileType: FileTypeEnum;
  id?: number | null;
  coverFile: UploadFile | File | null;
  coverFileUrl: string | null;
  file: UploadFile | Array<File> | File | null;
  fileUrl: string | null;
  applicationCode: string;
  largeId?: string;
}

export enum ResourceTypeEnum {
  /** 三维模型 */
  threeModel = 0,
  /** 图片 */
  image = 1,
  /** 视频 */
  video = 2,
  /** 材质贴图(hdr) */
  materialTexture = 3,
  /** GEOJSON/(zip) */
  geojson = 4,
  /** 天空盒压缩包(zip) 或者 pdf */
  skyBoxZipOrPdf = 5
}

/**
 * 素材库文件分类
 */
export enum FileTypeEnum {
  /** 个人大屏文件  只有当前大屏可用 */
  personalScreen = 1,
  /** 个人页面资产 所有大屏通用 */
  personalPageAssets = 2,
  /** 个人场景资产 */
  personalSceneAssets = 3,
  /** 城市编辑器资产 */
  cityEditorAssets = 4,
  /** 系统内置素材（全局只读） */
  systemMaterial = 5
}

export enum EditTypeEnum {
  add = 1,
  edit = 2
}
