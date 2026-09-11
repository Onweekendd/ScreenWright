import type { FileType } from "@screenwright/composables";
import type { MenuItemForRender } from "@screenwright/types";

export { FileType } from "@screenwright/composables";

export type FtUploadProps = {
  modelValue: string | undefined;
  fileType?: FileType;
  selectAssets?: boolean;
  screenShot?: boolean;
  screenShotDom?: string;
  fileSize?: number;
  showDel?: boolean;
  isPdf?: boolean;
  accept?: string;
  multiple?: boolean;
};

export type FtUploadChangePayload = {
  url: string;
  [key: string]: any;
};

export const FtUploadEmits = {
  "update:modelValue": (value: string) => true,
  change: (value: FtUploadChangePayload | MenuItemForRender) => true,
  delete: (value: string) => true,
};
export type FtUploadEmits = typeof FtUploadEmits;

/** 素材资源信息（上传/选择器返回的资源结构） */
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
