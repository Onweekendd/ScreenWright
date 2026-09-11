import {
  BarChart,
  CustomChart,
  EffectScatterChart,
  FunnelChart,
  GaugeChart,
  GraphChart,
  HeatmapChart,
  LineChart,
  LinesChart,
  MapChart,
  PictorialBarChart,
  PieChart,
  RadarChart,
  SankeyChart,
  ScatterChart,
  TreemapChart,
} from "echarts/charts";
import {
  AriaComponent,
  CalendarComponent,
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  ParallelComponent,
  PolarComponent,
  RadarComponent,
  TimelineComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";

import "echarts-liquidfill";
import "echarts-wordcloud";

// 需要注册进 echarts 的图表 / 组件 / 渲染器。
// 导出这个数组：下游具名引用后，rollup 无法把这些 import 当死代码摇掉。
export const echartsExtensions = [
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  PolarComponent,
  AriaComponent,
  ParallelComponent,
  BarChart,
  LineChart,
  PieChart,
  MapChart,
  RadarChart,
  GraphChart,
  TreemapChart,
  FunnelChart,
  SankeyChart,
  CustomChart,
  EffectScatterChart,
  GaugeChart,
  ScatterChart,
  CanvasRenderer,
  PictorialBarChart,
  RadarComponent,
  ToolboxComponent,
  DataZoomComponent,
  VisualMapComponent,
  TimelineComponent,
  CalendarComponent,
  GraphicComponent,
  MarkLineComponent,
  MarkAreaComponent,
  LinesChart,
  HeatmapChart,
];

// echarts.use() 是本模块的唯一目的，但它返回 undefined、且 echarts/core 不在 echarts
// 的 package.json#sideEffects 白名单里 —— rollup/esbuild 会把这句"纯表达式语句"摇掉，
// 导致所有图表类型没注册、setOption 静默失败、canvas 画不出来。
// 把调用结果塞进导出的对象（下游 index.vue 会读它），让打包器无法判定为可删调用。
export const echartsRegistered = {
  ok: echarts.use(echartsExtensions) === undefined,
  count: echartsExtensions.length,
};

export default echarts;
