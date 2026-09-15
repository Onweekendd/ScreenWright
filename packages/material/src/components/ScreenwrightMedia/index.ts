import { MediaEnum } from "@screenwright/types";
import type { Component } from "vue";

import audio from "./components/audio/index.vue";
import ctVideoPanel from "./components/ctVideoPanel/index.vue";
import swImg from "./components/swImg/index.vue";
import swImgBorder from "./components/swimgBorder/index.vue";
import swSwiper from "./components/swswiper/index.vue";
import swSwiperCard from "./components/swSwiperCard/index.vue";
import swSwiperV3 from "./components/swSwiperV3/index.vue";
import swVideo from "./components/swvideo/index.vue";
import openVideo from "./components/openVideo/index.vue";

// FtIframe 深度耦合大屏编辑器能力（EditShapeBox/EditGroup 等），不适合物料化，实现留在 app 本地（@/components/ScreenwrightMedia）
export const ScreenwrightMediaMap: Partial<Record<MediaEnum, Component>> = {
  [MediaEnum.SwSwiperCard]: swSwiperCard,
  [MediaEnum.SwEmbedAudio]: audio,
  [MediaEnum.SwImg]: swImg,
  [MediaEnum.SwOpenVideo]: openVideo,
  [MediaEnum.SwImgBorder]: swImgBorder,
  [MediaEnum.SwSwiper]: swSwiper,
  [MediaEnum.SwSwiperV3]: swSwiperV3,
  [MediaEnum.SwVideo]: swVideo,
  [MediaEnum.CtVideoPanel]: ctVideoPanel,
};
