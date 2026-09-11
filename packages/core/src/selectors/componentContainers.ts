import type { ComponentType, SystemComponentProps } from "@screenwright/types";

import type { ComponentId } from "../types/placement";

/**
 * 组件树的"容器"遍历原语（纯函数，无状态）。
 *
 * 树里存放子组件的地方只有两处：分组的 children、各类面板的 panelData[].config。
 * 这里按**结构**判断而不是按 component.prop 判断——prop 只是声明，
 * 实际有没有子组件看字段本身，这样特殊面板 / 引用面板这类不在白名单里的容器也不会被漏掉。
 */

/** 取组件直接持有的所有子组件数组（返回的是原数组引用，可就地增删）。 */
export const childLists = (component: ComponentType): ComponentType[][] => {
  const lists: ComponentType[][] = [];
  if (Array.isArray(component.children)) {
    lists.push(component.children);
  }
  const panelData = (component as SystemComponentProps).panelData;
  if (Array.isArray(panelData)) {
    for (const state of panelData) {
      if (Array.isArray(state?.config)) {
        lists.push(state.config);
      }
    }
  }
  return lists;
};

/** 组件在树中的位置：所在数组 + 下标 + 节点本身。 */
export interface ComponentEntry {
  list: ComponentType[];
  index: number;
  component: ComponentType;
}

const sameId = (component: ComponentType, id: ComponentId) => `${component.id}` === `${id}`;

/** 在树中定位组件；找不到返回 null。 */
export const findEntry = (layers: ComponentType[], id: ComponentId): ComponentEntry | null => {
  for (let index = 0; index < layers.length; index++) {
    const component = layers[index];
    if (sameId(component, id)) {
      return { list: layers, index, component };
    }
    for (const list of childLists(component)) {
      const found = findEntry(list, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

/** 从树中摘除组件并返回它；不存在返回 null（no-op，不报错——断言式操作要幂等）。 */
export const detach = (layers: ComponentType[], id: ComponentId): ComponentType | null => {
  const entry = findEntry(layers, id);
  if (!entry) {
    return null;
  }
  entry.list.splice(entry.index, 1);
  return entry.component;
};

/** 收集一棵子树里的全部组件（含自身，深度优先、父在子前）。 */
export const collectSubtree = (component: ComponentType): ComponentType[] => {
  const components: ComponentType[] = [component];
  for (const list of childLists(component)) {
    for (const child of list) {
      components.push(...collectSubtree(child));
    }
  }
  return components;
};

/** 收集一棵子树里的全部组件 id（含自身）。 */
export const collectSubtreeIds = (component: ComponentType): number[] =>
  collectSubtree(component).map((item) => item.id);
