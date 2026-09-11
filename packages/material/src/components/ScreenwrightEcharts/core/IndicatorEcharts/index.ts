import type { barEchartClass } from "../type";
import { indicatorEchartType } from "../type";
import { EchartGauge } from "./EchartGauge";
import { EchartliquidFill } from "./EchartliquidFill";
import { Echartprogress } from "./Echartprogress";
import { EchartRing } from "./EchartRing";
import { Echartwordcloud } from "./Echartwordcloud";

type IndicatorEcharts =
  | typeof Echartprogress
  | typeof EchartRing
  | typeof EchartGauge
  | typeof EchartliquidFill
  | typeof Echartwordcloud;

export type { IndicatorEcharts };

export const indicatorInstanceToType: barEchartClass<IndicatorEcharts, indicatorEchartType> = {
  [indicatorEchartType.echartprogress]: Echartprogress,
  [indicatorEchartType.echartring]: EchartRing,
  [indicatorEchartType.echartgauge]: EchartGauge,
  [indicatorEchartType.echartliquidFill]: EchartliquidFill,
  [indicatorEchartType.echartwordcloud]: Echartwordcloud
};
