import fsp from "node:fs/promises";
import path from "node:path";

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { applyComponentDelete, applyFilterDelete } from "@/mastra/services/bi-data-sync/screen-mutation";
import { getScreenVersionKeyFromPath } from "@/mastra/services/screen-workspace";

import { AgentMode } from "../../types/bi-chat";
import { SuspendDefs, SuspendType } from "../../types/suspend";
import { ChangeSchema, deletedChange } from "../change-report";
import { resolveFilePath } from "./state";
import { extractIdFromIdName, parsePlacementFromPath } from "./utils";

function isComponentFilePath(normalizedPath: string): boolean {
  return normalizedPath.endsWith(".json") && normalizedPath.includes("/component/");
}

function isDataFilterFilePath(normalizedPath: string): boolean {
  return (
    normalizedPath.includes("/dataFilterArr/") && (normalizedPath.endsWith(".json") || normalizedPath.endsWith(".js"))
  );
}

export const deleteFileTool = createTool({
  id: "delete_file",
  description: `从 workspace 中删除一个组件或数据过滤器，并同步到前端画布。

- 组件文件（路径含 /component/）：通知前端删除组件，前端处理状态清理
- 过滤器文件（路径含 /dataFilterArr/）：通知前端解绑所有关联组件，随后 {name}.json 与 {name}.js 一并删除
- 文件在前端确认删除之后才真正从工作区消失；前端取消或失败则原样保留

传入 .json 或 .js 路径均可，过滤器两个文件会一并删除。`,

  inputSchema: z.object({
    path: z.string().describe("文件路径（相对于 workspace 根目录或绝对路径），支持组件 JSON 和过滤器文件")
  }),

  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    change: z.array(ChangeSchema).optional()
  }),

  suspendSchema: z.discriminatedUnion("type", [
    SuspendDefs[SuspendType.DeleteComponent].suspend,
    SuspendDefs[SuspendType.AskApprovalDeleteComponent].suspend,
    SuspendDefs[SuspendType.DeleteFilter].suspend,
    SuspendDefs[SuspendType.AskApprovalDeleteFilter].suspend
  ]),

  resumeSchema: z.union([
    SuspendDefs[SuspendType.AskApprovalDeleteComponent].resume,
    SuspendDefs[SuspendType.DeleteComponent].resume,
    SuspendDefs[SuspendType.DeleteFilter].resume
  ]),

  execute: async ({ path: filePath }, context) => {
    const mode = context?.requestContext?.get("mode") as AgentMode | undefined;
    const { resumeData, suspend } = context?.agent ?? {};

    if (resumeData && "approved" in resumeData && resumeData.approved === false) {
      return { success: false, message: "用户取消了删除操作" };
    }

    const absPath = resolveFilePath(filePath);
    const normalizedPath = absPath.replace(/\\/g, "/");
    const screenKey = getScreenVersionKeyFromPath(absPath);

    // 挂起前后都要读这个路径，所以存在性检查放在最前面。恢复阶段它照样存在——删文件的是
    // 结尾那次整屏回写，前端那侧不再回写工作区，磁盘上仍是删除前的样子。
    const exists = await fsp
      .access(absPath)
      .then(() => true)
      .catch(() => false);
    if (!exists) {
      return { success: false, message: `文件不存在: ${filePath}` };
    }

    // ── 过滤器删除 ──────────────────────────────────────────────────────────
    if (isDataFilterFilePath(normalizedPath)) {
      const baseName = path.basename(absPath).replace(/\.(json|js)$/, "");
      // 文件名可能因含 Windows 非法字符被净化过，真实过滤器名在 JSON 的 name 字段里，
      // 前端解绑与 core 删除都以它为准
      const filterName =
        (await fsp
          .readFile(path.join(path.dirname(absPath), `${baseName}.json`), "utf-8")
          .then((c) => (JSON.parse(c) as { name?: string }).name)
          .catch(() => undefined)) ?? baseName;

      // 恢复阶段：前端已解绑，这时才由后端过 core 落盘
      if (resumeData && "filterDeleted" in resumeData) {
        if (!resumeData.filterDeleted) {
          return { success: false, message: `过滤器前端删除失败: ${resumeData.error ?? "未知错误"}` };
        }
        if (!screenKey) {
          return { success: false, message: `过滤器已在前端删除，但该路径不在任何大屏目录下: ${filePath}` };
        }
        try {
          // {name}.json 与 {name}.js 由整屏回写的 pruneStaleFiles 一并清掉，这里不单独 unlink：
          // 单独删就成了第二个写入者，且前端一旦失败，文件没了树还在，下次整屏回写又写回来
          await applyFilterDelete(screenKey, filterName);
          // 两个文件由整屏回写的 pruneStaleFiles 清，这里照实报出来，省得 agent 再去列目录确认
          return {
            success: true,
            message: "过滤器已删除",
            change: [
              deletedChange(`dataFilterArr/${filterName}.json`),
              deletedChange(`dataFilterArr/${filterName}.js`),
              {
                file: "",
                note: "绑定过该过滤器的组件，其 listenArgs 与回调关系也已一并解除"
              }
            ]
          };
        } catch (error) {
          return {
            success: false,
            message: `过滤器已在前端删除，但写入工作区失败: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }

      if (!suspend) {
        return { success: false, message: "当前上下文不支持 suspend（非 agent 流式调用）" };
      }

      return suspend(
        mode === AgentMode.ASK_BEFORE_EDIT
          ? { type: SuspendType.AskApprovalDeleteFilter, purpose: "删除数据过滤器", filterName }
          : { type: SuspendType.DeleteFilter, filterName }
      ) as never;
    }

    // ── 组件删除 ────────────────────────────────────────────────────────────
    if (isComponentFilePath(normalizedPath)) {
      // 文件名格式为 `{id}_{name}.json`，用 extractIdFromIdName 取纯数字 id（suspend 契约为 string）
      const componentId = extractIdFromIdName(path.basename(normalizedPath));
      if (componentId === null) {
        return { success: false, message: `无法从路径解析组件 ID: ${filePath}` };
      }

      // 恢复阶段：前端画布已删除，这时才由后端过 core 落盘
      if (resumeData) {
        if ("error" in resumeData && resumeData.error) {
          return { success: false, message: `前端删除组件失败: ${resumeData.error}` };
        }
        if ("componentId" in resumeData) {
          if (!screenKey) {
            return { success: false, message: `组件已在前端删除，但该路径不在任何大屏目录下: ${filePath}` };
          }
          try {
            // 组件 json 与它的子目录由整屏回写的 pruneOrphans 清掉；过滤器上的绑定、
            // 回调关系图的注销都在 core 的 delete 一路里，与前端删组件跑的是同一份逻辑
            await applyComponentDelete(screenKey, componentId);
            return {
              success: true,
              message: `组件已删除，ID: ${componentId}`,
              change: [deletedChange(filePath, "组件 json 及其子目录已由整屏回写清掉")]
            };
          } catch (error) {
            return {
              success: false,
              message: `组件已在前端删除，但写入工作区失败: ${error instanceof Error ? error.message : String(error)}`
            };
          }
        }
      }

      if (!suspend) {
        return { success: false, message: "当前上下文不支持 suspend（非 agent 流式调用）" };
      }

      // 从路径反推父节点 placement（与 push/copy 同一套 parsePlacementFromPath 规则）
      interface Placement {
        parentId: number;
        parentType: "group" | "dynamicPanel";
        stateId?: string;
      }
      const placement = (parsePlacementFromPath(absPath) as Placement | null) ?? undefined;

      return suspend(
        mode === AgentMode.ASK_BEFORE_EDIT
          ? {
              type: SuspendType.AskApprovalDeleteComponent,
              purpose: "删除组件",
              componentId: String(componentId),
              placement
            }
          : { type: SuspendType.DeleteComponent, componentId: String(componentId), placement }
      ) as never;
    }

    return { success: false, message: `不支持删除该类型文件: ${filePath}` };
  }
});
