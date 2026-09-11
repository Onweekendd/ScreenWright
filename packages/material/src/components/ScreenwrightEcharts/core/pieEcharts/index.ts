import { type barEchartClass, pieEchartType } from "../type";
import { EchartloopRingPie } from "./EchartloopRingPie";
import { Echartpie } from "./Echartpie";
import { EchartpluralRosePie } from "./EchartpluralRosePie";
import { EchartthreePie } from "./EchartthreePie";

type interFaceBar = typeof Echartpie | typeof EchartloopRingPie | typeof EchartpluralRosePie | typeof EchartthreePie;

export const pieInstanceToType: barEchartClass<interFaceBar, pieEchartType> = {
  [pieEchartType.echartpie]: Echartpie,
  [pieEchartType.echartloopRingPie]: EchartloopRingPie,
  [pieEchartType.echartpluralRosePie]: EchartpluralRosePie,
  [pieEchartType.echartthreePie]: EchartthreePie
};
