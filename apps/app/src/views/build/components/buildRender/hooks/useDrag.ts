import { useEncodePanelAction } from "@/views/build/components/encodeEditor/useEncodePanelAction";
import { usePanelAction } from "@/views/build/components/panelEditor/usePanelAction";
import type { NavListType } from "@/views/build/useNavAction";
import { useTabsMenuGroup } from "@/views/build/useTabsMenuGroup";

import type { MenuItemForRender } from "../../buildTabs/selectAssets/assetsMenuType";
import { DragKeyEnum, EditCanvasTypeEnum } from "../type";
import type { DragContext } from "./drag";
import { DragStrategyContext } from "./drag";
import { useEditStore } from "./useEditStore";

export const useDrag = (option: { isDynamicPanel: boolean } = { isDynamicPanel: false }) => {
  const { addComponentByNavType } = useTabsMenuGroup();
  const { isDynamicPanel: isPanel } = option;
  const { setEditCanvas, isEncodePanel, isDynamicPanel } = useEditStore();
  const { componentAddToPanelEntry: addComponentToEncodePanel } = useEncodePanelAction();
  const { componentAddToPanelEntry: addComponentToPanel } = usePanelAction();

  // 初始化拖拽策略上下文
  const dragStrategyContext = new DragStrategyContext();

  const dragHandle = async (e: DragEvent) => {
    e.preventDefault();
    console.log(e, "e");
    const drayDataString = e!.dataTransfer!.getData(DragKeyEnum.DRAG_KEY);
    const navListType = e!.dataTransfer!.getData("navListType") as NavListType;
    if (!drayDataString || !navListType) {
      return;
    }
    const dropData = JSON.parse(drayDataString);
    const targetElement = e.target as HTMLElement;
    const targetDom = document.getElementById("edit-screens");
    const disX = targetDom ? targetDom.getBoundingClientRect().x || 0 : 0;
    const disY = targetDom ? targetDom.getBoundingClientRect().y || 0 : 0;
    setEditCanvas(EditCanvasTypeEnum.IS_CREATE, false);
    // 创建拖拽上下文
    const dragContext: DragContext = {
      dropData,
      position: {
        left: targetElement.className.includes("es-editor") ? e.offsetX : e.x + disX,
        top: targetElement.className.includes("es-editor") ? e.offsetY : e.y + disY
      },
      isPanel,
      isDynamicPanel,
      isEncodePanel,
      addComponentList: (item: MenuItemForRender, attrs?: any) => addComponentByNavType(item, navListType, attrs),
      addComponentToPanel: (item, attrs) => addComponentToPanel(item, navListType, attrs),
      addComponentToEncodePanel: (item, attrs) => addComponentToEncodePanel(item, navListType, attrs)
    };

    // 使用策略模式处理拖拽
    await dragStrategyContext.execute(dragContext);
  };

  const dragoverHandle = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  };

  return {
    dragHandle,
    dragoverHandle
  };
};
