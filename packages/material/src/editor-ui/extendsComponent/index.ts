import type { Component } from "vue";

import { ExtendsEnum } from "@screenwright/types";

import ftDataContainerGlobal from "./extendsGlobal/ft-dataContainerGlobal.vue";
import ftMaskLayerGlobal from "./extendsGlobal/ft-mask-layerGlobal.vue";
import fullScreenSwitchGlobal from "./extendsGlobal/fullScreenSwitchGlobal.vue";
import ftWeatherGlobal from "./extendsGlobal/ft-weatherGlobal.vue";
import pageReloadGlobal from "./extendsGlobal/pageReloadGlobal.vue";
import simpleBarrageGlobal from "./extendsGlobal/simple-barrageGlobal.vue";
import simpleParticleGlobal from "./extendsGlobal/simple-particleGlobal.vue";
import simpleStarGlobal from "./extendsGlobal/simpleStarGlobal.vue";
import ftMaskLayerFrostedGlass from "./extendsFrostedGlass/ft-mask-layerFrostedGlass.vue";
import simpleBarrageBarrageStyle from "./extendsBarrageStyle/simple-barrageBarrageStyle.vue";
import simpleBarrageNewOption from "./extendsNewOption/simple-barrageNewOption.vue";
import simpleParticleParticleStyle from "./extendsParticleStyle/simple-particleParticleStyle.vue";
import ftWeatherSeries from "./extendsSeries/ft-weatherSeries.vue";
import ftWeatherStyle from "./extendsStyle/ft-weatherStyle.vue";

export enum optionType {
  global = "Global",
  style = "Style",
  series = "Series",
  barrageStyle = "BarrageStyle",
  newOption = "NewOption",
  particleStyle = "ParticleStyle",
  frostedGlass = "FrostedGlass",
  pictureList = "PictureList"
}

export type ConfigTab = {
  label: string;
  value: optionType;
  component: Component;
  /** 该 Tab 在编辑器中是否隐藏 */
  hidden?: boolean;
};

// 已物料化的扩展组件配置面板（静态组装，取代主包旧的 ComponentOptions glob + defineAsyncComponent）。
// 数字人（FtDigitalHuman）与 UE 串流的配置面板仍留在 app，由主包本地 glob 补齐后合并。
export const ExtendsConfigComponent: Partial<Record<ExtendsEnum, ConfigTab[]>> = {
  [ExtendsEnum.SimpleStar]: [{ label: "全局", value: optionType.global, component: simpleStarGlobal }],
  [ExtendsEnum.FullScreenSwitch]: [{ label: "全局", value: optionType.global, component: fullScreenSwitchGlobal }],
  [ExtendsEnum.PageReload]: [{ label: "全局", value: optionType.global, component: pageReloadGlobal }],
  [ExtendsEnum.FtDataContainer]: [{ label: "全局", value: optionType.global, component: ftDataContainerGlobal }],
  [ExtendsEnum.SimpleParticle]: [
    { label: "全局", value: optionType.global, component: simpleParticleGlobal },
    { label: "粒子样式", value: optionType.particleStyle, component: simpleParticleParticleStyle }
  ],
  [ExtendsEnum.FtWeather]: [
    { label: "全局", value: optionType.global, component: ftWeatherGlobal },
    { label: "样式", value: optionType.style, component: ftWeatherStyle },
    { label: "系列", value: optionType.series, component: ftWeatherSeries }
  ],
  [ExtendsEnum.FtMaskLayer]: [
    { label: "全局", value: optionType.global, component: ftMaskLayerGlobal },
    { label: "毛玻璃", value: optionType.frostedGlass, component: ftMaskLayerFrostedGlass }
  ],
  [ExtendsEnum.SimpleBarrage]: [
    { label: "全局", value: optionType.global, component: simpleBarrageGlobal },
    { label: "弹幕样式", value: optionType.barrageStyle, component: simpleBarrageBarrageStyle },
    { label: "新增配置", value: optionType.newOption, component: simpleBarrageNewOption }
  ]
};
