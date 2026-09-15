import { ExtendsEnum } from "@screenwright/types";
import type { Component } from "vue";

import swMaskLayerFrostedGlass from "./extendsFrostedGlass/sw-mask-layerFrostedGlass.vue";
import fullScreenSwitchGlobal from "./extendsGlobal/fullScreenSwitchGlobal.vue";
import pageReloadGlobal from "./extendsGlobal/pageReloadGlobal.vue";
import simpleParticleGlobal from "./extendsGlobal/simple-particleGlobal.vue";
import simpleStarGlobal from "./extendsGlobal/simpleStarGlobal.vue";
import swDataContainerGlobal from "./extendsGlobal/sw-dataContainerGlobal.vue";
import swMaskLayerGlobal from "./extendsGlobal/sw-mask-layerGlobal.vue";
import swWeatherGlobal from "./extendsGlobal/sw-weatherGlobal.vue";
import simpleParticleParticleStyle from "./extendsParticleStyle/simple-particleParticleStyle.vue";
import swWeatherSeries from "./extendsSeries/sw-weatherSeries.vue";
import swWeatherStyle from "./extendsStyle/sw-weatherStyle.vue";

export enum optionType {
  global = "Global",
  style = "Style",
  series = "Series",
  newOption = "NewOption",
  particleStyle = "ParticleStyle",
  frostedGlass = "FrostedGlass",
  pictureList = "PictureList",
}

export interface ConfigTab {
  label: string;
  value: optionType;
  component: Component;
  /** 该 Tab 在编辑器中是否隐藏 */
  hidden?: boolean;
}

// 已物料化的扩展组件配置面板（静态组装，取代主包旧的 ComponentOptions glob + defineAsyncComponent）。
// 数字人（FtDigitalHuman）与 UE 串流的配置面板仍留在 app，由主包本地 glob 补齐后合并。
export const ExtendsConfigComponent: Partial<Record<ExtendsEnum, ConfigTab[]>> =
  {
    [ExtendsEnum.SimpleStar]: [
      { label: "全局", value: optionType.global, component: simpleStarGlobal },
    ],
    [ExtendsEnum.FullScreenSwitch]: [
      {
        label: "全局",
        value: optionType.global,
        component: fullScreenSwitchGlobal,
      },
    ],
    [ExtendsEnum.PageReload]: [
      { label: "全局", value: optionType.global, component: pageReloadGlobal },
    ],
    [ExtendsEnum.SwDataContainer]: [
      {
        label: "全局",
        value: optionType.global,
        component: swDataContainerGlobal,
      },
    ],
    [ExtendsEnum.SimpleParticle]: [
      {
        label: "全局",
        value: optionType.global,
        component: simpleParticleGlobal,
      },
      {
        label: "粒子样式",
        value: optionType.particleStyle,
        component: simpleParticleParticleStyle,
      },
    ],
    [ExtendsEnum.SwWeather]: [
      { label: "全局", value: optionType.global, component: swWeatherGlobal },
      { label: "样式", value: optionType.style, component: swWeatherStyle },
      { label: "系列", value: optionType.series, component: swWeatherSeries },
    ],
    [ExtendsEnum.SwMaskLayer]: [
      { label: "全局", value: optionType.global, component: swMaskLayerGlobal },
      {
        label: "毛玻璃",
        value: optionType.frostedGlass,
        component: swMaskLayerFrostedGlass,
      },
    ],
  };
