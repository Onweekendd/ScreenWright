import { toRaw } from "vue";

import type { RollbackOp, RollbackPlan } from "@screenwright/server/rpc";
import type { ComponentType, LargeScreenDetailInfo } from "@screenwright/types";
import { cloneDeep } from "lodash-es";

import { updateLargeScreen } from "@/api/library";
import { AddComponentCommand, DeleteComponentCommand, UpdateComponentCommand } from "@/views/build/command";
import { useCommandHistory } from "@/views/build/command/useCommandHistory";
import { useHistoryAction } from "@/views/build/command/useHistoryAction";
import { useDataFilter } from "@/views/build/useDataFilter";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import { useEditStore } from "../../buildRender/hooks/useEditStore";
import { enqueueCanvasMutation } from "./useCanvasMutationQueue";
import { useCreateComponent } from "./useCreateComponent";

/** 一条回退操作未能落地的记录：谁 + 为什么，供 UI 如实告知用户。 */
export interface SkippedRollbackItem {
  /** 可读标识（组件 x / 过滤器 x / 大屏配置 / 文件路径） */
  target: string;
  /** 跳过原因（后端标记的 unsupported，或执行时的失败信息） */
  reason: string;
}

/** 回退计划执行结果：成功数 + 跳过项。整批尽力执行，单项失败不影响其余。 */
export interface RollbackExecutionResult {
  /** 成功落地的操作数 */
  appliedCount: number;
  /** 未落地的项：后端归入 unsupported 的差异 + 执行中失败的 op */
  skipped: SkippedRollbackItem[];
}

/**
 * 回退计划执行器（阶段 1）。
 *
 * 只处理「不改结构、无新 id」的安全回退：组件改配置、过滤器增删、大屏配置。
 * 组件走命令 `UpdateComponentCommand.undo`（把目标版本当 originalComponents，undo 即整体覆盖），
 * 过滤器 / 大屏配置走画布原语。组件的结构增删（remove/restore）与容器操作由后端归入 unsupported，
 * 不会下发到这里——见 servers/server/docs/version-rollback-design.md 的分阶段落地。
 */
export function useRollbackExecutor() {
  const { allComponentMap } = useGlobalComponentData();
  const { executeUpdateComponents, executeAddComponent, executeDeleteComponent } = useHistoryAction();
  const { handleSaveFilter, deleteFilter } = useDataFilter();
  const { editConfig } = useEditStore();
  const { navInfo } = useLargeScreenInfo();
  const { findMenuItemByName } = useCreateComponent();
  const { clearHistory } = useCommandHistory();

  /**
   * 用目标版本内容覆盖当前组件（阶段 1：仅改配置/改标题）。
   *
   * 复用命令系统而非手写覆盖：把目标内容放进 `originalComponents`，`undo()` 即
   * `executeUpdateComponents(目标内容)`——内部 `Object.assign(当前组件, 目标)` 整体覆盖。
   * 命令不进任何历史栈，new 完即用即弃，不污染用户画布的 undo/redo。
   * `updatedComponents` 传当前态快照仅为满足命令构造（redo 用；回退流程不触发 redo）。
   */
  const restoreComponent = async (id: number, target: ComponentType) => {
    const current = allComponentMap.value.get(`${id}`);
    if (!current) {
      throw new Error(`组件 ${id} 不在当前画布`);
    }
    const command = new UpdateComponentCommand({
      updatedComponents: [cloneDeep(toRaw(current))],
      originalComponents: [target],
      executeUpdateFn: executeUpdateComponents,
      description: `回退组件 ${id}`
    });
    return await command.undo();
  };

  /**
   * 恢复已删除组件 （阶段 1：只恢复大屏根的组件）。
   * @param id 被删除组件的id (可以不使用)
   * @param target 被删除的组件
   */
  const recreateComponent = async (id: number, target: ComponentType) => {
    const menuItem = findMenuItemByName(target.title);
    if (!menuItem || !menuItem.moduleId) {
      return { message: `找不到组件 "${target.title}" 对应的菜单项`, success: false };
    }

    const command = new DeleteComponentCommand({
      deleteComponentInfos: [
        {
          component: target,
          moduleId: menuItem.moduleId
        }
      ],
      executeDeleteFn: executeDeleteComponent,
      executeAddFn: executeAddComponent,
      onAfterUndo: (_addedComponents) => {
        // 无新 id，无需更新画布
      },
      onAfterRedo: (_deletedComponents) => {},
      description: `恢复组件 ${id}`
    });

    return await command.undo();
  };

  /**
   * 删除工作区相对目标版本「多出来」的组件（回退新增，阶段 1：只删大屏根的组件）。
   *
   * 对称于 recreateComponent：那边用 DeleteComponentCommand.undo()（撤销删除=重建），
   * 这边用 AddComponentCommand.undo()（撤销添加=删除），同样复用命令系统、不进历史栈。
   * 删除无新 id，不涉及 id 重映射；moduleId 仅构造需要，undo 路径用不到。
   * @param id 组件 id（仅用于描述/日志）
   * @param target 该组件内容（来自工作区，其 id 即待删除组件）
   */
  const removeComponent = async (id: number, target: ComponentType) => {
    const command = new AddComponentCommand({
      componentToAdd: target,
      moduleId: 0,
      executeAddFn: executeAddComponent,
      executeDeleteFn: executeDeleteComponent,
      onAfterUndo: () => {
        // 删除无新 id，无需更新画布
      },
      onAfterRedo: () => {},
      description: `回退新增：删除组件 ${id}`
    });

    return await command.undo();
  };

  /**
   * 用目标版本 detail 覆盖大屏配置并持久化。
   * 与 useComponentStreamUpdater.handleUpdateScreenInfo 同一路径，保持行为一致。
   *
   * detail 是 Partial：后端已剔除「视图本地」字段(scale)，故这里 Object.assign 合并进当前配置
   * （保留用户当前缩放），并持久化「合并后的完整 editConfig」而非入参本身——否则会把 scale 从
   * DB 里抹掉，下次加载缩放丢失。
   */
  const restoreScreenInfo = async (detail: Partial<LargeScreenDetailInfo>): Promise<void> => {
    Object.assign(editConfig.value, detail);
    const minioIds = (editConfig.value.minioIds ?? []).filter(
      (mid: number | null | undefined) => mid !== null && mid !== undefined
    );
    await updateLargeScreen({
      id: navInfo.value.id,
      detail: JSON.stringify(editConfig.value),
      minioIds: JSON.stringify(minioIds)
    });
  };

  /**
   * 分派并执行单个回退操作。
   *
   * 组件三种动作：overwrite=改内容覆盖、delete=删掉工作区多出来的组件、recreate=恢复被删组件。
   * 阶段 1 只处理大屏根级叶子组件的结构增删，嵌套/容器由后端归入 unsupported、不会下发到这里。
   */
  const applyOp = async (op: RollbackOp): Promise<void> => {
    switch (op.kind) {
      case "component":
        if (op.action === "overwrite") {
          await restoreComponent(op.id, op.component);
          return;
        }
        if (op.action === "delete") {
          await removeComponent(op.id, op.component);
          return;
        }
        await recreateComponent(op.id, op.component);
        return;
      case "filter": {
        if (op.action === "overwrite") {
          await handleSaveFilter(op.filter);
          return;
        }
        const result = await deleteFilter(op.name);
        if (!result.success) {
          throw new Error(result.error ?? `删除过滤器「${op.name}」失败`);
        }
        return;
      }
      case "screenInfo":
        await restoreScreenInfo(op.detail);
        return;
    }
  };

  /**
   * 把一条回退操作描述成「对象 + 被撤销的原始改动」，用于撤销前列清单、失败时反馈。
   *
   * 动词是「被撤销的那次原始改动」视角（对用户更直观）：AI 新增的组件回退时会被删掉，
   * 但展示为「xxx 组件 新增」——即告诉用户这条撤销的是一次「新增」。
   * - component overwrite（改内容）→ 更新；delete（工作区新增，回退删）→ 新增；recreate（工作区删除，回退恢复）→ 删除
   * - filter delete（回退删）→ 新增；overwrite（回退写回）→ 更新
   */
  const describeOp = (op: RollbackOp): string => {
    switch (op.kind) {
      case "component": {
        const verb = op.action === "delete" ? "新增" : op.action === "recreate" ? "删除" : "更新";
        return `${op.component.title || `组件 ${op.id}`} 组件 ${verb}`;
      }
      case "filter":
        return `过滤器「${op.name}」 ${op.action === "delete" ? "新增" : "更新"}`;
      case "screenInfo":
        return "大屏配置 更新";
    }
  };

  /** 撤销前用的清单：只描述「支持回退」的操作（unsupported 不对用户展示）。 */
  const describeRollbackOps = (plan: RollbackPlan): string[] => plan.ops.map(describeOp);

  /**
   * 执行整份回退计划。
   *
   * 全部操作放进**同一个** canvas mutation 顺序执行——回退是一次完整动作，批内要原子、
   * 不被其它 tab 的画布写入插队。单个 op 失败只记入 skipped 并继续，不中断整批（尽力回退、如实反馈）。
   *
   * plan.unsupported（阶段 1 暂不支持的结构增删/容器变更）不再计入 skipped、也不对用户展示——
   * 只在控制台留痕供排查；skipped 仅反映「本该支持却执行失败」的真实错误。
   * @param plan 后端 buildRollbackPlan 产出的回退计划
   */
  const executeRollbackPlan = async (plan: RollbackPlan): Promise<RollbackExecutionResult> => {
    return enqueueCanvasMutation(async () => {
      if (plan.unsupported.length > 0) {
        console.debug("[版本回退] 暂不支持的差异项（已忽略，不对用户展示）", plan.unsupported);
      }
      const skipped: SkippedRollbackItem[] = [];
      let appliedCount = 0;

      for (const op of plan.ops) {
        try {
          await applyOp(op);
          appliedCount++;
        } catch (e) {
          skipped.push({ target: describeOp(op), reason: (e as Error).message });
        }
      }

      // 版本回退让画布整体跳变，栈里用户此前手动操作的命令会引用已不存在的组件/状态，
      // 再按 Ctrl+Z 会拿过时命令乱改画布。故回退后清空编辑器 undo/redo 栈：对话撤销由版本节点负责，
      // 不与手动 undo/redo 混用。放在 mutation 队列内、ops 执行完之后，与回退保持原子。
      clearHistory();

      return { appliedCount, skipped };
    });
  };

  return { executeRollbackPlan, describeRollbackOps };
}
