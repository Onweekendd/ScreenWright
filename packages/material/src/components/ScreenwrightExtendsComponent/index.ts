import { ExtendsEnum } from "@screenwright/types";
import type { Component } from "vue";

import FtDataContainer from "./FtDataContainer/index.vue";
import FtMaskLayer from "./FtMaskLayer/index.vue";
import FtWeather from "./FtWeather/index.vue";
import FullScreenSwitch from "./FullScreenSwitch/index.vue";
import PageReload from "./PageReload/index.vue";
import photoSphereViewer from "./photoSphereViewer/index.vue";
import SimpleBarrage from "./SimpleBarrage/index.vue";
import SimpleParticle from "./SimpleParticle/index.vue";
import SimpleStar from "./SimpleStar/index.vue";

// 已物料化的扩展组件（数字人 FtDigitalHuman 与 UE 串流仍留在 app，故此处为 Partial）
export const ScreenwrightExtendsComponentMap: Partial<
  Record<ExtendsEnum, Component>
> = {
  [ExtendsEnum.SimpleStar]: SimpleStar,
  [ExtendsEnum.FullScreenSwitch]: FullScreenSwitch,
  [ExtendsEnum.PageReload]: PageReload,
  [ExtendsEnum.SimpleBarrage]: SimpleBarrage,
  [ExtendsEnum.SimpleParticle]: SimpleParticle,
  [ExtendsEnum.FtDataContainer]: FtDataContainer,
  [ExtendsEnum.FtWeather]: FtWeather,
  [ExtendsEnum.FtMaskLayer]: FtMaskLayer,
  [ExtendsEnum.PhotoSphereViewer]: photoSphereViewer,
};
