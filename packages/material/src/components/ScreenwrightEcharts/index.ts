import {
  BarEchartEnum,
  type EchartComponentType,
  indicatorEchartEnum,
  lineEchartEnum,
  otherEchartEnum,
  pieEchartEnum,
  projectEchartEnum,
  ringEchartEnum,
  scatterEchartEnum,
} from "@screenwright/types";
import type { Component } from "vue";

import ScreenwrightEcharts from "./index.vue";

export const ScreenwrightEchartsMap: Record<EchartComponentType, Component> = {
  // 柱状图
  [BarEchartEnum.echartstripBar]: ScreenwrightEcharts,
  [BarEchartEnum.echartbothWayStripBar]: ScreenwrightEcharts,
  [BarEchartEnum.echartlineAndBar]: ScreenwrightEcharts,
  [BarEchartEnum.echartpictorialbar]: ScreenwrightEcharts,
  [BarEchartEnum.echartrank]: ScreenwrightEcharts,
  [BarEchartEnum.echartbar]: ScreenwrightEcharts,
  // 饼图
  [pieEchartEnum.echartpie]: ScreenwrightEcharts,
  [pieEchartEnum.echartloopRingPie]: ScreenwrightEcharts,
  [pieEchartEnum.echartpluralRosePie]: ScreenwrightEcharts,
  [pieEchartEnum.echartthreePie]: ScreenwrightEcharts,
  // 散点图
  [scatterEchartEnum.echartscatter]: ScreenwrightEcharts,
  // 项目图表
  [projectEchartEnum.echartzebra2]: ScreenwrightEcharts,
  [projectEchartEnum.echartdoubleValueLine]: ScreenwrightEcharts,
  [projectEchartEnum.echartgrowthRateBar]: ScreenwrightEcharts,
  [projectEchartEnum.echarteffectScatter]: ScreenwrightEcharts,
  [projectEchartEnum.echartoverlapBar]: ScreenwrightEcharts,
  [projectEchartEnum.echartzebraBarAndLine]: ScreenwrightEcharts,
  [projectEchartEnum.echartthreedBarAndLine]: ScreenwrightEcharts,
  [projectEchartEnum.echartzebra]: ScreenwrightEcharts,
  [projectEchartEnum.echartthreedBar]: ScreenwrightEcharts,
  [projectEchartEnum.echartscalePie]: ScreenwrightEcharts,
  [projectEchartEnum.echartmultiplyRankBar]: ScreenwrightEcharts,
  [projectEchartEnum.echartrankBar]: ScreenwrightEcharts,
  [projectEchartEnum.echartthreeQuartersPie]: ScreenwrightEcharts,
  [projectEchartEnum.echartthinBar]: ScreenwrightEcharts,
  // 折线图
  [lineEchartEnum.echartareaLine]: ScreenwrightEcharts,
  [lineEchartEnum.echartline]: ScreenwrightEcharts,
  // 其他图表
  [otherEchartEnum.echarttreemap]: ScreenwrightEcharts,
  [otherEchartEnum.echartgraph]: ScreenwrightEcharts,
  [otherEchartEnum.echartfunnel]: ScreenwrightEcharts,
  [otherEchartEnum.echartradar]: ScreenwrightEcharts,
  [otherEchartEnum.echartsankey]: ScreenwrightEcharts,
  // 环形图
  [ringEchartEnum.echartring]: ScreenwrightEcharts,
  // 指标图
  [indicatorEchartEnum.echartprogress]: ScreenwrightEcharts,
  [indicatorEchartEnum.echartgauge]: ScreenwrightEcharts,
  [indicatorEchartEnum.echartliquidFill]: ScreenwrightEcharts,
  [indicatorEchartEnum.echartwordcloud]: ScreenwrightEcharts,
};
