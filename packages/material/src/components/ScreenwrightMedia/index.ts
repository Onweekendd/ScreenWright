import { MediaEnum } from "@screenwright/types";
import type { Component } from "vue";

import audio from "./components/audio/index.vue";
import ctVideoPanel from "./components/ctVideoPanel/index.vue";
import ftImg from "./components/ftImg/index.vue";
import ftImgBorder from "./components/ftimgBorder/index.vue";
import ftSwiper from "./components/ftswiper/index.vue";
import ftSwiperCard from "./components/ftSwiperCard/index.vue";
import ftSwiperV3 from "./components/ftSwiperV3/index.vue";
import ftVideo from "./components/ftvideo/index.vue";
import openVideo from "./components/openVideo/index.vue";

// FtIframe 深度耦合大屏编辑器能力（EditShapeBox/EditGroup 等），不适合物料化，实现留在 app 本地（@/components/ScreenwrightMedia）
export const ScreenwrightMediaMap: Partial<Record<MediaEnum, Component>> = {
  [MediaEnum.FtSwiperCard]: ftSwiperCard,
  [MediaEnum.FtEmbedAudio]: audio,
  [MediaEnum.FtImg]: ftImg,
  [MediaEnum.FtOpenVideo]: openVideo,
  [MediaEnum.FtImgBorder]: ftImgBorder,
  [MediaEnum.FtSwiper]: ftSwiper,
  [MediaEnum.FtSwiperV3]: ftSwiperV3,
  [MediaEnum.FtVideo]: ftVideo,
  [MediaEnum.CtVideoPanel]: ctVideoPanel,
};
