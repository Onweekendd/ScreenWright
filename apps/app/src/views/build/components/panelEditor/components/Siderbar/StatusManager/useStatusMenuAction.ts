import { nextTick, ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import type { PanelState } from "@/views/build/components/buildRender/core/SystemComponent/type";
import {
  calcMenuWidthAndHeight,
  calculateMenuPosition
} from "@/views/build/components/buildRender/hooks/useMenuAction";
import { usePanelInfo } from "@/views/build/components/panelEditor/usePanelInfo";

import type { StatusMenuOptionsItemType } from "./useStatueMenuOption";
import { useStatusMenuOptions } from "./useStatueMenuOption";

export const useStatusMenuAction = createGlobalState(() => {
  // 默认单组件
  const { statusMenuShow, setStatusMenuShow } = usePanelInfo();

  const mousePosition = ref({ startX: 0, startY: 0, x: 0, y: 0 });

  const setMousePosition = (x?: number, y?: number, startX?: number, startY?: number) => {
    if (x) mousePosition.value.x = x;
    if (y) mousePosition.value.y = y;
    if (startX) mousePosition.value.startX = startX;
    if (startY) mousePosition.value.startY = startY;
  };

  const { defaultOptions } = useStatusMenuOptions();

  const menuOptions = ref<StatusMenuOptionsItemType[]>([]);

  /**
   * 右键菜单
   * @param e 事件
   * @param targetStatus 当前选中的状态id
   */
  const handleContextMenu = async (e: MouseEvent, targetStatus: PanelState) => {
    e.stopPropagation();
    e.preventDefault();

    // 隐藏正在显示的菜单
    setStatusMenuShow(false);

    menuOptions.value = defaultOptions.value.map((item) => ({
      ...item,
      fnHandle: () => {
        item.fnHandle?.(targetStatus);
      }
    }));

    // 显示当前菜单
    setStatusMenuShow(true);
    await nextTick();
    const { menuWidth, menuHeight, x, y } = calcMenuWidthAndHeight(e, "status-context-menu");
    const { x: newX, y: newY } = calculateMenuPosition(x, y, menuWidth, menuHeight);
    setMousePosition(newX, newY);
  };

  return {
    menuOptions,
    mousePosition,
    statusMenuShow,
    setStatusMenuShow,
    handleContextMenu
  };
});
