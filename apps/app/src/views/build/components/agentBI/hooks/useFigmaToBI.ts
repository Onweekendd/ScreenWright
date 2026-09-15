import { computed, shallowRef } from "vue";
import { createGlobalState, until } from "@vueuse/core";

import type { SystemComponentProps } from "@screenwright/types";
import { type ComponentType, FolderEnum, MediaEnum } from "@screenwright/types";
import { ElMessage } from "element-plus";
import { isNil } from "lodash-es";

import { uploadMinioScene } from "@/api/assets";
import { useScreenEditor } from "@/core-adapter/useScreenEditor";
import router from "@/router";
import { uuid } from "@/utils/utils";
import { DYNAMIC_PANEL_MODULE_ID } from "@/views/build/components/buildRender/core/SystemComponent/panel";
import { PanelType } from "@/views/build/components/buildRender/core/SystemComponent/type";
import { UpdateHistoryTypeEnum, useAction } from "@/views/build/components/buildRender/hooks/useAction";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { FileTypeEnum, ResourceTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";
import { usePanelAction } from "@/views/build/components/panelEditor/usePanelAction";
import { usePanelData } from "@/views/build/components/panelEditor/usePanelData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useInitLargeScreenData } from "@/views/build/useInitLargeScreenData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import { enqueueCanvasMutation } from "./useCanvasMutationQueue";

export interface ConvertChunkDataType {
  component: ComponentType | null;
  nodeId: string;
  parentNodeId: string | null;
  moduleId: number;
  stateIndex?: number;
}

interface ConvertedComponentEntry {
  id: string;
  component: ComponentType;
}

const ADD_OPTIONS = {
  showLoading: false,
  showAddLoading: false,
  updateHistoryType: UpdateHistoryTypeEnum.SKIP
};

export const useFigmaToBI = createGlobalState(() => {
  const currentAddingComponent = shallowRef<ComponentType | null>(null);

  const { navInfo } = useLargeScreenInfo();
  const { allComponentMap } = useGlobalComponentData();
  const { isLoad: isPanelLoad, setIsLoad: setPanelLoad, panelInfo } = usePanelData();
  const { isLoad: isScreenLoad } = useInitLargeScreenData();
  const { addComponentList, buildComponentInstance, updateComponentLayers } = useAction();
  const { addComponentToPanel, addPanelStatus, changePanelStatus, addPanelToPanel } = usePanelAction();
  const { isDynamicPanel, componentList } = useEditStore();
  const editor = useScreenEditor();

  const route = computed(() => router.currentRoute.value);

  const convertedComponents = new Map<string, ConvertedComponentEntry>();

  const rememberConvertedComponent = (nodeId: string, component: ComponentType) => {
    convertedComponents.set(nodeId, {
      id: `${component.id}`,
      component
    });
  };

  /**
   * 将组件的 Figma 图片 URL 上传到 MinIO，返回上传后的新 URL。
   * 仅处理 FtImg 类型组件且 URL 为内网地址的情况，其他情况返回 null。
   *
   * @param component - 需要上传图片的 BI 组件
   * @returns 上传成功后的 MinIO URL，失败或不需要上传时返回 null
   */
  const uploadImageComponentToMinio = async (component: ComponentType): Promise<string | null> => {
    const imageUrl: string | undefined = component?.option?.url;
    if (
      !([MediaEnum.SwImg] as string[]).includes(component.component.prop) ||
      !imageUrl ||
      !/^https?:\/\/.+:\d+/.test(imageUrl)
    ) {
      return null;
    }

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.warn(`[FigmaToBI] fetch 图片失败: ${response.status} ${imageUrl}`);
        return null;
      }
      const blob = await response.blob();
      const fileName = imageUrl.split("/").pop() || `figma-${uuid()}.png`;
      const file = new File([blob], fileName, { type: blob.type || "image/png" });

      const uploadRes = await uploadMinioScene({
        name: fileName,
        resourceType: ResourceTypeEnum.image,
        groupId: "",
        fileType: FileTypeEnum.personalScreen,
        coverFile: null,
        coverFileUrl: null,
        largeId: `${navInfo.value.id}`,
        file,
        fileUrl: null,
        applicationCode: "BI"
      });

      if (uploadRes.success && uploadRes.result?.url) {
        return uploadRes.result.url;
      }
      console.warn("[FigmaToBI] 图片上传失败", uploadRes);
      return null;
    } catch (e) {
      console.warn(`[FigmaToBI] 图片上传异常，保持原始 url：${imageUrl}`, e);
      return null;
    }
  };

  /**
   * 导航到指定动态面板页，并等待面板数据加载完成。
   * 若当前路由已在目标面板则跳过导航。
   *
   * @param panelId - 目标动态面板组件 ID
   */
  const navigateToPanel = async (panelId: string | number) => {
    const isSamePanel = route.value.name === "panel" && String(route.value.params.cid) === String(panelId);
    if (isSamePanel) {
      return;
    }
    setPanelLoad(false);
    await router.push({ name: "panel", params: { id: navInfo.value.id, cid: panelId } });
    await until(isPanelLoad).toBe(true);
  };

  /**
   * 导航回大屏根级页面，并等待大屏数据加载完成。
   * 若当前路由已在大屏根级则跳过导航——否则 componentList 仍绑定在上一个面板的本地列表上，
   * 顶层（无 parentNodeId）组件会被 addComponentList 误塞进那个面板而非大屏根级列表。
   */
  const navigateToRoot = async () => {
    if (route.value.name === "build") {
      return;
    }
    isScreenLoad.value = false;
    await router.push(`/build/${navInfo.value.id}`);
    await until(isScreenLoad).toBe(true);
  };

  /**
   * 将 Figma 转换的组件添加到动态面板中。
   * 会先导航到目标面板并切换到对应状态，再执行添加操作。
   * 若为面板类组件（DYNAMIC_PANEL_MODULE_ID）则通过 addPanelToPanel 添加，否则通过 addComponentToPanel 添加。
   * 图片类组件添加完成后会自动上传图片至 MinIO 并更新组件数据。
   *
   * @param parentComponent - 父动态面板组件
   * @param component - 待添加的 BI 组件
   * @param nodeId - Figma 节点 ID，用于维护映射关系
   * @param moduleId - 组件模块 ID
   * @param stateIndex - 目标面板状态索引，undefined 时不切换状态
   * @returns 新添加的组件，失败时返回 null
   */
  const addToDynamicPanel = async (
    parentComponent: ComponentType,
    component: ComponentType,
    nodeId: string,
    moduleId: number,
    stateIndex?: number
  ): Promise<ComponentType | null> => {
    await navigateToPanel(parentComponent.id);

    if (!isNil(stateIndex)) {
      let panelStatus = panelInfo.value.config.panelData[stateIndex];
      if (!panelStatus) {
        panelStatus = await addPanelStatus(stateIndex);
      }
      changePanelStatus(panelStatus.id);
    }

    if (`${moduleId}` === `${DYNAMIC_PANEL_MODULE_ID}`) {
      const newComponent = await addPanelToPanel(component as SystemComponentProps);
      if (!newComponent) {
        ElMessage.error("组件添加失败");
        return null;
      }
      rememberConvertedComponent(nodeId, newComponent);
      return newComponent;
    }

    const newComponent = await addComponentToPanel({ moduleId }, component, ADD_OPTIONS);
    if (!newComponent) {
      ElMessage.error("组件添加失败");
      return null;
    }

    uploadImageComponentToMinio(newComponent).then((imageUrl) => {
      if (!imageUrl) {
        return;
      }
      newComponent.data = [{ value: imageUrl }];
      updateComponentLayers(newComponent);
    });

    rememberConvertedComponent(nodeId, newComponent);
    return newComponent;
  };

  /**
   * 把转换出来的组件加进分组，按分组所在位置分两条路：
   *
   * - **动态面板里的分组**：先导航到该面板、切到对应状态，再 addComponentToPanel，
   *   然后把新组件从顶层列表摘出来挂进分组（figma / codia 走这条）。
   * - **大屏根级的分组**：没有面板上下文，直接用 core 的 placement 落位
   *   （requirementToBIWorkflow 走这条）。
   *
   * @param groupComponent - 目标分组组件
   * @param component - 待添加的 BI 组件
   * @param nodeId - 转换侧的节点 ID，用于维护映射关系
   * @param moduleId - 组件模块 ID
   * @returns 新添加的组件，失败时返回 null
   */
  const addToGroup = async (
    groupComponent: ComponentType<FolderEnum.group>,
    component: ComponentType,
    nodeId: string,
    moduleId: number
  ): Promise<ComponentType | null> => {
    if (groupComponent.parentDynamicPanelId && groupComponent.parentDynamicPanelId.length > 0) {
      const lastPanelId = groupComponent.parentDynamicPanelId[groupComponent.parentDynamicPanelId.length - 1];
      const isSamePanel = route.value.name === "panel" && String(route.value.params.cid) === String(lastPanelId);

      if (!isSamePanel) {
        setPanelLoad(false);
        await router.push({ name: "panel", params: { id: navInfo.value.id, cid: lastPanelId } });
        await until(isPanelLoad).toBe(true);

        const targetState = panelInfo.value.config.panelData.find((state) => {
          state.config.some((c) => c.id === groupComponent.id);
        });
        if (targetState) {
          changePanelStatus(targetState.id);
        }
      }
    }

    // 根级分组：编辑器停在大屏根画布，没有面板上下文，走 core 的 placement 落位。
    //
    // 以前这里直接 `return null`，因为 figma / codia 的分组永远嵌在动态面板里，从没走到过根级。
    // requirementToBIWorkflow 把 ft-folder 建在根级后这条限制才暴露：7 个叶子组件全被静默丢弃，
    // 画布上只剩 6 个空分组，且因为分组尺寸由成员包围盒推导，全都是 0×0——
    // 现象看着像「组件没生成」，实际是生成了、被这一行扔了，没有任何报错。
    if (!isDynamicPanel()) {
      const newComponent = await buildComponentInstance(
        { moduleId },
        { ...component, parent: groupComponent.id },
        ADD_OPTIONS
      );
      if (!newComponent) {
        ElMessage.error("组件添加失败");
        return null;
      }

      // upsert 内部会 reflowGroups 重算分组包围盒，分组的 left/top/宽高不用也不该自己算
      editor.component.upsert(newComponent, { parentId: groupComponent.id, parentType: "group" });
      await updateComponentLayers(groupComponent, {
        fullUpdateGroup: true,
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });

      rememberConvertedComponent(nodeId, newComponent);
      return newComponent;
    }

    const newComponent = await addComponentToPanel(
      { moduleId },
      { ...component, parent: groupComponent.id },
      ADD_OPTIONS
    );
    if (!newComponent) {
      ElMessage.error("组件添加失败");
      return null;
    }

    groupComponent.children!.push(newComponent);

    const newComponentIndex = componentList.value.findIndex((item) => item.id === newComponent.id);
    if (newComponentIndex > -1) {
      componentList.value.splice(newComponentIndex, 1);
      await updateComponentLayers(panelInfo.value.config, {
        fullUpdateDynamicPanel: false,
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });
      await updateComponentLayers(groupComponent, {
        fullUpdateGroup: false,
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });
    }

    rememberConvertedComponent(nodeId, newComponent);
    return newComponent;
  };

  /**
   * 将 Figma 转换的组件添加到大屏根级组件列表。
   * 用于没有父组件（顶层节点）的场景。
   *
   * @param component - 待添加的 BI 组件
   * @param nodeId - Figma 节点 ID，用于维护映射关系
   * @param moduleId - 组件模块 ID
   * @returns 新添加的组件，失败时返回 null
   */
  const addToRoot = async (
    component: ComponentType,
    nodeId: string,
    moduleId: number
  ): Promise<ComponentType | null> => {
    await navigateToRoot();
    const newComponent = await addComponentList({ moduleId }, component, ADD_OPTIONS);
    if (!newComponent) {
      ElMessage.error("组件添加失败");
      return null;
    }
    rememberConvertedComponent(nodeId, newComponent);
    return newComponent;
  };

  /**
   * 整个转换流程结束后调用：把路由导航回大屏根级，并清空本轮 nodeId 映射。
   * 与 addProcessedComponent 共用同一条画布互斥队列，确保排在最后一个待处理组件之后执行，
   * 不会在还有排队中的 data-node-conversion chunk 时提前跳走。
   */
  const finishConversion = async (): Promise<void> => {
    return enqueueCanvasMutation(async () => {
      await navigateToRoot();
      // 清空本轮 nodeId 映射：既释放内存，也让下一轮转换里位置派生的 nodeId 不会被
      // addProcessedComponent 的幂等守卫误判为「已添加」而跳过。
      convertedComponents.clear();
    });
  };

  /**
   * 处理单个 Figma 转换结果，将组件添加到大屏中正确的位置。
   * 根据父节点类型分发到对应的添加策略：
   * - 无父节点 → 添加到根级列表
   * - 父节点为动态面板 → 添加到动态面板
   * - 父节点为分组 → 添加到分组
   * - 其他情况返回 null
   *
   * 幂等：同一 nodeId 重复到达（流重放 / resume / 工作流重试）直接跳过，避免落出重复组件。
   *
   * @param chunkData - Figma 节点转换结果，包含组件数据、节点 ID、父节点 ID、模块 ID 及状态索引
   * @returns 成功添加的组件，component 为 null、重复 nodeId 或添加失败时返回 null
   */
  const addProcessedComponent = async (chunkData: ConvertChunkDataType): Promise<ComponentType | null> => {
    const { parentNodeId, nodeId, moduleId, component, stateIndex } = chunkData;
    if (!component) {
      return null;
    }

    // 幂等保护：同一 nodeId 的 chunk 若因流重放 / resume / 工作流重试到达两次，直接跳过——
    // 否则会在画布上落出两个内容相同、id 不同的组件（如 3417418 / 3417480）。
    // 映射在 finishConversion（整轮转换结束）时清空，避免跨轮次误伤。
    if (convertedComponents.has(nodeId)) {
      return null;
    }

    // 画布只有一份：Figma 转换的逐个组件落地必须与其它 tab 的画布写入串行，避免并发写坏组件树/路由跳转互相打断
    return enqueueCanvasMutation(async () => {
      currentAddingComponent.value = component;

      try {
        const parentEntry = parentNodeId ? convertedComponents.get(parentNodeId) : undefined;
        if (!parentEntry) {
          return await addToRoot(component, nodeId, moduleId);
        }

        // allComponentMap follows the current editor route. After entering a dynamic panel it no longer
        // contains the panel component itself, so retain the component created during this conversion.
        const parentComponent = allComponentMap.value.get(parentEntry.id) ?? parentEntry.component;

        if (parentComponent.component.prop === PanelType.dynamicPanel) {
          return await addToDynamicPanel(parentComponent, component, nodeId, moduleId, stateIndex);
        }

        if (parentComponent.component.prop === FolderEnum.group && parentComponent.children) {
          return await addToGroup(parentComponent as ComponentType<FolderEnum.group>, component, nodeId, moduleId);
        }

        return null;
      } finally {
        currentAddingComponent.value = null;
      }
    });
  };

  return {
    currentAddingComponent,
    addProcessedComponent,
    finishConversion
  };
});
