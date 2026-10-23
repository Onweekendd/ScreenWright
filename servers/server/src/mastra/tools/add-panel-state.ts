import fsp from "node:fs/promises";
import path from "node:path";

import { createTool } from "@mastra/core/tools";
import { PanelEnum, type PanelState } from "@screenwright/types";
import { z } from "zod";

import { applyPanelStateAdd } from "@/mastra/services/bi-data-sync/screen-mutation";
import { getScreenVersionKeyFromPath, getWorkspaceBase } from "@/mastra/services/screen-workspace";

import { SuspendDefs, SuspendType } from "../types/suspend";
import { readCanvasOpResults, suspendCanvasOps } from "./canvas-ops";
import { ChangeSchema } from "./change-report";
import { describeAmbiguity, extractIdFromIdName, findComponentFileInWorkspace, isAmbiguousMatch } from "./file/utils";

export const addPanelStateTool = createTool({
  id: "add_panel_state",
  description: `给 workspace 中已存在的动态面板新增一个状态。

- 按 id 在 workspace 中定位该动态面板的当前文件，校验其确实是动态面板组件
- 暂停执行，将面板 id 和新状态名称交给前端；前端新增状态并追加到该面板的 panelData
- 前端回传新状态后，由后端写入工作区并返回新状态的 id

新状态初始没有子组件，可用返回的 stateId 配合 move_component / create_component 的 placement（parentType="dynamicPanel"）把组件放入该状态。`,

  inputSchema: z.object({
    panelId: z
      .string()
      .describe(
        '动态面板，形如 "{screenId}_{versionCode}/{componentId}"（如 "29445_1/4178"）。' +
          "工作区里多块大屏并存，只给组件 id 无法确定是哪一块。"
      ),
    stateName: z.string().describe("新状态的名称")
  }),

  suspendSchema: SuspendDefs[SuspendType.CanvasOps].suspend,

  resumeSchema: SuspendDefs[SuspendType.CanvasOps].resume,

  outputSchema: z.object({
    success: z.boolean(),
    stateId: z.string().optional().describe("新增状态的 id"),
    message: z.string(),
    change: z.array(ChangeSchema).optional()
  }),

  execute: async ({ panelId, stateName }, context) => {
    const reply = readCanvasOpResults(context?.agent?.resumeData, 1);

    // ── 恢复阶段：用户拒绝 / 回执不合法 / 前端返回错误 ───────────────────
    if (reply.status === "rejected") {
      return { success: false, message: "用户取消了新增状态操作" };
    }
    if (reply.status === "invalid") {
      return { success: false, message: reply.message };
    }
    if (reply.status === "done" && !reply.results[0].ok) {
      return { success: false, message: `前端新增状态失败: ${reply.results[0].error}` };
    }

    // ── 首次执行 / 恢复阶段共用：定位面板文件，校验是动态面板组件 ──────────
    const workspaceBase = path.resolve(getWorkspaceBase());
    const found = await findComponentFileInWorkspace(workspaceBase, panelId);
    if (!found) {
      return { success: false, message: `找不到组件: ${panelId}` };
    }
    if (isAmbiguousMatch(found)) {
      return { success: false, message: describeAmbiguity(panelId, found.ambiguous) };
    }
    // 交给 core 与前端的是裸 id：前端在当前打开的那块屏的内存树上操作，屏前缀对它没有意义
    const numericId = extractIdFromIdName(found.base);
    if (numericId === null) {
      return { success: false, message: `组件 id 不合法: ${panelId}` };
    }
    const bareId = String(numericId);

    let content: Record<string, unknown>;
    try {
      content = JSON.parse(await fsp.readFile(found.file, "utf-8"));
    } catch (e) {
      return { success: false, message: `读取组件失败: ${(e as Error).message}` };
    }
    const prop = (content.component as Record<string, unknown> | undefined)?.prop;
    if (prop !== PanelEnum.dynamicPanel) {
      return { success: false, message: `组件 ${panelId} 不是动态面板组件，无法新增状态` };
    }

    // ── 恢复阶段：前端建好了状态，这时才由后端过 core 落盘 ──────────────────
    // 状态 id 是本地 uuid，后端自己也造得出来——但画布上已经用那个 id 建好了，
    // 后端再造一个就跟画布对不上，所以回传的这一份原样追加进 panelData。
    if (reply.status === "done") {
      const frontendState = reply.results[0].ok ? reply.results[0].state : undefined;
      if (!frontendState) {
        return { success: false, message: "前端没有回传新增的状态，未写入工作区" };
      }
      const screenKey = getScreenVersionKeyFromPath(found.file);
      if (!screenKey) {
        return { success: false, message: `状态已在前端新增，但无法确定该面板属于哪个大屏: ${panelId}` };
      }
      const state = frontendState as unknown as PanelState;
      try {
        await applyPanelStateAdd(screenKey, bareId, state);
        return {
          success: true,
          stateId: `${state.id}`,
          message: `状态已新增，id: ${state.id}`,
          change: [
            {
              file: path.relative(getWorkspaceBase(), found.file).replace(/\\/gu, "/"),
              // 不回显 panelData：每个状态带一整棵子树，倒出来既长又没用
              note: `面板 ${bareId} 的 panelData 里新增了状态「${stateName}」(id: ${state.id})`
            }
          ]
        };
      } catch (error) {
        return {
          success: false,
          message: `状态已在前端新增，但写入工作区失败: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }

    return suspendCanvasOps(context, {
      purpose: "给动态面板新增一个状态",
      ops: [{ op: "add_panel_state", panelId: numericId, stateName }]
    });
  }
});
