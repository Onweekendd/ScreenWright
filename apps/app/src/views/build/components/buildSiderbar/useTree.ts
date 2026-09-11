import { computed, ref } from "vue";

import { FolderEnum } from "@screenwright/types";
import { debounce } from "lodash-es";

import { useScreenEditor } from "@/core-adapter/useScreenEditor";
import { useHistoryData } from "@/views/build/command/useHistoryData";

import { useGlobalComponentData } from "../../useGlobalComponentData";
import type { DynamicPanelProps } from "../buildRender/core/SystemComponent/panel/DynamicPanel";
import { UpdateHistoryTypeEnum, useAction } from "../buildRender/hooks/useAction";
import { useEditStore } from "../buildRender/hooks/useEditStore";
import type { ComponentType } from "../buildRender/type";
import { usePanelInfo } from "../panelEditor/usePanelInfo";
/**
 * Tree组件的通用逻辑hooks
 * @returns Tree组件所需的所有逻辑
 */
export const useTree = ({ isDynamicPanel = false }: { isDynamicPanel?: boolean } = { isDynamicPanel: false }) => {
  const editor = useScreenEditor();
  // 获取store和actions
  const { componentList, currentCanvasPlacement } = useEditStore();
  const { updateComponentLayers } = useAction({ isDynamicPanel });
  const { panelInfo } = usePanelInfo();
  const { allComponentMap } = useGlobalComponentData();
  const { clearHistory } = useHistoryData();
  // 防抖相关变量
  const pendingUpdates = new Set<string>(); // 记录等待更新的组件ID

  /**
   * 构建树形数据：对 group 组件的子组件排序，并对顶层组件按 zIndex 降序排序
   * @param components 组件列表
   * @returns 处理后的树形数据
   */
  const buildTreeData = (components: ComponentType[]): ComponentType[] => {
    const withSortedChildren = components.map((component) => {
      if (component.component.prop === FolderEnum.group) {
        component.children!.sort((a, b) => b.zIndex - a.zIndex);
      }
      return component;
    });
    return withSortedChildren.sort((a, b) => b.zIndex - a.zIndex);
  };

  // 树形数据，按 zIndex 排序。**只读**：写入树一律走 updateLocalData → core 的 reorder，
  // 留一个 setter 等于留一扇绕过 core 的门（zIndex 不重排、parent 不记账、包围盒不重算）。
  const treeData = computed(() => buildTreeData(componentList.value));

  const expandedIds = ref<string[]>([]);

  // 处理展开/收起
  const handleToggleExpand = (id: string) => {
    const index = expandedIds.value.indexOf(id);
    if (index > -1) {
      expandedIds.value.splice(index, 1);
    } else {
      expandedIds.value.push(id);
    }
  };

  // 初始化时展开所有文件夹
  const initExpandedState = () => {
    const getAllFolderIds = (items: any[]): string[] => {
      const ids: string[] = [];
      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          ids.push(item.id);
          ids.push(...getAllFolderIds(item.children));
        }
      });
      return ids;
    };
    expandedIds.value = getAllFolderIds(treeData.value);
  };

  /**
   * 立即更新本地数据
   */
  const updateLocalData = (parentId: string | undefined, newData: ComponentType[]) => {
    // 拖拽给出的就是一个有序数组，两支都是同一件事：断言这个容器的成员与叠放次序。
    // zIndex 按下标重排、parent 记账、分组包围盒重算，全在 core 的 reorder 里，这里只挑容器。
    if (!parentId) {
      editor.component.reorder(newData, currentCanvasPlacement());
      // 记录根级更新
      pendingUpdates.add("root");
      return;
    }

    const parent = allComponentMap.value.get(parentId);
    if (!parent) {
      return;
    }
    editor.component.reorder(newData, { parentId: parent.id, parentType: "group" });
    // 记录父组件更新
    pendingUpdates.add(parentId);
  };

  /**
   * 处理待更新的组件，包括分组解散逻辑
   */
  const processPendingUpdates = (): { componentsToUpdate: ComponentType[]; needClearHistory: boolean } => {
    const componentsToUpdate: ComponentType[] = [];
    let needClearHistory = true;

    pendingUpdates.forEach((updateId) => {
      if (updateId === "root") {
        // 过滤掉目标分组组件
        componentsToUpdate.push(...treeData.value.filter((item) => !pendingUpdates.has(`${item.id}`)));
      } else {
        // 更新指定的分组组件及其子组件
        const parent = allComponentMap.value.get(updateId);
        if (parent) {
          componentsToUpdate.push(parent);
          // 「分组至少两个成员」这条规则归 core：不够就摘掉分组、把成员塞回分组原来的位置
          // 并继承它的层级。返回 null 表示分组仍然成立。
          const promoted = editor.component.dissolveIfUnderfilled(parent.id);
          if (promoted) {
            needClearHistory = true;
            componentsToUpdate.push(...promoted);
            // 分组已不在树上，但它自己还要发一次更新（与 handleGroupDelete 同做法）
            parent.children = [];
          } else if (parent.children) {
            componentsToUpdate.push(...parent.children);
          }
        }
      }
    });

    // 去重处理
    return {
      componentsToUpdate: Array.from(new Map(componentsToUpdate.map((comp) => [comp.id, comp])).values()),
      needClearHistory
    };
  };

  /**
   * 执行网络请求更新
   */
  const executeNetworkUpdate = async () => {
    try {
      // 处理待更新的组件
      const { componentsToUpdate, needClearHistory } = processPendingUpdates();

      await Promise.all([
        ...componentsToUpdate.map((item) =>
          updateComponentLayers(item, {
            fullUpdateGroup: false,
            updateHistoryType: needClearHistory ? UpdateHistoryTypeEnum.SKIP : UpdateHistoryTypeEnum.UPDATE
          })
        )
      ]);

      // 如果是动态面板，执行面板更新
      if (isDynamicPanel) {
        await updateComponentLayers(panelInfo.value.config as DynamicPanelProps, {
          updateHistoryType: UpdateHistoryTypeEnum.SKIP
        });
      }

      // 清空待更新列表
      pendingUpdates.clear();
    } catch (error) {
      console.error("批量更新组件失败:", error);
      // 即使出错也要清空待更新列表，避免重复尝试
      pendingUpdates.clear();
    }
  };

  // 使用lodash的debounce创建防抖函数
  const debouncedNetworkUpdate = debounce(executeNetworkUpdate, 50);

  /**
   * 防抖版本的updateNode
   * 拖拽目标先更新
   */
  const updateNode = (parentId: string | undefined, newData: ComponentType[]) => {
    clearHistory();
    // 立即更新本地数据
    updateLocalData(parentId, newData);

    // 使用lodash防抖执行网络更新
    debouncedNetworkUpdate();
    // transFormIndex(newData)
  };

  return {
    // 数据
    treeData,

    // 方法
    updateNode,
    updateLocalData,
    processPendingUpdates,
    handleToggleExpand,
    initExpandedState,
    expandedIds
  };
};
