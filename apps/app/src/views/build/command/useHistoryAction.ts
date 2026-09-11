import { nextTick, toRaw } from "vue";

import type { DynamicPanelProps } from "../components/buildRender/core/SystemComponent/panel/DynamicPanel";
import type { PanelType } from "../components/buildRender/core/SystemComponent/type";
import { renderSystemComponentType } from "../components/buildRender/core/SystemComponent/type";
import { UpdateHistoryTypeEnum, useAction } from "../components/buildRender/hooks/useAction";
import { useEditStore } from "../components/buildRender/hooks/useEditStore";
import type { ComponentType } from "../components/buildRender/type";
import { FolderType } from "../components/buildRender/type";
import { saveLayersByType } from "../components/buildRender/utils";
import { useEncodePanelAction } from "../components/encodeEditor/useEncodePanelAction";
import { usePanelAction } from "../components/panelEditor/usePanelAction";
import { usePanelInfo } from "../components/panelEditor/usePanelInfo";
import { useGlobalComponentData } from "../useGlobalComponentData";

export const useHistoryAction = () => {
  const { allComponentMap } = useGlobalComponentData();
  const { isPanel, isDynamicPanel, isEncodePanel, setTargetSelectChart, componentList } = useEditStore();
  const { handleDelComponent, addComponentList } = useAction();
  const { addComponentToPanel, deleteComponentFromPanel } = usePanelAction();
  const { addComponentToPanel: addComponentToEncodePanel, deleteComponentFromPanel: deleteComponentFromEncodePanel } =
    useEncodePanelAction();

  const { panelInfo } = usePanelInfo();

  /**
   * 执行组件更新操作的公共函数
   * @param freezedComponents 要更新的组件列表
   * @param selectIds 要选中的组件ID列表
   */
  const executeUpdateComponents = async (freezedComponents: ComponentType[], selectIds: string[]) => {
    const updatePromises: Promise<any>[] = [];

    // 设置选中的组件
    if (selectIds.length > 1) {
      setTargetSelectChart(selectIds);
    } else if (componentList.value.some((item) => item.id === Number(selectIds[0]))) {
      setTargetSelectChart([selectIds[0]]);
    }

    await nextTick();

    // 批量更新组件
    freezedComponents.forEach((freezedComponent) => {
      const currentComponent = allComponentMap.value.get(`${freezedComponent.id}`);
      if (!currentComponent) {
        console.warn(`组件 ${freezedComponent.id} 不存在，跳过更新`);
        return;
      }

      if (renderSystemComponentType.includes(currentComponent.component.prop as PanelType)) {
        updateDynamicPanel();
      } else if (currentComponent.component.prop === FolderType.group) {
        updateGroup();
      } else {
        const componentTemp = JSON.parse(JSON.stringify(freezedComponent)) as ComponentType;
        Object.assign(currentComponent, componentTemp);
      }

      // 收集更新操作到 Promise 数组
      const updatePromise = saveLayersByType(currentComponent, isPanel(), {
        fullUpdateGroup: false,
        fullUpdateDynamicPanel: false,
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });
      updatePromises.push(updatePromise);

      function updateDynamicPanel() {
        if (!currentComponent) {
          return;
        }

        const freezeDynamicPanel = freezedComponent as unknown as DynamicPanelProps;
        if (!isPanel() || panelInfo.value.config.id !== freezeDynamicPanel.id) {
          const { panelData: _panelData, ...freezeDynamicPanelTemp } = freezeDynamicPanel;

          Object.assign(currentComponent, {
            ...JSON.parse(JSON.stringify(freezeDynamicPanelTemp)),
            panelData: currentComponent.panelData
          });
        } else {
          const { panelData: _panelData, ...freezeDynamicPanelTemp } = freezeDynamicPanel;
          const freezePanelData = freezeDynamicPanel.panelData.map((state) => {
            return {
              ...state,
              config: state.config.map((componentOrId) => {
                if (typeof componentOrId === "number") {
                  return componentOrId;
                }
                return componentOrId.id;
              })
            };
          });

          Object.assign(currentComponent, {
            ...JSON.parse(JSON.stringify(freezeDynamicPanelTemp)),
            panelData: freezePanelData.map((state) => {
              return {
                ...state,
                config: state.config.map((componentOrId) => toRaw(allComponentMap.value.get(`${componentOrId}`)))
              };
            })
          });
        }
      }

      function updateGroup() {
        if (!currentComponent) {
          return;
        }

        const freezeGroup = freezedComponent;

        const { children: freezeChildren, ...freezeGroupTemp } = freezeGroup;

        if (!freezeChildren) {
          return;
        }

        const freezeChildrenIdList = freezeChildren.map((componentOrId: number | ComponentType) => {
          if (typeof componentOrId === "number") {
            return componentOrId;
          } else {
            return componentOrId.id;
          }
        });

        Object.assign(currentComponent, {
          ...JSON.parse(JSON.stringify(freezeGroupTemp)),
          children: freezeChildrenIdList.map((componentOrId) => toRaw(allComponentMap.value.get(`${componentOrId}`)))
        });
      }
    });

    // 批量执行所有更新操作
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      console.log(`批量更新完成，共 ${updatePromises.length} 个组件`);
    }
  };

  /**
   * 执行添加组件操作的公共函数
   * @param freezedComponent 要添加的组件
   * @param moduleId 模块ID
   * @returns 新添加的组件
   */
  const executeAddComponent = async (freezedComponent: ComponentType, moduleId: number) => {
    setTargetSelectChart([`${freezedComponent.id}`]);

    console.log(`添加组件 ${freezedComponent.id}，moduleId: ${moduleId}`);

    try {
      let newComponent = null;
      if (isDynamicPanel()) {
        newComponent = await addComponentToPanel(
          { moduleId: moduleId },
          JSON.parse(JSON.stringify(freezedComponent)) as ComponentType,
          { updateHistoryType: UpdateHistoryTypeEnum.SKIP }
        );
      } else if (isEncodePanel()) {
        newComponent = await addComponentToEncodePanel(
          { moduleId: moduleId },
          JSON.parse(JSON.stringify(freezedComponent)) as ComponentType,
          { updateHistoryType: UpdateHistoryTypeEnum.SKIP }
        );
      } else {
        newComponent = await addComponentList(
          { moduleId: moduleId },
          JSON.parse(JSON.stringify(freezedComponent)) as ComponentType,
          { updateHistoryType: UpdateHistoryTypeEnum.SKIP }
        );
      }

      if (newComponent) {
        console.log(`添加组件完成：组件 ${newComponent.id} 已添加`);
        return newComponent;
      } else {
        console.error(`添加组件失败：无法创建组件`);
        return null;
      }
    } catch (error) {
      console.error(`添加组件失败:`, error);
      return null;
    }
  };

  /**
   * 执行删除组件操作的公共函数
   * @param componentIds 要删除的组件ID（支持单个或数组）
   * @param showConfirm 是否显示确认提示框，默认true
   */
  const executeDeleteComponent = async (componentIds: string | string[], showConfirm = true): Promise<boolean> => {
    const ids = Array.isArray(componentIds) ? componentIds : [componentIds];
    setTargetSelectChart(ids);

    // 检查所有组件是否存在
    const notExistIds = ids.filter((id) => !allComponentMap.value.get(id));
    if (notExistIds.length > 0) {
      notExistIds.forEach((id) => {
        console.warn(`组件 ${id} 不存在，跳过删除`);
      });
      // 只删除存在的
      const existIds = ids.filter((id) => allComponentMap.value.get(id));
      if (existIds.length === 0) {
        return false;
      }
      // 只处理存在的
      return await executeDeleteComponent(existIds, showConfirm);
    }

    console.log(`删除组件 ${ids.join(",")}（批量）`);

    try {
      if (isDynamicPanel()) {
        await deleteComponentFromPanel(ids, UpdateHistoryTypeEnum.SKIP, showConfirm);
      } else if (isEncodePanel()) {
        await deleteComponentFromEncodePanel(ids, UpdateHistoryTypeEnum.SKIP, showConfirm);
      } else {
        await handleDelComponent(ids, UpdateHistoryTypeEnum.SKIP, showConfirm);
      }
      console.log(`删除组件完成：组件 ${ids.join(",")} 已删除`);
      return true;
    } catch (error) {
      console.error(`删除组件失败:`, error);
      return false;
    }
  };

  return {
    executeUpdateComponents,
    executeAddComponent,
    executeDeleteComponent
  };
};
