import { computed, ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import type { PanelState } from "@screenwright/types";
import { ElMessage } from "element-plus";

import { useHistoryData } from "@/views/build/command/useHistoryData";

import type { ComponentType } from "../components/buildRender/type";
import { AddComponentCommand } from "./AddComponentCommand";
import { AddPanelStateCommand } from "./AddPanelStateCommand";
import { CopyPanelStateCommand, type RecreatedPanelStateCopy } from "./CopyPanelStateCommand";
import { DeleteComponentCommand } from "./DeleteComponentCommand";
import { DeleteGroupCommand, type RecreatedGroup, type RecreatedGroupComponent } from "./DeleteGroupCommand";
import { DeletePanelStateCommand, type RecreatedPanelStateChild } from "./DeletePanelStateCommand";
import { RemoveGroupMemberCommand } from "./RemoveGroupMemberCommand";
import { ReorderPanelStateCommand } from "./ReorderPanelStateCommand";
import { type GroupBuildResult, type GroupDissolveResult, ToggleGroupCommand } from "./ToggleGroupCommand";
import { UpdateComponentCommand } from "./UpdateComponentCommand";
import { useHistoryAction } from "./useHistoryAction";
import { createDebouncedBatchDeleteUpdater, createDebouncedBatchUpdater } from "./utils";

/**
 * 命令历史记录管理 hooks
 * 整合了 useCacheState 和 useHistory 功能，使用命令模式管理历史记录
 *
 * @example
 * ```typescript
 * // 在组件中使用
 * const {
 *   updateComponent,
 *   addComponent,
 *   deleteComponent,
 *   undo,
 *   redo,
 *   canUndo,
 *   canRedo,
 *   clearHistory
 * } = useCommandHistory()
 *
 * // 更新组件
 * await updateComponent([updatedComponent])
 *
 * // 添加组件
 * await addComponent(newComponent, moduleId)
 *
 * // 删除组件
 * await deleteComponent([componentId])
 *
 * // 撤销
 * await undo()
 *
 * // 重做
 * await redo()
 * ```
 */
export const useCommandHistory = createGlobalState(() => {
  // 获取原有的 hooks
  const {
    cacheComponentList,
    updateCacheComponent,
    updateCacheComponents,
    deleteCacheComponents,
    commandManager,
    clearHistory
  } = useHistoryData();
  const {
    executeUpdateComponents: historyExecuteUpdateComponents,
    executeAddComponent: historyExecuteAddComponent,
    executeDeleteComponent: historyExecuteDeleteComponent
  } = useHistoryAction();

  /**
   * 获取缓存状态的函数
   * @returns 当前缓存状态
   */
  const getCacheState = () => {
    return cacheComponentList.value;
  };

  /**
   * 包装后的添加组件函数，匹配 AddComponentCommand 的预期签名
   * @param component 要添加的组件
   * @param moduleId 模块ID
   * @returns 添加的组件或null
   */
  const wrappedAddComponent = async (component: ComponentType, moduleId: number): Promise<ComponentType | null> => {
    return await historyExecuteAddComponent(component, moduleId);
  };

  /**
   * 包装后的删除单个组件函数，匹配 AddComponentCommand 的预期签名
   * @param componentId 要删除的组件ID
   * @param showConfirm 是否显示确认对话框
   * @returns 删除是否成功
   */
  const wrappedDeleteSingleComponent = async (componentId: string, showConfirm?: boolean): Promise<boolean> => {
    return await historyExecuteDeleteComponent([componentId], showConfirm);
  };

  /**
   * 包装后的删除多个组件函数，匹配 DeleteComponentCommand 的预期签名
   * @param componentIds 要删除的组件ID列表
   * @param showConfirm 是否显示确认对话框
   * @returns 删除是否成功
   */
  const wrappedDeleteMultipleComponents = async (componentIds: string[], showConfirm?: boolean): Promise<boolean> => {
    return await historyExecuteDeleteComponent(componentIds, showConfirm);
  };

  /**
   * 执行组件更新命令
   * @param updatedComponents 更新后的组件列表
   * @param originalComponents 更新前的组件列表，如果不提供则从缓存中获取
   * @returns 执行结果
   */
  const createUpdateComponentCommand = async (
    updatedComponents: ComponentType[],
    originalComponents?: ComponentType[]
  ) => {
    // 如果没有提供原始组件，从缓存中获取
    let originalComps = originalComponents;
    if (!originalComps) {
      originalComps = [];
      const cache = getCacheState();
      if (cache) {
        for (const component of updatedComponents) {
          const original = cache.get(component.id.toString());
          if (original) {
            originalComps.push(original);
          }
        }
      }
    }

    if (originalComps.length === 0) {
      return {
        success: false,
        error: "无法获取原始组件数据"
      };
    }

    const command = new UpdateComponentCommand({
      updatedComponents,
      originalComponents: originalComps,
      executeUpdateFn: historyExecuteUpdateComponents,
      description: "组件更新"
    });

    // 添加到历史记录
    commandManager.addCommand(command);

    // 更新缓存
    updateCacheComponents(updatedComponents);

    return {
      success: true,
      message: "组件更新成功",
      data: { updatedComponents }
    };
  };

  /**
   * 执行组件添加命令
   * @param component 要添加的组件
   * @param moduleId 模块ID
   * @returns 执行结果
   */
  const createAddComponentCommand = async (component: ComponentType, moduleId: number) => {
    const command = new AddComponentCommand({
      componentToAdd: JSON.parse(JSON.stringify(component)),
      moduleId,
      executeAddFn: wrappedAddComponent,
      executeDeleteFn: wrappedDeleteSingleComponent,
      onAfterUndo: (oldComponent: ComponentType) => {
        deleteCacheComponents([oldComponent]);
      },
      onAfterRedo: (oldComponent: ComponentType, newComponent: ComponentType) => {
        commandManager.updateComponentIdInHistory(oldComponent.id.toString(), newComponent.id.toString());
      },
      description: "组件添加"
    });

    // 添加到历史记录
    commandManager.addCommand(command);

    // 更新缓存
    updateCacheComponent(component);

    return {
      success: true,
      message: "组件添加成功",
      data: { addedComponent: component }
    };
  };

  /**
   * 执行组件删除命令
   * @param componentIds 要删除的组件ID列表
   * @param moduleIds 对应的模块ID列表，如果不提供则使用默认值
   * @returns 执行结果
   */
  const createDeleteComponentCommand = async (deleteInfos: { component: ComponentType; moduleId: number }[]) => {
    const cache = getCacheState();
    if (!cache) {
      return {
        success: false,
        error: "缓存状态不可用"
      };
    }

    const command = new DeleteComponentCommand({
      deleteComponentInfos: deleteInfos,
      executeDeleteFn: wrappedDeleteMultipleComponents,
      executeAddFn: wrappedAddComponent,
      onAfterUndo: (deleteComponentInfos: { originalComponent: ComponentType; newComponent: ComponentType }[]) => {
        deleteComponentInfos.forEach((info) => {
          commandManager.updateComponentIdInHistory(
            info.originalComponent.id.toString(),
            info.newComponent.id.toString()
          );
        });
      },
      onAfterRedo: (deletedComponents: ComponentType[]) => {
        deletedComponents.forEach((component) => {
          deleteCacheComponents([component]);
        });
      },
      description: "组件删除"
    });

    // 添加到历史记录
    commandManager.addCommand(command);

    // 更新缓存
    const componentsToDelete = deleteInfos.map((info) => info.component);
    deleteCacheComponents(componentsToDelete);

    return {
      success: true,
      message: "组件删除成功",
      data: { deletedComponents: componentsToDelete }
    };
  };

  /**
   * 记录“删除动态面板状态”这一结构操作的撤销重做命令。
   *
   * 与扁平的增/改/删不同，删状态是组合操作（删 N 个子组件 + 摘除 panelData 状态），
   * 响应拦截器无法表达其语义，因此由调用方（onStatusDelete）在删除发生后于“意图边界”
   * 直接压入本命令。副作用（重建/删除/插入/摘除状态）由调用方注入；这里只负责把历史栈里的
   * 旧组件 id 在 undo 重建后重映射为新 id。
   *
   * @param params 命令参数（已捕获的状态元数据、索引、子组件，以及四个副作用闭包）
   */
  const createDeletePanelStateCommand = (params: {
    statusIndex: number;
    stateMeta: Omit<PanelState, "config">;
    children: ComponentType[];
    recreateChildrenFn: (children: ComponentType[]) => Promise<RecreatedPanelStateChild[]>;
    deleteChildrenFn: (componentIds: string[]) => Promise<void>;
    insertStateFn: (statusIndex: number, state: PanelState) => Promise<void>;
    removeStateFn: (statusIndex: number) => Promise<void>;
  }) => {
    const command = new DeletePanelStateCommand({
      ...params,
      onAfterUndo: (recreated) => {
        recreated.forEach(({ original, created }) => {
          commandManager.updateComponentIdInHistory(`${original.id}`, `${created.id}`);
        });
      },
      description: "删除动态面板状态"
    });

    commandManager.addCommand(command);

    return command;
  };

  /**
   * 记录"分组创建/解散"这一结构操作的撤销重做命令。
   *
   * direction="create" 用于 handleGroup（创建分组已发生）；direction="dissolve"
   * 用于 handleUnGroup（解散分组已发生）。buildGroupFn/dissolveGroupFn 由调用方
   * 复用既有的 handleSelectGroupAction/handleGroupDelete 包装而成。
   */
  const createToggleGroupCommand = (params: {
    direction: "create" | "dissolve";
    groupId: string;
    memberIds: string[];
    buildGroupFn: (memberIds: string[]) => Promise<GroupBuildResult>;
    dissolveGroupFn: (groupId: string) => Promise<GroupDissolveResult>;
  }) => {
    const command = new ToggleGroupCommand({
      ...params,
      onAfterBuild: (oldGroupId, newGroupId) => {
        commandManager.updateComponentIdInHistory(oldGroupId, newGroupId);
      }
    });

    commandManager.addCommand(command);

    return command;
  };

  /**
   * 记录"整组删除"（分组容器 + 全部成员级联硬删除）这一结构操作的撤销重做命令。
   */
  const createDeleteGroupCommand = (params: {
    groupMeta: ComponentType;
    members: ComponentType[];
    recreateFn: (groupMeta: ComponentType, members: ComponentType[]) => Promise<RecreatedGroup>;
    deleteFn: (groupId: string, memberIds: string[]) => Promise<void>;
  }) => {
    const command = new DeleteGroupCommand({
      ...params,
      onAfterUndo: (pairs: RecreatedGroupComponent[]) => {
        pairs.forEach(({ original, created }) => {
          commandManager.updateComponentIdInHistory(`${original.id}`, `${created.id}`);
        });
      }
    });

    commandManager.addCommand(command);

    return command;
  };

  /**
   * 记录"分组成员删除"（删除后分组仍保留 >=2 个成员）这一结构操作的撤销重做命令。
   */
  const createRemoveGroupMemberCommand = (params: {
    groupId: string;
    member: ComponentType;
    recreateMemberFn: (groupId: string, member: ComponentType) => Promise<ComponentType>;
    removeMemberFn: (groupId: string, memberId: string) => Promise<void>;
  }) => {
    const command = new RemoveGroupMemberCommand({
      ...params,
      onAfterUndo: (oldMemberId, newMember) => {
        commandManager.updateComponentIdInHistory(oldMemberId, `${newMember.id}`);
      }
    });

    commandManager.addCommand(command);

    return command;
  };

  /**
   * 记录"新增动态面板状态"这一操作的撤销重做命令（状态 id 全程不变，无需 id 重映射）。
   */
  const createAddPanelStateCommand = (params: {
    stateIndex: number;
    state: PanelState;
    insertStateFn: (stateIndex: number, state: PanelState) => Promise<void>;
    removeStateFn: (stateIndex: number) => Promise<void>;
  }) => {
    const command = new AddPanelStateCommand(params);

    commandManager.addCommand(command);

    return command;
  };

  /**
   * 记录"动态面板状态排序"这一操作的撤销重做命令（无 id 漂移，直接整体覆盖顺序快照）。
   */
  const createReorderPanelStateCommand = (params: {
    oldOrder: PanelState[];
    newOrder: PanelState[];
    applyOrderFn: (order: PanelState[]) => Promise<void>;
  }) => {
    const command = new ReorderPanelStateCommand(params);

    commandManager.addCommand(command);

    return command;
  };

  /**
   * 记录"复制动态面板状态"这一结构操作的撤销重做命令（DeletePanelStateCommand 的镜像）。
   */
  const createCopyPanelStateCommand = (params: {
    sourceStatus: PanelState;
    copiedState: PanelState;
    rebuildFn: (sourceStatus: PanelState) => Promise<{ newState: PanelState; pairs: RecreatedPanelStateCopy[] }>;
    teardownFn: (state: PanelState) => Promise<void>;
  }) => {
    const command = new CopyPanelStateCommand({
      ...params,
      onAfterRedo: (pairs: RecreatedPanelStateCopy[]) => {
        pairs.forEach(({ original, created }) => {
          commandManager.updateComponentIdInHistory(`${original.id}`, `${created.id}`);
        });
      }
    });

    commandManager.addCommand(command);

    return command;
  };

  /**
   * 撤销最后一个命令
   * @returns 撤销结果
   */
  const undo = async () => {
    const result = await commandManager.undo();
    if (result.success) {
      console.log("撤销成功:", result.message);
    } else {
      console.error("撤销失败:", result.error);
      ElMessage.warning(result.error || "没有可撤销的操作");
    }

    return result;
  };

  /**
   * 重做最后一个撤销的命令
   * @returns 重做结果
   */
  const redo = async () => {
    const result = await commandManager.redo();

    if (result.success) {
      console.log("重做成功:", result.message);
    } else {
      console.error("重做失败:", result.error);
    }

    return result;
  };

  const batchCreateUpdateComponentsCommand = createDebouncedBatchUpdater(createUpdateComponentCommand, 300);
  const batchCreateDeleteComponentsCommand = createDebouncedBatchDeleteUpdater(createDeleteComponentCommand, 1000);

  /**
   * 历史栈变化的响应式版本号。
   * CommandManager（@screenwright/core）用普通数组维护栈、通过 subscribe 通知变化；
   * 这里据此把 canUndo/canRedo 重建为 computed（原 getCanUndo/getCanRedo 的职责移到适配层）。
   */
  const historyVersion = ref(0);
  commandManager.subscribe(() => {
    historyVersion.value++;
  });

  /**
   * 获取是否可以撤销的响应式计算属性
   * @returns 是否可以撤销的计算属性
   */
  const canUndo = computed(() => {
    void historyVersion.value;
    return commandManager.canUndo();
  });

  /**
   * 获取是否可以重做的响应式计算属性
   * @returns 是否可以重做的计算属性
   */
  const canRedo = computed(() => {
    void historyVersion.value;
    return commandManager.canRedo();
  });

  /**
   * 获取历史记录统计信息
   * @returns 历史记录统计
   */
  const getHistoryStats = () => {
    return {
      undoStackSize: commandManager.getUndoStackSize(),
      redoStackSize: commandManager.getRedoStackSize(),
      canUndo: commandManager.canUndo(),
      canRedo: commandManager.canRedo(),
      lastCommand: commandManager.getLastCommandDescription()
    };
  };

  /**
   * 获取详细的历史记录信息
   * @returns 详细历史记录
   */
  const getHistorySummary = () => {
    return commandManager.getHistorySummary();
  };

  return {
    createUpdateComponentCommand,
    createAddComponentCommand,
    createDeleteComponentCommand,
    createDeletePanelStateCommand,
    createToggleGroupCommand,
    createDeleteGroupCommand,
    createRemoveGroupMemberCommand,
    createAddPanelStateCommand,
    createReorderPanelStateCommand,
    createCopyPanelStateCommand,

    // 撤销重做
    undo,
    redo,

    // 状态查询
    canUndo,
    canRedo,

    // 历史记录管理
    getHistoryStats,
    getHistorySummary,
    clearHistory,

    batchCreateUpdateComponentsCommand,
    batchCreateDeleteComponentsCommand,

    // 原始命令管理器（用于高级用例）
    commandManager
  };
});
