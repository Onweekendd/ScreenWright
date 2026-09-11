import { createGlobalState } from "@vueuse/core";

import type { LargeScreenDetailInfo } from "@screenwright/types";

import type { ComponentType } from "@/views/build/components/buildRender/type";
import { FolderType } from "@/views/build/components/buildRender/type";
import { buildComponentMap } from "@/views/build/useGlobalComponentData";
import type { NavInfo } from "@/views/build/useLargeScreenInfo";

import { useImmer } from "../components/buildConfig/attrsRender/components/customAnimation/useImmer";
import type { PanelType } from "../components/buildRender/core/SystemComponent/type";
import { renderSystemComponentType } from "../components/buildRender/core/SystemComponent/type";
import { CommandManager } from "./CommandManager";

/**
 * 缓存状态管理 hooks
 * 管理组件列表、编辑配置和导航信息的缓存状态
 */
export const useHistoryData = createGlobalState(() => {
  // 创建命令管理器
  const commandManager = new CommandManager(20);

  // 创建缓存状态 - 使用深拷贝确保完全隔离
  const [cacheComponentList, updateCacheComponentList] = useImmer<Map<string, ComponentType> | null>(null);
  const [cacheEditConfig, updateCacheEditConfig] = useImmer<LargeScreenDetailInfo | null>(null);
  const [cacheNavInfo, updateCacheNavInfo] = useImmer<NavInfo | null>(null);

  /**
   * 通用的缓存操作函数 - 更新单个组件
   */
  const updateCacheComponent = (component: ComponentType) => {
    updateCacheComponentList((draft) => {
      if (!draft) {
        console.error("缓存组件列表为空");
        return;
      }
      draft.set(`${component.id}`, component);
    });
  };

  /**
   * 通用的缓存操作函数 - 批量更新多个组件
   */
  const updateCacheComponents = (components: ComponentType[]) => {
    updateCacheComponentList((draft) => {
      if (!draft) {
        console.error("缓存组件列表为空");
        return;
      }
      components.forEach((component) => {
        draft.set(`${component.id}`, component);
      });
    });
  };

  /**
   * 通用的缓存操作函数 - 批量删除多个组件
   */
  const deleteCacheComponents = (deleteComponents: Array<ComponentType>) => {
    updateCacheComponentList((draft) => {
      if (!draft) {
        console.error("缓存组件列表为空");
        return;
      }
      deleteComponents.forEach((component) => {
        draft.delete(`${component.id}`);
      });
    });
  };

  const initCacheState = ({
    componentList,
    editConfig,
    navInfo
  }: {
    componentList: ComponentType[];
    editConfig: LargeScreenDetailInfo;
    navInfo: NavInfo;
  }) => {
    updateCacheComponentList(() => {
      const res = new Map<string, ComponentType & { parentDynamicPanelId: number[] }>();

      buildComponentMap({ componentList, componentMap: res, parentDynamicPanelId: [] });

      return res;
    });

    updateCacheEditConfig(() => {
      return editConfig as LargeScreenDetailInfo;
    });

    updateCacheNavInfo(() => {
      return navInfo as NavInfo;
    });
  };

  /**
   * 决定删除该组件时，网络请求是否要传 SKIP（跳过响应拦截器的自动记录）。
   *
   * 注意：这里只负责"要不要 SKIP"，不再代表"删除后一定清空历史记录"——
   * isGroup（整组删除）与 component.parent 为真且分组剩余成员 >=2（分组成员删除）
   * 这两种情况，现在由 useAction.ts 的 handleDelComponent 在业务副作用完成后
   * 精细压入 DeleteGroupCommand / RemoveGroupMemberCommand，不再清空历史；
   * 只有"分组 2→1 自动解散"（component.parent 为真但分组剩余成员 ===2）与
   * isPanel（面板整体删除）仍保留 clearHistory() 兜底，详见 useAction.ts 中对应注释。
   * @param component 组件
   * @returns 是否需要跳过自动历史记录（走 SKIP）
   */
  const shouldClearHistory = (component: ComponentType) => {
    const isGroup = component.component.prop === FolderType.group;
    const isPanel = renderSystemComponentType.includes(component.component.prop as PanelType);
    return isGroup || component.parent || isPanel;
  };

  /**
   * 清空所有历史记录
   */
  const clearHistory = () => {
    commandManager.clearHistory();
    console.log("命令历史记录已清空");
  };

  return {
    commandManager,
    cacheComponentList,

    // 缓存状态

    // 初始化
    initCacheState,
    updateCacheComponentList,

    clearHistory,
    shouldClearHistory,

    // 新增的通用缓存操作函数
    updateCacheComponent,
    updateCacheComponents,
    deleteCacheComponents
  };
});
