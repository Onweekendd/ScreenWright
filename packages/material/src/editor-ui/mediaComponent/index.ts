import { MediaEnum } from "@screenwright/types";
import type { Component } from "vue";

import ftimgAnimation from "./mediaAnimation/ftimgAnimation.vue";
import ftOpenVideoBtnOption from "./mediaBtnOption/ft-open-videoBtnOption.vue";
import ftSwiperCardCard from "./mediaCard/ftSwiperCardCard.vue";
import ctVideoPanelFilter from "./mediaFilter/ctVideoPanelFilter.vue";
import ftOpenVideoFilter from "./mediaFilter/ft-open-videoFilter.vue";
import ftimgFilter from "./mediaFilter/ftimgFilter.vue";
import ftvideoFilter from "./mediaFilter/ftvideoFilter.vue";
import ftimgFrostedGlass from "./mediaFrostedGlass/ftimgFrostedGlass.vue";
import ftvideoFrostedGlass from "./mediaFrostedGlass/ftvideoFrostedGlass.vue";
import ctVideoPanelGlobal from "./mediaGlobal/ctVideoPanelGlobal.vue";
import ftEmbedAudioGlobal from "./mediaGlobal/ft-embed-audioGlobal.vue";
import ftOpenVideoGlobal from "./mediaGlobal/ft-open-videoGlobal.vue";
import ftImgBorderGlobal from "./mediaGlobal/ftimgBorderGlobal.vue";
import ftImgGlobal from "./mediaGlobal/ftimgGlobal.vue";
import ftSwiperCardGlobal from "./mediaGlobal/ftSwiperCardGlobal.vue";
import ftswiperGlobal from "./mediaGlobal/ftswiperGlobal.vue";
import ftSwiperV3Global from "./mediaGlobal/ftSwiperV3Global.vue";
import ftVideoGlobal from "./mediaGlobal/ftvideoGlobal.vue";
import ftswiperPicture from "./mediaPicture/ftswiperPicture.vue";
import ftSwiperV3Picture from "./mediaPicture/ftSwiperV3Picture.vue";
import ctVideoPanelSeries from "./mediaSeries/ctVideoPanelSeries.vue";
import ctVideoPanelTitle from "./mediaTitle/ctVideoPanelTitle.vue";

export enum optionType {
  global = "Global",
  extend = "Extend",
  card = "Card",
  animation = "Animation",
  picture = "Picture",
  filter = "Filter",
  title = "Title",
  series = "Series",
  btnOption = "BtnOption",
  frostedGlass = "FrostedGlass",
}

export type ConfigTab = {
  label: string;
  value: optionType;
  component: Component;
};

// FtIframe 的配置面板留在 app 本地（依赖大屏编辑器 useUpdateInstance 等能力），未在此注册
export const MediaConfigComponent: Partial<Record<MediaEnum, ConfigTab[]>> = {
  [MediaEnum.FtEmbedAudio]: [
    { label: "全局", value: optionType.global, component: ftEmbedAudioGlobal },
  ],
  [MediaEnum.FtImgBorder]: [
    { label: "全局", value: optionType.global, component: ftImgBorderGlobal },
  ],
  [MediaEnum.FtSwiperCard]: [
    { label: "全局", value: optionType.global, component: ftSwiperCardGlobal },
    { label: "卡片", value: optionType.card, component: ftSwiperCardCard },
  ],
  [MediaEnum.FtOpenVideo]: [
    { label: "全局", value: optionType.global, component: ftOpenVideoGlobal },
    {
      label: "按钮配置",
      value: optionType.btnOption,
      component: ftOpenVideoBtnOption,
    },
    { label: "滤镜", value: optionType.filter, component: ftOpenVideoFilter },
  ],
  [MediaEnum.FtImg]: [
    { label: "全局", value: optionType.global, component: ftImgGlobal },
    { label: "动画", value: optionType.animation, component: ftimgAnimation },
    { label: "滤镜", value: optionType.filter, component: ftimgFilter },
    {
      label: "毛玻璃",
      value: optionType.frostedGlass,
      component: ftimgFrostedGlass,
    },
  ],
  [MediaEnum.FtSwiper]: [
    { label: "全局", value: optionType.global, component: ftswiperGlobal },
    { label: "图片", value: optionType.picture, component: ftswiperPicture },
  ],
  [MediaEnum.FtSwiperV3]: [
    { label: "全局", value: optionType.global, component: ftSwiperV3Global },
    { label: "图片", value: optionType.picture, component: ftSwiperV3Picture },
  ],
  [MediaEnum.FtVideo]: [
    { label: "全局", value: optionType.global, component: ftVideoGlobal },
    { label: "滤镜", value: optionType.filter, component: ftvideoFilter },
    {
      label: "毛玻璃",
      value: optionType.frostedGlass,
      component: ftvideoFrostedGlass,
    },
  ],
  [MediaEnum.CtVideoPanel]: [
    { label: "全局", value: optionType.global, component: ctVideoPanelGlobal },
    { label: "标题", value: optionType.title, component: ctVideoPanelTitle },
    { label: "滤镜", value: optionType.filter, component: ctVideoPanelFilter },
    { label: "系列", value: optionType.series, component: ctVideoPanelSeries },
  ],
};
