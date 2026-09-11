import {
  BarEchartEnum,
  type EchartComponentType,
  IndicatorEchartEnum,
  LineEchartEnum,
  OtherEchartEnum,
  PieEchartEnum,
  ProjectEchartEnum,
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
import echartdoubleValueLineGlobal from "./echartsGlobal/echartdoubleValueLineGlobal.vue";
import echarteffectScatterGlobal from "./echartsGlobal/echarteffectScatterGlobal.vue";
import echartfunnelGlobal from "./echartsGlobal/echartfunnelGlobal.vue";
import echartgaugeGlobal from "./echartsGlobal/echartgaugeGlobal.vue";
import echartgraphGlobal from "./echartsGlobal/echartgraphGlobal.vue";
import echartgrowthRateBarGlobal from "./echartsGlobal/echartgrowthRateBarGlobal.vue";
import echartlineAndBarGlobal from "./echartsGlobal/echartlineAndBarGlobal.vue";
import echartlineGlobal from "./echartsGlobal/echartlineGlobal.vue";
import echartliquidFillGlobal from "./echartsGlobal/echartliquidFillGlobal.vue";
import echartloopRingPieGlobal from "./echartsGlobal/echartloopRingPieGlobal.vue";
import echartmultiplyRankBarGlobal from "./echartsGlobal/echartmultiplyRankBarGlobal.vue";
import echartoverlapBarGlobal from "./echartsGlobal/echartoverlapBarGlobal.vue";
import echartpictorialbarGlobal from "./echartsGlobal/echartpictorialbarGlobal.vue";
import echartpieGlobal from "./echartsGlobal/echartpieGlobal.vue";
import echartpluralRosePieGlobal from "./echartsGlobal/echartpluralRosePieGlobal.vue";
import echartprogressGlobal from "./echartsGlobal/echartprogressGlobal.vue";
import echartradarGlobal from "./echartsGlobal/echartradarGlobal.vue";
import echartrankBarGlobal from "./echartsGlobal/echartrankBarGlobal.vue";
import echartrankGlobal from "./echartsGlobal/echartrankGlobal.vue";
import echartringGlobal from "./echartsGlobal/echartringGlobal.vue";
import echartsankeyGlobal from "./echartsGlobal/echartsankeyGlobal.vue";
import echartscalePieGlobal from "./echartsGlobal/echartscalePieGlobal.vue";
import echartscatterGlobal from "./echartsGlobal/echartscatterGlobal.vue";
import echartstripBarGlobal from "./echartsGlobal/echartstripBarGlobal.vue";
import echartthinBarGlobal from "./echartsGlobal/echartthinBarGlobal.vue";
import echartthreedBarAndLineGlobal from "./echartsGlobal/echartthreedBarAndLineGlobal.vue";
import echartthreedBarGlobal from "./echartsGlobal/echartthreedBarGlobal.vue";
import echartthreePieGlobal from "./echartsGlobal/echartthreePieGlobal.vue";
import echartthreeQuartersPieGlobal from "./echartsGlobal/echartthreeQuartersPieGlobal.vue";
import echarttreemapGlobal from "./echartsGlobal/echarttreemapGlobal.vue";
import echartwordcloudGlobal from "./echartsGlobal/echartwordcloudGlobal.vue";
import echartzebra2Global from "./echartsGlobal/echartzebra2Global.vue";
import echartzebraBarAndLineGlobal from "./echartsGlobal/echartzebraBarAndLineGlobal.vue";
import echartzebraGlobal from "./echartsGlobal/echartzebraGlobal.vue";
// ── LoopAnimation ──
import echartloopRingPieLoopAnimation from "./echartsLoopAnimation/echartloopRingPieLoopAnimation.vue";
// ── Series ──
import echartareaLineSeries from "./echartsSeries/echartareaLineSeries.vue";
import echartbarSeries from "./echartsSeries/echartbarSeries.vue";
import echartbothWayStripBarSeries from "./echartsSeries/echartbothWayStripBarSeries.vue";
import echartdoubleValueLineSeries from "./echartsSeries/echartdoubleValueLineSeries.vue";
import echarteffectScatterSeries from "./echartsSeries/echarteffectScatterSeries.vue";
import echartfunnelSeries from "./echartsSeries/echartfunnelSeries.vue";
import echartgraphSeries from "./echartsSeries/echartgraphSeries.vue";
import echartgrowthRateBarSeries from "./echartsSeries/echartgrowthRateBarSeries.vue";
import echartlineAndBarSeries from "./echartsSeries/echartlineAndBarSeries.vue";
import echartlineSeries from "./echartsSeries/echartlineSeries.vue";
import echartloopRingPieSeries from "./echartsSeries/echartloopRingPieSeries.vue";
import echartmultiplyRankBarSeries from "./echartsSeries/echartmultiplyRankBarSeries.vue";
import echartoverlapBarSeries from "./echartsSeries/echartoverlapBarSeries.vue";
import echartpictorialbarSeries from "./echartsSeries/echartpictorialbarSeries.vue";
import echartpieSeries from "./echartsSeries/echartpieSeries.vue";
import echartpluralRosePieSeries from "./echartsSeries/echartpluralRosePieSeries.vue";
import echartprogressSeries from "./echartsSeries/echartprogressSeries.vue";
import echartradarSeries from "./echartsSeries/echartradarSeries.vue";
import echartrankSeries from "./echartsSeries/echartrankSeries.vue";
import echartringSeries from "./echartsSeries/echartringSeries.vue";
import echartsankeySeries from "./echartsSeries/echartsankeySeries.vue";
import echartscalePieSeries from "./echartsSeries/echartscalePieSeries.vue";
import echartscatterSeries from "./echartsSeries/echartscatterSeries.vue";
import echartstripBarSeries from "./echartsSeries/echartstripBarSeries.vue";
import echartthreePieSeries from "./echartsSeries/echartthreePieSeries.vue";
import echartthreeQuartersPieSeries from "./echartsSeries/echartthreeQuartersPieSeries.vue";
import echarttreemapSeries from "./echartsSeries/echarttreemapSeries.vue";
import echartzebra2Series from "./echartsSeries/echartzebra2Series.vue";
import echartzebraBarAndLineSeries from "./echartsSeries/echartzebraBarAndLineSeries.vue";
// ── Tooltip ──
import echartareaLineTooltip from "./echartsTooltip/echartareaLineTooltip.vue";
import echartbarTooltip from "./echartsTooltip/echartbarTooltip.vue";
import echartlineAndBarTooltip from "./echartsTooltip/echartlineAndBarTooltip.vue";
import echartlineTooltip from "./echartsTooltip/echartlineTooltip.vue";
import echartpictorialbarTooltip from "./echartsTooltip/echartpictorialbarTooltip.vue";
import echartscatterTooltip from "./echartsTooltip/echartscatterTooltip.vue";
import echartstripBarTooltip from "./echartsTooltip/echartstripBarTooltip.vue";
import echartthinBarTooltip from "./echartsTooltip/echartthinBarTooltip.vue";
import echartthreedBarAndLineTooltip from "./echartsTooltip/echartthreedBarAndLineTooltip.vue";
import echartthreedBarTooltip from "./echartsTooltip/echartthreedBarTooltip.vue";
import echartzebra2Tooltip from "./echartsTooltip/echartzebra2Tooltip.vue";
import echartzebraBarAndLineTooltip from "./echartsTooltip/echartzebraBarAndLineTooltip.vue";
import echartzebraTooltip from "./echartsTooltip/echartzebraTooltip.vue";
// ── Water ──
import echartliquidFillWater from "./echartsWater/echartliquidFillWater.vue";
// ── xAxis ──
import echartareaLinexAxis from "./echartsxAxis/echartareaLinexAxis.vue";
import echartbarxAxis from "./echartsxAxis/echartbarxAxis.vue";
import echartbothWayStripBarxAxis from "./echartsxAxis/echartbothWayStripBarxAxis.vue";
import echartdoubleValueLinexAxis from "./echartsxAxis/echartdoubleValueLinexAxis.vue";
import echartgaugexAxis from "./echartsxAxis/echartgaugexAxis.vue";
import echartgrowthRateBarxAxis from "./echartsxAxis/echartgrowthRateBarxAxis.vue";
import echartlineAndBarxAxis from "./echartsxAxis/echartlineAndBarxAxis.vue";
import echartlinexAxis from "./echartsxAxis/echartlinexAxis.vue";
import echartpictorialbarxAxis from "./echartsxAxis/echartpictorialbarxAxis.vue";
import echartradarxAxis from "./echartsxAxis/echartradarxAxis.vue";
import echartrankxAxis from "./echartsxAxis/echartrankxAxis.vue";
import echartscatterxAxis from "./echartsxAxis/echartscatterxAxis.vue";
import echartstripBarxAxis from "./echartsxAxis/echartstripBarxAxis.vue";
import echartthinBarxAxis from "./echartsxAxis/echartthinBarxAxis.vue";
import echartthreedBarAndLinexAxis from "./echartsxAxis/echartthreedBarAndLinexAxis.vue";
import echartthreedBarxAxis from "./echartsxAxis/echartthreedBarxAxis.vue";
import echartzebra2xAxis from "./echartsxAxis/echartzebra2xAxis.vue";
import echartzebraBarAndLinexAxis from "./echartsxAxis/echartzebraBarAndLinexAxis.vue";
import echartzebraxAxis from "./echartsxAxis/echartzebraxAxis.vue";

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
  [BarEchartEnum.echartrank]: [
    { label: "全局", value: optionType.global, component: echartrankGlobal },
    { label: "坐标轴", value: optionType.xAxis, component: echartrankxAxis },
    { label: "系列", value: optionType.series, component: echartrankSeries },
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

  // ── 项目图表 ──
  [ProjectEchartEnum.echartzebra2]: [
    { label: "全局", value: optionType.global, component: echartzebra2Global },
    { label: "坐标轴", value: optionType.xAxis, component: echartzebra2xAxis },
    { label: "系列", value: optionType.series, component: echartzebra2Series },
    {
      label: "提示框",
      value: optionType.tooltip,
      component: echartzebra2Tooltip,
    },
  ],
  [ProjectEchartEnum.echartdoubleValueLine]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartdoubleValueLineGlobal,
    },
    {
      label: "坐标轴",
      value: optionType.xAxis,
      component: echartdoubleValueLinexAxis,
    },
    {
      label: "系列",
      value: optionType.series,
      component: echartdoubleValueLineSeries,
    },
  ],
  [ProjectEchartEnum.echartgrowthRateBar]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartgrowthRateBarGlobal,
    },
    {
      label: "坐标轴",
      value: optionType.xAxis,
      component: echartgrowthRateBarxAxis,
    },
    {
      label: "系列",
      value: optionType.series,
      component: echartgrowthRateBarSeries,
    },
  ],
  [ProjectEchartEnum.echarteffectScatter]: [
    {
      label: "全局",
      value: optionType.global,
      component: echarteffectScatterGlobal,
    },
    {
      label: "系列",
      value: optionType.series,
      component: echarteffectScatterSeries,
    },
  ],
  [ProjectEchartEnum.echartoverlapBar]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartoverlapBarGlobal,
    },
    {
      label: "系列",
      value: optionType.series,
      component: echartoverlapBarSeries,
    },
  ],
  [ProjectEchartEnum.echartzebraBarAndLine]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartzebraBarAndLineGlobal,
    },
    {
      label: "坐标轴",
      value: optionType.xAxis,
      component: echartzebraBarAndLinexAxis,
    },
    {
      label: "系列",
      value: optionType.series,
      component: echartzebraBarAndLineSeries,
    },
    {
      label: "提示框",
      value: optionType.tooltip,
      component: echartzebraBarAndLineTooltip,
    },
  ],
  [ProjectEchartEnum.echartthreedBarAndLine]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartthreedBarAndLineGlobal,
    },
    {
      label: "坐标轴",
      value: optionType.xAxis,
      component: echartthreedBarAndLinexAxis,
    },
    {
      label: "提示框",
      value: optionType.tooltip,
      component: echartthreedBarAndLineTooltip,
    },
  ],
  [ProjectEchartEnum.echartzebra]: [
    { label: "全局", value: optionType.global, component: echartzebraGlobal },
    { label: "坐标轴", value: optionType.xAxis, component: echartzebraxAxis },
    {
      label: "提示框",
      value: optionType.tooltip,
      component: echartzebraTooltip,
    },
  ],
  [ProjectEchartEnum.echartthreedBar]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartthreedBarGlobal,
    },
    {
      label: "坐标轴",
      value: optionType.xAxis,
      component: echartthreedBarxAxis,
    },
    {
      label: "提示框",
      value: optionType.tooltip,
      component: echartthreedBarTooltip,
    },
  ],
  [ProjectEchartEnum.echartscalePie]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartscalePieGlobal,
    },
    {
      label: "系列",
      value: optionType.series,
      component: echartscalePieSeries,
    },
  ],
  [ProjectEchartEnum.echartmultiplyRankBar]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartmultiplyRankBarGlobal,
    },
    {
      label: "系列",
      value: optionType.series,
      component: echartmultiplyRankBarSeries,
    },
  ],
  [ProjectEchartEnum.echartrankBar]: [
    { label: "全局", value: optionType.global, component: echartrankBarGlobal },
  ],
  [ProjectEchartEnum.echartthreeQuartersPie]: [
    {
      label: "全局",
      value: optionType.global,
      component: echartthreeQuartersPieGlobal,
    },
    {
      label: "系列",
      value: optionType.series,
      component: echartthreeQuartersPieSeries,
    },
  ],
  [ProjectEchartEnum.echartthinBar]: [
    { label: "全局", value: optionType.global, component: echartthinBarGlobal },
    { label: "坐标轴", value: optionType.xAxis, component: echartthinBarxAxis },
    {
      label: "提示框",
      value: optionType.tooltip,
      component: echartthinBarTooltip,
    },
  ],

  // ── 指标图 ──
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
