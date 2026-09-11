import { type barEchartClass, projectEchartType } from "../type";
import { EchartdoubleValueLine } from "./EchartdoubleValueLine";
import { EcharteffectScatter } from "./EcharteffectScatter";
import { EchartgrowthRateBar } from "./EchartgrowthRateBar";
import { EchartmultiplyRankBar } from "./EchartmultiplyRankBar";
import { EchartoverlapBar } from "./EchartoverlapBar";
import { EchartrankBar } from "./EchartrankBar";
import { EchartscalePie } from "./EchartscalePie";
import { EchartthinBar } from "./EchartthinBar";
import { EchartthreedBar } from "./EchartthreedBar";
import { EchartthreedBarAndLine } from "./EchartthreedBarAndLine";
import { EchartthreeQuartersPie } from "./EchartthreeQuartersPie";
import { Echartzebra } from "./Echartzebra";
import { Echartzebra2 } from "./Echartzebra2";
import { EchartzebraBarAndLine } from "./EchartzebraBarAndLine";

type interFaceBar =
  | typeof EchartdoubleValueLine
  | typeof Echartzebra
  | typeof Echartzebra2
  | typeof EchartgrowthRateBar
  | typeof EcharteffectScatter
  | typeof EchartoverlapBar
  | typeof EchartzebraBarAndLine
  | typeof EchartthreedBarAndLine
  | typeof EchartthreedBar
  | typeof EchartscalePie
  | typeof EchartmultiplyRankBar
  | typeof EchartrankBar
  | typeof EchartthreeQuartersPie
  | typeof EchartthinBar;

export const projectInstanceToType: barEchartClass<interFaceBar, projectEchartType> = {
  [projectEchartType.echartzebra]: Echartzebra,
  [projectEchartType.echartzebra2]: Echartzebra2,
  [projectEchartType.echartdoubleValueLine]: EchartdoubleValueLine,
  [projectEchartType.echartgrowthRateBar]: EchartgrowthRateBar,
  [projectEchartType.echarteffectScatter]: EcharteffectScatter,
  [projectEchartType.echartoverlapBar]: EchartoverlapBar,
  [projectEchartType.echartzebraBarAndLine]: EchartzebraBarAndLine,
  [projectEchartType.echartthreedBarAndLine]: EchartthreedBarAndLine,
  [projectEchartType.echartthreedBar]: EchartthreedBar,
  [projectEchartType.echartscalePie]: EchartscalePie,
  [projectEchartType.echartmultiplyRankBar]: EchartmultiplyRankBar,
  [projectEchartType.echartrankBar]: EchartrankBar,
  [projectEchartType.echartthreeQuartersPie]: EchartthreeQuartersPie,
  [projectEchartType.echartthinBar]: EchartthinBar
};
