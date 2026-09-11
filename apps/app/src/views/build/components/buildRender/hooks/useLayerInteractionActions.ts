import { cloneDeep } from "lodash-es";

import buildAsyncTree from "../../buildAsyncTree/index.vue";
import type { componentType } from "../core/BaseComponent/type";
import type { PanelType } from "../core/SystemComponent/type";
import type { ComponentType } from "../type";
import { saveParentGroupData } from "../utils";
import type { ActionContext } from "./useActionContext";
import type { LayerPersistence } from "./useLayerPersistence";

interface PanelDataItem {
  config?: Array<{ component?: { prop?: componentType | PanelType }; id?: number | string }>;
  [key: string]: unknown;
}

interface LayerMoveOptions {
  direction: -1 | 1;
  moveToBoundary?: boolean;
  persistTopLevelTargetAfterMove?: boolean;
}

const swapComponentZIndexes = (target: ComponentType, sibling: ComponentType) => {
  [target.zIndex, sibling.zIndex] = [sibling.zIndex, target.zIndex];
};

const moveComponentInList = (
  target: ComponentType,
  components: ComponentType[],
  { direction, moveToBoundary = false }: LayerMoveOptions,
  onSwap: (target: ComponentType, sibling: ComponentType) => void
) => {
  const currentIndex = components.findIndex((component) => `${component.id}` === `${target.id}`);
  if (currentIndex === -1) {
    return false;
  }

  const boundaryIndex = direction === -1 ? 0 : components.length - 1;
  const destinationIndex = moveToBoundary ? boundaryIndex : currentIndex + direction;
  if (destinationIndex < 0 || destinationIndex >= components.length || destinationIndex === currentIndex) {
    return false;
  }

  let movingIndex = currentIndex;
  while (movingIndex !== destinationIndex) {
    const siblingIndex = movingIndex + direction;
    onSwap(target, components[siblingIndex]);
    movingIndex = siblingIndex;
  }
  return true;
};

export const useLayerInteractionActions = (
  { allComponentMap, cIsDynamicPanel, componentList, dialog, selectTargetData, setTargetSelectChart }: ActionContext,
  { updateComponentLayers }: LayerPersistence
) => {
  const setComponentShow = (id: string) => {
    const target = allComponentMap.value.get(id);
    if (!target) {
      return;
    }
    target.display = !target.display;
    updateComponentLayers(target, {
      fullUpdateGroup: false
    });
  };

  const setComponentLock = (component: ComponentType, isLocked: boolean) => {
    component.isLock = isLocked;
    updateComponentLayers(component, {
      fullUpdateGroup: false
    });
  };

  const toggleComponentLock = (component: ComponentType) => {
    const isLocked = !component.isLock;
    setComponentLock(component, isLocked);
    component.children?.forEach((child) => setComponentLock(child, isLocked));
  };

  // 添加锁定
  const lock = () => {
    if (selectTargetData.value.length === 0) {
      return;
    }

    selectTargetData.value.forEach(toggleComponentLock);
    setTargetSelectChart(undefined);
  };

  // 单个锁定
  const handleSingleLock = (element: ComponentType) => {
    const isGroup = Boolean(element.children?.length);
    toggleComponentLock(element);
    if (!isGroup) {
      setTargetSelectChart(`${element.id}`);
    }
  };

  const swapAndPersistComponentZIndexes = (target: ComponentType, sibling: ComponentType) => {
    swapComponentZIndexes(target, sibling);
    updateComponentLayers(target);
    updateComponentLayers(sibling);
  };

  const moveSelectedComponent = (options: LayerMoveOptions) => {
    const target = selectTargetData.value[0];
    if (!target) {
      return;
    }

    if (!target.parent) {
      const sortedComponents = componentList.value.sort((a, b) => b.zIndex - a.zIndex);
      const hasMoved = moveComponentInList(target, sortedComponents, options, swapAndPersistComponentZIndexes);
      if (hasMoved && options.persistTopLevelTargetAfterMove) {
        updateComponentLayers(target);
      }
      return;
    }

    const parent = allComponentMap.value.get(`${target.parent}`);
    if (!parent?.children) {
      return;
    }

    const hasMoved = moveComponentInList(target, parent.children, options, swapComponentZIndexes);
    if (!hasMoved) {
      return;
    }

    parent.children = parent.children.sort((a, b) => b.zIndex - a.zIndex);
    saveParentGroupData(parent, { isDynamicPanel: cIsDynamicPanel.value });
  };

  const handleTop = () =>
    moveSelectedComponent({ direction: -1, moveToBoundary: true, persistTopLevelTargetAfterMove: true });

  const handleBottom = () => moveSelectedComponent({ direction: 1, moveToBoundary: true });

  const handleMoveUp = () => moveSelectedComponent({ direction: -1 });

  const handleMoveDown = () => moveSelectedComponent({ direction: 1 });

  const transformData = (data: ComponentType[], target: ComponentType) => {
    const prop = target.component.prop;
    return data
      .map((item: ComponentType) => {
        const newItem = { ...item };
        // 处理 children 字段
        if (newItem.children && newItem.children.length > 0) {
          newItem.children = newItem.children.filter(
            (child: ComponentType) => child.component.prop === prop && item.id !== target.id
          );

          if (newItem.children.length === 0) {
            delete newItem.children;
          }
        }

        // 处理 panelData 字段
        if (newItem.panelData && newItem.panelData.length > 0) {
          const newChildren: ComponentType[] = [];
          newItem.panelData.forEach((panel: PanelDataItem) => {
            panel.config?.forEach((config) => {
              if (config.component?.prop === prop && config.id !== target.id) {
                newChildren.push(config as ComponentType);
              }
            });
          });
          if (newChildren.length > 0) {
            newItem.children = newChildren as ComponentType<componentType | PanelType, unknown, unknown>[];
          }
          delete newItem.panelData;
        }

        return newItem;
      })
      .filter((item: ComponentType) => {
        return (item.component.prop === prop || (item.children && item.children.length > 0)) && item.id !== target.id;
      });
  };
  // 更新同类型组件
  const updateSameComponentOption = (data: Array<{ id?: number | string }>) => {
    const currentOptions = cloneDeep(selectTargetData.value[0].option);

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const currentItem = allComponentMap.value.get(`${item.id}`);
      if (!currentItem) {
        continue;
      }
      currentItem.option = JSON.parse(
        JSON.stringify({
          ...cloneDeep(currentItem.option),
          ...currentOptions
        })
      );
      updateComponentLayers(currentItem);
    }
  };
  // 组件同步样式
  const handleAsyncOption = () => {
    const treeData = transformData(cloneDeep(componentList.value), selectTargetData.value[0]);
    dialog({
      center: true,
      closeBefore: async (componentData, done) => {
        const { data, success } = await componentData.validate();
        console.log(data, "data", success);
        if (!success) {
          return;
        }
        updateSameComponentOption(data);
        done();
      },
      component: buildAsyncTree,
      componentProps: {
        treeData
      },
      DialogProps: {
        modalClass: "build-render-ignore",
        title: "同步配置列表",
        width: "400"
      }
    });
  };

  return {
    handleAsyncOption,
    handleBottom,
    handleMoveDown,
    handleMoveUp,
    handleSingleLock,
    handleTop,
    lock,
    setComponentShow
  };
};
