import { type barEchartClass, scatterEchartType } from "../type";
import { Echartscatter } from "./Echartscatter";

type interFaceBar = typeof Echartscatter;

export const scatterInstanceToType: barEchartClass<interFaceBar, scatterEchartType> = {
  [scatterEchartType.echartscatter]: Echartscatter
};
