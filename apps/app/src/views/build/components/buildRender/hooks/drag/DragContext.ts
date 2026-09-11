import type { MenuItemForRender } from "../../../buildTabs/selectAssets/assetsMenuType";

/**
 * 拖拽上下文接口
 * 用于在责任链中传递拖拽相关的数据和状态
 */
export interface DragContext {
  dropData: any;
  position: { left: number; top: number };
  isPanel: boolean;
  isDynamicPanel: () => boolean;
  isEncodePanel: () => boolean;
  addComponentList: (item: MenuItemForRender, attrs?: any) => Promise<any>;
  addComponentToPanel: (item: MenuItemForRender, attrs?: any) => Promise<any>;
  addComponentToEncodePanel: (item: MenuItemForRender, attrs?: any) => Promise<any>;
}
