import { computed, nextTick, ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import { useEncodePanelMenuOption } from "@/views/build/components/encodeEditor/components/Sidebar/useEncodePanelMenuOption";
import { usePanelMenuOption } from "@/views/build/components/panelEditor/components/Siderbar/usePanelMenuOption";

import type { ComponentType, MenuOptionsItemType } from "../type";
import { ContextMenuType } from "../type";
import { useEditStore } from "./useEditStore";
import { useMenuOptions } from "./useMenuOptions";

// 计算菜单临界值的函数
export const calculateMenuPosition = (x: number, y: number, menuWidth: number, menuHeight: number) => {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  // 检查是否会超出屏幕右侧
  if (x + menuWidth > screenWidth) {
    x = screenWidth - menuWidth - 20;
  }
  // 检查是否会超出屏幕底部
  if (y + menuHeight > screenHeight) {
    y = screenHeight - menuHeight - 20;
  }
  // 确保菜单不会超出屏幕左侧和顶部
  x = Math.max(x, 0);
  y = Math.max(y, 0);
  return { x, y };
};

// 计算菜单本身的宽度和高度
export const calcMenuWidthAndHeight = (e: MouseEvent, contextMenuElementId: string) => {
  const menuElement = document.getElementById(contextMenuElementId);
  if (menuElement) {
    const menuWidth = menuElement.offsetWidth;
    const menuHeight = menuElement.offsetHeight;
    return { menuWidth, menuHeight, x: e.clientX, y: e.clientY };
  }
  return { menuWidth: 0, menuHeight: 0, x: 0, y: 0 };
};

export const useMenuAction = createGlobalState(() => {
  // 默认单组件
  const { rightMenuShow, setRightMenuShow, editCanvas, isPanel, isEncodePanel } = useEditStore();
  const mousePosition = ref({ startX: 0, startY: 0, x: 0, y: 0 });

  // 不要直接使用配置项
  const { defaultOptions } = useMenuOptions();

  // * 右键内容
  const menuDefaultOptions = computed<MenuOptionsItemType[]>(() =>
    defaultOptions.value.filter((v) => ![ContextMenuType.CLEAR, ContextMenuType.LOCK].includes(v.key))
  );
  const pasteOptions = computed<MenuOptionsItemType[]>(() =>
    menuDefaultOptions.value.filter((v) => v.key === ContextMenuType.PASTE)
  );

  const { panelDefaultOptions } = usePanelMenuOption();
  const menuDynamicPanelOptions = computed<MenuOptionsItemType[]>(() =>
    panelDefaultOptions.value.filter((v) => ![ContextMenuType.CLEAR, ContextMenuType.LOCK].includes(v.key))
  );
  const menuDynamicPanelPasteOptions = computed<MenuOptionsItemType[]>(() =>
    menuDynamicPanelOptions.value.filter((v) => v.key === ContextMenuType.PASTE)
  );

  const { encodePanelDefaultOptions } = useEncodePanelMenuOption();
  const menuEncodePanelOptions = computed<MenuOptionsItemType[]>(() =>
    encodePanelDefaultOptions.value.filter((v) => ![ContextMenuType.CLEAR, ContextMenuType.LOCK].includes(v.key))
  );
  const menuEncodePanelPasteOptions = computed<MenuOptionsItemType[]>(() =>
    menuEncodePanelOptions.value.filter((v) => v.key === ContextMenuType.PASTE)
  );

  const menuOptions = ref<MenuOptionsItemType[]>([]);
  const isRightMenuShow = computed(() => rightMenuShow.value);

  // TODO: 是否可以在这里传入需要使用的配置项 这里需要做动态面板与非动态面板的区别
  // 或者使用配置项注册的方式？ 在这里使用已注册的配置项
  /**
   * 右键菜单
   * @param e 事件
   * @param item 当前选中的元素
   * @param option 配置项
   */
  const handleContextMenu = async (e: MouseEvent, item: ComponentType | null = null) => {
    e.stopPropagation();
    e.preventDefault();
    console.log(e, "ffff", editCanvas.value.isSelect);
    // 隐藏正在显示的菜单
    setRightMenuShow(false);

    if (isPanel()) {
      if (isEncodePanel()) {
        menuOptions.value = item ? menuEncodePanelOptions.value : menuEncodePanelPasteOptions.value;
      } else {
        menuOptions.value = item ? menuDynamicPanelOptions.value : menuDynamicPanelPasteOptions.value;
      }
    } else {
      menuOptions.value = item ? menuDefaultOptions.value : pasteOptions.value;
    }

    // 显示当前菜单
    setRightMenuShow(true);
    await nextTick();
    const { menuWidth, menuHeight, x, y } = calcMenuWidthAndHeight(e, "edit-contextMenu");
    const { x: newX, y: newY } = calculateMenuPosition(x, y, menuWidth, menuHeight);
    mousePosition.value.x = newX;
    mousePosition.value.y = newY;
  };

  return {
    menuOptions,
    mousePosition,
    isRightMenuShow,
    setRightMenuShow,
    handleContextMenu
  };
});
