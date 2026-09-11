import type { ComponentType, PanelEnum } from "@screenwright/types";

import { AbstractComponent } from "../AbstractComponent";
import { panelInstanceToType } from "./panel";

export const systemInstanceToType = {
  ...panelInstanceToType
};

export class SystemComponent extends AbstractComponent<ComponentType<PanelEnum>, typeof systemInstanceToType> {
  private static instance: SystemComponent | null = null;
  protected type = "SystemComponent";
  protected instanceToType = systemInstanceToType;
  baseChartProps: ComponentType<PanelEnum> | null;
  componentInstanceMap: Map<number, InstanceType<(typeof systemInstanceToType)[keyof typeof systemInstanceToType]>> =
    new Map();

  constructor() {
    super();
    this.baseChartProps = null;
    if (SystemComponent.instance) {
      return SystemComponent.instance;
    }
    SystemComponent.instance = this;
  }
}
