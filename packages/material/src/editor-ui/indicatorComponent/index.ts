import { IndicatorEnum } from "@screenwright/types";
import type { Component } from "vue";

import swFlopPerformanceFlip from "./indicatorFlip/swFlopPerformanceFlip.vue";
import echartringGlobal from "./indicatorGlobal/echartringGlobal.vue";
import iconRatioGlobal from "./indicatorGlobal/iconRatioGlobal.vue";
import rankProgressGlobal from "./indicatorGlobal/rank-progressGlobal.vue";
import rasterProgressBarGlobal from "./indicatorGlobal/rasterProgressBarGlobal.vue";
import sortRatioBarGlobal from "./indicatorGlobal/sortRatioBarGlobal.vue";
import swdynamicratioGlobal from "./indicatorGlobal/swdynamicratioGlobal.vue";
import swFlopPerformanceGlobal from "./indicatorGlobal/swFlopPerformanceGlobal.vue";
import rasterProgressBarGrid from "./indicatorGrid/rasterProgressBarGrid.vue";
import rasterProgressBarIndicator from "./indicatorIndicator/rasterProgressBarIndicator.vue";
import rasterProgressBarInterval from "./indicatorInterval/rasterProgressBarInterval.vue";
import rankProgressProgress from "./indicatorProgress/rank-progressProgress.vue";
import iconRatioSeries from "./indicatorSeries/iconRatioSeries.vue";
import rankProgressSeries from "./indicatorSeries/rank-progressSeries.vue";
import sortRatioBarSeries from "./indicatorSeries/sortRatioBarSeries.vue";
import swdynamicratioStyle from "./indicatorStyle/swdynamicratioStyle.vue";
import sortRatioBarText from "./indicatorText/sortRatioBarText.vue";

export enum optionType {
  global = "Global",
  style = "Style",
  flip = "Flip",
  grid = "Grid",
  indicator = "Indicator",
  interval = "Interval",
  text = "Text",
  series = "Series",
  progress = "Progress",
}

export interface ConfigTab {
  label: string;
  value: optionType;
  component: Component;
}

export const IndicatorConfigComponent: Record<IndicatorEnum, ConfigTab[]> = {
  [IndicatorEnum.EchartRing]: [
    { label: "全局", value: optionType.global, component: echartringGlobal },
  ],
  [IndicatorEnum.RasterProgressBar]: [
    {
      label: "全局",
      value: optionType.global,
      component: rasterProgressBarGlobal,
    },
    { label: "栅格", value: optionType.grid, component: rasterProgressBarGrid },
    {
      label: "指标",
      value: optionType.indicator,
      component: rasterProgressBarIndicator,
    },
    {
      label: "区间",
      value: optionType.interval,
      component: rasterProgressBarInterval,
    },
  ],
  [IndicatorEnum.SortRatioBar]: [
    { label: "全局", value: optionType.global, component: sortRatioBarGlobal },
    { label: "文字", value: optionType.text, component: sortRatioBarText },
    { label: "系列", value: optionType.series, component: sortRatioBarSeries },
  ],
  [IndicatorEnum.IconRatio]: [
    { label: "全局", value: optionType.global, component: iconRatioGlobal },
    { label: "图标", value: optionType.series, component: iconRatioSeries },
  ],
  [IndicatorEnum.SwDynamicRatio]: [
    {
      label: "全局",
      value: optionType.global,
      component: swdynamicratioGlobal,
    },
    { label: "样式", value: optionType.style, component: swdynamicratioStyle },
  ],
  [IndicatorEnum.SwFlopPerformance]: [
    {
      label: "全局",
      value: optionType.global,
      component: swFlopPerformanceGlobal,
    },
    {
      label: "翻牌器",
      value: optionType.flip,
      component: swFlopPerformanceFlip,
    },
  ],
  [IndicatorEnum.RankProgress]: [
    { label: "全局", value: optionType.global, component: rankProgressGlobal },
    {
      label: "进度条",
      value: optionType.progress,
      component: rankProgressProgress,
    },
    { label: "系列", value: optionType.series, component: rankProgressSeries },
  ],
};
