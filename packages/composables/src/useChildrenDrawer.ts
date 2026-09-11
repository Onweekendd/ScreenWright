import { type ChildComponent, type ComponentType, echartsTabEnum, type sceneEnumType } from "@screenwright/types";
import { createGlobalState } from "@vueuse/core";
import { computed, ref } from "vue";

import { getDataFilterPersistence } from "./ports/persistencePort";
import { useCallbackArguments } from "./useCallbackArguments";
import { useEditStore } from "./useEditStore";
import { TargetFlag, useTargetData } from "./useTargetData";

export { echartsTabEnum };

/**
 * 子组件（children）编辑抽屉状态：iconList/twinPanelIconList 等组件内部嵌套子项的编辑面板。
 * 纯 UI 状态 + useCallbackArguments/useEditStore（均已下沉）；唯一 IO 边界是保存图层，走
 * initDataFilterPersistence 端口。
 */
export const useChildrenDrawer = createGlobalState(() => {
  const { isPanel } = useEditStore();
  const { setSelectedTargetActionData, onConfigDrawerClose, setTargetFlag } = useTargetData();
  const currentChildrenItem = ref<ChildComponent | any>(null);
  const currentParentItem = ref<ComponentType | null>(null);
  const visibleRef = ref(false);
  const active = ref(echartsTabEnum.STYLE);
  const tabs = ref([
    {
      title: "样式",
      en: "style",
      key: echartsTabEnum.STYLE,
      icon: "iconfont-style_btn"
    },
    {
      title: "数据",
      en: "data",
      key: echartsTabEnum.DATA,
      icon: "iconfont-data_btn"
    },
    {
      title: "交互",
      en: "interactive",
      key: echartsTabEnum.INTERACTIVE,
      icon: "iconfont-interactive_btn"
    }
  ]);
  const { emitFilterTrigger } = useCallbackArguments();
  const ueTabs = ref([
    {
      title: "样式",
      en: "style",
      key: echartsTabEnum.STYLE,
      icon: "iconfont-style_btn"
    },
    {
      title: "交互",
      en: "interactive",
      key: echartsTabEnum.INTERACTIVE,
      icon: "iconfont-interactive_btn"
    }
  ]);

  const curTabs = computed(() => {
    if (!currentChildrenItem.value) {
      return [];
    }
    const props = currentChildrenItem.value.type;
    const mapPropsToList: Record<any, any[]> = {
      mapEffectScatter: tabs.value.slice(0, 2),
      mapGlScatter: tabs.value.slice(0, 2),
      mapLines: tabs.value.slice(0, 2),
      heatmap: tabs.value.slice(0, 2),
      colormap: tabs.value.slice(0, 2),
      iconList: tabs.value,
      twinIconList: tabs.value,
      twinPanelIconList: tabs.value,
      flowLine: tabs.value.slice(0, 2),
      mapPath: tabs.value.slice(0, 2),
      fence: tabs.value.slice(0, 2),
      plane: tabs.value.slice(0, 2),
      mapBar: tabs.value.slice(0, 2),
      mapScatter: tabs.value.slice(0, 2),
      regionOutline: tabs.value.slice(0, 2),
      mapGlIcon: tabs.value,
      ueToFunEvent: ueTabs.value
    };
    return mapPropsToList[props as sceneEnumType] || [];
  });
  const handleShowDrawer = () => {
    visibleRef.value = !visibleRef.value;
    if (!visibleRef.value) {
      handleClose();
    }
  };
  const handleClose = () => {
    onConfigDrawerClose();
    active.value = echartsTabEnum.STYLE;
  };
  const setCurrentChildrenItem = (item: any, parentItem: any) => {
    currentChildrenItem.value = item;
    currentParentItem.value = parentItem;
    setTargetFlag(TargetFlag.ChildItemOption);
    setSelectedTargetActionData(item);
  };
  const update = () => {
    if (!currentParentItem.value) {
      return;
    }

    emitFilterTrigger(`${currentParentItem.value.id}`);
    getDataFilterPersistence().saveLayersByType(currentParentItem.value, isPanel());
  };

  return {
    visibleRef,
    active,
    tabs,
    curTabs,
    currentChildrenItem,
    currentParentItem,
    update,
    handleClose,
    onConfigDrawerClose,
    setCurrentChildrenItem,
    handleShowDrawer
  };
});
