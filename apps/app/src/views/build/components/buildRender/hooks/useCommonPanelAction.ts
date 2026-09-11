import type { Ref } from "vue";

import { createPanelState, type RecreatedPanelStateCopy } from "@screenwright/core";
import { ElMessage } from "element-plus";
import { isNil } from "lodash-es";

import { copyLayers, delLayersAgg } from "@/api/library";
import { useScreenEditor } from "@/core-adapter/useScreenEditor";
import type { GroupCase } from "@/model/Layer";
import { dyPanelCount } from "@/utils/config";
import { getAssetsWidthHeight, handleMessageBox } from "@/utils/utils";
import { useCommandHistory } from "@/views/build/command/useCommandHistory";
import { useHistoryData } from "@/views/build/command/useHistoryData";
import { useCustomAnimation } from "@/views/build/components/buildConfig/attrsRender/components/customAnimation/useCustomAnimation";
import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { DYNAMIC_PANEL_MODULE_ID } from "@/views/build/components/buildRender/core/SystemComponent/panel";
import type { SystemComponentProps } from "@/views/build/components/buildRender/core/SystemComponent/type";
import { type PanelState, PanelType } from "@/views/build/components/buildRender/core/SystemComponent/type";
import { useDataFilter } from "@/views/build/useDataFilter";
import { NavListType } from "@/views/build/useNavAction";
import { useTabsMenuGroup } from "@/views/build/useTabsMenuGroup";

import type { MenuItemForRender } from "../../buildTabs/selectAssets/assetsMenuType";
import type { PanelInfo } from "../../common/useCommonPanelData";
import type { ComponentType } from "../type";
import { getPureComponent, isCanNotPanelPaste } from "../utils";
import { UpdateHistoryTypeEnum, useAction } from "./useAction";
import { useClipboard } from "./useClipboard";
import { useEditStore } from "./useEditStore";

type getFunctionArgs<T> = T extends (...args: infer R) => void ? R : never;

/**
 * 创建新动态面板状态。
 *
 * 实现已搬进 @screenwright/core 的 createPanelState，前后端共用同一份字段约定；
 * 这里保留 app 侧的旧名字，免得十几个调用点跟着改。
 */
export const createLocalPanelStatus = createPanelState;

/**
 * 通用面板操作 hooks
 * @param options 依赖注入参数
 */
export function useCommonPanelAction({
  // 面板信息相关
  panelInfo,
  activeStatusId,
  panelData
}: {
  panelInfo: Ref<PanelInfo>;
  activeStatusId: Ref<string>;
  panelData: Ref<PanelState[]>;
}) {
  const editor = useScreenEditor();
  const { componentList, currentCanvasPlacement, setTargetSelectChart } = useEditStore();
  const {
    addComponentList,
    addGroupComponentList,
    getNewComponentOptions,
    updateComponentLayers,
    handleDelComponent,
    handleTop,
    handleBottom,
    handleMoveUp,
    handleMoveDown,
    handleGroup,
    handleUnGroup,
    handleToDynamicPanel,
    saveLayersAggApi
  } = useAction({
    isDynamicPanel: true
  });
  const { updateFilterOnComponentPasted, updateFilterOnComponentDeleted } = useDataFilter();
  const { clearHistory } = useHistoryData();
  const { tabsList } = useTabsMenuGroup();
  const { recordChart, handlePasteComponent } = useClipboard();
  const { copyAnimationOnStatusCopy } = useCustomAnimation();
  const { copyStatusAnimationOnStatusCopy } = useStatusAnimation();

  /**
   * 当前正在编辑的那个面板在组件树上的 id。
   *
   * panelInfo.value.config 是 initPanelDataFromLocalData 从 componentMap 里取出的**活引用**
   * （componentMap 由 layers 派生），所以 core 一定按 id 找得到它，
   * 不必再把 panelData 数组传来传去。
   */
  const currentPanelId = () => panelInfo.value.config.id;

  /**
   * 添加组件到状态面板
   */
  const addComponentToPanel = async (...args: getFunctionArgs<typeof addComponentList>) => {
    if (!activeStatusId.value) {
      return null;
    }
    const res = await addComponentList(...args);
    if (!res) {
      return null;
    }
    await updateComponentLayers(panelInfo.value.config, {
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });
    return res;
  };

  /**
   * 添加分组组件到面板
   */
  const addGroupComponentToPanel = async (...args: getFunctionArgs<typeof addGroupComponentList>) => {
    const res = await addGroupComponentList(...args);
    updateComponentLayers(panelInfo.value.config, {
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });
    return res;
  };

  /**
   * 添加面板到面板
   */
  const addPanelToPanel = async (toMergePanel?: SystemComponentProps) => {
    const panel = await getNewComponentOptions({
      moduleId: DYNAMIC_PANEL_MODULE_ID
    });
    if (!panel) {
      return;
    }
    const initStatus = createLocalPanelStatus(0);
    panel.panelData.push(initStatus);

    if (toMergePanel) {
      const { id: _id, panelData: _panelData, ...rest } = toMergePanel;
      Object.assign(panel, rest);
    }

    editor.component.upsert(panel, currentCanvasPlacement());
    setTargetSelectChart(`${panel.id}`);
    await updateComponentLayers(panel, { updateHistoryType: UpdateHistoryTypeEnum.ADD });
    await updateComponentLayers(panelInfo.value.config, {
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });

    return panel;
  };

  /**
   * 从面板删除组件
   */
  const deleteComponentFromPanel = async (...args: getFunctionArgs<typeof handleDelComponent>) => {
    await handleDelComponent(...args);
    await updateComponentLayers(panelInfo.value.config, {
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });
  };

  /**
   * 添加状态
   *
   * 注意：显式传入 stateIndex 时（目前仅供 Figma 导入等后台批量流程使用，可能产生稀疏数组）
   * 保持原有的直接赋值语义，不接入撤销重做；仅"追加到末尾"这一交互入口（不传参数，对应
   * 状态管理面板的"新增状态"按钮）才记录为可撤销命令。
   */
  const addPanelStatus = async (stateIndex?: number): Promise<PanelState> => {
    if (!isNil(stateIndex) && panelInfo.value.config) {
      const newStatus = editor.panel.createState(stateIndex);

      // 这里刻意不走 editor.panel.addState：调用方按下标寻址、允许留空洞，
      // 而 addState 遇到越界下标会退化成追加，会让后续 panelData[i] 取到别的状态。
      panelInfo.value.config.panelData[stateIndex] = newStatus;
      await updateComponentLayers(panelInfo.value.config, {
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });
      return newStatus;
    }

    const insertIndex = panelInfo.value.config.panelData?.length || 0;
    const newStatus = editor.panel.createState(insertIndex);
    editor.panel.addState(currentPanelId(), newStatus);
    await updateComponentLayers(panelInfo.value.config, {
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });

    const { createAddPanelStateCommand } = useCommandHistory();
    createAddPanelStateCommand({
      stateIndex: insertIndex,
      state: newStatus,
      insertStateFn: async (index, state) => {
        editor.panel.addState(currentPanelId(), state, index);
        await updateComponentLayers(panelInfo.value.config, {
          updateHistoryType: UpdateHistoryTypeEnum.SKIP
        });
      },
      removeStateFn: async (index) => {
        // 命令按下标记账、core 按 id 摘除：先把下标翻成 id，保持与原实现同样的语义
        const target = panelData.value[index];
        if (target) {
          editor.panel.removeState(currentPanelId(), target.id);
        }
        await updateComponentLayers(panelInfo.value.config, {
          updateHistoryType: UpdateHistoryTypeEnum.SKIP
        });
      }
    });

    return newStatus;
  };

  /**
   * 切换状态
   */
  const changePanelStatus = (statusId: string) => {
    if (!panelInfo.value.config.panelData) {
      return;
    }
    const panelStatus = panelInfo.value.config.panelData.find((item: any) => item.id === statusId);
    if (!panelStatus) {
      return;
    }
    clearHistory();
    activeStatusId.value = statusId;
  };

  /**
   * 状态排序改变
   * @param oldOrder 拖拽开始前的状态顺序快照（由拖拽入口在 dragStart 时捕获并传入）；
   *   缺省时（未接入快照捕获的调用方）保持原有"仅持久化、不记录历史"的行为
   */
  const onStatusOrderChange = (oldOrder?: PanelState[]) => {
    updateComponentLayers(panelInfo.value.config, {
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });

    if (oldOrder && oldOrder.length === panelData.value.length) {
      const newOrder = [...panelData.value];
      const { createReorderPanelStateCommand } = useCommandHistory();
      createReorderPanelStateCommand({
        oldOrder,
        newOrder,
        applyOrderFn: async (order) => {
          panelData.value.splice(0, panelData.value.length, ...order);
          await updateComponentLayers(panelInfo.value.config, {
            updateHistoryType: UpdateHistoryTypeEnum.SKIP
          });
        }
      });
    }
  };

  /**
   * 复制源状态的全部子组件（服务端各自新建、发新 id），返回复制出的状态与新旧组件配对。
   * 供 onStatusCopy 的初次执行与 CopyPanelStateCommand 的 rebuildFn（重做）共用。
   */
  const copyPanelStateChildren = async (
    sourceStatus: PanelState
  ): Promise<{ newState: PanelState; pairs: RecreatedPanelStateCopy[]; componentIdMap: Record<number, number> }> => {
    // 「换新 id、名字加 -副本、其余样式沿用」这套约定归 core；config 先留空，
    // 等下面逐个复制完子组件（拿到服务端分配的真实 id）再填。
    const newState = editor.panel.copyState(sourceStatus, []);
    const componentIdMap: Record<number, number> = {};
    const pairs: RecreatedPanelStateCopy[] = [];

    const copyPromises = sourceStatus.config.map(async (forCopyComponent: any) => {
      try {
        const {
          code,
          message,
          result: remoteCopiedComponentData
        } = await copyLayers(forCopyComponent.id, true, true, UpdateHistoryTypeEnum.SKIP);
        if (code !== 200) {
          throw new Error(message);
        }
        const remoteCopiedComponent = JSON.parse(remoteCopiedComponentData.config);

        // 建立新旧组件ID的映射关系
        if (remoteCopiedComponent && remoteCopiedComponent.id) {
          componentIdMap[forCopyComponent.id] = remoteCopiedComponent.id;
          if (forCopyComponent.children && remoteCopiedComponent.children.length > 0) {
            for (let i = 0; i < forCopyComponent.children.length; i++) {
              const childComponent = forCopyComponent.children[i];
              const remoteChildComponent = remoteCopiedComponent.children[i];
              if (childComponent && remoteChildComponent) {
                componentIdMap[childComponent.id] = remoteChildComponent.id;
              }
            }
          }
          pairs.push({ original: forCopyComponent, created: remoteCopiedComponent });
        }

        return remoteCopiedComponent;
      } catch (error) {
        console.log("复制组件失败", error);
        return null;
      }
    });

    const results = await Promise.all(copyPromises);
    const successfulCopies = results.filter((result: any) => Boolean(result));
    newState.config = successfulCopies;

    return { newState, pairs, componentIdMap };
  };

  /**
   * 从 panelData 摘除一个复制出的状态并硬删除其当前子组件。
   * 供 CopyPanelStateCommand 的 teardownFn（撤销）复用，对称于 onStatusDelete 的删除逻辑。
   */
  const teardownCopiedPanelState = async (state: PanelState): Promise<void> => {
    if (!editor.panel.findState(currentPanelId(), state.id)) {
      return;
    }

    await Promise.all(state.config.map((component) => delLayersAgg(component.id, UpdateHistoryTypeEnum.SKIP)));

    editor.panel.removeState(currentPanelId(), state.id);
    if (activeStatusId.value === state.id) {
      activeStatusId.value = panelData.value.length > 0 ? panelData.value[0].id : "";
      if (panelData.value.length === 0) {
        componentList.value = [];
      }
    }
    await updateComponentLayers(panelInfo.value.config, {
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });
  };

  /**
   * 复制状态
   */
  const onStatusCopy = async (status: PanelState) => {
    try {
      const { newState: localCopiedStatus, componentIdMap } = await copyPanelStateChildren(status);

      if (localCopiedStatus.config.length === 0) {
        ElMessage.error("复制状态失败");
        return;
      }

      editor.panel.addState(currentPanelId(), localCopiedStatus);
      activeStatusId.value = localCopiedStatus.id;

      await updateComponentLayers(panelInfo.value.config, {
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });

      // 复制动画配置
      try {
        await copyAnimationOnStatusCopy(status, localCopiedStatus, componentIdMap);
      } catch (error) {
        console.error("复制自定义动画配置失败", error);
      }

      // 复制状态动画配置
      try {
        await copyStatusAnimationOnStatusCopy(status, localCopiedStatus, componentIdMap);
      } catch (error) {
        console.error("复制状态动画配置失败", error);
      }

      if (updateFilterOnComponentPasted) {
        localCopiedStatus.config.forEach(async (component: any) => {
          await updateFilterOnComponentPasted!(component.id);
        });
      }

      // 动画复制仅在初次执行时进行，重做（redo）只重建状态与子组件结构，
      // 与 DeletePanelStateCommand 的既有范围保持一致（撤销重做不管理动画配置）。
      const { createCopyPanelStateCommand } = useCommandHistory();
      createCopyPanelStateCommand({
        sourceStatus: status,
        copiedState: localCopiedStatus,
        rebuildFn: async (sourceStatus) => {
          const { newState, pairs: newPairs } = await copyPanelStateChildren(sourceStatus);
          if (newState.config.length === 0) {
            throw new Error("重做复制状态失败: 没有成功复制任何子组件");
          }
          editor.panel.addState(currentPanelId(), newState);
          activeStatusId.value = newState.id;
          await updateComponentLayers(panelInfo.value.config, {
            updateHistoryType: UpdateHistoryTypeEnum.SKIP
          });
          return { newState, pairs: newPairs };
        },
        teardownFn: teardownCopiedPanelState
      });
    } catch (error) {
      console.error("复制组件过程出错", error);
    }
  };

  /**
   * 删除状态
   */
  const onStatusDelete = async (status: PanelState) => {
    const isCanDelete = await handleMessageBox("是否删除所选状态?", {
      confirmButtonText: "确定",
      cancelButtonText: "取消"
    });
    if (!isCanDelete) {
      return;
    }

    // 删除前在“意图边界”捕获撤销所需的快照：状态索引、状态元数据、子组件（深拷贝防止后续被改）
    const statusIndex = panelData.value.findIndex((item) => item.id === status.id);
    if (statusIndex === -1) {
      return;
    }
    const { config: capturedChildren, ...stateMeta } = JSON.parse(JSON.stringify(status)) as PanelState;

    // 标题 -> moduleId（与响应历史处理器一致；放在重建时解析以适配多轮 undo 后的 id 漂移）
    const resolveModuleId = (title: string): number | undefined =>
      tabsList.value.find((item) => item.name === title)?.id;

    // 子组件硬删除：必须传 SKIP，避免响应拦截器把它们记成扁平删除命令（双重记账）
    const deletePromises = status.config.map(async (component) => {
      if (updateFilterOnComponentDeleted) {
        await updateFilterOnComponentDeleted(component.id);
      }
      const { code, message } = await delLayersAgg(component.id, UpdateHistoryTypeEnum.SKIP);
      if (code !== 200) {
        console.error("删除组件失败", message);
        return false;
      }
      return true;
    });
    try {
      const results = await Promise.all(deletePromises);
      const allDeleted = results.every((result: boolean) => result === true);
      if (!allDeleted) {
        return;
      }

      editor.panel.removeState(currentPanelId(), status.id);
      if (activeStatusId.value === status.id) {
        if (panelData.value.length > 0) {
          activeStatusId.value = panelData.value[0].id;
        } else {
          activeStatusId.value = "";
          componentList.value = [];
        }
      }
      await updateComponentLayers(panelInfo.value.config, {
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });

      // 延迟获取 useCommandHistory：它经 useHistoryAction → usePanelAction 间接依赖本 hook，
      // 在 setup 阶段调用会形成初始化环（栈溢出）；放到用户操作时再取，此时全局状态已就绪。
      const { createDeletePanelStateCommand } = useCommandHistory();

      // 在意图边界压入一条结构化撤销命令（副作用闭包注入）
      createDeletePanelStateCommand({
        statusIndex,
        stateMeta,
        children: capturedChildren,
        // undo：从捕获的子组件数据重建服务端记录（新 id），不经过“活动状态”添加路径，避免重复落位
        recreateChildrenFn: async (childrenToCreate) => {
          const recreated: { original: ComponentType; created: ComponentType }[] = [];
          for (const child of childrenToCreate) {
            const result = await saveLayersAggApi(
              {
                config: JSON.stringify(getPureComponent(child)),
                moduleId: resolveModuleId(child.title),
                status: true
              },
              { updateHistoryType: UpdateHistoryTypeEnum.SKIP }
            );
            if (result) {
              recreated.push({ original: child, created: JSON.parse(result.config) });
            }
          }
          return recreated;
        },
        // redo：删除当前（上一轮 undo 重建出的新 id）子组件
        deleteChildrenFn: async (componentIds) => {
          await Promise.all(componentIds.map((id) => delLayersAgg(Number(id), UpdateHistoryTypeEnum.SKIP)));
        },
        // undo：把状态插回 panelData 原索引并持久化整面板
        insertStateFn: async (index, state) => {
          editor.panel.addState(currentPanelId(), state, index);
          activeStatusId.value = state.id;
          await updateComponentLayers(panelInfo.value.config, {
            updateHistoryType: UpdateHistoryTypeEnum.SKIP
          });
        },
        // redo：把状态从 panelData 摘除并持久化整面板
        removeStateFn: async (index) => {
          // 命令按下标记账、core 按 id 摘除：先把下标翻成 id，保持与原实现同样的语义
          const target = panelData.value[index];
          const removed = target ? editor.panel.removeState(currentPanelId(), target.id) : null;
          if (removed && activeStatusId.value === removed.id) {
            activeStatusId.value = panelData.value.length > 0 ? panelData.value[0].id : "";
            if (panelData.value.length === 0) {
              componentList.value = [];
            }
          }
          await updateComponentLayers(panelInfo.value.config, {
            updateHistoryType: UpdateHistoryTypeEnum.SKIP
          });
        }
      });
    } catch (error) {
      console.error("删除状态过程出错", error);
    }
  };

  /**
   * 往面板添加组件入口
   * @param item 组件信息
   * @param item.id 组件ID
   * @param item.moduleId 组件所属模块ID
   * @param item.type 组件类型
   * @param item.img 组件图片
   * @param item.url 组件链接
   */
  const componentAddToPanelEntry = async (
    item: MenuItemForRender,
    navListType: NavListType,
    position?: {
      left: number;
      top: number;
    }
  ) => {
    let result: ComponentType | GroupCase[] | null = null;
    if (navListType === NavListType.Component) {
      result = await addComponentToPanel(item, position);
    }
    if (navListType === NavListType.MaterialLibrary) {
      if (item.type != "group" && item.type && item.img) {
        const res = await getAssetsWidthHeight(item.type, item.img);
        const { width, height } = res;

        result = await addComponentToPanel(item, {
          left: position?.left || 0,
          top: position?.top || 0,
          component: {
            width: width,
            height: height
          } as any,
          url: item.url
        });
      } else {
        // 处理组数据添加逻辑
        result = await addGroupComponentToPanel(item, position);
      }
    }
    return result;
  };

  /**
   * 菜单操作方法
   */
  const handleTopAndUpdate = async () => {
    handleTop();
    await updateComponentLayers(panelInfo.value.config, {
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });
  };

  const handleBottomAndUpdate = () => {
    handleBottom();
    updateComponentLayers(panelInfo.value.config, {
      fullUpdateGroup: false,
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });
  };

  const handleMoveUpAndUpdate = () => {
    handleMoveUp();
    updateComponentLayers(panelInfo.value.config, {
      fullUpdateGroup: false,
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });
  };

  const handleMoveDownAndUpdate = () => {
    handleMoveDown();
    updateComponentLayers(panelInfo.value.config, {
      fullUpdateGroup: false,
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });
  };

  const handleGroupAndUpdate = async () => {
    await handleGroup();
    updateComponentLayers(panelInfo.value.config, {
      fullUpdateGroup: false,
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });
  };

  const handleToDynamicPanelAndUpdate = async () => {
    await handleToDynamicPanel(true);
    updateComponentLayers(panelInfo.value.config, {
      fullUpdateGroup: false,
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });
  };

  const handleUnGroupAndUpdate = async () => {
    await handleUnGroup();
    updateComponentLayers(panelInfo.value.config, {
      fullUpdateGroup: false,
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });
  };

  const handleDelComponentAndUpdate = async () => {
    await handleDelComponent();
    await updateComponentLayers(panelInfo.value.config, {
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });
  };

  const handlePasteAndUpdate = async () => {
    if (!recordChart.value || recordChart.value.length === 0) {
      return;
    }
    const isHasPanel = recordChart.value.some((v) => v.component.prop === PanelType.dynamicPanel);

    if (
      panelInfo.value.config.component.prop == PanelType.dynamicPanel &&
      isHasPanel &&
      panelInfo.value.config.parentDynamicPanelId &&
      panelInfo.value.config.parentDynamicPanelId.length === dyPanelCount - 1
    ) {
      ElMessage.warning(`动态面板最多嵌套${dyPanelCount}层`);
      return;
    }
    const canNotPaste = isCanNotPanelPaste(recordChart.value[0]);
    console.log(recordChart.value);
    if (canNotPaste) {
      ElMessage.warning("该类型面板不支持粘贴组件！");
      return;
    }

    const res = await handlePasteComponent();
    await updateComponentLayers(panelInfo.value.config, {
      fullUpdateGroup: false,
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });

    return res;
  };

  return {
    addComponentToPanel,
    addGroupComponentToPanel,
    addPanelStatus,
    changePanelStatus,
    onStatusOrderChange,
    onStatusCopy,
    onStatusDelete,
    addPanelToPanel,
    deleteComponentFromPanel,
    // 菜单操作方法
    handleTopAndUpdate,
    handleBottomAndUpdate,
    handleMoveUpAndUpdate,
    handleMoveDownAndUpdate,
    handleGroupAndUpdate,
    handleUnGroupAndUpdate,
    handleDelComponentAndUpdate,
    handlePasteAndUpdate,
    componentAddToPanelEntry,
    handleToDynamicPanelAndUpdate
  };
}
