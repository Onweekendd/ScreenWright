/**
 * 媒体组件类型
 * @description 媒体类组件的类型标识
 */

/**
 * 媒体组件枚举
 * @description 各种媒体组件的类型标识
 */
export enum MediaEnum {
  /** 轮播卡片 */
  SwSwiperCard = "swSwiperCard",
  /** 嵌入音频 */
  SwEmbedAudio = "sw-embed-audio",
  /** iframe */
  SwIframe = "swiframe",
  /** 图片 */
  SwImg = "swimg",
  /** 视频播放器 */
  SwOpenVideo = "sw-open-video",
  /** 图片边框 */
  SwImgBorder = "swimgBorder",
  /** 轮播图 */
  SwSwiper = "swswiper",
  /** 轮播图V3 */
  SwSwiperV3 = "swSwiperV3",
  /** 视频 */
  SwVideo = "swvideo",
  /** 视频面板 */
  CtVideoPanel = "ctVideoPanel"
}

/** @deprecated 使用 MediaEnum 代替 */
export const mediaEnum = MediaEnum;
