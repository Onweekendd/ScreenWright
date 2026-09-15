import { IndicatorEnum } from "@screenwright/types";
import type { Component } from "vue";

import echartRing from "./components/echartring/index.vue";
import swDynamicRatio from "./components/swdynamicratio/index.vue";
import swFlopPerformance from "./components/SwFlopPerformance/index.vue";
import iconRatio from "./components/iconRatio/index.vue";
import rankProgress from "./components/rankProgress/index.vue";
import rasterProgressBar from "./components/rasterProgressBar/index.vue";
import sortRatioBar from "./components/sortRatioBar/index.vue";

export const ScreenwrightIndicatorMap: Record<IndicatorEnum, Component> = {
  [IndicatorEnum.RasterProgressBar]: rasterProgressBar,
  [IndicatorEnum.IconRatio]: iconRatio,
  [IndicatorEnum.SortRatioBar]: sortRatioBar,
  [IndicatorEnum.SwDynamicRatio]: swDynamicRatio,
  [IndicatorEnum.SwFlopPerformance]: swFlopPerformance,
  [IndicatorEnum.EchartRing]: echartRing,
  [IndicatorEnum.RankProgress]: rankProgress,
};
