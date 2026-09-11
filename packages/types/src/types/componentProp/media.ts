/**
 * 媒体组件类型
 * @description 媒体类组件的类型标识
 */

/**
 * 媒体组件枚举
 * @description 各种媒体组件的类型标识
 */
export enum MediaEnum {
  /** H5播放器 */
  FtH5player = "swH5player",
  /** 轮播卡片 */
  FtSwiperCard = "swSwiperCard",
  /** 嵌入音频 */
  FtEmbedAudio = "sw-embed-audio",
  /** iframe */
  FtIframe = "swiframe",
  /** 图片 */
  FtImg = "swimg",
  /** 视频播放器 */
  FtOpenVideo = "sw-open-video",
  /** 图片边框 */
  FtImgBorder = "swimgBorder",
  /** 轮播图 */
  FtSwiper = "swswiper",
  /** 轮播图V3 */
  FtSwiperV3 = "swSwiperV3",
  /** 视频 */
  FtVideo = "swvideo",
  /** 视频面板 */
  CtVideoPanel = "ctVideoPanel"
}

/** @deprecated 使用 MediaEnum 代替 */
export const mediaEnum = MediaEnum;
