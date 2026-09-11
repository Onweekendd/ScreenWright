import { AbstractComponent } from "../AbstractComponent";
import { barInstanceToType } from "./barEcarts/index";
import { indicatorInstanceToType } from "./IndicatorEcharts";
import { lineInstanceToType } from "./lineEcharts/index";
import { otherInstanceToType } from "./otherEcharts/index";
import { pieInstanceToType } from "./pieEcharts/index";
import { projectInstanceToType } from "./projectEcharts/index";
import { scatterInstanceToType } from "./scattercharts/index";
import type { BaseChartProps } from "./type";

export const echartInstanceToType = {
  ...barInstanceToType,
  ...pieInstanceToType,
  ...lineInstanceToType,
  ...scatterInstanceToType,
  ...otherInstanceToType,
  ...projectInstanceToType,
  ...indicatorInstanceToType
};

export const getBaseEchartInstanceToType = (instanceType: Partial<typeof echartInstanceToType>) => {
  const result = [];
  for (const key in instanceType) {
    const InstanceClass = instanceType[key as keyof typeof echartInstanceToType];
    if (InstanceClass) {
      const instance = new InstanceClass();
      result.push(instance);
    }
  }
  return result;
};

class BaseComponent extends AbstractComponent<BaseChartProps, typeof echartInstanceToType> {
  type = "BaseChart";
  instanceToType = echartInstanceToType;
  constructor() {
    super();
    this.baseChartProps = null;
    // if (BaseComponent.instance) {
    //   return BaseComponent.instance
    // }
    // BaseComponent.instance = this
  }
}

export { BaseComponent };
