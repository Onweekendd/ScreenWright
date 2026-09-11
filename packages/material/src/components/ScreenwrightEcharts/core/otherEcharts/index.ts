import { type barEchartClass, otherEchartType } from "../type";
import { EchartFunnel } from "./EchartFunnel";
import { EchartGraph } from "./EchartGraph";
import { EchartRadar } from "./EchartRadar";
import { EchartSankey } from "./EchartSankey";
import { EchartTreemap } from "./EchartTreemap";

type interFaceotherEchart =
  | typeof EchartGraph
  | typeof EchartTreemap
  | typeof EchartFunnel
  | typeof EchartRadar
  | typeof EchartSankey;

export const otherInstanceToType: barEchartClass<interFaceotherEchart, otherEchartType> = {
  [otherEchartType.echartgraph]: EchartGraph,
  [otherEchartType.echarttreemap]: EchartTreemap,
  [otherEchartType.echartfunnel]: EchartFunnel,
  [otherEchartType.echartradar]: EchartRadar,
  [otherEchartType.echartsankey]: EchartSankey
};
