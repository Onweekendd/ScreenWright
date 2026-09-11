/**
 * 展品组件类型
 * @description 展品类组件的类型标识
 */

/**
 * 展品组件枚举
 * @description 各种展品组件的类型标识
 */
export enum ExhibitEnum {
  /** 3D环形指示器 */
  RingIndicator3d = "ringIndicator3d",
  /** 3D环形指示器新版 */
  ringIndicator3dNew = "ringIndicator3dNew",
  /** 滑动卡片V1 */
  FtSlidecardV1 = "sw-slidecard-v1",
  /** 3D图片列表 */
  ImagesList3d = "imagesList3d",
  /** AI问答 */
  FtQachat = "sw-qachat",
  /** PDF查看器 */
  PdfjsViewer = "pdfjs-viewer",
  /** 空间粒子 */
  FtParticles = "sw-particles",
  /** 3D立方体 */
  FtRotateCube = "sw-rotateCube",
  /** 签名板 */
  FtSignaturePad = "sw-signaturePad",
  /** 曲线轨道列表 */
  CurvedTrackList = "CurvedTrackList",
  /** 译文转换 */
  FtTranslation = "sw-translation",
  /** 轮播图V2 */
  FtCarouselImageV2 = "sw-carousel-image-v2",
  /** 翻页组件 */
  FtTurnPage = "sw-turn-page",
  /** 滤镜组件 */
  FtFilter = "sw-filter",
  /** 弹性装饰 */
  FtFlexDecoration = "sw-flex-decoration",
  /** 点九图 */
  FtNinePatch = "sw-nine-patch",
  /** 垂直卡片 */
  verticalCard = "verticalCard",
  /** 旋转组件 */
  FtRotate = "sw-rotate"
}

/** @deprecated 使用 ExhibitEnum 代替 */
export type ExhibitEnumType = ExhibitEnum;
