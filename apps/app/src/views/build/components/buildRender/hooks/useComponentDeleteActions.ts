import type { RecreatedGroup, RecreatedGroupComponent } from "@screenwright/core";
import { FolderEnum, SceneEnum } from "@screenwright/types";
import { ElMessage } from "element-plus";

import { delLayersAgg, updateLargeScreen } from "@/api/library";
import { handleMessageBox } from "@/utils/utils";
import { useCommandHistory } from "@/views/build/command/useCommandHistory";
import { useTabsMenuGroup } from "@/views/build/useTabsMenuGroup";

import { PanelType } from "../core/SystemComponent/type";
import type { ComponentType } from "../type";
import { getPureComponent, UpdateHistoryTypeEnum } from "../utils";
import type { ActionContext } from "./useActionContext";
import type { GroupActions } from "./useGroupActions";
import type { LayerPersistence } from "./useLayerPersistence";

/** 撤销快照必须与树上的对象彻底断开：等到撤销时，树早就不是拍快照那一刻的样子了。 */
const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const hasLockedComponent = (components: ComponentType[]) =>
  components.some(
    (component) =>
      Boolean(component.isLock) ||
      (component.component.prop === FolderEnum.group &&
        Boolean(component.children?.some((child) => Boolean(child.isLock))))
  );

export const useComponentDeleteActions = (
  {
    addLoading,
    allComponentMap,
    cIsDynamicPanel,
    clearHistory,
    currentCanvasPlacement,
    deleteAnimationOnPanelDelete,
    editConfig,
    editor,
    navInfo,
    onCustomAnimationComponentDelete,
    onDeleteComponentFromAllAnimations,
    selectTargetData,
    setTargetSelectChart,
    shouldClearHistory,
    targetChart,
    updateFilterOnComponentDeleted
  }: ActionContext,
  { settleDissolvedGroup }: GroupActions,
  { saveLayersAggApi, updateComponentLayers }: LayerPersistence
) => {
  /**
   * 组件标题 -> moduleId（用于结构化撤销命令重建组件时反查所属模块）。
   * useTabsMenuGroup 反过来依赖 useAction（addComponentList 等），必须延迟到实际调用时才取，
   * 不能在 useAction() 顶层同步调用，否则会形成初始化环（与 useCommandHistory 的既有告诫一致）。
   */
  const resolveModuleId = (title: string): number | undefined => {
    const { tabsList } = useTabsMenuGroup();
    return tabsList.value.find((item) => item.name === title)?.id;
  };
  // 检查组件是否有锁定状态
  const checkComponentsLock = (components: ComponentType[]) => hasLockedComponent(components);

  const emitDeleteComponent = (componentIds: string[]) => {
    componentIds.forEach((id) => {
      const component = allComponentMap.value.get(id);
      if (component) {
        // 直接调用动画相关函数而不是发出事件
        onCustomAnimationComponentDelete({ component });
        onDeleteComponentFromAllAnimations(component.id.toString());
      }
    });
  };

  // 处理编码面板类型组件的删除
  const handleEncodePanelDeletion = async (componentId: string) => {
    if (editConfig.value.terminalEnableArr && editConfig.value.terminalEnableArr[componentId]) {
      delete editConfig.value.terminalEnableArr[componentId];
    }

    const updateParams = {
      detail: JSON.stringify({ ...editConfig.value }),
      id: navInfo.value.id,
      minioIds: JSON.stringify(editConfig.value.minioIds)
    };
    await updateLargeScreen(updateParams);
  };

  /**
   * 断言组件已被删除：从树上摘掉，并注销它整棵子树在回调关系图里的登记。
   *
   * 原实现只在 componentList（当前画布那一层）里找，core 的 delete 走整棵 layers——
   * 组件嵌在分组或面板状态里时同样能摘掉；已不在树上时是 no-op。
   * 回调关系的注销原本要在每个删除分支手写一遍 deleteCallbackRelation，
   * 现在跟摘树绑在一起，漏不掉，且注销范围从「自身 + 直接子组件」扩到整棵子树
   * （动态面板各状态里的组件原先是漏网的，会在关系图里留下一批悬挂登记）。
   */
  const removeComponentFromList = (componentId: string) => {
    editor.component.delete(componentId);
  };

  /**
   * 删掉分组里的一个成员，然后处理分组自身。
   *
   * 原先按成员数分成 `===2`（解散）与 `>2`（只更新分组）两个分支手写，`<2` 那档掉进缝里
   * ——组件已判定删除却没从树上摘掉。现在只做一件事：先摘成员，再问 core「这个分组还成不成立」
   * （`dissolveIfUnderfilled`，规则是至少两个成员）。该不该解散不再由调用点数个数。
   */
  const handleMemberDeletedFromGroup = async (componentId: string, parent: ComponentType) => {
    // 摘树 + 注销回调关系 + 收紧父分组包围盒，都在 delete 里；
    // 且是就地 splice，不像原来那样整体换掉 parent.children 的数组引用
    editor.component.delete(componentId);

    const promoted = editor.component.dissolveIfUnderfilled(parent.id);
    if (!promoted) {
      // 分组仍然成立，落盘它收紧后的包围盒即可
      await updateComponentLayers(parent, {
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });
      return;
    }

    // 分组已被解散：收尾与用户手动解散完全一样，复用同一条（见 useGroupActions）
    await settleDissolvedGroup(parent, promoted);
    clearHistory();
  };

  // 处理单个组件的删除逻辑
  const handleSingleComponentDeletion = async (componentId: string) => {
    const item = allComponentMap.value.get(componentId);
    if (!item) {
      return;
    }

    // 处理编码面板类型组件
    if (item.component.prop === PanelType.encodePanel) {
      emitDeleteComponent([componentId]);
      // 回调关系的注销由下面的 removeComponentFromList → core delete 一并完成
      await updateFilterOnComponentDeleted(componentId);
      await handleEncodePanelDeletion(componentId);
      removeComponentFromList(componentId);
      return;
    }

    if (item.component.prop === PanelType.dynamicPanel) {
      deleteAnimationOnPanelDelete(item.id);
    }

    if (item.children && item.children.length > 0) {
      const toDeleteComponentIds = [componentId, ...item.children.map((v) => `${v.id}`)];
      emitDeleteComponent(toDeleteComponentIds);
      // 过滤器清理必须赶在摘树之前——它要靠 allComponentMap 反查组件；
      // 回调关系则交给下面的 removeComponentFromList，core 会连整棵子树一起注销
      await Promise.all(
        toDeleteComponentIds.map(async (id) => {
          if (allComponentMap.value.get(id)) {
            await updateFilterOnComponentDeleted(id);
          }
        })
      );

      removeComponentFromList(componentId);
      return;
    }

    if (item.parent) {
      emitDeleteComponent([componentId]);
      // 父分组已不在树上时，成员多半是跟着父分组一起没的——那时 delete 找不到节点、也就不会
      // 注销回调登记。所以这里按**组件对象**先注销一次（releaseCallbackRelations 对脱离树的
      // 节点同样有效）；下面 delete 里的那次是幂等重复，不会多删。
      editor.component.releaseCallbackRelations(item);
      await updateFilterOnComponentDeleted(componentId);
      const parent = allComponentMap.value.get(`${item.parent}`);
      if (!parent) {
        // 父分组不在了，没有分组要善后，但组件自己该摘还得摘（已摘掉时是 no-op）
        removeComponentFromList(componentId);
        return;
      }

      // 不再按成员数分支：摘掉成员之后由 core 判定分组还成不成立
      await handleMemberDeletedFromGroup(componentId, parent);
    } else {
      emitDeleteComponent([componentId]);
      await updateFilterOnComponentDeleted(componentId);
      removeComponentFromList(componentId);
    }
  };

  /**
   * 删除前拍下结构化撤销所需的快照，返回「删除完成后压入命令」的收尾函数。
   *
   * 快照必须赶在删除**之前**拍，命令又必须等级联副作用**之后**才压——这两半原先拆在循环的
   * 一头一尾、中间隔着六十行，同一组「这次删除能不能精细撤销」的判断写了两遍（clearHistory
   * 的兜底条件里还有第三遍）。合成一处之后只判一次，返回 null 就是不能。
   */
  const beginUndoRecord = (target: ComponentType): (() => void) | null => {
    // 删分组：容器与全部成员一起快照，撤销时整组重建
    if (target.component.prop === FolderEnum.group) {
      const groupMeta = deepClone({ ...target, children: undefined }) as ComponentType;
      const members = deepClone(target.children ?? []);
      return () => {
        const { createDeleteGroupCommand } = useCommandHistory();
        createDeleteGroupCommand({
          groupMeta,
          members,
          recreateFn: recreateGroupFn,
          deleteFn: deleteGroupFn
        });
      };
    }

    // 删分组成员：删完仍剩 >=2 个成员时才可精细撤销。恰好剩 1 个会触发自动解散
    // （dissolveIfUnderfilled），那是复合操作，超出单条命令的表达范围。
    const groupId = target.parent ? `${target.parent}` : null;
    const group = groupId ? allComponentMap.value.get(groupId) : undefined;
    if (groupId && (group?.children?.length ?? 0) > 2) {
      const member = deepClone(target);
      return () => {
        const { createRemoveGroupMemberCommand } = useCommandHistory();
        createRemoveGroupMemberCommand({
          groupId,
          member,
          recreateMemberFn: recreateGroupMemberFn,
          removeMemberFn: removeGroupMemberFn
        });
      };
    }

    return null;
  };

  /**
   * 删掉一个组件：后端硬删 → 树上摘除与级联副作用 → 压入结构化撤销命令。
   *
   * @returns false 表示这一个没删成，整批应当中止（与改动前的行为一致）
   */
  const deleteOne = async (id: string, updateHistoryType: UpdateHistoryTypeEnum): Promise<boolean> => {
    const target = allComponentMap.value.get(String(id));
    if (!target) {
      console.warn("删除组件不存在");
      return false;
    }

    const commitUndo = beginUndoRecord(target);
    const skipHistory = shouldClearHistory(target);

    const res = await delLayersAgg(Number(id), skipHistory ? UpdateHistoryTypeEnum.SKIP : updateHistoryType);
    if (!res.success) {
      ElMessage.error(`${target.name}删除失败 ${res.message}`);
      return false;
    }

    // 结构化撤销覆盖不到的场景（分组 2→1 自动解散、面板整体删除）仍走清空历史兜底，
    // 详见 useHistoryData.shouldClearHistory 注释
    if (skipHistory && !commitUndo) {
      clearHistory();
    }

    await handleSingleComponentDeletion(id);
    await threeSceneUpdateLargeScreen(target);

    // 级联/重排副作用都做完之后，再在「意图边界」压入撤销命令
    commitUndo?.();
    return true;
  };

  /**
   * 删除一个或多个组件。
   *
   * 确认 → 锁检查 → 逐个删 → 清选区并提示。任一个失败即中止整批，
   * 此时不清选区、也不提示成功。
   */
  const handleDelComponent = async (
    ids?: string | string[],
    updateHistoryType: UpdateHistoryTypeEnum = UpdateHistoryTypeEnum.DELETE,
    showConfirm = true
  ) => {
    // 统一处理输入，将单个 ID 转换为数组形式
    const componentIds = Array.isArray(ids) ? ids : ids ? [ids] : targetChart.value.selectId;
    if (componentIds.length === 0) {
      return;
    }

    if (showConfirm) {
      const confirmed = await handleMessageBox("是否删除所选组件?", {
        cancelButtonText: "取消",
        confirmButtonText: "确定"
      });
      if (!confirmed) {
        return;
      }
    }

    if (checkComponentsLock(selectTargetData.value)) {
      ElMessage.warning("所选组件中包含锁定组件，请先解锁后再删除");
      return;
    }

    addLoading.value = true;
    try {
      for (const id of componentIds) {
        const deleted = await deleteOne(id, updateHistoryType);
        if (!deleted) {
          return;
        }
      }
      setTargetSelectChart(undefined);
      ElMessage.success("删除成功");
    } catch (error) {
      console.error("删除组件时发生错误:", error);
      ElMessage.error("删除失败");
    } finally {
      addLoading.value = false;
    }
  };

  /**
   * 重建整个分组（容器 + 全部成员，均产生新 id）。供 DeleteGroupCommand.doUndo 复用。
   */
  const recreateGroupFn = async (groupMeta: ComponentType, members: ComponentType[]): Promise<RecreatedGroup> => {
    const groupRes = await saveLayersAggApi(
      {
        config: JSON.stringify(getPureComponent({ ...groupMeta, children: undefined })),
        moduleId: 75,
        status: cIsDynamicPanel.value
      },
      { updateHistoryType: UpdateHistoryTypeEnum.SKIP }
    );
    if (!groupRes) {
      throw new Error(`重建分组失败: ${groupMeta.id}`);
    }
    const newGroup = JSON.parse(groupRes.config) as ComponentType;

    const recreatedMembers: RecreatedGroupComponent[] = [];
    for (const member of members) {
      const memberRes = await saveLayersAggApi(
        {
          config: JSON.stringify(getPureComponent({ ...member, parent: newGroup.id })),
          moduleId: resolveModuleId(member.title),
          status: cIsDynamicPanel.value
        },
        { updateHistoryType: UpdateHistoryTypeEnum.SKIP }
      );
      if (memberRes) {
        recreatedMembers.push({ original: member, created: JSON.parse(memberRes.config) as ComponentType });
      }
    }

    if (recreatedMembers.length === 0) {
      throw new Error(`重建分组失败: 没有成功恢复任何成员 (${groupMeta.id})`);
    }

    newGroup.children = recreatedMembers.map((item) => item.created);
    await updateComponentLayers(newGroup, {
      fullUpdateGroup: true,
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });
    editor.component.upsert(newGroup, currentCanvasPlacement());
    setTargetSelectChart(`${newGroup.id}`);

    return { group: newGroup, members: recreatedMembers };
  };

  /**
   * 级联硬删除整个分组（容器 + 全部成员，后端级联清理成员）。供 DeleteGroupCommand.doRedo 复用。
   */
  const deleteGroupFn = async (groupId: string): Promise<void> => {
    const res = await delLayersAgg(Number(groupId), UpdateHistoryTypeEnum.SKIP);
    if (!res.success) {
      throw new Error(`删除分组失败: ${groupId}`);
    }
    removeComponentFromList(groupId);
  };

  /**
   * 重建分组成员（新 id）并插回分组并持久化。供 RemoveGroupMemberCommand.doUndo 复用。
   * 包围盒由 core 的 upsert 内部重算。
   */
  const recreateGroupMemberFn = async (groupId: string, member: ComponentType): Promise<ComponentType> => {
    const group = allComponentMap.value.get(groupId);
    if (!group) {
      throw new Error(`恢复分组成员失败: 分组 ${groupId} 不存在`);
    }

    const memberRes = await saveLayersAggApi(
      {
        config: JSON.stringify(getPureComponent({ ...member, parent: Number(groupId) })),
        moduleId: resolveModuleId(member.title),
        status: cIsDynamicPanel.value
      },
      { updateHistoryType: UpdateHistoryTypeEnum.SKIP }
    );
    if (!memberRes) {
      throw new Error(`恢复分组成员失败: ${member.id}`);
    }
    const newMember = JSON.parse(memberRes.config) as ComponentType;

    // upsert 负责挂进 children（就地 push，不换数组引用）、记 parent、并按新成员重算分组包围盒
    editor.component.upsert(newMember, { parentId: group.id, parentType: "group" });
    await updateComponentLayers(group, { updateHistoryType: UpdateHistoryTypeEnum.SKIP });

    return newMember;
  };

  /**
   * 硬删除分组成员并从分组摘除并持久化。供 RemoveGroupMemberCommand.doRedo 复用。
   * 包围盒由 core 的 delete 内部重算。
   */
  const removeGroupMemberFn = async (groupId: string, memberId: string): Promise<void> => {
    const group = allComponentMap.value.get(groupId);
    if (!group) {
      throw new Error(`删除分组成员失败: 分组 ${groupId} 不存在`);
    }

    const res = await delLayersAgg(Number(memberId), UpdateHistoryTypeEnum.SKIP);
    if (!res.success) {
      throw new Error(`删除分组成员失败: ${memberId}`);
    }

    // 成员已被 delLayersAgg 硬删，delete 一并摘树、注销回调关系、收紧分组包围盒
    editor.component.delete(memberId);
    await updateComponentLayers(group, { updateHistoryType: UpdateHistoryTypeEnum.SKIP });
  };

  const threeSceneUpdateLargeScreen = async (deleteComponent: ComponentType) => {
    if (deleteComponent.component.prop === SceneEnum.ThreeScene) {
      const updateParams = {
        detail: JSON.stringify({ ...editConfig.value }),
        id: navInfo.value.id,
        minioIds: JSON.stringify(editConfig.value.minioIds),
        sceneInfo: "{}"
      };
      await updateLargeScreen(updateParams);
    }
  };

  return {
    handleDelComponent
  };
};
