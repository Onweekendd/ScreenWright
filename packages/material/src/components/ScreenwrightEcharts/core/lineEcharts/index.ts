import { type barEchartClass, lineEchartsType } from "../type";
import { EchartareaLine } from "./EchartareaLine";
import { Echartline } from "./Echartline";

type interFaceBar = typeof EchartareaLine | typeof Echartline;

export const lineInstanceToType: barEchartClass<interFaceBar, lineEchartsType> = {
  [lineEchartsType.echartareaLine]: EchartareaLine,
  [lineEchartsType.echartline]: Echartline
};
