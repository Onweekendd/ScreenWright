import type {
  ComponentType,
  TempPool as TempPoolType,
} from "@screenwright/types";
import {
  AllEchartEnum,
  BarEchartEnum,
  IndicatorEchartEnum,
  LineEchartEnum,
  OtherEchartEnum,
  PieEchartEnum,
  ProjectEchartEnum,
  RingEchartEnum,
  ScatterEchartEnum,
} from "@screenwright/types";

// 从 @screenwright/types 重新导出 Echart 枚举，保持本地命名
export { BarEchartEnum as BarEchartType };
export { PieEchartEnum as pieEchartType };
export { ScatterEchartEnum as scatterEchartType };
export { ProjectEchartEnum as projectEchartType };
export { LineEchartEnum as lineEchartsType };
export { OtherEchartEnum as otherEchartType };
export { RingEchartEnum as ringEchartType };
export { IndicatorEchartEnum as indicatorEchartType };
export { AllEchartEnum as AllEchartType };

// 统一的图表类型联合（保持原有定义）
export type componentType =
  | BarEchartEnum
  | PieEchartEnum
  | LineEchartEnum
  | ScatterEchartEnum
  | OtherEchartEnum
  | ProjectEchartEnum
  | RingEchartEnum
  | IndicatorEchartEnum;

// 渲染组件类型列表（使用 @screenwright/types 中的枚举值）
export const renderEchartComponentType: componentType[] = [
  BarEchartEnum.echartbothWayStripBar,
  BarEchartEnum.echartstripBar,
  BarEchartEnum.echartlineAndBar,
  BarEchartEnum.echartpictorialbar,
  BarEchartEnum.echartrank,
  BarEchartEnum.echartbar,
  PieEchartEnum.echartpie,
  PieEchartEnum.echartloopRingPie,
  PieEchartEnum.echartpluralRosePie,
  PieEchartEnum.echartthreePie,
  LineEchartEnum.echartareaLine,
  LineEchartEnum.echartline,
  ScatterEchartEnum.echartscatter,
  OtherEchartEnum.echartgraph,
  OtherEchartEnum.echarttreemap,
  OtherEchartEnum.echartfunnel,
  OtherEchartEnum.echartradar,
  OtherEchartEnum.echartsankey,
  ProjectEchartEnum.echartzebra2,
  ProjectEchartEnum.echartdoubleValueLine,
  ProjectEchartEnum.echartgrowthRateBar,
  ProjectEchartEnum.echarteffectScatter,
  ProjectEchartEnum.echartoverlapBar,
  ProjectEchartEnum.echartzebraBarAndLine,
  ProjectEchartEnum.echartthreedBarAndLine,
  ProjectEchartEnum.echartzebra,
  ProjectEchartEnum.echartthreedBar,
  ProjectEchartEnum.echartscalePie,
  ProjectEchartEnum.echartmultiplyRankBar,
  ProjectEchartEnum.echartrankBar,
  ProjectEchartEnum.echartthreeQuartersPie,
  ProjectEchartEnum.echartthinBar,
  IndicatorEchartEnum.echartprogress,
  IndicatorEchartEnum.echartgauge,
  IndicatorEchartEnum.echartliquidFill,
  IndicatorEchartEnum.echartwordcloud,
];

export type barEchartClass<T, U extends string | number | symbol> = {
  [key in U]: T;
};

export type BaseChartProps = ComponentType<componentType>;

export interface ArrayDataItem {
  name: string;
  value: number;
  seriesName?: string;
}

// 使用 @screenwright/types 中的 Filter 类型，但保持本地名称
export type { Filter } from "@screenwright/types";

// 临时池类型（使用 @screenwright/types 中的定义）
export type TempPool = TempPoolType;
