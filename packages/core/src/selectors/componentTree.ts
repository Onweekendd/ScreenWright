import type { ChildComponent, ComponentType, PanelEnum, SystemComponentProps } from "@screenwright/types";

import { renderSystemComponentType } from "../constants/panel";

// 轻量工具，避免 core 依赖 lodash
const isNil = (v: unknown): v is null | undefined => v === null || v === undefined;
const isString = (v: unknown): v is string => typeof v === "string";

/**
 * 把字符串数据转换成对象数据。
 * @param groupData 字符串（或已是对象）数组
 */
export const transformGroupData = (groupData: string[]): ComponentType[] => {
  return groupData.map((item) => (isString(item) ? JSON.parse(item) : item));
};

export type ComponentMap = Map<
  string,
  | (ComponentType & { parentDynamicPanelId: number[]; dynamicPanelComponents?: ComponentMap })
  | (ChildComponent & { parentDynamicPanelId: number[] })
>;

/**
 * 扁平组件映射（仅 ComponentType 分支，含 parentDynamicPanelId）。
 * 与原 useGlobalComponentData 中 globalComponentMap/allComponentMap 等的类型保持一致，
 * 便于调用点把取出的值当作 ComponentType 使用。
 */
export type FlatComponentMap = Map<string, ComponentType & { parentDynamicPanelId: number[] }>;

/**
 * 递归遍历组件树，构建组件映射的纯函数。
 * 会就地为顶层元素装配 parentDynamicPanelId（与原实现一致）。
 */
export const buildComponentMap = (params: {
  componentList: ComponentType[] | ChildComponent[];
  componentMap: ComponentMap;
  parentDynamicPanelId: number[];
  assignParentDynamicPanelId?: boolean;
  rootComponentMap?: ComponentMap;
  /** 是否是子组件（children 或 presetChild） */
  isChildComponent?: boolean;
  processPanel?: boolean;
  processPresetChild?: boolean;
}) => {
  const {
    componentList,
    componentMap,
    parentDynamicPanelId,
    rootComponentMap,
    isChildComponent = false,
    assignParentDynamicPanelId = true,
    processPanel = true,
    processPresetChild = true
  } = params;
  if (!componentList?.length) {
    return;
  }

  for (const element of componentList) {
    if (isNil(element)) {
      continue;
    }

    /** 添加当前组件到全局Map（子组件不添加） */
    if (!componentMap.has(`${element.id}`)) {
      if (rootComponentMap && rootComponentMap.get(`${element.id}`)) {
        componentMap.set(`${element.id}`, rootComponentMap.get(`${element.id}`)!);
      } else if (isChildComponent) {
        componentMap.set(`${element.id}`, element as unknown as ChildComponent & { parentDynamicPanelId: number[] });
      } else {
        if (assignParentDynamicPanelId) {
          componentMap.set(`${element.id}`, Object.assign(element, { parentDynamicPanelId }));
        } else {
          componentMap.set(`${element.id}`, Object.assign({ ...element }, { parentDynamicPanelId }));
        }
      }

      /** 处理分组子组件 */
      if (element.children?.length) {
        buildComponentMap({
          componentList: element.children,
          componentMap,
          parentDynamicPanelId,
          rootComponentMap
        });
      }

      /** 处理预设子组件 */
      if (processPresetChild && element.presetChild && element.presetChild.length) {
        buildComponentMap({
          componentList: element.presetChild,
          componentMap,
          parentDynamicPanelId,
          rootComponentMap,
          isChildComponent: true
        });
      }

      /** 处理动态面板 */
      if (processPanel && renderSystemComponentType.includes(element.component?.prop as PanelEnum)) {
        const { panelData } = element as SystemComponentProps;
        /** 遍历所有状态 */
        for (const status of panelData) {
          buildComponentMap({
            componentList: status ? status.config || [] : [],
            componentMap,
            parentDynamicPanelId: [...(parentDynamicPanelId || []), Number(element.id)],
            rootComponentMap
          });
        }
      }
    }
  }
};

interface FindTargetDynamicPanelParams {
  /** 组件数据数组（不会被修改） */
  data: ComponentType[];
  /** 父级ID链，用于定位目标组件的路径 */
  parentIds: number[];
}

/**
 * 递归查找并返回目标动态面板（无副作用）。
 */
export function findTargetDynamicPanel(params: FindTargetDynamicPanelParams): ComponentType | null {
  const { data, parentIds } = params;

  if (!parentIds.length) {
    return null;
  }

  for (let i = 0; i < data.length; i++) {
    const item = data[i] as SystemComponentProps;
    if (item.id === parentIds[0]) {
      // 如果是最后一级ID，直接返回当前组件
      if (parentIds.length === 1) {
        return item;
      }

      /** 递归处理子级面板 */
      if (isDynamicPanel(item)) {
        for (const child of item.panelData) {
          const result = findTargetDynamicPanel({
            data: child.config,
            parentIds: parentIds.slice(1)
          });
          if (result) {
            return result;
          }
        }
      }
      return null;
    }
  }
  return null;
}

/** 类型守卫：判断组件是否为动态面板（含 panelData）。 */
function isDynamicPanel(item: ComponentType): item is SystemComponentProps {
  return (item as SystemComponentProps).panelData !== undefined;
}
