import type { SystemComponentProps } from "@screenwright/types";
import { type ComponentType, FolderEnum } from "@screenwright/types";

import { useScreenEditor } from "@/core-adapter/useScreenEditor";
import { uuid } from "@/utils/utils";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useTabsMenuGroup } from "@/views/build/useTabsMenuGroup";

import { useDataFilter } from "../../../useDataFilter";
import { extendsEnumType } from "../../buildRender/core/ExtendsComponents/type";
import { sceneEnumType } from "../../buildRender/core/SceneComponent/type";
import { type PanelState, PanelType } from "../../buildRender/core/SystemComponent/type";
import { UpdateHistoryTypeEnum, useAction } from "../../buildRender/hooks/useAction";
import { useEditStore } from "../../buildRender/hooks/useEditStore";
import type { MenuItemForRender, ModuleGroupForRender } from "../../buildTabs/selectAssets/assetsMenuType";
import { useEncodeTabsMenuGroup } from "../../encodeEditor/components/Tabs/useEncodeTabsMenuGroup";

export type ComponentPlacement =
  | { parentId: number; parentType: "group" }
  | { parentId: number; parentType: "dynamicPanel"; stateId: string };

export interface MoveComponentTarget {
  parentId: number;
  parentType: "group" | "dynamicPanel";
  stateId?: string;
}

export interface MoveComponentsResult {
  success: boolean;
  message: string;
}

export interface CreateComponentOptions {
  /** 组件的中文名称（title 字段） */
  componentTitle: string;
  componentConfig?: Partial<ComponentType>;
  placement?: ComponentPlacement;
}

export interface CreateComponentResult {
  success: boolean;
  message: string;
  componentId?: number;
  /** 建好的那一份（含业务接口分配的真实 id）；回传给后端过 core 放进树并整屏落盘 */
  component?: ComponentType;
}

/**
 * AI 建组件时**不回写 agent 工作区**：这条路上工作区由后端过 core 之后写
 * （见 servers/server 的 screen-mutation.ts），前端再回写一遍就是两个写入者。
 *
 * 顺带修掉一个竞态：前端的工作区回写是 debounce 的、而且响应拦截器不 await
 * （见 useCacheData 的 debouncedResponseHandler），由它写就可能 resume 都回到后端了、
 * 文件还没落地，agent 紧接着 read_file 会扑空。后端写则是写完才返回。
 *
 * updateHistoryType 用 SKIP 是另一件事：AI 建的组件不该进用户的撤销/重做栈。
 * 只传 { assignAttrs: true } 会让底层兜底成 ADD，被响应拦截器记成 AddComponentCommand 压栈，
 * 用户撤销时又删不掉。
 */
const AI_CREATE_OPTIONS = {
  assignAttrs: true,
  showLoading: false,
  syncWorkspace: false,
  updateHistoryType: UpdateHistoryTypeEnum.SKIP
};

function checkComponentConstraints({
  componentList,
  componentName,
  encodeComponentMap,
  isDynamicPanel,
  isInEncodePanel,
  prop
}: {
  prop: string | undefined;
  componentName: string;
  isDynamicPanel: boolean;
  isInEncodePanel: boolean;
  componentList: ComponentType[];
  encodeComponentMap: Map<string, ComponentType>;
}): string | null {
  if (!prop) {
    return null;
  }

  const sceneProps = [sceneEnumType.ThreeScene, sceneEnumType.IndustryScene] as string[];
  const ueProps = [
    extendsEnumType.UePixelStreaming,
    extendsEnumType.UePeerStreaming,
    extendsEnumType.FtUnrealEngine
  ] as string[];

  if (sceneProps.includes(prop)) {
    if (isDynamicPanel || isInEncodePanel) {
      return "场景模板不能添加到动态面板或终端交互中";
    }
    const count = componentList.filter((v) => sceneProps.includes(v.component.prop as string)).length;
    if (count >= 1) {
      return "场景模板数量已达上限（最多 1 个）";
    }
  }

  if (ueProps.includes(prop)) {
    if (isDynamicPanel || isInEncodePanel) {
      return "UE 组件不能添加到动态面板或终端交互中";
    }
    const count = componentList.filter((v) =>
      [extendsEnumType.UePixelStreaming as string, extendsEnumType.UePeerStreaming as string].includes(
        v.component.prop as string
      )
    ).length;
    if (count >= 1) {
      return `${componentName} 已达上限（最多 1 个）`;
    }
  }

  if (prop === (extendsEnumType.FtDigitalHuman as string)) {
    const count = componentList.filter((v) => v.component.prop === (extendsEnumType.FtDigitalHuman as string)).length;
    if (count >= 1) {
      return "数字人已达上限（最多 1 个）";
    }
  }

  if (prop === (sceneEnumType.Maptalks as string)) {
    if (isDynamicPanel || isInEncodePanel) {
      return "城市模板不能添加到动态面板或终端交互中";
    }
    const count = componentList.filter((v) => v.component.prop === (sceneEnumType.Maptalks as string)).length;
    if (count >= 1) {
      return "城市模板已达上限（最多 1 个）";
    }
  }

  if (prop === PanelType.encodePanel) {
    const count = Array.from(encodeComponentMap.values()).filter(
      (v) => v.component.prop === PanelType.encodePanel
    ).length;
    if (count >= 5) {
      return "终端交互组件数量已达上限（最多 5 个）";
    }
  }

  return null;
}

export function useCreateComponent() {
  const editor = useScreenEditor();
  const { addComponentList, buildComponentInstance, handleDelComponent, updateComponentLayers } = useAction();
  const { componentList, isEncodePanel, isPanel } = useEditStore();
  const { tabsGroupMenu } = useTabsMenuGroup();
  const { encodeTabsGroupMenu } = useEncodeTabsMenuGroup();
  const { allComponentMap, encodeComponentMap } = useGlobalComponentData();
  const {
    dataFilter,

    saveGlobalDataFilter
  } = useDataFilter();

  function resolvePlacementFlags(placement?: ComponentPlacement): {
    isDynamicPanel: boolean;
    isInEncodePanel: boolean;
  } {
    if (!placement) {
      return { isDynamicPanel: isPanel(), isInEncodePanel: isEncodePanel() };
    }

    const parentInEncode = encodeComponentMap.value.has(`${placement.parentId}`);
    if (parentInEncode) {
      return { isDynamicPanel: false, isInEncodePanel: true };
    }

    return { isDynamicPanel: placement.parentType === "dynamicPanel", isInEncodePanel: false };
  }

  function findComponentMenuItem(title: string) {
    const lowerTitle = title.toLowerCase();
    return tabsGroupMenu.value
      .flatMap((item) => (item.children as ModuleGroupForRender[]).flatMap((group) => group.children ?? group))
      .filter(Boolean)
      .find((item) => item.title.toLowerCase() === lowerTitle);
  }

  function findMenuItemByName(name: string): MenuItemForRender | undefined {
    if (name === "动态面板") {
      return {
        id: 69,
        moduleId: 69,
        title: "动态面板"
      } as MenuItemForRender;
    }

    if (name === "分组") {
      return {
        id: 75,
        moduleId: 75,
        title: "分组"
      } as MenuItemForRender;
    }

    const lowerName = name.toLowerCase();

    if (isEncodePanel()) {
      return encodeTabsGroupMenu.value[0].children.find((item) => item.title.toLowerCase() === lowerName) as
        | MenuItemForRender
        | undefined;
    }

    return tabsGroupMenu.value
      .flatMap((item) => (item.children as ModuleGroupForRender[]).flatMap((group) => group.children ?? group))
      .filter(Boolean)
      .find((item) => item.title.toLowerCase() === lowerName);
  }

  async function createComponent({
    componentConfig,
    componentTitle,
    placement
  }: CreateComponentOptions): Promise<CreateComponentResult> {
    const menuItem = findComponentMenuItem(componentTitle);

    if (!menuItem) {
      return { message: `不存在组件标识为 ${componentTitle} 的组件`, success: false };
    }

    const { isDynamicPanel, isInEncodePanel } = resolvePlacementFlags(placement);
    const constraintError = checkComponentConstraints({
      componentList: componentList.value,
      componentName: componentTitle,
      encodeComponentMap: encodeComponentMap.value,
      isDynamicPanel,
      isInEncodePanel,
      prop: componentConfig?.component?.prop as string | undefined
    });
    if (constraintError) {
      return { message: constraintError, success: false };
    }

    // 根目录添加
    if (!placement) {
      try {
        const result = await addComponentList(menuItem, componentConfig as Partial<ComponentType>, AI_CREATE_OPTIONS);

        if (!result) {
          throw new Error("添加组件失败");
        }

        return { component: result, componentId: result.id, message: `成功添加 ${componentTitle}`, success: true };
      } catch (error) {
        return { message: `添加组件 ${componentTitle} 时发生错误: ${(error as Error).message}`, success: false };
      }
    }

    // 嵌套添加（分组 / 动态面板）
    const parentComponent = allComponentMap.value.get(`${placement.parentId}`);

    if (!parentComponent) {
      return { message: `找不到 id 为 ${placement.parentId} 的分组/动态面板`, success: false };
    }

    const status = placement.parentType === "dynamicPanel" || isPanel();

    try {
      const buildOptions = {
        ...AI_CREATE_OPTIONS,
        status
      };
      const newComponent = await buildComponentInstance(
        menuItem,
        componentConfig as Partial<ComponentType>,
        buildOptions
      );

      if (!newComponent) {
        return { message: `构造组件 ${componentTitle} 失败`, success: false };
      }

      // 挂进目标容器：容器定位、状态兜底、parent 记账都在 core 里，前后端同一套
      try {
        editor.component.upsert(newComponent, placement);
      } catch (error) {
        return { message: (error as Error).message, success: false };
      }

      await updateComponentLayers(parentComponent, {
        status,
        syncWorkspace: false,
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });

      return {
        component: newComponent,
        componentId: newComponent.id,
        message:
          placement.parentType === "dynamicPanel"
            ? `成功添加 ${componentTitle} 到动态面板 ${placement.parentId} 的状态 ${placement.stateId ?? "（首个）"}`
            : `成功添加 ${componentTitle} 到分组 ${placement.parentId}`,
        success: true
      };
    } catch (error) {
      return { message: `添加组件时发生错误: ${(error as Error).message}`, success: false };
    }
  }

  const fixDataFilterRelation = async (component: ComponentType) => {
    const listenArg = component.listenArgs;

    const bindFilterList = listenArg
      .map((arg) => {
        const filterName = arg.filterName;
        if (!dataFilter.value[filterName]) {
          return;
        }

        return {
          ...dataFilter.value[filterName],
          name: filterName
        };
      })
      .filter(Boolean);

    if (!bindFilterList.length) {
      return;
    }

    for (const filter of bindFilterList) {
      if (!filter) {
        continue;
      }

      const bindComponent = filter.bindComponent;

      // 过滤掉不在 allComponentMap 中的无效引用
      filter.bindComponent = bindComponent.filter(({ id }) => allComponentMap.value.has(`${id}`));

      // 如果当前组件不在 bindComponent 中，补上
      if (!filter.bindComponent.some(({ id }) => id === component.id)) {
        filter.bindComponent.push({ id: component.id, label: component.title });
      }

      dataFilter.value[filter.name] = filter;
    }

    await saveGlobalDataFilter();
  };

  /**
   * 从复制的组件配置创建组件（递归处理动态面板状态和分组子组件）
   */
  async function createComponentFromConfig(
    config: SystemComponentProps | ComponentType,
    placement?: ComponentPlacement
  ): Promise<CreateComponentResult> {
    const menuItem = findMenuItemByName(config.title);
    if (!menuItem) {
      return { message: `找不到组件 "${config.title}" 对应的菜单项`, success: false };
    }

    const { isDynamicPanel: placementIsDynamic, isInEncodePanel } = resolvePlacementFlags(placement);
    const constraintError = checkComponentConstraints({
      componentList: componentList.value,
      componentName: config.title,
      encodeComponentMap: encodeComponentMap.value,
      isDynamicPanel: placementIsDynamic,
      isInEncodePanel,
      prop: config.component?.prop as string | undefined
    });
    if (constraintError) {
      return { message: constraintError, success: false };
    }

    const isDynamicPanel = config.component?.prop === PanelType.dynamicPanel;
    const isGroup = config.component?.prop === FolderEnum.group;
    const copiedPanelData = config.panelData as PanelState[] | undefined;
    const copiedChildren = config.children;
    const status = placement ? placement.parentType === "dynamicPanel" || isPanel() : isPanel();

    // 剥离嵌套数据，避免使用原始组件的 ID
    const { children: _ch, panelData: _pd, ...coreConfig } = config as SystemComponentProps;

    // 创建顶层组件
    let newComponent: ComponentType | null = null;

    if (!placement) {
      // 同 createComponent：根级添加也要走 SKIP，否则 AI 复制/创建的组件会漏进撤销栈
      newComponent = await addComponentList(menuItem, coreConfig, AI_CREATE_OPTIONS);
      if (!newComponent) {
        return { message: "创建组件失败", success: false };
      }
    } else {
      const parentComponent = allComponentMap.value.get(`${placement.parentId}`);
      if (!parentComponent) {
        return { message: `找不到父组件 ${placement.parentId}`, success: false };
      }

      newComponent = await buildComponentInstance(menuItem, coreConfig, {
        ...AI_CREATE_OPTIONS,
        status
      });
      if (!newComponent) {
        return { message: "创建组件失败", success: false };
      }

      try {
        editor.component.upsert(newComponent, placement);
      } catch (error) {
        return { message: (error as Error).message, success: false };
      }
      await updateComponentLayers(parentComponent, {
        status,
        syncWorkspace: false,
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });
    }

    // 动态面板：设置状态并递归创建子组件
    if (isDynamicPanel && copiedPanelData?.length) {
      let panelData = newComponent.panelData as PanelState[] | undefined;
      if (!panelData) {
        panelData = [];
        newComponent.panelData = panelData;
      }

      panelData.length = 0;
      for (const copiedState of copiedPanelData) {
        panelData.push({ ...copiedState, config: [], id: uuid() });
      }
      await updateComponentLayers(newComponent, {
        status,
        syncWorkspace: false,
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });

      for (let i = 0; i < copiedPanelData.length; i++) {
        const runtimeState = panelData[i];
        for (const childConfig of copiedPanelData[i].config) {
          await createComponentFromConfig(
            { ...childConfig, panelData: childConfig.panelData },
            { parentId: newComponent!.id, parentType: "dynamicPanel", stateId: runtimeState.id }
          );
        }
      }
    }

    // 分组：递归创建子组件
    if (isGroup && copiedChildren?.length) {
      for (const childConfig of copiedChildren) {
        await createComponentFromConfig(
          { ...childConfig, panelData: childConfig.panelData },
          { parentId: newComponent!.id, parentType: "group" }
        );
      }
    }

    // 返回的是 core 树上那一份：子组件已由上面的递归 upsert 挂进它的 children / panelData[].config，
    // 后端拿到的因此是完整子树，不必再靠 id 去别处捞
    return { component: newComponent!, componentId: newComponent!.id, message: "成功创建组件", success: true };
  }

  const fixDataFilterRelationRecursive = async (componentId: number) => {
    const component = allComponentMap.value.get(`${componentId}`);
    if (!component) {
      return;
    }

    if (component.listenArgs?.length) {
      await fixDataFilterRelation(component);
    }

    // 动态面板：递归处理各状态下的子组件
    if (component.component?.prop === PanelType.dynamicPanel) {
      const panelData = component.panelData as PanelState[] | undefined;
      if (panelData?.length) {
        for (const state of panelData) {
          for (const child of state.config) {
            await fixDataFilterRelationRecursive(child.id);
          }
        }
      }
    }

    // 分组：递归处理子组件
    if (component.component?.prop === FolderEnum.group && component.children?.length) {
      for (const child of component.children) {
        await fixDataFilterRelationRecursive(child.id);
      }
    }
  };

  const onDeleteComponent = async (componentId: number, placement: ComponentPlacement) => {
    const status = placement ? placement.parentType === "dynamicPanel" || isPanel() : isPanel();

    try {
      if (!placement) {
        await handleDelComponent([`${componentId}`], UpdateHistoryTypeEnum.DELETE, false);
        return { message: "删除组件成功", success: true };
      } else {
        const parentComponent = allComponentMap.value.get(`${placement.parentId}`);
        if (!parentComponent) {
          return { message: `找不到父组件 ${placement.parentId}`, success: false };
        }

        if (placement.parentType === "dynamicPanel") {
          const panelData = parentComponent.panelData as PanelState[] | undefined;
          if (!panelData?.length) {
            return { message: "父动态面板没有可用状态", success: false };
          }
          const targetState = placement.stateId ? panelData.find((s) => s.id === placement.stateId) : panelData[0];
          if (!targetState) {
            return { message: `找不到状态 ${placement.stateId}`, success: false };
          }
          const beforeDeleteComponentIndex = targetState.config.findIndex((c) => c.id === componentId);
          if (beforeDeleteComponentIndex === -1) {
            return { message: `动态面板状态 ${placement.stateId} 中没有组件 ${componentId}`, success: false };
          }

          await handleDelComponent([`${componentId}`], UpdateHistoryTypeEnum.DELETE, false);
          // handleDelComponent 的级联可能已经把它带走了，这里只是断言「它已被删除」，已不在即 no-op
          editor.component.delete(componentId);

          await updateComponentLayers(parentComponent, {
            status,

            updateHistoryType: UpdateHistoryTypeEnum.SKIP
          });
        } else if (placement.parentType === "group") {
          if (!parentComponent.children) {
            parentComponent.children = [];
          }

          const beforeDeleteComponentIndex = parentComponent.children.findIndex((c) => c.id === componentId);
          if (beforeDeleteComponentIndex === -1) {
            return { message: `分组中没有组件 ${componentId}`, success: false };
          }

          await handleDelComponent([`${componentId}`], UpdateHistoryTypeEnum.DELETE, false);
          editor.component.delete(componentId);

          await updateComponentLayers(parentComponent, {
            status,

            updateHistoryType: UpdateHistoryTypeEnum.SKIP
          });
        }
      }
    } catch (error) {
      return { message: `删除组件时发生错误: ${(error as Error).message}`, success: false };
    }
  };

  /**
   * 组件当前挂在哪个容器组件下（分组 / 动态面板）；挂在大屏根级时返回 undefined。
   * 移动前后这两个容器的包围盒都要重算，故 move 之前先把旧容器记下来。
   */
  const resolveOwningContainer = (component: ComponentType): ComponentType | undefined => {
    if (component.parent) {
      return allComponentMap.value.get(`${component.parent}`);
    }
    const panelIds = component.parentDynamicPanelId;
    if (panelIds?.length) {
      return allComponentMap.value.get(`${panelIds[panelIds.length - 1]}`);
    }
    return undefined;
  };

  /**
   * 把若干已存在的组件从当前容器（根级 / 分组 / 动态面板状态）摘除，挂到目标容器下。
   * 组件本身不会被删除或重建，id 不变，只是挂载位置变化。
   * @param componentIds 待移动的组件 id 数组
   * @param target 目标容器；不传表示移动到大屏根级
   */
  const moveComponents = async (
    componentIds: number[],
    target?: MoveComponentTarget
  ): Promise<MoveComponentsResult> => {
    // 待重算包围盒 + 持久化的容器（分组/动态面板），用 Map 按 id 去重
    const touchedContainers = new Map<number, ComponentType>();

    for (const componentId of componentIds) {
      const component = allComponentMap.value.get(`${componentId}`);
      if (!component) {
        return { success: false, message: `找不到组件 ${componentId}` };
      }
      if (target && target.parentId === componentId) {
        return { success: false, message: "目标容器不能是被移动的组件本身" };
      }

      // 旧容器必须在 move 之前取：core 会把 parent 记账清掉，move 之后就问不出来了
      const oldContainer = resolveOwningContainer(component);
      if (oldContainer) {
        touchedContainers.set(oldContainer.id, oldContainer);
      }

      // 摘挂 + zIndex 置顶 + parent 记账全部交给 core：后端 resume 时跑的是同一个函数，
      // 前端这里只保留 core 管不到的部分——容器包围盒重算与持久化。
      try {
        editor.component.move([componentId], target);
      } catch (error) {
        return { success: false, message: (error as Error).message };
      }

      if (target) {
        const newContainer = allComponentMap.value.get(`${target.parentId}`);
        if (newContainer) {
          touchedContainers.set(newContainer.id, newContainer);
        }
      }
    }

    // 重算涉及的分组容器包围盒，并持久化所有受影响的容器
    for (const container of touchedContainers.values()) {
      // 非分组是 no-op，分组与否由 reflowGroup 自己判
      editor.component.reflowGroup(container);
      await updateComponentLayers(container, {
        status: container.component?.prop === PanelType.dynamicPanel || isPanel(),
        syncWorkspace: false,
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });
    }

    // 持久化被移动的组件本身
    for (const componentId of componentIds) {
      const component = allComponentMap.value.get(`${componentId}`);
      if (component) {
        await updateComponentLayers(component, {
          status: target?.parentType === "dynamicPanel" || isPanel(),
          syncWorkspace: false,
          updateHistoryType: UpdateHistoryTypeEnum.SKIP
        });
      }
    }

    return { success: true, message: "移动完成" };
  };

  return {
    createComponent,
    findMenuItemByName,
    createComponentFromConfig,
    fixDataFilterRelationRecursive,
    onDeleteComponent,
    moveComponents
  };
}
