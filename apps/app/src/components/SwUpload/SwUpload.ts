import { type UploadProps } from "element-plus";
import { isString } from "lodash-es";

import type { MenuItemForRender } from "@/views/build/components/buildTabs/selectAssets/assetsMenuType";

//
//  "img" | "video" | "audio" | "model"
export enum FileType {
  img = "img",
  video = "video",
  audio = "audio",
  model = "model",
  file = "file",
  imgAndVideo = "imgAndVideo"
}

/**
 * 文件资源对象接口
 */
export interface FileResourceInfo {
  /** 认证信息 */
  auth: any | null;
  /** 封面 */
  cover: any | null;
  /** 封面名称 */
  coverName: string | null;
  /** 创建者 */
  createdBy: string;
  /** 创建时间 */
  createdTime: string;
  /** 文件名 */
  filename: string;
  /** 文件类型 */
  fileType: number;
  /** 组ID */
  groupId: number | null;
  /** HDR重写 */
  hdrRewriting: any | null;
  /** ID */
  id: number;
  /** 是否小尺寸调整 */
  isLessResize: boolean | null;
  /** 最后宽度 */
  lastWidth: number;
  /** 图层ID */
  layerId: number;
  /** 大头部信息 */
  largeHeads: string;
  /** 图层ID列表 */
  layerlds: string;
  /** 名称 */
  name: string;
  /** 资源大小 */
  resourceSize: number;
  /** 资源类型 */
  resourceType: number;
  /** 更新者 */
  updatedBy: string;
  /** 更新时间 */
  updatedTime: string;
  /** 文件URL */
  url: string;
  /** 用户ID */
  userId: number;
  /** 向量重写 */
  vectorRewriting: any | null;
  /** z-index层级 */
  zIndex: number | null;
}

export type FtUploadProps = {
  // 实现侧 watcher 一直是 isNil(nVal) 判空（null/undefined 同等对待），签名漏了 null
  modelValue: string | null | undefined;
  fileType?: FileType;
  selectAssets?: boolean;
  screenShot?: boolean;
  screenShotDom?: string;
  fileSize?: number;
  showDel?: boolean;
  isPdf?: boolean;
} & Partial<Omit<UploadProps, "onChange">>;

/**
 * SwUpload组件事件定义
 */
export const FtUploadEmits = {
  "update:modelValue": (value: string) => isString(value),
  screenShot: (value: { url: string; file: File }) => value,
  change: (value: FileResourceInfo | MenuItemForRender) => value,
  delete: (value: string) => isString(value)
};
export type FtUploadEmits = typeof FtUploadEmits;
