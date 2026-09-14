/**
 * 素材/资源相关共享类型与枚举
 * 从主包 buildTabs/assetsEditFrom、selectAssets、model 下沉，供物料包与主包共享
 */

/** 资源类型枚举 */
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
  skyBoxZipOrPdf = 5,
  /** 代码库 */
  codeLibrary = 6
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

/** UI 渲染单项类型（素材选择器菜单项） */
export interface MenuItemForRender {
  id?: number;
  title: string;
  name?: string;
  img: string;
  isVideo?: boolean | undefined | null;
  moduleId?: number;
  url?: string;
  fileType?: string;
  type?: string;
  assetType?: FileTypeEnum;
}

/** 大屏版本信息 */
export interface ScreenVersion {
  id: number;
  versionCode: string;
  hasPassword: boolean;
  hasExpirationTime: boolean;
  status: boolean;
  password: string;
  expirationTime: string | null;
  versionDesc?: string | null;
  updatedTime?: string | null;
}
