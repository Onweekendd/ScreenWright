import type { MenuItemForRender } from "../../buildTabs/selectAssets/assetsMenuType";

/**
 * 「动态面板」「分组」是容器，不在左侧组件菜单里（从工具栏建），按名字查菜单查不到，
 * 这里直接给出它们固定的菜单项。agent 建组件、复制组件两条路都要先查这里——
 * agent 建组件那条曾经漏了，模型建动态面板必然报「不存在组件标识为 动态面板 的组件」。
 */
const CONTAINERS: Record<string, { id: number; title: string }> = {
  动态面板: { id: 69, title: "动态面板" },
  分组: { id: 75, title: "分组" }
};

export const containerMenuItem = (name: string): MenuItemForRender | undefined => {
  const container = CONTAINERS[name];
  return container
    ? ({ id: container.id, moduleId: container.id, title: container.title } as MenuItemForRender)
    : undefined;
};
