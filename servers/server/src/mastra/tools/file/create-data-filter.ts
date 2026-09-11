import { existsSync, readFileSync } from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import { createTool } from "@mastra/core/tools";
import type { Filter } from "@screenwright/types";
import { z } from "zod";

import { applyFilterSave } from "@/mastra/services/bi-data-sync/screen-mutation";
import { getScreenDirPath } from "@/mastra/services/screen-workspace";

import { AgentMode } from "../../types/bi-chat";
import { SuspendDefs, SuspendType } from "../../types/suspend";
import { capChanges, type Change, ChangeSchema, createdChange, fieldChange } from "../change-report";
import { findComponentFileInWorkspace, isAmbiguousMatch, sanitizeFsName } from "./utils";

const DEFAULT_FORMATTER = "(data, callbackArgs) => {\r\n    return data\r\n}";

/**
 * 组装一份完整的过滤器。
 *
 * 挂起前后各要一次（推给前端保存、交给 core 落盘），且必须是**同一份**——所以在这里成型，
 * 不在两处各拼一遍。dataFormatter 装的是函数体本身而不是 "{name}.js" 那个指针：
 * 内存形态里它就是源码，拆成两个文件是落盘时整屏写入器干的事。
 *
 * 不再带 id：那个字段过去用来标记「前端还没确认」，而现在文件只会在前端确认之后才产生，
 * 中间态不存在了。
 */
const buildFilter = ({
  name,
  bindComponent,
  callBack,
  dataFormatter
}: {
  name: string;
  bindComponent: Array<{ label: string; id: number }>;
  callBack: string[];
  dataFormatter?: string;
}): Filter =>
  ({
    name,
    callBack,
    callBackStatus: false,
    dataFormatter: dataFormatter ?? DEFAULT_FORMATTER,
    bindComponent,
    checked: true,
    notSaved: false,
    tempPool: { callBack: [], dataFormatter: "" },
    show: true
  }) as Filter;

/**
 * 汇总这次保存过滤器**实际动了哪些文件**。
 *
 * 不止两个新文件：`saveFilterWithBindings` 还会往每个绑定组件上挂 `listenArgs`、把
 * `openFilter` 打开（见 `DataFilterManager.saveFilterWithBindings`）——改的是 agent 没点名的
 * 文件。实测不报的后果是 agent 下一步用 `editFilesTool` 把 `listenArgs` 又手写一遍。
 *
 * 走重读而不是 diff：落盘由前端 + 整屏回写完成，这里拿不到改前快照（见 change-report.ts 头注释）。
 */
const collectFilterChanges = async (
  screenKey: string,
  fileBase: string,
  filterName: string,
  bindComponent: Array<{ label: string; id: number }>
): Promise<Change[]> => {
  const screenDir = getScreenDirPath(screenKey);
  const changes: Change[] = [];

  for (const suffix of ["json", "js"] as const) {
    const rel = `dataFilterArr/${fileBase}.${suffix}`;
    try {
      const content = await fsp.readFile(path.join(screenDir, rel), "utf-8");
      // .js 就是 agent 刚写的 dataFormatter，通常几百字节。直接回显全文，它就不用再读回来
      // 确认自己写的函数体落对了没（实测每次建完都要读一遍）。.json 是元数据，报行数即可
      changes.push(suffix === "js" ? { file: rel, created: true, after: content } : createdChange(rel, content));
    } catch {
      // 整屏回写没产出这个文件就不报它，回执宁可少一条也不能谎报
    }
  }

  for (const { id, label } of bindComponent) {
    const found = await findComponentFileInWorkspace(path.dirname(screenDir), `${screenKey}/${id}`);
    if (!found || isAmbiguousMatch(found)) {
      continue;
    }
    let content: string;
    try {
      content = await fsp.readFile(found.file, "utf-8");
    } catch {
      continue;
    }
    const rel = path.relative(path.dirname(screenDir), found.file).replace(/\\/gu, "/");
    const note = `绑定过滤器「${filterName}」时由本工具顺带改的，不用再自己写一遍`;
    for (const field of ["listenArgs", "openFilter"] as const) {
      const change = fieldChange(rel, content, field, note);
      if (change) {
        changes.push(change);
      }
    }
    if (!changes.some((c) => c.file === rel)) {
      changes.push({ file: rel, note: `${label}(${id}) 未发现绑定字段变化` });
    }
  }

  return capChanges(changes);
};

export const createDataFilterTool = createTool({
  id: "create_data_filter",
  description: `在 workspace 中为指定大屏创建一个新数据过滤器，并推送到前端。

- 先推送到前端，前端通过 handleSaveFilter 完成绑定和缓存更新
- 前端保存成功后，才在 dataFilterArr/ 目录下写入 {name}.json（元数据）和 {name}.js（dataFormatter 函数体）
- 前端取消或保存失败时不写任何文件
- 若同名过滤器已存在，则拒绝覆盖，请改用 edit_files 修改`,

  inputSchema: z.object({
    screenId: z.string().describe('大屏目录标识，格式为 "{screenId}_{versionCode}"，如 "29445_1"'),
    name: z.string().describe("过滤器名称"),
    bindComponent: z
      .array(
        z.object({
          label: z.string().describe("组件名称"),
          id: z.number().describe("组件 ID")
        })
      )
      .describe("绑定的组件列表"),
    callBack: z.array(z.string()).optional().describe("回调函数名列表，默认为空"),
    dataFormatter: z
      .string()
      .optional()
      .describe("过滤器 JS 函数体，默认为直通函数。格式：(data, callbackArgs) => { ... }")
  }),

  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    change: z.array(ChangeSchema).optional()
  }),

  suspendSchema: z.union([
    SuspendDefs[SuspendType.SaveFilter].suspend,
    SuspendDefs[SuspendType.AskApprovalSaveFilter].suspend
  ]),

  resumeSchema: SuspendDefs[SuspendType.AskApprovalSaveFilter].resume,

  execute: async ({ screenId, name, bindComponent, callBack = [], dataFormatter }, context) => {
    const mode = context?.requestContext?.get("mode") as AgentMode | undefined;
    const { resumeData, suspend } = context?.agent ?? {};

    // 用户拒绝（ask_approval_save_filter declined）
    if (resumeData && "approved" in resumeData && resumeData.approved === false) {
      return { success: false, message: "用户取消了创建操作" };
    }

    const filter = buildFilter({ name, bindComponent, callBack, dataFormatter });

    // ── 恢复阶段：前端已保存并完成绑定，这时才由后端过 core 落盘 ──────────────
    // 落盘推迟到这里，才不会出现「文件已经写了、前端却拒绝或失败」的分叉；
    // {name}.json / {name}.js 由整屏回写生成，与前端保存过滤器写出来的是同一份。
    if (resumeData && "filterSaved" in resumeData) {
      if (!resumeData.filterSaved) {
        return { success: false, message: (resumeData.error as string | undefined) ?? "前端保存过滤器失败" };
      }
      try {
        await applyFilterSave(screenId, filter);
        return {
          success: true,
          message: `过滤器 "${name}" 创建成功`,
          change: await collectFilterChanges(screenId, sanitizeFsName(name), name, bindComponent)
        };
      } catch (error) {
        return {
          success: false,
          message: `过滤器已在前端保存，但写入工作区失败: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }

    // 大屏目录一律走 getScreenDirPath：它每次现读环境变量，与整屏回写用的是同一个函数。
    // tools/file/state.ts 的 WORKSPACE_BASE 是模块加载时快照下来的，两者在运行期可能不是同一个目录，
    // 拿它拼路径就会「往 A 处查、往 B 处写」。
    const screenDir = getScreenDirPath(screenId);

    // 验证 bindComponent 的 ID 在当前大屏中存在
    const metaPath = path.join(screenDir, "_meta.json");
    if (existsSync(metaPath)) {
      try {
        const meta = JSON.parse(readFileSync(metaPath, "utf-8")) as { componentIds?: number[] };
        if (meta.componentIds) {
          const validIds = new Set(meta.componentIds);
          const invalid = bindComponent.filter((c) => !validIds.has(c.id));
          if (invalid.length > 0) {
            return {
              success: false,
              message: `以下组件 ID 在当前大屏中不存在：${invalid.map((c) => `${c.label}(${c.id})`).join(", ")}`
            };
          }
        }
      } catch {
        // meta 解析失败时跳过验证
      }
    }

    // 同名过滤器已存在就不覆盖。判据是文件在不在，不再看 JSON 里有没有「前端未确认」标记——
    // 现在压根不存在未确认的中间态：文件只会在前端保存成功之后由整屏回写产生。
    const fileBase = sanitizeFsName(name);
    const jsonPath = path.join(screenDir, "dataFilterArr", `${fileBase}.json`);
    if (existsSync(jsonPath)) {
      return {
        success: false,
        message: `过滤器 "${name}" 已存在。如需修改内容，请使用 edit_files 工具直接编辑 dataFilterArr/${fileBase}.json 或 dataFilterArr/${fileBase}.js`
      };
    }

    // ASK 模式：一次 suspend 完成确认 + 保存
    if (mode === AgentMode.ASK_BEFORE_EDIT) {
      return suspend?.({
        type: SuspendType.AskApprovalSaveFilter,
        purpose: "创建数据过滤器",
        filterName: name,
        filter
      }) as never;
    }

    return suspend?.({ type: SuspendType.SaveFilter, filterName: name, filter }) as never;
  }
});
