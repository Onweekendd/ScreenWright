import type { ComponentType as BaseComponentType } from "../../../type";
import type { ComponentInstanceType } from "../../AbstractComponent";
import type { ComponentType } from "../type";

/**
 * @class 系统组件基类
 * @description 系统组件基类，所有系统组件都继承自该类
 * @template {T} T 组件的配置项类型
 */
abstract class SystemBase<T = Record<string, any>> implements ComponentInstanceType {
  baseChartProps: BaseComponentType<ComponentType> | null;
  id: number;
  name: string;
  type: string;
  prop: ComponentType;
  img: string;
  groupName: string;
  // 渲染 Echarts 的 option
  options: any = {};
  screenScale: number;
  constructor(baseChartProps: BaseComponentType<ComponentType> & { groupName: string; type: string }) {
    this.baseChartProps = baseChartProps;
    this.id = baseChartProps.id;
    this.name = baseChartProps.name;
    this.type = "SystemBase";
    this.prop = baseChartProps.component.prop;
    this.img = baseChartProps.img;
    this.groupName = baseChartProps.groupName;
    this.screenScale = 0.6;
  }

  updateBaseProps(baseChartProps: BaseComponentType<ComponentType>) {
    this.baseChartProps = baseChartProps;
    this.id = baseChartProps.id;
    this.name = baseChartProps.name;
    this.prop = baseChartProps.component.prop;
    this.img = baseChartProps.img;
  }

  abstract init(baseProps: BaseComponentType<ComponentType>): void;
  abstract getOptions(): T;
}

export { SystemBase };
