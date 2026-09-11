import { PanelEnum } from "@screenwright/types";

/**
 * 需要递归展开 panelData 的系统面板类型（动态面板/编码面板/特殊面板/引用面板）。
 * 对应原 app 的 buildRender/core/SystemComponent/type.ts -> renderSystemComponentType。
 */
export const renderSystemComponentType: PanelEnum[] = [
  PanelEnum.dynamicPanel,
  PanelEnum.encodePanel,
  PanelEnum.quotePanel
];

/** 只在大屏中渲染的面板。 */
export const largePanel: PanelEnum[] = [PanelEnum.dynamicPanel];
