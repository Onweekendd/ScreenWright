import {
  BarEchartEnum,
  type EchartComponentType,
  IndicatorEchartEnum,
  LineEchartEnum,
  OtherEchartEnum,
  PieEchartEnum,
  ScatterEchartEnum,
} from "@screenwright/types";
import type { Component } from "vue";

// ── Attrs ──
import echartfunnelAttrs from "./echartsAttrs/echartfunnelAttrs.vue";
import echartgaugeAttrs from "./echartsAttrs/echartgaugeAttrs.vue";
import echartloopRingPieAttrs from "./echartsAttrs/echartloopRingPieAttrs.vue";
import echartpieAttrs from "./echartsAttrs/echartpieAttrs.vue";
import echartpluralRosePieAttrs from "./echartsAttrs/echartpluralRosePieAttrs.vue";
import echartprogressAttrs from "./echartsAttrs/echartprogressAttrs.vue";
import echartringAttrs from "./echartsAttrs/echartringAttrs.vue";
import echartthreePieAttrs from "./echartsAttrs/echartthreePieAttrs.vue";
// ── Global ──
import echartareaLineGlobal from "./echartsGlobal/echartareaLineGlobal.vue";
import echartbarGlobal from "./echartsGlobal/echartbarGlobal.vue";
import echartbothWayStripBarGlobal from "./echartsGlobal/echartbothWayStripBarGlobal.vue";
import echartfunnelGlobal from "./echartsGlobal/echartfunnelGlobal.vue";
import echartgaugeGlobal from "./echartsGlobal/echartgaugeGlobal.vue";
import echartgraphGlobal from "./echartsGlobal/echartgraphGlobal.vue";
import echartlineAndBarGlobal from "./echartsGlobal/echartlineAndBarGlobal.vue";
import echartlineGlobal from "./echartsGlobal/echartlineGlobal.vue";
import echartliquidFillGlobal from "./echartsGlobal/echartliquidFillGlobal.vue";
import echartloopRingPieGlobal from "./echartsGlobal/echartloopRingPieGlobal.vue";
import echartpictorialbarGlobal from "./echartsGlobal/echartpictorialbarGlobal.vue";
import echartpieGlobal from "./echartsGlobal/echartpieGlobal.vue";
import echartpluralRosePieGlobal from "./echartsGlobal/echartpluralRosePieGlobal.vue";
import echartprogressGlobal from "./echartsGlobal/echartprogressGlobal.vue";
import echartradarGlobal from "./echartsGlobal/echartradarGlobal.vue";
import echartringGlobal from "./echartsGlobal/echartringGlobal.vue";
import echartsankeyGlobal from "./echartsGlobal/echartsankeyGlobal.vue";
import echartscatterGlobal from "./echartsGlobal/echartscatterGlobal.vue";
import echartstripBarGlobal from "./echartsGlobal/echartstripBarGlobal.vue";
import echartthreePieGlobal from "./echartsGlobal/echartthreePieGlobal.vue";
import echartthreeQuartersPieGlobal from "./echartsGlobal/echartthreeQuartersPieGlobal.vue";
import echarttreemapGlobal from "./echartsGlobal/echarttreemapGlobal.vue";
import echartwordcloudGlobal from "./echartsGlobal/echartwordcloudGlobal.vue";
// ── LoopAnimation ──
import echartloopRingPieLoopAnimation from "./echartsLoopAnimation/echartloopRingPieLoopAnimation.vue";
// ── Series ──
import echartareaLineSeries from "./echartsSeries/echartareaLineSeries.vue";
import echartbarSeries from "./echartsSeries/echartbarSeries.vue";
import echartbothWayStripBarSeries from "./echartsSeries/echartbothWayStripBarSeries.vue";
import echartfunnelSeries from "./echartsSeries/echartfunnelSeries.vue";
import echartgraphSeries from "./echartsSeries/echartgraphSeries.vue";
import echartlineAndBarSeries from "./echartsSeries/echartlineAndBarSeries.vue";
import echartlineSeries from "./echartsSeries/echartlineSeries.vue";
import echartloopRingPieSeries from "./echartsSeries/echartloopRingPieSeries.vue";
import echartpictorialbarSeries from "./echartsSeries/echartpictorialbarSeries.vue";
import echartpieSeries from "./echartsSeries/echartpieSeries.vue";
import echartpluralRosePieSeries from "./echartsSeries/echartpluralRosePieSeries.vue";
import echartprogressSeries from "./echartsSeries/echartprogressSeries.vue";
import echartradarSeries from "./echartsSeries/echartradarSeries.vue";
import echartringSeries from "./echartsSeries/echartringSeries.vue";
import echartsankeySeries from "./echartsSeries/echartsankeySeries.vue";
import echartscatterSeries from "./echartsSeries/echartscatterSeries.vue";
import echartstripBarSeries from "./echartsSeries/echartstripBarSeries.vue";
import echartthreePieSeries from "./echartsSeries/echartthreePieSeries.vue";
import echartthreeQuartersPieSeries from "./echartsSeries/echartthreeQuartersPieSeries.vue";
import echarttreemapSeries from "./echartsSeries/echarttreemapSeries.vue";
// ── Tooltip ──
import echartareaLineTooltip from "./echartsTooltip/echartareaLineTooltip.vue";
import echartbarTooltip from "./echartsTooltip/echartbarTooltip.vue";
import echartlineAndBarTooltip from "./echartsTooltip/echartlineAndBarTooltip.vue";
import echartlineTooltip from "./echartsTooltip/echartlineTooltip.vue";
import echartpictorialbarTooltip from "./echartsTooltip/echartpictorialbarTooltip.vue";
import echartscatterTooltip from "./echartsTooltip/echartscatterTooltip.vue";
import echartstripBarTooltip from "./echartsTooltip/echartstripBarTooltip.vue";
// ── Water ──
import echartliquidFillWater from "./echartsWater/echartliquidFillWater.vue";
// ── xAxis ──
import echartareaLinexAxis from "./echartsxAxis/echartareaLinexAxis.vue";
import echartbarxAxis from "./echartsxAxis/echartbarxAxis.vue";
import echartbothWayStripBarxAxis from "./echartsxAxis/echartbothWayStripBarxAxis.vue";
import echartgaugexAxis from "./echartsxAxis/echartgaugexAxis.vue";
import echartlineAndBarxAxis from "./echartsxAxis/echartlineAndBarxAxis.vue";
import echartlinexAxis from "./echartsxAxis/echartlinexAxis.vue";
import echartpictorialbarxAxis from "./echartsxAxis/echartpictorialbarxAxis.vue";
import echartradarxAxis from "./echartsxAxis/echartradarxAxis.vue";
import echartscatterxAxis from "./echartsxAxis/echartscatterxAxis.vue";
import echartstripBarxAxis from "./echartsxAxis/echartstripBarxAxis.vue";

export enum optionType {
  global = "Global",
  attrs = "Attrs",
  xAxis = "xAxis",
  series = "Series",
  tooltip = "Tooltip",
  loopAnimation = "LoopAnimation",
  water = "Water",
}

export type ConfigTab = {
  label: string;
  value: optionType;
  component: Component;
};

export const ScreenwrightEchartsConfigComponent: Record<
  EchartComponentType,
  ConfigTab[]
> = {
  // ── 柱状图 ──
  [BarEchartEnum.echartstripBar]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartstripBarGlobal,
    },
    {
      label: "坐标轴",
      value: optionType.xAxis,
      component: echartstripBarxAxis,
    },
    {
      label: "系列",
      value: optionType.series,
      component: echartstripBarSeries,
    },
    {
      label: "提示框",
      value: optionType.tooltip,
      component: echartstripBarTooltip,
    },
  ],
  [BarEchartEnum.echartbothWayStripBar]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartbothWayStripBarGlobal,
    },
    {
      label: "坐标轴",
      value: optionType.xAxis,
      component: echartbothWayStripBarxAxis,
    },
    {
      label: "系列",
      value: optionType.series,
      component: echartbothWayStripBarSeries,
    },
  ],
  [BarEchartEnum.echartlineAndBar]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartlineAndBarGlobal,
    },
    {
      label: "坐标轴",
      value: optionType.xAxis,
      component: echartlineAndBarxAxis,
    },
    {
      label: "系列",
      value: optionType.series,
      component: echartlineAndBarSeries,
    },
    {
      label: "提示框",
      value: optionType.tooltip,
      component: echartlineAndBarTooltip,
    },
  ],
  [BarEchartEnum.echartpictorialbar]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartpictorialbarGlobal,
    },
    {
      label: "坐标轴",
      value: optionType.xAxis,
      component: echartpictorialbarxAxis,
    },
    {
      label: "系列",
      value: optionType.series,
      component: echartpictorialbarSeries,
    },
    {
      label: "提示框",
      value: optionType.tooltip,
      component: echartpictorialbarTooltip,
    },
  ],
  [BarEchartEnum.echartbar]: [
    { label: "全局", value: optionType.global, component: echartbarGlobal },
    { label: "坐标轴", value: optionType.xAxis, component: echartbarxAxis },
    { label: "系列", value: optionType.series, component: echartbarSeries },
    { label: "提示框", value: optionType.tooltip, component: echartbarTooltip },
  ],

  // ── 饼图 ──
  [PieEchartEnum.echartpie]: [
    { label: "全局", value: optionType.global, component: echartpieGlobal },
    { label: "饼图属性", value: optionType.attrs, component: echartpieAttrs },
    { label: "系列", value: optionType.series, component: echartpieSeries },
  ],
  [PieEchartEnum.echartloopRingPie]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartloopRingPieGlobal,
    },
    {
      label: "饼图属性",
      value: optionType.attrs,
      component: echartloopRingPieAttrs,
    },
    {
      label: "系列",
      value: optionType.series,
      component: echartloopRingPieSeries,
    },
    {
      label: "轮播动画",
      value: optionType.loopAnimation,
      component: echartloopRingPieLoopAnimation,
    },
  ],
  [PieEchartEnum.echartpluralRosePie]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartpluralRosePieGlobal,
    },
    {
      label: "坐标轴",
      value: optionType.attrs,
      component: echartpluralRosePieAttrs,
    },
    {
      label: "系列",
      value: optionType.series,
      component: echartpluralRosePieSeries,
    },
  ],
  [PieEchartEnum.echartthreePie]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartthreePieGlobal,
    },
    {
      label: "饼图属性",
      value: optionType.attrs,
      component: echartthreePieAttrs,
    },
    {
      label: "系列",
      value: optionType.series,
      component: echartthreePieSeries,
    },
  ],

  // ── 折线图 ──
  [PieEchartEnum.echartthreeQuartersPie]: [
    { label: "全局", value: optionType.global, component: echartthreeQuartersPieGlobal },
    { label: "系列", value: optionType.series, component: echartthreeQuartersPieSeries },
  ],

  [LineEchartEnum.echartareaLine]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartareaLineGlobal,
    },
    {
      label: "坐标轴",
      value: optionType.xAxis,
      component: echartareaLinexAxis,
    },
    {
      label: "系列",
      value: optionType.series,
      component: echartareaLineSeries,
    },
    {
      label: "提示框",
      value: optionType.tooltip,
      component: echartareaLineTooltip,
    },
  ],
  [LineEchartEnum.echartline]: [
    { label: "全局", value: optionType.global, component: echartlineGlobal },
    { label: "坐标轴", value: optionType.xAxis, component: echartlinexAxis },
    { label: "系列", value: optionType.series, component: echartlineSeries },
    {
      label: "提示框",
      value: optionType.tooltip,
      component: echartlineTooltip,
    },
  ],

  // ── 散点图 ──
  [ScatterEchartEnum.echartscatter]: [
    { label: "全局", value: optionType.global, component: echartscatterGlobal },
    { label: "坐标轴", value: optionType.xAxis, component: echartscatterxAxis },
    { label: "系列", value: optionType.series, component: echartscatterSeries },
    {
      label: "提示框",
      value: optionType.tooltip,
      component: echartscatterTooltip,
    },
  ],

  // ── 其他图表 ──
  [OtherEchartEnum.echarttreemap]: [
    { label: "全局", value: optionType.global, component: echarttreemapGlobal },
    { label: "系列", value: optionType.series, component: echarttreemapSeries },
  ],
  [OtherEchartEnum.echartgraph]: [
    { label: "全局", value: optionType.global, component: echartgraphGlobal },
    { label: "系列", value: optionType.series, component: echartgraphSeries },
  ],
  [OtherEchartEnum.echartfunnel]: [
    { label: "全局", value: optionType.global, component: echartfunnelGlobal },
    { label: "属性", value: optionType.attrs, component: echartfunnelAttrs },
    { label: "系列", value: optionType.series, component: echartfunnelSeries },
  ],
  [OtherEchartEnum.echartradar]: [
    { label: "全局", value: optionType.global, component: echartradarGlobal },
    { label: "坐标轴", value: optionType.xAxis, component: echartradarxAxis },
    { label: "系列", value: optionType.series, component: echartradarSeries },
  ],
  [OtherEchartEnum.echartsankey]: [
    { label: "全局", value: optionType.global, component: echartsankeyGlobal },
    { label: "系列", value: optionType.series, component: echartsankeySeries },
  ],

  [IndicatorEchartEnum.echartring]: [
    { label: "全局", value: optionType.global, component: echartringGlobal },
    { label: "指标", value: optionType.attrs, component: echartringAttrs },
    { label: "刻度", value: optionType.series, component: echartringSeries },
  ],
  [IndicatorEchartEnum.echartprogress]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartprogressGlobal,
    },
    { label: "指标", value: optionType.attrs, component: echartprogressAttrs },
    {
      label: "刻度",
      value: optionType.series,
      component: echartprogressSeries,
    },
  ],
  [IndicatorEchartEnum.echartgauge]: [
    { label: "全局", value: optionType.global, component: echartgaugeGlobal },
    { label: "指标", value: optionType.attrs, component: echartgaugeAttrs },
    { label: "轴线", value: optionType.xAxis, component: echartgaugexAxis },
  ],
  [IndicatorEchartEnum.echartliquidFill]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartliquidFillGlobal,
    },
    {
      label: "水波",
      value: optionType.water,
      component: echartliquidFillWater,
    },
  ],
  [IndicatorEchartEnum.echartwordcloud]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartwordcloudGlobal,
    },
  ],
};
