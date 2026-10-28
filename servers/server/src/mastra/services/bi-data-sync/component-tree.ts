import type { SystemComponentProps } from "@screenwright/types";
import { type ComponentType, FolderEnum, PanelEnum } from "@screenwright/types";

/**
 * 组件树遍历工具（无状态纯函数）。
 * 收敛「动态面板 panelData / 分组 children」这套子树下钻规则，供 layout / flow-graph / 同步写入等复用。
 */

/**
 * 取组件的直接子组件分组：动态面板每个非空状态返回一组子组件，分组返回其 children 一组，叶子返回空。
 * 收敛「动态面板 panelData / 分组 children」这套在多处重复的子树下钻规则。
 */
export const childConfigGroups = (comp: ComponentType): ComponentType[][] => {
  const panelData = (comp as SystemComponentProps).panelData;
  if (comp.component.prop === PanelEnum.dynamicPanel && panelData?.length) {
    return panelData.filter((state) => state.config?.length).map((state) => state.config);
  }
  if (comp.component.prop === FolderEnum.group && comp.children?.length) {
    return [comp.children];
  }
  return [];
};

/** 递归展开组件树为平铺数组（含分组子组件和动态面板各状态子组件） */
export const flattenComponents = (components: ComponentType[]): ComponentType[] => {
  const result: ComponentType[] = [];
  const walk = (items: ComponentType[]) => {
    for (const comp of items) {
      result.push(comp);
      for (const group of childConfigGroups(comp)) {
        walk(group);
      }
    }
  };
  walk(components);
  return result;
};

/** 递归收集 incoming layers 中所有组件 id（含分组、动态面板的子组件） */
export const collectIncomingIds = (components: ComponentType[]): Set<number> => {
  const result = new Set<number>();
  for (const component of components) {
    result.add(component.id);
    for (const group of childConfigGroups(component)) {
      for (const id of collectIncomingIds(group)) {
        result.add(id);
      }
    }
  }
  return result;
};
