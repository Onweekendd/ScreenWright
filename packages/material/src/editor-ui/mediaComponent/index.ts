import { MediaEnum } from "@screenwright/types";
import type { Component } from "vue";

import swimgAnimation from "./mediaAnimation/swimgAnimation.vue";
import swOpenVideoBtnOption from "./mediaBtnOption/sw-open-videoBtnOption.vue";
import swSwiperCardCard from "./mediaCard/swSwiperCardCard.vue";
import ctVideoPanelFilter from "./mediaFilter/ctVideoPanelFilter.vue";
import swOpenVideoFilter from "./mediaFilter/sw-open-videoFilter.vue";
import swimgFilter from "./mediaFilter/swimgFilter.vue";
import swvideoFilter from "./mediaFilter/swvideoFilter.vue";
import swimgFrostedGlass from "./mediaFrostedGlass/swimgFrostedGlass.vue";
import swvideoFrostedGlass from "./mediaFrostedGlass/swvideoFrostedGlass.vue";
import ctVideoPanelGlobal from "./mediaGlobal/ctVideoPanelGlobal.vue";
import swEmbedAudioGlobal from "./mediaGlobal/sw-embed-audioGlobal.vue";
import swOpenVideoGlobal from "./mediaGlobal/sw-open-videoGlobal.vue";
import swImgBorderGlobal from "./mediaGlobal/swimgBorderGlobal.vue";
import swImgGlobal from "./mediaGlobal/swimgGlobal.vue";
import swSwiperCardGlobal from "./mediaGlobal/swSwiperCardGlobal.vue";
import swswiperGlobal from "./mediaGlobal/swswiperGlobal.vue";
import swSwiperV3Global from "./mediaGlobal/swSwiperV3Global.vue";
import swVideoGlobal from "./mediaGlobal/swvideoGlobal.vue";
import swswiperPicture from "./mediaPicture/swswiperPicture.vue";
import swSwiperV3Picture from "./mediaPicture/swSwiperV3Picture.vue";
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
  [MediaEnum.SwEmbedAudio]: [
    { label: "全局", value: optionType.global, component: swEmbedAudioGlobal },
  ],
  [MediaEnum.SwImgBorder]: [
    { label: "全局", value: optionType.global, component: swImgBorderGlobal },
  ],
  [MediaEnum.SwSwiperCard]: [
    { label: "全局", value: optionType.global, component: swSwiperCardGlobal },
    { label: "卡片", value: optionType.card, component: swSwiperCardCard },
  ],
  [MediaEnum.SwOpenVideo]: [
    { label: "全局", value: optionType.global, component: swOpenVideoGlobal },
    {
      label: "按钮配置",
      value: optionType.btnOption,
      component: swOpenVideoBtnOption,
    },
    { label: "滤镜", value: optionType.filter, component: swOpenVideoFilter },
  ],
  [MediaEnum.SwImg]: [
    { label: "全局", value: optionType.global, component: swImgGlobal },
    { label: "动画", value: optionType.animation, component: swimgAnimation },
    { label: "滤镜", value: optionType.filter, component: swimgFilter },
    {
      label: "毛玻璃",
      value: optionType.frostedGlass,
      component: swimgFrostedGlass,
    },
  ],
  [MediaEnum.SwSwiper]: [
    { label: "全局", value: optionType.global, component: swswiperGlobal },
    { label: "图片", value: optionType.picture, component: swswiperPicture },
  ],
  [MediaEnum.SwSwiperV3]: [
    { label: "全局", value: optionType.global, component: swSwiperV3Global },
    { label: "图片", value: optionType.picture, component: swSwiperV3Picture },
  ],
  [MediaEnum.SwVideo]: [
    { label: "全局", value: optionType.global, component: swVideoGlobal },
    { label: "滤镜", value: optionType.filter, component: swvideoFilter },
    {
      label: "毛玻璃",
      value: optionType.frostedGlass,
      component: swvideoFrostedGlass,
    },
  ],
  [MediaEnum.CtVideoPanel]: [
    { label: "全局", value: optionType.global, component: ctVideoPanelGlobal },
    { label: "标题", value: optionType.title, component: ctVideoPanelTitle },
    { label: "滤镜", value: optionType.filter, component: ctVideoPanelFilter },
    { label: "系列", value: optionType.series, component: ctVideoPanelSeries },
  ],
};
