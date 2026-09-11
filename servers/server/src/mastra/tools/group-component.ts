import path from "node:path";

import { createTool } from "@mastra/core/tools";
import type { ComponentPlacement } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";
import { z } from "zod";

import { applyComponentGroup } from "@/mastra/services/bi-data-sync/screen-mutation";
import { getScreenVersionKeyFromPath, getWorkspaceBase } from "@/mastra/services/screen-workspace";

import { AgentMode } from "../types/bi-chat";
import { SuspendDefs, SuspendType } from "../types/suspend";
import { ChangeSchema, readCreatedChange } from "./change-report";
import {
  describeAmbiguity,
  extractIdFromIdName,
  findComponentFileInWorkspace,
  formatValidationWarnings,
  isAmbiguousMatch,
  parsePlacementFromPath,
  validateComponentContent
} from "./file/utils";

export const groupComponentTool = createTool({
  id: "group_component",
  description: `将 workspace 中若干个已存在的组件组合成一个新分组，并获取新分组在 workspace 中的完整路径。

- 按 id 在 workspace 中定位每个组件的当前文件，要求它们当前处于同一父级（同一分组/同一动态面板状态/同一根级）下
- 暂停执行，将组件 id 列表交给前端；前端创建新分组、把这些组件移入其 children
- 前端分配真实 ID 并回传新分组，后端写入工作区后返回新分组的完整路径

⚠️ 本工具已在 suspend 中完成前端实际分组操作。原组件本身不会被删除，只是被移入新分组，可用返回的 filePath 对新分组本身继续 read_file / edit_files。`,

  inputSchema: z.object({
    componentIds: z
      .array(z.string())
      .min(2)
      .describe(
        "要组合成一个分组的组件，至少 2 个且当前处于同一父级下。每项形如 " +
          '"{screenId}_{versionCode}/{componentId}"（如 "29445_1/4179"）——工作区里多块大屏并存，' +
          "只给组件 id 无法确定是哪一块。"
      )
  }),

  suspendSchema: z.discriminatedUnion("type", [
    SuspendDefs[SuspendType.AskApprovalGroupComponent].suspend,
    SuspendDefs[SuspendType.GroupComponent].suspend
  ]),

  resumeSchema: SuspendDefs[SuspendType.AskApprovalGroupComponent].resume,

  outputSchema: z.object({
    success: z.boolean(),
    filePath: z.string().optional().describe("新分组在 workspace 中的完整路径"),
    message: z.string(),
    change: z.array(ChangeSchema).optional()
  }),

  execute: async ({ componentIds }, context) => {
    const { suspend, resumeData } = context?.agent ?? {};
    const mode = context?.requestContext?.get("mode") as AgentMode | undefined;

    // ── 恢复阶段：用户拒绝 ────────────────────────────────────────────
    if (resumeData?.approved === false) {
      return { success: false, message: "用户取消了分组操作" };
    }

    // ── 恢复阶段：前端已分组或返回错误 ──────────────────────────────────
    if (resumeData?.error) {
      return { success: false, message: `前端分组失败: ${resumeData.error}` };
    }

    // ── 首次执行 / 恢复阶段共用：定位每个组件文件，校验同处一个父级 ────────
    // 恢复阶段重算一遍是安全的：前端那侧不再回写工作区，磁盘上仍是成组前的样子，
    // 正是后端接下来要施加变更的那个状态。分组自己该挂在哪，也就是成员原来挂的地方。
    const workspaceBase = path.resolve(getWorkspaceBase());
    const placements: Array<ReturnType<typeof parsePlacementFromPath>> = [];
    let screenKey: string | null = null;

    // 交给 core 与前端的都是**裸 id**：前端在当前打开的那块屏的内存树上操作，屏前缀对它没有意义
    const bareIds: string[] = [];

    for (const ref of componentIds) {
      const found = await findComponentFileInWorkspace(workspaceBase, ref);
      if (!found) {
        return { success: false, message: `找不到组件: ${ref}` };
      }
      if (isAmbiguousMatch(found)) {
        return { success: false, message: describeAmbiguity(ref, found.ambiguous) };
      }
      placements.push(parsePlacementFromPath(found.file));
      screenKey ??= getScreenVersionKeyFromPath(found.file);
      bareIds.push(String(extractIdFromIdName(found.base)));
    }

    const first = placements[0];
    const allSame = placements.every((p) => JSON.stringify(p) === JSON.stringify(first));
    if (!allSame) {
      return {
        success: false,
        message: "只能对同一容器下的组件分组，请检查这些组件是否都在同一分组/动态面板状态/根级下"
      };
    }

    // ── 恢复阶段：前端建好了分组容器，这时才由后端过 core 落盘 ──────────────
    // 分组容器和普通组件一样要业务接口分配真实 id，所以只能前端建；成员的摘挂、parent 记账、
    // 包围盒重算跑的是 core 里同一个 group，路径由后端改完自己的树再扫盘推。
    if (resumeData?.component) {
      if (!screenKey) {
        return { success: false, message: `分组已在前端创建，但无法确定它属于哪个大屏: ${componentIds[0]}` };
      }

      const validation = validateComponentContent(JSON.stringify(resumeData.component));
      if (!validation.ok) {
        return {
          success: false,
          message: `分组已在前端创建，但它的结构过不了校验，未写入工作区：${validation.message}`
        };
      }

      try {
        // 用原始对象而不是 validation.data：zod 会补默认值并重排 key，那些值会一路写进工作区
        const created = await applyComponentGroup(
          screenKey,
          resumeData.component as unknown as ComponentType,
          bareIds,
          (first ?? undefined) as ComponentPlacement | undefined
        );
        if (!created) {
          return { success: false, message: "分组已在前端创建，但落盘后未能在工作区中定位到它" };
        }
        const createdFile = await readCreatedChange(workspaceBase, created.filePath);
        return {
          success: true,
          filePath: created.filePath,
          message: `分组已创建，路径: ${created.filePath}` + formatValidationWarnings(validation.warnings),
          ...(createdFile ? { change: [createdFile] } : {})
        };
      } catch (error) {
        return {
          success: false,
          message: `分组已在前端创建，但写入工作区失败: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }

    if (!suspend) {
      return { success: false, message: "当前上下文不支持 suspend（非 agent 流式调用）" };
    }

    // ── ASK_BEFORE_EDIT：先弹审批框，用户接受后再交前端分组 ──────────────
    if (mode === AgentMode.ASK_BEFORE_EDIT) {
      return suspend({
        type: SuspendType.AskApprovalGroupComponent,
        purpose: "组合选中的组件为一个分组",
        componentIds: bareIds
      }) as never;
    }

    // 自动模式：直接 suspend 交给前端分组
    return suspend({ type: SuspendType.GroupComponent, componentIds: bareIds }) as never;
  }
});
