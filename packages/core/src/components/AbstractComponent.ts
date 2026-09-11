import type { ComponentType, Filter } from "@screenwright/types";

/**
 * @description 组件基类需要实现的接口
 */
export interface ComponentInstanceType {
  init: (props: any) => void;
  getOptions: () => any;
  registerDataFilter?: (filter: Record<string, Filter>) => void;
  groupName?: string;
  type?: string;
  name?: string;
  img?: string;
  [key: string]: any;
}

/**
 * @description 组件名 -> 组件类
 */
export interface InstanceToTypeMap {
  [key: string]: new () => ComponentInstanceType;
}

/**
 * @class 抽象组件类
 * @template {T} 组件的配置项类型
 * @template {I} 组件名->类 数组
 *
 * 框架无关：泛型约束放宽为 `ComponentType<any>`，不再耦合具体的图表/面板枚举，
 * 由各消费方（图表、系统面板等）自行收窄。
 */
export abstract class AbstractComponent<
  T extends ComponentType<any> = ComponentType<any>,
  I extends InstanceToTypeMap = InstanceToTypeMap
> {
  protected baseChartProps: T | null = null;
  protected abstract type: string;
  protected componentInstanceMap: Map<number, InstanceType<I[keyof I]>> = new Map();
  protected abstract instanceToType: I;

  public getCurrentInstanceById(id: number): InstanceType<I[keyof I]> | undefined {
    return this.componentInstanceMap.get(id);
  }

  public getCurrentInstance(): InstanceType<I[keyof I]> | undefined {
    if (!this.baseChartProps) {
      return;
    }

    try {
      const instance = this.instanceToType[this.baseChartProps.component.prop];
      const id = this.baseChartProps.id;

      if (!this.componentInstanceMap.has(id)) {
        const componentInstance = new instance() as InstanceType<I[keyof I]>;
        this.componentInstanceMap.set(id, componentInstance);
        return componentInstance;
      } else {
        return this.getCurrentInstanceById(id);
      }
    } catch (e) {
      throw new Error(`${this.type}中${this.baseChartProps.component}组件不存在,需要注册组件,${e}`);
    }
  }

  public async init(props: { baseChartProps: T; filter?: Record<string, Filter> }) {
    this.baseChartProps = props.baseChartProps;
    const componentInstance = this.getCurrentInstance();
    if (!componentInstance) {
      return this;
    }
    if (this.baseChartProps) {
      if (props.filter && componentInstance.registerDataFilter) {
        // 注册全局过滤器
        componentInstance.registerDataFilter(props.filter);
      }

      await componentInstance.init(this.baseChartProps);
    }
    return this;
  }

  public getOptions() {
    const componentInstance = this.getCurrentInstance();
    if (!componentInstance) {
      return;
    }
    return componentInstance.getOptions();
  }

  public setOptions(baseChartProps: T) {
    this.baseChartProps = baseChartProps;
    return this;
  }

  protected getBaseInstanceToType(instanceType: Partial<I>) {
    const result = [];
    for (const key in instanceType) {
      const InstanceClass = instanceType[key as keyof I];
      if (InstanceClass) {
        const instance = new InstanceClass();
        result.push(instance);
      }
    }
    return result;
  }
}
