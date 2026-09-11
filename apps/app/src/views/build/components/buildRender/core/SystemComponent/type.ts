import type { PanelState, SystemComponentProps } from "@screenwright/types";
import { PanelEnum } from "@screenwright/types";

// 从 @screenwright/types 重新导出 PanelEnum，保持本地命名
export { PanelEnum as PanelType };

/**
 * 只在大屏中渲染的面板
 */
export const largePanel = [PanelEnum.dynamicPanel];

export type barEchartClass<T, U extends string | number | symbol> = {
  [key in U]: T;
};

export type ComponentType = PanelEnum;

export const renderSystemComponentType: ComponentType[] = [
  PanelEnum.dynamicPanel,
  PanelEnum.encodePanel,
  PanelEnum.quotePanel
];

export type { PanelState, SystemComponentProps };
