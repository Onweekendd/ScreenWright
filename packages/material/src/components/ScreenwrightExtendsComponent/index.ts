import { ExtendsEnum } from "@screenwright/types";
import type { Component } from "vue";

import FullScreenSwitch from "./FullScreenSwitch/index.vue";
import PageReload from "./PageReload/index.vue";
import SimpleParticle from "./SimpleParticle/index.vue";
import SimpleStar from "./SimpleStar/index.vue";
import SwDataContainer from "./SwDataContainer/index.vue";
import SwMaskLayer from "./SwMaskLayer/index.vue";
import SwWeather from "./SwWeather/index.vue";

// 已物料化的扩展组件（数字人 FtDigitalHuman 与 UE 串流仍留在 app，故此处为 Partial）
export const ScreenwrightExtendsComponentMap: Partial<
  Record<ExtendsEnum, Component>
> = {
  [ExtendsEnum.SimpleStar]: SimpleStar,
  [ExtendsEnum.FullScreenSwitch]: FullScreenSwitch,
  [ExtendsEnum.PageReload]: PageReload,
  [ExtendsEnum.SimpleParticle]: SimpleParticle,
  [ExtendsEnum.SwDataContainer]: SwDataContainer,
  [ExtendsEnum.SwWeather]: SwWeather,
  [ExtendsEnum.SwMaskLayer]: SwMaskLayer,
};
