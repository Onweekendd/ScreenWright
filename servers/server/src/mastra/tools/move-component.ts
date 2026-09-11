import fsp from "node:fs/promises";
import path from "node:path";

import { createTool } from "@mastra/core/tools";
import type { ComponentPlacement } from "@screenwright/core";
import { FolderEnum, PanelEnum } from "@screenwright/types";
import { z } from "zod";

import { applyComponentMove } from "@/mastra/services/bi-data-sync/screen-mutation";
import { getScreenVersionKeyFromPath, getWorkspaceBase } from "@/mastra/services/screen-workspace";

import { AgentMode } from "../types/bi-chat";
import { SuspendDefs, SuspendType } from "../types/suspend";
import { ChangeSchema, movedChanges } from "./change-report";
import { describeAmbiguity, extractIdFromIdName, findComponentFileInWorkspace, isAmbiguousMatch } from "./file/utils";

/** 递归收集某组件子目录（若存在）下所有 .json 文件对应的 id，用于跨容器移动前的环路校验 */
async function collectDescendantIds(dir: string): Promise<Set<number>> {
  const ids = new Set<number>();
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return ids;
  }
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      for (const id of await collectDescendantIds(entryPath)) {
        ids.add(id);
      }
    } else if (entry.name.endsWith(".json") && !entry.name.startsWith("_")) {
      const id = extractIdFromIdName(entry.name);
      if (id !== null) {
        ids.add(id);
      }
    }
  }
  return ids;
}

type ResolvedMove =
  | { ok: false; message: string }
  | {
      ok: true;
      /** 数字化后的待移动组件 id */
      componentIds: number[];
      /** 归一化后的目标容器；undefined 表示大屏根级 */
      target?: ComponentPlacement;
      /** 这批组件所属的大屏，由第一个组件的文件路径反推 */
      screenKey: string | null;
    };

/**
 * 定位待移动组件、把 target 归一成 core 认的 placement，并校验它确实能当容器。
 *
 * **parentType 由磁盘反推、不由 agent 给**（约定④）：目标是分组还是动态面板是它自己的属性，
 * 让 agent 猜就会出现「猜错了，前端已经挪完、后端才在 core 里炸」这种半截状态。
 * 环路校验同理只有读磁盘才做得了：不能把一个分组挪进它自己的子孙里。
 */
async function resolveMoveTarget(
  workspaceBase: string,
  componentIds: string[],
  target?: { parentId?: string | null; stateId?: string | null } | null
): Promise<ResolvedMove> {
  let screenKey: string | null = null;

  // 定位一次就把结果留着：下面的环路校验还要用，重复查等于把「按 id 全区搜」多跑几遍
  const resolved: Array<{ ref: string; file: string; numericId: number }> = [];
  for (const ref of componentIds) {
    const found = await findComponentFileInWorkspace(workspaceBase, ref);
    if (!found) {
      return { ok: false, message: `找不到组件: ${ref}` };
    }
    if (isAmbiguousMatch(found)) {
      return { ok: false, message: describeAmbiguity(ref, found.ambiguous) };
    }
    screenKey ??= getScreenVersionKeyFromPath(found.file);
    // **必须从定位到的文件名取 id，不能直接解析入参**：入参是 "9012_1/4177" 这种作用域形态，
    // extractIdFromIdName 会把开头的 9012 当成 id 取走。
    resolved.push({ ref, file: found.file, numericId: extractIdFromIdName(found.base)! });
  }

  const numericIds = resolved.map((r) => r.numericId);

  if (!target?.parentId) {
    return { ok: true, componentIds: numericIds, screenKey };
  }

  const found = await findComponentFileInWorkspace(workspaceBase, target.parentId);
  if (!found) {
    return { ok: false, message: `找不到目标容器: ${target.parentId}` };
  }
  if (isAmbiguousMatch(found)) {
    return { ok: false, message: describeAmbiguity(target.parentId, found.ambiguous) };
  }
  const targetId = extractIdFromIdName(found.base);
  if (targetId === null) {
    return { ok: false, message: `目标容器 id 不合法: ${target.parentId}` };
  }

  if (numericIds.includes(targetId)) {
    return { ok: false, message: "目标容器不能是被移动的组件本身" };
  }

  // 环路校验：目标不能是被移动分组的子孙
  for (const moved of resolved) {
    const subDir = moved.file.replace(/\.json$/, "");
    const descendantIds = await collectDescendantIds(subDir);
    if (descendantIds.has(targetId)) {
      return { ok: false, message: `目标容器 ${target.parentId} 是被移动组件 ${moved.ref} 的子孙，无法移动` };
    }
  }

  let content: Record<string, unknown>;
  try {
    content = JSON.parse(await fsp.readFile(found.file, "utf-8"));
  } catch (e) {
    return { ok: false, message: `读取目标容器失败: ${(e as Error).message}` };
  }
  const prop = (content.component as Record<string, unknown> | undefined)?.prop;

  if (prop === FolderEnum.group) {
    return { ok: true, componentIds: numericIds, screenKey, target: { parentId: targetId, parentType: "group" } };
  }

  if (prop === PanelEnum.dynamicPanel) {
    if (!target.stateId) {
      return {
        ok: false,
        message: `目标是动态面板，必须提供 stateId（先用 read_file 查看 ${target.parentId} 的 panelData）`
      };
    }
    return {
      ok: true,
      componentIds: numericIds,
      screenKey,
      target: { parentId: targetId, parentType: "dynamicPanel", stateId: target.stateId }
    };
  }

  return { ok: false, message: `目标容器 ${target.parentId} 既不是分组也不是动态面板，无法作为移动目标` };
}

export const moveComponentTool = createTool({
  id: "move_component",
  description: `将 workspace 中若干个已存在的组件移动到另一个容器（分组 / 动态面板的某个状态 / 大屏根级）。

- 按 id 在 workspace 中定位每个待移动组件，校验目标容器存在且不构成环路（不能移进自身或自己的子孙）
- 若目标是动态面板，必须同时给出 stateId（先用 read_file 查看该面板 panelData 里的状态 id）
- 暂停执行，将组件 id 列表和目标容器交给前端；前端把组件从当前位置摘除并挂到目标容器下
- 前端处理完成后恢复执行，由后端写入工作区并返回移动后各组件的新路径

⚠️ 组件本身不会被删除或重建，只是挂载位置变化，id 不变。用返回的 movedComponents 里的 filePath 继续 read_file / edit_files。`,

  inputSchema: z.object({
    componentIds: z
      .array(z.string())
      .min(1)
      .describe(
        '要移动的组件，每项形如 "{screenId}_{versionCode}/{componentId}"（如 "29445_1/4175"）。' +
          "工作区里多块大屏并存，只给组件 id 无法确定是哪一块。"
      ),
    target: z
      .object({
        parentId: z
          .string()
          .nullish()
          .describe('目标容器，同样带大屏前缀（如 "29445_1/4177"）；不传或传 null 表示移动到大屏根级'),
        stateId: z.string().nullish().describe("当目标容器是动态面板时，目标状态 id；目标是分组或根级时不传")
      })
      .nullish()
      // 收 null 是必要的：模型表达「移到根级」时惯于把每个键填成 null 而不是省略整个对象，
      // 而 zod 的 .optional() 不收 null，最常见的那条路反倒会被入参校验拦死（create_component 已实测）
      .describe("不传、传 null 或不传 parentId 都表示移动到大屏根级")
  }),

  suspendSchema: z.discriminatedUnion("type", [
    SuspendDefs[SuspendType.AskApprovalMoveComponent].suspend,
    SuspendDefs[SuspendType.MoveComponent].suspend
  ]),

  resumeSchema: SuspendDefs[SuspendType.AskApprovalMoveComponent].resume,

  outputSchema: z.object({
    success: z.boolean(),
    movedComponents: z
      .array(z.object({ componentId: z.number(), filePath: z.string() }))
      .optional()
      .describe("移动后各组件的新路径"),
    message: z.string(),
    change: z.array(ChangeSchema).optional()
  }),

  execute: async ({ componentIds, target }, context) => {
    const { suspend, resumeData } = context?.agent ?? {};
    const mode = context?.requestContext?.get("mode") as AgentMode | undefined;

    // ── 恢复阶段：用户拒绝 ────────────────────────────────────────────
    if (resumeData?.approved === false) {
      return { success: false, message: "用户取消了移动操作" };
    }

    // ── 恢复阶段：前端返回错误 ──────────────────────────────────────────
    if (resumeData?.error) {
      return { success: false, message: `前端移动失败: ${resumeData.error}` };
    }

    // 挂起前后都要用它：挂起时告诉前端往哪挪，恢复时告诉 core 往哪挪。
    // 恢复阶段重算一遍是安全的——前端那侧不再回写工作区，磁盘上仍是移动前的样子，
    // 正是后端接下来要施加变更的那个状态。
    const workspaceBase = path.resolve(getWorkspaceBase());
    const resolved = await resolveMoveTarget(workspaceBase, componentIds, target);
    if (!resolved.ok) {
      return { success: false, message: resolved.message };
    }

    // ── 恢复阶段：前端画布已挪好，这时才由后端过 core 落盘 ────────────────
    // 移动不产生新 id，前端没有任何后端算不出来的东西，回执只是一句「干完了」；
    // 摘挂与包围盒重算两边跑的是 core 里同一个 move，新路径由后端改完自己的树再扫盘推。
    if (resumeData?.moved) {
      const screenKey = resolved.screenKey;
      if (!screenKey) {
        return { success: false, message: `组件已在前端移动，但无法确定它属于哪个大屏: ${componentIds[0]}` };
      }
      try {
        const movedComponents = await applyComponentMove(screenKey, resolved.componentIds, resolved.target);
        const list = movedComponents.map((item) => `${item.componentId} -> ${item.filePath}`).join("; ");
        return {
          success: true,
          movedComponents,
          message: `移动完成: ${list}`,
          change: movedChanges(movedComponents)
        };
      } catch (error) {
        return {
          success: false,
          message: `组件已在前端移动，但写入工作区失败: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }

    if (!suspend) {
      return { success: false, message: "当前上下文不支持 suspend（非 agent 流式调用）" };
    }

    // ── ASK_BEFORE_EDIT：先弹审批框，用户接受后再交前端移动 ──────────────
    if (mode === AgentMode.ASK_BEFORE_EDIT) {
      return suspend({
        type: SuspendType.AskApprovalMoveComponent,
        purpose: "移动选中的组件",
        componentIds,
        target: resolved.target
      }) as never;
    }

    // 自动模式：直接 suspend 交给前端移动
    return suspend({ type: SuspendType.MoveComponent, componentIds, target: resolved.target }) as never;
  }
});
