import { ExhibitEnum } from "@screenwright/types";
import type { Component } from "vue";

import swParticlesAnimation from "./exhibitAnimation/sw-particlesAnimation.vue";
import imagesList3dBaseMap from "./exhibitBaseMap/imagesList3dBaseMap.vue";
import swFilterFilter from "./exhibitFilter/sw-filterFilter.vue";
import imagesList3dGlobal from "./exhibitGlobal/imagesList3dGlobal.vue";
import ringIndicator3dGlobal from "./exhibitGlobal/ringIndicator3dGlobal.vue";
import ringIndicator3dNewGlobal from "./exhibitGlobal/ringIndicator3dNewGlobal.vue";
import swFilterGlobal from "./exhibitGlobal/sw-filterGlobal.vue";
import swParticlesGlobal from "./exhibitGlobal/sw-particlesGlobal.vue";
import swParticlesInteractive from "./exhibitInteractive/sw-particlesInteractive.vue";
import swParticlesLineOption from "./exhibitLineOption/sw-particlesLineOption.vue";
import imagesList3dPicList from "./exhibitPicList/imagesList3dPicList.vue";
import ringIndicator3dNewSign from "./exhibitSign/ringIndicator3dNewSign.vue";
import ringIndicator3dSign from "./exhibitSign/ringIndicator3dSign.vue";

export enum optionType {
  global = "Global",
  sign = "Sign",
  baseMap = "BaseMap",
  picList = "PicList",
  edit = "Edit",
  control = "Control",
  dic = "Dic",
  filter = "Filter",
  lineOption = "LineOption",
  animation = "Animation",
  interactive = "Interactive",
  style = "Style",
  picture = "Picture",
}

export interface ConfigTab {
  label: string;
  value: optionType;
  component: Component;
  /** 该 Tab 在编辑器中是否隐藏 */
  hidden?: boolean;
}

export const ExhibitConfigComponent: Partial<Record<ExhibitEnum, ConfigTab[]>> =
  {
    [ExhibitEnum.RingIndicator3d]: [
      {
        label: "全局",
        value: optionType.global,
        component: ringIndicator3dGlobal,
      },
      { label: "标牌", value: optionType.sign, component: ringIndicator3dSign },
    ],
    [ExhibitEnum.ringIndicator3dNew]: [
      {
        label: "全局",
        value: optionType.global,
        component: ringIndicator3dNewGlobal,
      },
      {
        label: "标牌",
        value: optionType.sign,
        component: ringIndicator3dNewSign,
      },
    ],
    [ExhibitEnum.ImagesList3d]: [
      {
        label: "全局",
        value: optionType.global,
        component: imagesList3dGlobal,
      },
      {
        label: "底图",
        value: optionType.baseMap,
        component: imagesList3dBaseMap,
      },
      {
        label: "图片列表",
        value: optionType.picList,
        component: imagesList3dPicList,
      },
    ],
    [ExhibitEnum.SwParticles]: [
      {
        label: "基础配置",
        value: optionType.global,
        component: swParticlesGlobal,
      },
      {
        label: "连线配置",
        value: optionType.lineOption,
        component: swParticlesLineOption,
      },
      {
        label: "动画配置",
        value: optionType.animation,
        component: swParticlesAnimation,
      },
      {
        label: "交互配置",
        value: optionType.interactive,
        component: swParticlesInteractive,
      },
    ],
    [ExhibitEnum.SwFilter]: [
      { label: "全局", value: optionType.global, component: swFilterGlobal },
      { label: "滤镜", value: optionType.filter, component: swFilterFilter },
    ],
  };
