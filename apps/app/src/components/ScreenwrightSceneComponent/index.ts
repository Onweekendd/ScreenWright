import type { Component } from "vue";

import { SceneEnum } from "@screenwright/types";

import echartcommonMap from "./component/echartcommonMap/index.vue";
import echartGlmap from "./component/echartGlmap/index.vue";

export const ScreenwrightSceneComponentMap: Partial<Record<SceneEnum, Component>> = {
  [SceneEnum.EchartcommonMap]: echartcommonMap,
  [SceneEnum.EchartGlmap]: echartGlmap
};
