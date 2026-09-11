import fsp from "node:fs/promises";
import path from "node:path";

import { createTool } from "@mastra/core/tools";
import { FolderEnum } from "@screenwright/types";
import { z } from "zod";

import { applyComponentUngroup } from "@/mastra/services/bi-data-sync/screen-mutation";
import { getScreenVersionKeyFromPath, getWorkspaceBase } from "@/mastra/services/screen-workspace";

import { AgentMode } from "../types/bi-chat";
import { SuspendDefs, SuspendType } from "../types/suspend";
import { ChangeSchema, movedChanges } from "./change-report";
import { describeAmbiguity, extractIdFromIdName, findComponentFileInWorkspace, isAmbiguousMatch } from "./file/utils";

export const ungroupComponentTool = createTool({
  id: "ungroup_component",
  description: `解散 workspace 中若干个已存在的分组，把它们的子组件提升到上一级。

- 按 id 在 workspace 中定位每个分组的当前文件，校验其确实是分组组件
- 暂停执行，将分组 id 列表交给前端；前端把子组件提升到上一级
- 前端处理完成后恢复执行，由后端写入工作区并返回被提升子组件的新路径列表

⚠️ 分组容器本身随之消失，子组件不会重建，只是挂载位置变化。用返回的 movedComponents 里的 filePath 对子组件继续 read_file / edit_files。`,

  inputSchema: z.object({
    groupIds: z
      .array(z.string())
      .min(1)
      .describe(
        '要解散的分组，形如 "{screenId}_{versionCode}/{componentId}"（如 "29445_1/4177"）。' +
          "工作区里多块大屏并存，只给组件 id 无法确定是哪一块——同 id 在多屏命中时会直接报错。"
      )
  }),

  suspendSchema: z.discriminatedUnion("type", [
    SuspendDefs[SuspendType.AskApprovalUngroupComponent].suspend,
    SuspendDefs[SuspendType.UngroupComponent].suspend
  ]),

  resumeSchema: SuspendDefs[SuspendType.AskApprovalUngroupComponent].resume,

  outputSchema: z.object({
    success: z.boolean(),
    movedComponents: z
      .array(z.object({ componentId: z.number(), filePath: z.string() }))
      .optional()
      .describe("被解散提升到上一级的子组件及其新路径"),
    message: z.string(),
    change: z.array(ChangeSchema).optional()
  }),

  execute: async ({ groupIds }, context) => {
    const { suspend, resumeData } = context?.agent ?? {};
    const mode = context?.requestContext?.get("mode") as AgentMode | undefined;

    // ── 恢复阶段：用户拒绝 ────────────────────────────────────────────
    if (resumeData?.approved === false) {
      return { success: false, message: "用户取消了解散分组操作" };
    }

    // ── 恢复阶段：前端已解散或返回错误 ──────────────────────────────────
    if (resumeData?.error) {
      return { success: false, message: `前端解散分组失败: ${resumeData.error}` };
    }

    // ── 首次执行 / 恢复阶段共用：定位每个分组文件，校验是分组组件 ──────────
    // 恢复阶段重算一遍是安全的：前端那侧不再回写工作区，磁盘上仍是解散前的样子。
    const workspaceBase = path.resolve(getWorkspaceBase());
    let screenKey: string | null = null;
    // 交给 core 与前端的都是**裸 id**：前端在「当前打开的那块屏」的内存树上操作，屏前缀对它没有意义，
    // 带过去只会让它在自己的树里找不到组件。
    const bareIds: string[] = [];

    for (const ref of groupIds) {
      const found = await findComponentFileInWorkspace(workspaceBase, ref);
      if (!found) {
        return { success: false, message: `找不到组件: ${ref}` };
      }
      if (isAmbiguousMatch(found)) {
        return { success: false, message: describeAmbiguity(ref, found.ambiguous) };
      }
      screenKey ??= getScreenVersionKeyFromPath(found.file);
      bareIds.push(String(extractIdFromIdName(found.base)));
      let content: Record<string, unknown>;
      try {
        content = JSON.parse(await fsp.readFile(found.file, "utf-8"));
      } catch (e) {
        return { success: false, message: `读取组件失败: ${(e as Error).message}` };
      }
      const prop = (content.component as Record<string, unknown> | undefined)?.prop;
      if (prop !== FolderEnum.group) {
        return { success: false, message: `组件 ${ref} 不是分组组件，无法解散` };
      }
    }

    // ── 恢复阶段：前端画布已解散，这时才由后端过 core 落盘 ──────────────────
    // 解散不产生新 id，回执只是一句「干完了」；子组件提升到哪一层由 core 的 ungroup 决定，
    // 提升后的新路径由后端改完自己的树再扫盘推。
    if (resumeData?.ungrouped) {
      if (!screenKey) {
        return { success: false, message: `分组已在前端解散，但无法确定它属于哪个大屏: ${groupIds[0]}` };
      }
      try {
        const movedComponents = await applyComponentUngroup(screenKey, bareIds);
        const list = movedComponents.map((item) => `${item.componentId} -> ${item.filePath}`).join("; ");
        return {
          success: true,
          movedComponents,
          message: `分组已解散，子组件新路径: ${list}`,
          change: movedChanges(movedComponents)
        };
      } catch (error) {
        return {
          success: false,
          message: `分组已在前端解散，但写入工作区失败: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }

    if (!suspend) {
      return { success: false, message: "当前上下文不支持 suspend（非 agent 流式调用）" };
    }

    // ── ASK_BEFORE_EDIT：先弹审批框，用户接受后再交前端解散 ──────────────
    if (mode === AgentMode.ASK_BEFORE_EDIT) {
      return suspend({
        type: SuspendType.AskApprovalUngroupComponent,
        purpose: "解散选中的分组",
        groupIds: bareIds
      }) as never;
    }

    // 自动模式：直接 suspend 交给前端解散
    return suspend({ type: SuspendType.UngroupComponent, groupIds: bareIds }) as never;
  }
});
