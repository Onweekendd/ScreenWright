import { type barEchartClass, pieEchartType } from "../type";
import { EchartloopRingPie } from "./EchartloopRingPie";
import { Echartpie } from "./Echartpie";
import { EchartpluralRosePie } from "./EchartpluralRosePie";
import { EchartthreePie } from "./EchartthreePie";
import { EchartthreeQuartersPie } from "./EchartthreeQuartersPie";

type interFaceBar = typeof Echartpie | typeof EchartloopRingPie | typeof EchartpluralRosePie | typeof EchartthreePie | typeof EchartthreeQuartersPie;

export const pieInstanceToType: barEchartClass<interFaceBar, pieEchartType> = {
  [pieEchartType.echartpie]: Echartpie,
  [pieEchartType.echartloopRingPie]: EchartloopRingPie,
  [pieEchartType.echartpluralRosePie]: EchartpluralRosePie,
  [pieEchartType.echartthreePie]: EchartthreePie,
  [pieEchartType.echartthreeQuartersPie]: EchartthreeQuartersPie
};
