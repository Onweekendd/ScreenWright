/**
 * 上传相关枚举（下沉副本），与 app `@/views/build/components/buildTabs/assetsEditFrom/type` 保持同值。
 */
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
