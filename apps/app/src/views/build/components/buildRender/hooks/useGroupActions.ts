import { toRaw } from "vue";

import { createPanelState, type GroupBuildResult, type GroupDissolveResult } from "@screenwright/core";
import { ElMessage } from "element-plus";
import { has, isArray } from "lodash-es";

import { updateLargeNoCacheScreen } from "@/api/library";
import { dyPanelCount } from "@/utils/config";
import { handleMessageBox } from "@/utils/utils";
import { useCommandHistory } from "@/views/build/command/useCommandHistory";

import { DYNAMIC_PANEL_MODULE_ID } from "../core/SystemComponent/panel";
import type { DynamicPanelProps } from "../core/SystemComponent/panel/DynamicPanel";
import type { ComponentType } from "../type";
import {
  calculateGroupDimensions,
  getMaxDynamicPanelLevel,
  getMaxIndex,
  saveLayersByType,
  UpdateHistoryTypeEnum
} from "../utils";
import type { ActionContext } from "./useActionContext";
import type { ComponentCreateActions } from "./useComponentCreateActions";
import type { LayerPersistence } from "./useLayerPersistence";

export const useGroupActions = (
  {
    allComponentMap,
    cIsDynamicPanel,
    clearHistory,
    componentList,
    currentCanvasPlacement,
    editConfig,
    editor,
    navInfo,
    onCustomAnimationComponentDelete,
    onDeleteComponentFromAllAnimations,
    panelInfo,
    selectTargetData,
    setTargetSelectChart,
    targetChart,
    updateCacheComponent
  }: ActionContext,
  { createNewComponentInstance }: ComponentCreateActions,
  { getModuleInfoApi, saveLayersAggApi, updateComponentLayers }: LayerPersistence
) => {
  const handleSelectGroupAction = async (targetGroupData?: ComponentType[], name?: string) => {
    const groupData = targetGroupData ? targetGroupData : selectTargetData.value;
    const selectId = groupData ? groupData.map((v) => `${v.id}`) : targetChart.value.selectId;
    if (groupData.length === 0) {
      return;
    }
    const isHasGroup = groupData.some((v) => v && v.children && v.children.length > 0);
    if (isHasGroup) {
      ElMessage.warning("暂不支持包含【分组】组件成组！");
      return;
    }

    // 新分组的层级要盖过「成组之后剩下的」那些组件，所以先把待成组的成员排除掉再取最大值。
    // 成员的实际摘除交给下面 editor.component.group 的「先摘再放」——放在接口调用之前摘，
    // 一旦建分组接口失败（下面的 early return），成员就会凭空从画布上消失。
    const maxIndex = getMaxIndex(componentList.value.filter((item) => !selectId.includes(`${item.id}`))) + 1;

    const GROUP_MODULE_ID = "75";
    const res = await getModuleInfoApi(GROUP_MODULE_ID);

    const groupConfig = await saveLayersAggApi(
      {
        status: cIsDynamicPanel.value
      },
      { updateHistoryType: UpdateHistoryTypeEnum.SKIP }
    );
    if (!groupConfig || !res) {
      return;
    }

    const id = (groupConfig.config ? JSON.parse(groupConfig.config).id : 0) as number;
    const option = (res.javaScript ? JSON.parse(res.javaScript) : null) as ComponentType | null;
    if (!option) {
      return;
    }

    if (name) {
      option.name = name;
    }

    const groupItem: ComponentType = {
      ...option,
      // parent 记账由 editor.component.group 统一处理，这里只负责排序
      children: groupData.map((v) => toRaw(v)).sort((a, b) => b.zIndex - a.zIndex),
      isLock: false,
      id,
      isExpand: true,
      isOuter: true,
      zIndex: maxIndex
    };
    // children 已装配好，group 直接采用；成员在画布上的旧副本由「先摘再放」一并带走。
    // 包围盒（left/top + 宽高）也由 group 内部按成员算，模板 option 上带的那份不用管。
    editor.component.group(groupItem, selectId, currentCanvasPlacement());
    setTargetSelectChart(`${id}`);
    await updateComponentLayers(groupItem, {
      fullUpdateGroup: true,
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });
    // 分组容器经 /layersAgg/save 创建，不经过 /layers/update 响应拦截器，不会被
    // handleUpdateResponse 自动写入缓存；上面的 SKIP 更新虽走拦截器，但 saveParentGroupData
    // 提交时会把 children 替换成 id 数组（见 utils.ts saveParentGroupData），导致缓存结构与
    // componentList 不一致。因此最后用完整 groupItem 覆盖一次，确保缓存中有该分组，后续对分组的
    // UPDATE 才能在 handleUpdateResponse 里命中 oldComponent、正确记录历史——否则组合后分组的
    // 属性/位置修改不可撤销。
    updateCacheComponent(groupItem);

    return groupItem;
  };

  /**
   * 建组副作用：按成员 id 建立分组容器，返回新分组 id。
   * 供 ToggleGroupCommand 的 doRedo(direction=create)/doUndo(direction=dissolve) 复用。
   */
  const buildGroupFn = async (memberIds: string[]): Promise<GroupBuildResult> => {
    const members = memberIds.map((id) => allComponentMap.value.get(id)).filter(Boolean) as ComponentType[];

    if (members.length === 0) {
      throw new Error("建组失败: 找不到成员组件");
    }

    const groupItem = await handleSelectGroupAction(members);
    if (!groupItem) {
      throw new Error("建组失败");
    }

    return { groupId: `${groupItem.id}` };
  };

  /**
   * 解组副作用：按分组 id 拆解分组容器，成员提升回顶层（原 id 不变），返回成员 id 列表。
   * 供 ToggleGroupCommand 的 doRedo(direction=dissolve)/doUndo(direction=create) 复用。
   */
  const dissolveGroupFn = async (groupId: string): Promise<GroupDissolveResult> => {
    const group = allComponentMap.value.get(groupId);
    if (!group) {
      throw new Error(`解组失败: 分组 ${groupId} 不存在`);
    }

    const memberIds = (group.children || []).map((c: ComponentType) => `${c.id}`);
    // 解组不产生新 id，无需事后清空历史，交由调用方（handleUnGroup / ToggleGroupCommand）决定是否压入命令
    await handleGroupDelete([group], { clearHistoryOnSuccess: false });

    return { memberIds };
  };

  /**
   * 组合
   */
  const handleGroup = async () => {
    const isCanGroup = await handleMessageBox("是否组合所选组件?", {
      confirmButtonText: "确定",
      cancelButtonText: "取消"
    });
    if (!isCanGroup) {
      return;
    }

    if (targetChart.value.selectId.length < 2) {
      ElMessage.warning("请至少选择两个组件");
      return;
    }

    const memberIds = selectTargetData.value.map((v) => `${v.id}`);
    const groupItem = await handleSelectGroupAction();

    if (groupItem) {
      const { createToggleGroupCommand } = useCommandHistory();
      createToggleGroupCommand({
        direction: "create",
        groupId: `${groupItem.id}`,
        memberIds,
        buildGroupFn,
        dissolveGroupFn
      });
    }

    return groupItem;
  };

  const handleToDynamicPanel = async (isInPanel = false) => {
    const isCanGroup = await handleMessageBox("是否将所选组件组合成动态面板?", {
      confirmButtonText: "确定",
      cancelButtonText: "取消"
    });
    if (!isCanGroup) {
      return;
    }

    if (targetChart.value.selectId.length < 2) {
      ElMessage.warning("请至少选择两个组件");
      return;
    }
    if (isInPanel) {
      const currentLevel =
        panelInfo.value.config.parentDynamicPanelId && panelInfo.value.config.parentDynamicPanelId.length
          ? panelInfo.value.config.parentDynamicPanelId.length
          : 1;
      const levelMsg = getMaxDynamicPanelLevel(selectTargetData.value);
      console.log("levelMsg", levelMsg, currentLevel);
      if (currentLevel + levelMsg >= dyPanelCount) {
        ElMessage.warning(`动态面板最多嵌套${dyPanelCount}层`);
        return;
      }
    } else {
      const levelMsg = getMaxDynamicPanelLevel(selectTargetData.value);

      if (levelMsg >= dyPanelCount - 1) {
        ElMessage.warning(`动态面板最多嵌套${dyPanelCount}层`);
        return;
      }
    }

    await handleSelectDynamicPanelGroup(selectTargetData.value, isInPanel);
    clearHistory();
  };

  const handleSelectDynamicPanelGroup = async (targetGroupData: ComponentType[], isInPanel = false) => {
    // 1、创建动态面板
    const dynamicPanel = (await createNewComponentInstance({
      moduleId: DYNAMIC_PANEL_MODULE_ID
    })) as DynamicPanelProps;

    const initStatus = createPanelState(0);
    dynamicPanel.panelData.push(initStatus);

    const groupData = targetGroupData ? targetGroupData : selectTargetData.value;

    // 动态面板的尺寸是**用户可编辑的属性**，不是派生值，所以 core 的 reflowGroup 刻意不管它
    // （管了会把用户设的面板大小按内容冲掉）。这里只是新建时按选区给个贴合的初始值。
    const { width, height, left, top } = calculateGroupDimensions(groupData);

    dynamicPanel.left = left;
    dynamicPanel.top = top;
    dynamicPanel.component.width = width;
    dynamicPanel.component.height = height;
    dynamicPanel.zIndex = getMaxIndex(componentList.value) + 1;

    await saveLayersByType(dynamicPanel, isInPanel, {
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });

    for (let i = 0; i < groupData.length; i++) {
      const itemRes = updateDynamicPanelItem(groupData[i], { left, top });
      itemRes.parentDynamicPanelId = [];
      itemRes.parentDynamicPanelId.push(dynamicPanel.id);
      dynamicPanel.panelData[0].config.push(itemRes);
      // filterArr.push(itemRes.id);
      await saveLayersByType(itemRes, true, {
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });
    }

    // 成员此刻同时存在于两处：新面板的状态里、以及它们在画布上的原位置。
    // upsert 的「先摘再放」按 collectSubtreeIds 扫，而它会走进 panelData[].config，
    // 所以画布上那批旧副本由这一行一并带走——不需要在上面的循环里逐个摘。
    // 放在循环外还顺带把中途 saveLayersByType 失败的残局收掉：
    // 要么面板连成员一起落位，要么画布原样不动，不会出现「组件已经没了、面板还没建成」。
    editor.component.upsert(dynamicPanel, currentCanvasPlacement());
    await saveLayersByType(dynamicPanel, true, {
      updateHistoryType: UpdateHistoryTypeEnum.SKIP
    });

    if (!isInPanel) {
      const arr = componentList.value.map((item: ComponentType) => {
        return item.id;
      });

      await updateLargeNoCacheScreen({
        detail: JSON.stringify(editConfig.value),
        id: navInfo.value.id,
        config: JSON.stringify(arr)
      });
    }

    console.log("handleSelectDynamicPanelGroup", width, height, left, top, dynamicPanel, componentList.value);
  };

  const updateDynamicPanelItem = (componentItem: ComponentType, attr: { left: number; top: number }) => {
    componentItem.left = componentItem.left - attr.left;
    componentItem.top = componentItem.top - attr.top;
    if (has(componentItem, "children") && isArray(componentItem.children) && componentItem.children.length > 0) {
      componentItem.children.forEach((childrenItem: ComponentType) => {
        childrenItem.left = childrenItem.left - attr.left;
        childrenItem.top = childrenItem.top - attr.top;
      });
    }

    return componentItem;
  };

  /**
   * 解散分组（拆解分组容器，成员提升回顶层）。
   * @param groupData 待解散的分组列表，默认取当前选中项
   * @param options.clearHistoryOnSuccess 成功后是否清空历史记录：
   *   - 手动解散（handleUnGroup）与 ToggleGroupCommand 内部复用（dissolveGroupFn）都传 false，
   *     改由各自的调用方决定如何记录历史（分别是压入 ToggleGroupCommand / 交给上层命令编排）；
   *   - "2→1 自动解散"（handleParentWithTwoChildren）保持默认 true，范围外，仍走清空历史兜底。
   */
  /**
   * 分组已在树上被解散之后的收尾：提升出来的成员各自落盘、分组自己再发一次更新、
   * 清掉它在动画注册表里的登记。
   *
   * **只管副作用，不碰树**——树上的解散动作由调用方先做完，且有两个入口：
   * 用户手动解散走 `ungroup`（选了就散，不看成员数），删成员导致分组不成立走
   * `dissolveIfUnderfilled`（由 core 判定该不该散）。两条路的收尾完全一样，故抽在这里，
   * 否则「成员 showSubComponent/type 归位」这类记账会在两处各写一遍、迟早写岔。
   *
   * 空分组只清动画登记、不落盘（没有成员要更新，分组本身也已经不存在了）。
   */
  const settleDissolvedGroup = async (group: ComponentType, promoted: ComponentType[]) => {
    for (const item of promoted) {
      item.showSubComponent = false;
      item.type = "item";

      // 更新子组件
      await updateComponentLayers(item, {
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });
    }

    if (promoted.length > 0) {
      // 更新分组组件
      group.children = [];
      await updateComponentLayers(group, {
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });
    }

    // 直接调用动画相关函数而不是发出事件
    onCustomAnimationComponentDelete({ component: group });
    onDeleteComponentFromAllAnimations(group.id.toString());
  };

  const handleGroupDelete = async (
    groupData: ComponentType[] = selectTargetData.value,
    options?: { clearHistoryOnSuccess?: boolean }
  ): Promise<void> => {
    for (const group of groupData) {
      // 手动解散：选了就散，不看成员数（与 dissolveIfUnderfilled 的自动解散区别就在这里）。
      // 摘掉分组节点，子组件提升到分组原来所在的那一层、原来的位置（core 一并清掉 parent）。
      // 无子组件的分组同样被摘掉，与原实现一致。
      const promoted = editor.component.ungroup(group.id);
      await settleDissolvedGroup(group, promoted);
    }

    if (options?.clearHistoryOnSuccess ?? true) {
      clearHistory();
    }
  };
  /**
   * 解散分组
   */
  const handleUnGroup = async () => {
    const groupData = selectTargetData.value;
    if (groupData.length === 0) {
      return;
    }
    const isCanUnGroup = await handleMessageBox("是否解散分组图层?", {
      confirmButtonText: "确定",
      cancelButtonText: "取消"
    });
    if (!isCanUnGroup) {
      return;
    }

    if (targetChart.value.selectId.length < 1) {
      ElMessage.warning("请至少选择一个组件");
      return;
    }

    const isHasGroup = groupData.some((v) => v && v.children && v.children.length > 0);
    if (!isHasGroup) {
      ElMessage.warning("请选择【分组】组件");
      return;
    }

    // 手动解散：逐个分组捕获快照（支持同时选中多个分组），解散成功后各自压入一条撤销命令
    const dissolveSnapshots = groupData
      .filter((group) => group.children && group.children.length > 0)
      .map((group) => ({
        groupId: `${group.id}`,
        memberIds: (group.children || []).map((c) => `${c.id}`)
      }));

    await handleGroupDelete(groupData, { clearHistoryOnSuccess: false });

    const { createToggleGroupCommand } = useCommandHistory();
    dissolveSnapshots.forEach(({ groupId, memberIds }) => {
      createToggleGroupCommand({
        direction: "dissolve",
        groupId,
        memberIds,
        buildGroupFn,
        dissolveGroupFn
      });
    });
  };

  return {
    handleGroup,
    handleGroupDelete,
    handleSelectGroupAction,
    handleToDynamicPanel,
    handleUnGroup,
    settleDissolvedGroup
  };
};

export type GroupActions = ReturnType<typeof useGroupActions>;
