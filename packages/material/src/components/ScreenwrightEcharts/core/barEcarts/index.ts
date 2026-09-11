import { type barEchartClass, BarEchartType } from "../type";
import { Echartbar } from "./Echartbar";
import { EchartbothWayStripBar } from "./EchartbothWayStripBar";
import { EchartlineAndBar } from "./EchartlineAndBar";
import { EchartpictorialBar } from "./EchartpictorialBar";
import { Echartrank } from "./Echartrank";
import { EchartstripBar } from "./EchartstripBar";

type interFaceBar =
  | typeof EchartstripBar
  | typeof EchartbothWayStripBar
  | typeof EchartpictorialBar
  | typeof Echartbar
  | typeof Echartrank
  | typeof EchartlineAndBar;

export const barInstanceToType: barEchartClass<interFaceBar, BarEchartType> = {
  [BarEchartType.echartstripBar]: EchartstripBar,
  [BarEchartType.echartbothWayStripBar]: EchartbothWayStripBar,
  [BarEchartType.echartlineAndBar]: EchartlineAndBar,
  [BarEchartType.echartpictorialbar]: EchartpictorialBar,
  [BarEchartType.echartrank]: Echartrank,
  [BarEchartType.echartbar]: Echartbar,
};
