import type { Component } from "vue";

import { IndicatorEnum } from "@screenwright/types";

import echartringGlobal from "./indicatorGlobal/echartringGlobal.vue";
import ftCountupV2Global from "./indicatorGlobal/ft-countup-v2Global.vue";
import ftdynamicratioGlobal from "./indicatorGlobal/ftdynamicratioGlobal.vue";
import ftFlopPerformanceGlobal from "./indicatorGlobal/ftFlopPerformanceGlobal.vue";
import ftFlopGlobal from "./indicatorGlobal/ftflopGlobal.vue";
import ftPeriodictableGlobal from "./indicatorGlobal/ftPeriodictableGlobal.vue";
import iconRatioGlobal from "./indicatorGlobal/iconRatioGlobal.vue";
import rankProgressGlobal from "./indicatorGlobal/rank-progressGlobal.vue";
import rasterProgressBarGlobal from "./indicatorGlobal/rasterProgressBarGlobal.vue";
import sortRatioBarGlobal from "./indicatorGlobal/sortRatioBarGlobal.vue";

import ftCountupV2Flip from "./indicatorFlip/ft-countup-v2Flip.vue";
import ftFlopPerformanceFlip from "./indicatorFlip/ftFlopPerformanceFlip.vue";
import ftFlopFlip from "./indicatorFlip/ftflopFlip.vue";

import rasterProgressBarGrid from "./indicatorGrid/rasterProgressBarGrid.vue";
import rasterProgressBarIndicator from "./indicatorIndicator/rasterProgressBarIndicator.vue";
import rasterProgressBarInterval from "./indicatorInterval/rasterProgressBarInterval.vue";
import rankProgressProgress from "./indicatorProgress/rank-progressProgress.vue";
import iconRatioSeries from "./indicatorSeries/iconRatioSeries.vue";
import rankProgressSeries from "./indicatorSeries/rank-progressSeries.vue";
import sortRatioBarSeries from "./indicatorSeries/sortRatioBarSeries.vue";
import ftdynamicratioStyle from "./indicatorStyle/ftdynamicratioStyle.vue";
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
  progress = "Progress"
}

export type ConfigTab = {
  label: string;
  value: optionType;
  component: Component;
};

export const IndicatorConfigComponent: Record<IndicatorEnum, ConfigTab[]> = {
  [IndicatorEnum.FtPeriodictable]: [{ label: "全局", value: optionType.global, component: ftPeriodictableGlobal }],
  [IndicatorEnum.EchartRing]: [{ label: "全局", value: optionType.global, component: echartringGlobal }],
  [IndicatorEnum.FtCountupV2]: [
    { label: "全局", value: optionType.global, component: ftCountupV2Global },
    { label: "翻牌器", value: optionType.flip, component: ftCountupV2Flip }
  ],
  [IndicatorEnum.RasterProgressBar]: [
    { label: "全局", value: optionType.global, component: rasterProgressBarGlobal },
    { label: "栅格", value: optionType.grid, component: rasterProgressBarGrid },
    { label: "指标", value: optionType.indicator, component: rasterProgressBarIndicator },
    { label: "区间", value: optionType.interval, component: rasterProgressBarInterval }
  ],
  [IndicatorEnum.SortRatioBar]: [
    { label: "全局", value: optionType.global, component: sortRatioBarGlobal },
    { label: "文字", value: optionType.text, component: sortRatioBarText },
    { label: "系列", value: optionType.series, component: sortRatioBarSeries }
  ],
  [IndicatorEnum.IconRatio]: [
    { label: "全局", value: optionType.global, component: iconRatioGlobal },
    { label: "图标", value: optionType.series, component: iconRatioSeries }
  ],
  [IndicatorEnum.FtDynamicRatio]: [
    { label: "全局", value: optionType.global, component: ftdynamicratioGlobal },
    { label: "样式", value: optionType.style, component: ftdynamicratioStyle }
  ],
  [IndicatorEnum.FtFlop]: [
    { label: "全局", value: optionType.global, component: ftFlopGlobal },
    { label: "翻牌器", value: optionType.flip, component: ftFlopFlip }
  ],
  [IndicatorEnum.FtFlopPerformance]: [
    { label: "全局", value: optionType.global, component: ftFlopPerformanceGlobal },
    { label: "翻牌器", value: optionType.flip, component: ftFlopPerformanceFlip }
  ],
  [IndicatorEnum.RankProgress]: [
    { label: "全局", value: optionType.global, component: rankProgressGlobal },
    { label: "进度条", value: optionType.progress, component: rankProgressProgress },
    { label: "系列", value: optionType.series, component: rankProgressSeries }
  ]
};
