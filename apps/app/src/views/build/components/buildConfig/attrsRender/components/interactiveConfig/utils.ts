import type {
  PanelState,
  PanelType,
  SystemComponentProps
} from "@/views/build/components/buildRender/core/SystemComponent/type";
import { largePanel } from "@/views/build/components/buildRender/core/SystemComponent/type";
import type { ComponentType } from "@/views/build/components/buildRender/type";

/**
 * 动态面板状态内组件转children
 */
export const panelDataToChildren = (data: PanelState[]): ComponentType[] => {
  const returnData: ComponentType[] = [];

  data.forEach((item: PanelState) => {
    item.config?.forEach((comp: ComponentType) => {
      // 动态面板特殊处理
      if (
        largePanel.includes(comp.component.prop as PanelType) &&
        panelChildrenLength(comp as SystemComponentProps) > 0
      ) {
        returnData.push({
          name: comp.name,
          id: comp.id,
          left: comp.left,
          top: comp.top,
          component: comp.component,
          option: comp.option
        } as ComponentType);
      }
      returnData.push(comp);
    });
  });
  return returnData;
};

export const panelChildrenLength = (item: SystemComponentProps) => {
  return item.panelData.reduce((acc, cur) => {
    const singlePanelChildrenLength = cur.config.length;
    return acc + singlePanelChildrenLength;
  }, 0);
};

// 类型守卫，判断是否有 panelData 属性
export function hasPanelData(item: ComponentType): item is SystemComponentProps {
  return item && Array.isArray((item as SystemComponentProps).panelData);
}

/**
 * 动态面板的状态组件转化为children数据
 * @param item 组件
 * @param isAll 是否所有组件
 * @returns 组件树
 */
export const getChildren = (item: ComponentType, isAll: boolean): ComponentType[] | undefined => {
  if (isAll && hasPanelData(item)) {
    return panelDataToChildren(item.panelData);
  }
  // 这里需要判断 item 是否有 children 属性
  if ("children" in item && Array.isArray(item.children)) {
    return item.children;
  }
  return undefined;
};

export type UnProcessedComponent = ComponentType & {
  label: string;
  value: string;
  children: ComponentType[];
};

/**
 * 计算组件的value值
 */
export const calculateComponentValue = (item: ComponentType, isAll: boolean): string => {
  return isAll && hasPanelData(item) && (item as SystemComponentProps).panelData?.length
    ? `$component(${item.id}-meet)`
    : `$component(${item.id})`;
};

export const processItem = (item: ComponentType, isAll: boolean): UnProcessedComponent => {
  const label = item.name;
  // TODO: 添加终端交互差异化
  const value = calculateComponentValue(item, isAll);

  const children = item.title === "分组" ? null : getChildren(item, isAll);
  return { ...item, label, value, children: children || [] };
};

/**
 * 建立组件树
 * @param data 组件列表
 * @param isAll 是否所有组件
 * @returns 组件树
 */
export const traverseTrees = (data: ComponentType[], isAll = false): UnProcessedComponent[] => {
  const res: UnProcessedComponent[] = [];
  for (const item of data) {
    const processedItem = processItem(item, isAll);
    res.push(processedItem);

    if (processedItem.children && processedItem.children.length) {
      processedItem.children = traverseTrees(processedItem.children, isAll);
    }
  }
  return res;
};

/**
 * 构建树结构
 */
export interface TreeNode {
  id: string;
  label: string;
  name: string;
  value: string;
  title: string;
  terminalId: string;
  events: number;
  children?: TreeNode[];
  isPopupInScene?: boolean;
}

/**
 * 构建树结构
 * @param componentList 未处理组件列表
 * @returns 树结构
 */
export const buildTree = (componentList: UnProcessedComponent[]): TreeNode[] => {
  const res: TreeNode[] = [];
  componentList.forEach((component) => {
    const node: TreeNode = {
      id: String(component.id),
      label: component.name,
      name: component.name,
      value: component.value,
      title: component.title,
      terminalId: component.terminalId || "",
      events: component.events?.length || 0,
      isPopupInScene: component.isPopupInScene || false
    };
    res.push(node);
    if (component.children && component.children.length) {
      node.children = buildTree(component.children as UnProcessedComponent[]);
    }
  });
  return res;
};

/**
 * 去除面板子组件并添加无状态面板副本
 * @param componentList 组件列表
 * @returns 处理后的组件列表（去除子组件，每个有子组件的面板旁边添加无状态副本）
 */
export const processPanelComponents = (componentList: ComponentType[]): ComponentType[] => {
  const result: ComponentType[] = [];
  const deleteIds: number[] = [];

  // 先收集所有需要排除的面板子组件ID
  componentList.forEach((component) => {
    if (largePanel.includes(component.component.prop as PanelType)) {
      const panel = component as SystemComponentProps;
      panel.panelData.forEach((status) => {
        status.config.forEach((child) => {
          deleteIds.push(child.id);
        });
      });
    }
  });

  // 遍历组件列表，构建结果数组
  componentList.forEach((component) => {
    // 跳过面板子组件
    if (deleteIds.includes(component.id)) {
      return;
    }

    // 对于有子组件的面板，添加面板本身和无状态副本
    if (largePanel.includes(component.component.prop as PanelType)) {
      // 添加原始面板
      result.push(component);

      // 添加无状态副本（去除 panelData）
      const { panelData: _panelData, ...noStatusPanel } = { ...component } as SystemComponentProps;
      result.push(noStatusPanel as ComponentType);
    } else {
      // 其他组件直接添加
      result.push(component);
    }
  });

  return result;
};
