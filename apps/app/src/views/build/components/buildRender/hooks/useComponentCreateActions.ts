import { toRaw } from "vue";

import { SceneEnum } from "@screenwright/types";
import { ElMessage } from "element-plus";
import { assign, cloneDeep } from "lodash-es";

import { uuid } from "@/utils/utils";
import { defaultGlData } from "../defaultGlData";

import { FileTypeEnum } from "../../buildTabs/assetsEditFrom/type";
import type { MenuItemForRender } from "../../buildTabs/selectAssets/assetsMenuType";
import type { ComponentMinioAsset, ComponentType } from "../type";
import { getMaxIndex, UpdateHistoryTypeEnum, validateComponentForAdd } from "../utils";
import type { ActionContext } from "./useActionContext";
import type { LayerPersistence } from "./useLayerPersistence";

export interface DragAttrs {
  left?: number;
  top?: number;
}

const glPresetChildTemplateMap = new Map(defaultGlData.map((child) => [child.type, child] as const));

const isRecord = (value: unknown): value is Record<PropertyKey, unknown> => typeof value === "object" && value !== null;

const isScatterPoint = (value: unknown) =>
  isRecord(value) && Number.isFinite(Number(value.lng)) && Number.isFinite(Number(value.lat));

const isFlowLine = (value: unknown) =>
  isRecord(value) &&
  Array.isArray(value.from) &&
  value.from.length === 2 &&
  Array.isArray(value.to) &&
  value.to.length === 2;

export const useComponentCreateActions = (
  {
    addLoading,
    cIsDynamicPanel,
    componentList,
    currentCanvasPlacement,
    editor,
    encodeComponentMap,
    isEncodePanel,
    setTargetSelectChart
  }: ActionContext,
  { getModuleInfoApi, saveLayersAggApi, updateComponentLayers }: LayerPersistence
) => {
  const buildComponent = async (
    {
      assetId,
      assetType,
      moduleId
    }: {
      moduleId: number;
      assetType?: FileTypeEnum;
      assetId?: number;
    },
    options?: {
      showLoading?: boolean;
      updateHistoryType?: UpdateHistoryTypeEnum;
      status?: boolean;
    }
  ) => {
    const dataParams = {
      assetId: assetId,
      assetType: assetType,
      moduleId: moduleId,
      status: options?.status ?? cIsDynamicPanel.value
    };
    const saveRes = await saveLayersAggApi(dataParams, options);
    if (!saveRes) {
      return;
    }

    const component = JSON.parse(saveRes.config) as { id: number };

    return component.id;
  };

  const calculateNewComponentPosition = (item: ComponentType, attrs: Partial<ComponentType>) => {
    const width = attrs.component?.width ?? item.component.width;
    const height = attrs.component?.height ?? item.component.height;
    const left = Number(((attrs?.left ?? 0) - width / 2).toFixed(2));
    const top = Number(((attrs?.top ?? 0) - height / 2).toFixed(2));
    return { left, top };
  };

  const normalizePresetChildren = (component: ComponentType) => {
    if (!Array.isArray(component.presetChild) || component.presetChild.length === 0) {
      return;
    }

    component.presetChild = component.presetChild.map((child) => {
      const normalizedType =
        child.type === "mapGlScatter" ? "mapScatter" : child.type === "mapLines" ? "flowLine" : child.type;
      if (!["mapScatter", "flowLine"].includes(normalizedType)) {
        return {
          ...child,
          id: child.id || uuid(),
          parentId: child.parentId ?? component.id,
          type: normalizedType
        };
      }

      const template =
        component.component.prop === SceneEnum.EchartGlmap ? glPresetChildTemplateMap.get(normalizedType) : undefined;
      const hasRenderableData =
        normalizedType === "mapScatter"
          ? Array.isArray(child.data) && child.data.some(isScatterPoint)
          : Array.isArray(child.data) && child.data.some(isFlowLine);
      const mergedChild = template
        ? {
            ...cloneDeep(template),
            ...child,
            component: {
              ...cloneDeep(template.component || {}),
              ...(child.component || {})
            },
            data: hasRenderableData ? cloneDeep(child.data) : cloneDeep(template.data || []),
            dataRemark:
              Array.isArray(child.dataRemark) && child.dataRemark.length > 0
                ? cloneDeep(child.dataRemark)
                : cloneDeep(template.dataRemark || []),
            listenArgs:
              Array.isArray(child.listenArgs) && child.listenArgs.length > 0
                ? cloneDeep(child.listenArgs)
                : cloneDeep(template.listenArgs || []),
            option: {
              ...cloneDeep(template.option || {}),
              ...(child.option || {})
            },
            type: normalizedType
          }
        : {
            ...child,
            type: normalizedType
          };

      return {
        ...mergedChild,
        id: child.id || uuid(),
        parentId: child.parentId ?? component.id
      };
    });
  };

  const getNewComponentOptions = async (
    item: Partial<MenuItemForRender>,
    attrs?: Partial<ComponentType>,
    options?: {
      showLoading?: boolean;
      updateHistoryType?: UpdateHistoryTypeEnum;
      /** 为 true 时，即使 attrs 没有 id，也将 attrs 的全部字段 assign 到新组件上（位置单独处理）*/
      assignAttrs?: boolean;
      status?: boolean;
    }
  ): Promise<ComponentType | null> => {
    const target = await getModuleInfoApi(`${item.moduleId}`);
    if (!target) {
      throw new Error("未找到对应的模块组件");
    }

    const componentTemplate = JSON.parse(target.javaScript) as ComponentType;
    // 后端模板里带着一个 callbackArgs 顶层键，但它不在 ComponentFlatSchema 里（那里只有 cbArgs），
    // 前端也没有任何一处读组件对象上的 callbackArgs——它只是被一路存下来、读回来、再存回去。
    // 留着的唯一效果是把人和 AI 引向错误的字段名：实测真实工作区 21/23 个组件文件都带着这个空数组，
    // 而真正生效的 cbArgs 只有 13 个有，谁看谁以为前者才是正牌。建组件时就剥掉，不让它继续扩散。
    delete (componentTemplate as { callbackArgs?: unknown }).callbackArgs;
    const moduleId = target ? target.id : 0;

    const result = await validateComponentForAdd({
      componentList: componentList.value,
      encodeComponentMap: encodeComponentMap.value,
      isDynamicPanel: cIsDynamicPanel.value,
      isEncodePanel: isEncodePanel(),
      newComponent: componentTemplate
    });
    if (!result) {
      addLoading.value = false;
      return null;
    }
    const newComponentId = await buildComponent(
      {
        assetId: item.id,
        assetType: item.assetType,
        moduleId
      },
      options
    );
    if (!newComponentId) {
      ElMessage.error("创建组件失败");
      return null;
    }

    const newComponent = {
      ...componentTemplate,
      id: newComponentId,
      left: attrs?.left || 0,
      top: attrs?.top || 0
    } as ComponentType;
    normalizePresetChildren(newComponent);

    const zIndex = getMaxIndex(componentList.value) + 1;
    newComponent.zIndex = zIndex;

    if (attrs && !attrs.id) {
      if (options?.assignAttrs) {
        const { id: _id, left: _l, title: _title, top: _t, ...rest } = attrs as ComponentType;
        assign(newComponent, rest);
      } else if (attrs.url) {
        const { left, top } = calculateNewComponentPosition(newComponent, attrs);
        newComponent.left = left;
        newComponent.top = top;

        assign(newComponent, {
          ...newComponent,
          component: {
            ...newComponent.component,
            height: attrs.component?.height ?? newComponent.component.height,
            width: attrs.component?.width ?? newComponent.component.width
          },
          data: [
            {
              ...newComponent.data[0],
              value: attrs.url
            }
          ]
        });
      }
    } else if (attrs && attrs.id) {
      const { id: _id, ...rest } = attrs;
      assign(newComponent, rest);
    }
    return newComponent;
  };

  const setComponentName = (newComponent: ComponentType, item: Partial<MenuItemForRender>) => {
    if (item.name && item.name.trim() !== "") {
      newComponent.name = item.name || newComponent.name;
    }
  };

  const setComponentMinioArr = (newComponent: ComponentType, item: Partial<MenuItemForRender>) => {
    newComponent.minioArr = [toRaw({ ...item })] as unknown as ComponentMinioAsset[];
  };

  /**
   * 创建新组件
   * @param item 组件信息
   * @param attrs 组件属性
   * @returns 新组件
   */
  const createNewComponentInstance = async (
    item: Partial<MenuItemForRender>,
    attrs?: {
      left: number;
      top: number;
      width?: number | string;
      height?: number | string;
      url?: string | undefined;
    }
  ): Promise<ComponentType | null> => {
    const newComponent = await getNewComponentOptions(item, attrs as unknown as Partial<ComponentType>);
    if (!newComponent) {
      return null;
    }

    return newComponent;
  };

  /**
   * 构造并持久化一个新组件实例，但不写入 componentList。
   * 适用于需要将组件挂入动态面板或分组的场景。
   */
  const buildComponentInstance = async (
    item: Partial<MenuItemForRender>,
    attrs?: Partial<ComponentType>,
    options?: {
      updateHistoryType?: UpdateHistoryTypeEnum;
      showLoading?: boolean;
      assignAttrs?: boolean;
      status?: boolean;
      /** false 表示本次创建不回写 agent 工作区（AI 建组件走这条，工作区由后端过 core 之后写） */
      syncWorkspace?: boolean;
    }
  ): Promise<ComponentType | null> => {
    const newComponent = await getNewComponentOptions(item, attrs, options);
    if (!newComponent) {
      return null;
    }

    setComponentName(newComponent, item);

    if (item.fileType && item.assetType === FileTypeEnum.personalPageAssets) {
      setComponentMinioArr(newComponent, item);
    }

    await updateComponentLayers(newComponent, {
      status: options?.status,

      showLoading: options?.showLoading,
      syncWorkspace: options?.syncWorkspace,
      updateHistoryType: options?.updateHistoryType ?? UpdateHistoryTypeEnum.ADD
    });

    return newComponent;
  };

  const addComponentList = async (
    item: Partial<MenuItemForRender>,
    attrs?: Partial<ComponentType>,
    options?: {
      updateHistoryType?: UpdateHistoryTypeEnum;
      showLoading?: boolean;
      showAddLoading?: boolean;
      assignAttrs?: boolean;
      /** 见 {@link buildComponentInstance} 的同名参数 */
      syncWorkspace?: boolean;
    }
  ) => {
    try {
      if (options?.showAddLoading !== false) {
        addLoading.value = true;
      }

      const newComponent = await buildComponentInstance(item, attrs, options);
      if (!newComponent) {
        addLoading.value = false;
        return null;
      }

      editor.component.upsert(newComponent, currentCanvasPlacement());
      setTargetSelectChart(`${newComponent.id}`);
      addLoading.value = false;

      return newComponent;
    } catch (error) {
      ElMessage.error(`创建组件失败: ${error}`);
      addLoading.value = false;
      return null;
    }
  };
  // 组合案例 / 用户资产 已下线（开源版移除 groupLayerData 后端）。
  // 该导出仍被 useCommonPanelAction / useTabsMenuGroup 引用，保留为空实现。
  const addGroupComponentList = async (_item: MenuItemForRender, _attrs?: DragAttrs) => {
    return null;
  };

  // 设置组件显示与隐藏

  return {
    addComponentList,
    addGroupComponentList,
    buildComponentInstance,
    calculateNewComponentPosition,
    createNewComponentInstance,
    getNewComponentOptions
  };
};

export type ComponentCreateActions = ReturnType<typeof useComponentCreateActions>;
