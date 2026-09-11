import { useRoute } from "vue-router";

import { uuid } from "@screenwright/core";
import { ElMessage } from "element-plus";

import { updateLargeScreen } from "@/api/library";
import { useScreenEditor } from "@/core-adapter/useScreenEditor";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import { dyPanelCount } from "@/utils/config";

import {
  ARTIFACT_APP_PREVIEW_MODULE_ID,
  DYNAMIC_PANEL_MODULE_ID,
  ENCODE_PANEL_MODULE_ID,
  QUOTE_PANEL_MODULE_ID
} from "./components/buildRender/core/SystemComponent/panel";
import type { ArtifactAppPreviewProps } from "./components/buildRender/core/SystemComponent/panel/ArtifactAppPreview";
import type { DynamicPanelProps } from "./components/buildRender/core/SystemComponent/panel/DynamicPanel";
import type { EncodePanelProps } from "./components/buildRender/core/SystemComponent/panel/EncodePanel";
import { useAction } from "./components/buildRender/hooks/useAction";
import { UpdateHistoryTypeEnum } from "./components/buildRender/hooks/useAction";
import { createLocalPanelStatus } from "./components/buildRender/hooks/useCommonPanelAction";
import { useEditStore } from "./components/buildRender/hooks/useEditStore";
import { useEncodeTabsMenuGroup } from "./components/encodeEditor/components/Tabs/useEncodeTabsMenuGroup";
import { useEncodePanelAction } from "./components/encodeEditor/useEncodePanelAction";
import { useEncodePanelInfo } from "./components/encodeEditor/useEncodePanelInfo";
import { usePanelAction } from "./components/panelEditor/usePanelAction";
import { usePanelInfo } from "./components/panelEditor/usePanelInfo";
import { useGlobalComponentData } from "./useGlobalComponentData";
import { useLargeScreenInfo } from "./useLargeScreenInfo";
import { NavListType, useNavAction } from "./useNavAction";
import { useTabsMenuGroup } from "./useTabsMenuGroup";

// 导航操作类型枚举 - 统一所有原始的ClickEnum
export enum NavigationActionType {
  // 基础操作
  COMPONENT = NavListType.Component,
  MATERIAL_LIBRARY = NavListType.MaterialLibrary,
  ARTIFACT_APP_PREVIEW = "artifactAppPreview",
  PROJECT_FILTER = "projectFilter",
  CALLBACK_MANAGE = "callbackManage",

  // 面板相关
  DYNAMIC_PANEL = "dynamicPanel",
  DYNAMIC_PANEL_IN_PANEL = "dynamicPanelInPanel",
  DYNAMIC_PANEL_IN_ENCODE_PANEL = "dynamicPanelInEncodePanel",
  ENCODE_PANEL = "encodePanel",
  QUOTE_PANEL = "quotePanel"
}

// 为了向下兼容，保留原始的NavActionType
export const NavActionType = NavigationActionType;

/** 生成可直接作为项目目录名使用的 Artifact App ID。 */
const createArtifactAppId = (): string => `app-${uuid()}`;

// 导航上下文类型，用于区分不同的使用环境
export enum NavigationContext {
  BUILD_NAV = "buildNav",
  PANEL_EDITOR = "panelEditor",
  ENCODE_EDITOR = "encodeEditor"
}

// 导航控制项数据类型 - 重命名以更好表达意图
export interface NavigationControlItem {
  name: string;
  enName: string;
  iconType: string;
  type: NavigationActionType;
  showCondition?: () => boolean;
}

// 为了向下兼容，保留原始类型
export type NavControlItem = NavigationControlItem;

// 导航策略函数类型
export type NavigationStrategyFunction = () => void | Promise<void>;

// 导航策略配置类型
export type NavigationStrategyMap = Partial<Record<NavigationActionType, NavigationStrategyFunction>>;

// 为了向下兼容，保留原始类型
export type NavStrategyFunction = NavigationStrategyFunction;
export interface NavStrategyConfig {
  [key: string]: NavStrategyFunction;
}

/**
 * 导航策略管理hooks - 包含所有导航策略的完整实现
 * 提供统一的导航控制项点击策略管理
 */
export function useNavigationStrategies() {
  // 全量引入所有需要的hooks
  const { projectFilterShow, navListType, globalCallbackManagerShow } = useNavAction();
  const { getModuleInfoByComponent, getLibraryByMaterial } = useTabsMenuGroup();
  const { getLibraryByMaterial: getEncodeLibraryByMaterial, getEncodeModuleInfoListApi } = useEncodeTabsMenuGroup();
  const { addPanelToPanel: addPanelToPanelEditor } = usePanelAction();
  const { addPanelToPanel: addPanelToEncodePanel } = useEncodePanelAction();
  const { panelInfo } = usePanelInfo();
  const { panelInfo: encodePanelInfo } = useEncodePanelInfo();
  const { globalComponentMap, encodeComponentMap } = useGlobalComponentData();
  const editor = useScreenEditor();
  const { editConfig, componentList, currentCanvasPlacement, setTargetSelectChart } = useEditStore();
  const { createNewComponentInstance, updateComponentLayers } = useAction();
  const { navInfo } = useLargeScreenInfo();
  const { loading } = useGlobalLoading();
  const route = useRoute();

  // 通用策略处理函数
  const handleProjectFilterControl = () => {
    projectFilterShow.value = true;
  };

  const handleCallbackManage = (): void => {
    globalCallbackManagerShow.value = true;
  };

  const handleComponentNavigation = () => {
    navListType.value = NavListType.Component;
    getModuleInfoByComponent();
  };

  const handleEncodeComponentNavigation = () => {
    navListType.value = NavListType.Component;
    getEncodeModuleInfoListApi();
  };

  const handleMaterialLibraryNavigation = () => {
    navListType.value = NavListType.MaterialLibrary;
    getLibraryByMaterial();
  };

  const handleEncodeMaterialLibraryNavigation = () => {
    navListType.value = NavListType.MaterialLibrary;
    getEncodeLibraryByMaterial();
  };

  const handleDynamicPanelInPanel = () => {
    const currentPanel = globalComponentMap.value.get(`${panelInfo.value.config.id}`);
    if (!currentPanel) {
      return;
    }

    if (currentPanel.parentDynamicPanelId && currentPanel.parentDynamicPanelId.length == dyPanelCount - 1) {
      ElMessage.warning(`动态面板最多嵌套${dyPanelCount}层`);
      return;
    }

    addPanelToPanelEditor();
  };

  const handleDynamicPanelInEncodePanel = () => {
    const currentPanel = encodeComponentMap.value.get(`${encodePanelInfo.value.config.id}`);
    if (!currentPanel) {
      return;
    }

    if (currentPanel.parentDynamicPanelId && currentPanel.parentDynamicPanelId.length == dyPanelCount - 1) {
      ElMessage.warning(`动态面板最多嵌套${dyPanelCount}层`);
      return;
    }

    addPanelToEncodePanel();
  };

  // 大屏相关的更新函数
  const updateLargeScreenInfo = () => {
    const updateParams = {
      detail: JSON.stringify({ ...editConfig.value }),
      id: Number(route.params.id),
      minioIds: JSON.stringify(editConfig.value.minioIds),
      name: navInfo.value.name
    };
    updateLargeScreen(updateParams);
  };

  // 创建动态面板
  const createDynamicPanel = async (): Promise<void> => {
    loading.value = true;
    const dynamicPanel = (await createNewComponentInstance({
      moduleId: DYNAMIC_PANEL_MODULE_ID
    })) as DynamicPanelProps;

    const initStatus = createLocalPanelStatus(0);
    dynamicPanel.panelData.push(initStatus);

    await updateComponentLayers(dynamicPanel, {
      updateHistoryType: UpdateHistoryTypeEnum.ADD
    });

    editor.component.upsert(dynamicPanel, currentCanvasPlacement());
    setTargetSelectChart(`${dynamicPanel.id}`);
    loading.value = false;
  };

  const createQuotePanel = async () => {
    console.log("zzzzzzzz");

    loading.value = true;
    const quotePanel = await createNewComponentInstance({
      moduleId: QUOTE_PANEL_MODULE_ID
    });
    if (!quotePanel) {
      loading.value = false;
      return;
    }
    await updateComponentLayers(quotePanel, {
      updateHistoryType: UpdateHistoryTypeEnum.ADD
    });

    editor.component.upsert(quotePanel, currentCanvasPlacement());
    setTargetSelectChart(`${quotePanel.id}`);
    console.log(componentList.value, "componentList.value");
    loading.value = false;
  };

  /** 创建 Artifact 应用预览组件。 */
  const createArtifactAppPreview = async (): Promise<void> => {
    if (loading.value) {
      return;
    }

    loading.value = true;
    try {
      const appPreview = await createNewComponentInstance({
        moduleId: ARTIFACT_APP_PREVIEW_MODULE_ID
      });
      if (!appPreview) {
        return;
      }

      const artifactAppPreview = appPreview as ArtifactAppPreviewProps;
      artifactAppPreview.option.appId = createArtifactAppId();

      await updateComponentLayers(artifactAppPreview, {
        updateHistoryType: UpdateHistoryTypeEnum.ADD
      });
      editor.component.upsert(artifactAppPreview, currentCanvasPlacement());
      setTargetSelectChart(`${artifactAppPreview.id}`);
    } catch (error) {
      console.error("创建应用预览组件失败：", error);
      ElMessage.error(`应用预览组件创建失败，请确认系统模块 ${ARTIFACT_APP_PREVIEW_MODULE_ID} 已注册`);
    } finally {
      loading.value = false;
    }
  };

  // 创建编码面板
  const createEncodePanel = async (): Promise<void> => {
    loading.value = true;
    const encodePanel = await createNewComponentInstance({
      moduleId: ENCODE_PANEL_MODULE_ID
    });

    if (!encodePanel) {
      loading.value = false;
      return;
    }

    const initStatus = createLocalPanelStatus(0);
    encodePanel.panelData.push(initStatus);

    await updateComponentLayers(encodePanel as EncodePanelProps, {
      updateHistoryType: UpdateHistoryTypeEnum.ADD
    });

    editor.component.upsert(encodePanel, currentCanvasPlacement());
    setTargetSelectChart(`${encodePanel.id}`);

    // 确保 terminalEnableArr 存在
    if (!editConfig.value.terminalEnableArr) {
      return;
    }
    editConfig.value.terminalEnableArr[encodePanel.id] = encodePanel.name;
    navInfo.value.config.push(`${encodePanel.id}`);
    loading.value = false;
    updateLargeScreenInfo();
  };

  // 完整的导航策略实现
  const allNavigationStrategies: NavigationStrategyMap = {
    [NavigationActionType.COMPONENT]: handleComponentNavigation,
    [NavigationActionType.MATERIAL_LIBRARY]: handleMaterialLibraryNavigation,
    [NavigationActionType.ARTIFACT_APP_PREVIEW]: createArtifactAppPreview,
    [NavigationActionType.DYNAMIC_PANEL_IN_PANEL]: handleDynamicPanelInPanel,
    [NavigationActionType.DYNAMIC_PANEL_IN_ENCODE_PANEL]: handleDynamicPanelInEncodePanel,
    [NavigationActionType.PROJECT_FILTER]: handleProjectFilterControl,
    [NavigationActionType.CALLBACK_MANAGE]: handleCallbackManage,
    [NavigationActionType.DYNAMIC_PANEL]: createDynamicPanel,
    [NavigationActionType.ENCODE_PANEL]: createEncodePanel,
    [NavigationActionType.QUOTE_PANEL]: createQuotePanel
  };

  /**
   * 执行导航策略
   * @param item 导航控制项数据
   * @param customStrategies 自定义策略配置（可选）
   */
  const executeNavigationStrategy = (
    item: NavigationControlItem,
    customStrategies: NavigationStrategyMap = {}
  ): void => {
    const allStrategies = { ...allNavigationStrategies, ...customStrategies };
    const strategy = allStrategies[item.type];

    if (strategy) {
      strategy();
    }
  };

  /**
   * 过滤导航控制项
   * @param items 原始控制项数组
   * @returns 过滤后的控制项数组
   */
  const filterNavigationItems = (items: NavigationControlItem[]): NavigationControlItem[] => {
    return items.filter((item) => {
      if (!item.showCondition) {
        return true;
      }
      return item.showCondition();
    });
  };

  // 提供特定上下文的策略函数
  const getStrategiesForPanelEditor = (): NavigationStrategyMap => ({
    [NavigationActionType.COMPONENT]: handleComponentNavigation,
    [NavigationActionType.MATERIAL_LIBRARY]: handleMaterialLibraryNavigation,
    [NavigationActionType.DYNAMIC_PANEL_IN_PANEL]: handleDynamicPanelInPanel,
    [NavigationActionType.PROJECT_FILTER]: handleProjectFilterControl,
    [NavigationActionType.CALLBACK_MANAGE]: handleCallbackManage
  });

  const getStrategiesForEncodeEditor = (): NavigationStrategyMap => ({
    [NavigationActionType.COMPONENT]: handleEncodeComponentNavigation,
    [NavigationActionType.MATERIAL_LIBRARY]: handleEncodeMaterialLibraryNavigation,
    [NavigationActionType.DYNAMIC_PANEL_IN_ENCODE_PANEL]: handleDynamicPanelInEncodePanel,
    [NavigationActionType.PROJECT_FILTER]: handleProjectFilterControl,
    [NavigationActionType.CALLBACK_MANAGE]: handleCallbackManage
  });

  return {
    NavigationActionType,
    NavigationContext,
    allNavigationStrategies,
    executeNavigationStrategy,
    filterNavigationItems,
    getStrategiesForPanelEditor,
    getStrategiesForEncodeEditor,
    // 向下兼容的别名
    NavActionType: NavigationActionType,
    baseStrategies: allNavigationStrategies,
    executeNavStrategy: executeNavigationStrategy,
    filterControlItems: filterNavigationItems,
    baseNavigationStrategies: allNavigationStrategies
  };
}

// 为了向下兼容，保留原始函数
export const useNavListStrategies = useNavigationStrategies;
