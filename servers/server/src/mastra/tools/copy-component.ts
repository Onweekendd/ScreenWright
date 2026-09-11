import fsp from "node:fs/promises";
import path from "node:path";

import { createTool } from "@mastra/core/tools";
import type { ComponentPlacement } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";
import { z } from "zod";

import { getAgentWorkspacePath } from "@/agent-resources/workspace-path";
import { applyComponentCreate } from "@/mastra/services/bi-data-sync/screen-mutation";
import { getScreenVersionKeyFromPath } from "@/mastra/services/screen-workspace";

import { AgentMode } from "../types/bi-chat";
import { SuspendDefs, SuspendType } from "../types/suspend";
import { ChangeSchema, readCreatedChange } from "./change-report";
import { resolveFilePath } from "./file/state";
import {
  extractIdFromIdName,
  extractStateIdFromDirName,
  formatValidationWarnings,
  parsePlacementFromDir,
  parsePlacementFromPath,
  validateComponentContent
} from "./file/utils";

/**
 * 在 dir 下定位组件文件：优先精确匹配 `${idName}.json`；未命中则按 id 兜底
 * （readdir 找首个 id 相同的 .json），容忍 children/config 里记录的 name 段与磁盘落盘 name 不一致。
 * 与 findStateDir 的"按 id 匹配目录"保持对称。返回实际文件路径及其去扩展名的基础名（供推导子目录）。
 */
async function findComponentFile(dir: string, idName: string): Promise<{ file: string; base: string } | null> {
  const exact = path.join(dir, `${idName}.json`);
  try {
    await fsp.access(exact);
    return { file: exact, base: idName };
  } catch {
    // 精确未命中 → 按 id 兜底
  }
  const wantId = extractIdFromIdName(idName);
  if (wantId === null) {
    return null;
  }
  let entries: string[];
  try {
    entries = await fsp.readdir(dir);
  } catch {
    return null;
  }
  const match = entries.find((e) => e.endsWith(".json") && extractIdFromIdName(e) === wantId);
  return match ? { file: path.join(dir, match), base: path.basename(match, ".json") } : null;
}

async function readAndValidateComponentFile(filePath: string) {
  const raw = await fsp.readFile(filePath);
  const content = (
    raw[0] === 0xff && raw[1] === 0xfe ? raw.slice(2).toString("utf16le") : raw.toString("utf8")
  ).replace(/\r\n/g, "\n");

  const validation = validateComponentContent(content);
  if (!validation.ok) {
    throw new Error(
      `${filePath}: ${validation.message}${validation.validationErrors ? "\n" + validation.validationErrors.join("\n") : ""}`
    );
  }

  return validation.data;
}

async function dirExists(dirPath: string): Promise<boolean> {
  try {
    await fsp.access(dirPath);
    return true;
  } catch {
    return false;
  }
}

/** 在 childDir 下找到名称以 "{stateId}" 或 "{stateId}_{stateName}" 开头的状态子目录，找不到返回 null */
async function findStateDir(childDir: string, stateId: string): Promise<string | null> {
  let entries: string[];
  try {
    entries = await fsp.readdir(childDir);
  } catch {
    return null;
  }
  const match = entries.find((entry) => extractStateIdFromDirName(entry) === stateId);
  return match ? path.join(childDir, match) : null;
}

/** idName 为不含扩展名的文件/目录基础名，新格式为 "{id}_{name}"，旧数据兼容 "{id}_{name}_{title}" / 纯数字 "{id}" */
async function readFullComponentTree(componentDir: string, idName: string) {
  const found = await findComponentFile(componentDir, idName);
  if (!found) {
    const err = new Error(`组件文件不存在: ${path.join(componentDir, `${idName}.json`)}`) as NodeJS.ErrnoException;
    err.code = "ENOENT";
    err.path = path.join(componentDir, `${idName}.json`);
    throw err;
  }
  const component = (await readAndValidateComponentFile(found.file)) as ComponentType;

  // 子目录名与文件基础名同源，用实际命中的 base（而非传入的 idName）推导，兼容 name 段不一致
  const childDir = path.join(componentDir, found.base);

  if (Array.isArray(component.children) && component.children.length > 0 && (await dirExists(childDir))) {
    component.children = await Promise.all(
      component.children.map((childIdName) => readFullComponentTree(childDir, childIdName as unknown as string))
    );
  }

  if (Array.isArray(component.panelData) && component.panelData.length > 0 && (await dirExists(childDir))) {
    component.panelData = await Promise.all(
      component.panelData.map(async (state) => {
        const stateId = state.id as string;
        const config = state.config as unknown as string[];
        const stateDir = await findStateDir(childDir, stateId);
        if (Array.isArray(config) && config.length > 0 && stateDir) {
          const fullConfig = await Promise.all(
            config.map((childIdName) => readFullComponentTree(stateDir, childIdName))
          );
          return { ...state, config: fullConfig };
        }
        return state;
      })
    );
  }

  return component;
}

/**
 * 从 to 路径推目标容器：给的是 .json 就按同级推，给的是目录就按该目录推。
 *
 * 挂起前后各要一次——挂起时前端据此决定副本落在画布的哪个容器，恢复时 core 据此把它放进树。
 * 两次必须同一份规则，否则画布与工作区分叉。
 */
const resolveCopyPlacement = (absTo: string): ComponentPlacement | undefined =>
  ((absTo.endsWith(".json") ? parsePlacementFromPath(absTo) : parsePlacementFromDir(absTo)) ?? undefined) as
    | ComponentPlacement
    | undefined;

export const copyComponentTool = createTool({
  id: "copy_component",
  description: `将 workspace 中已有组件复制到另一位置，并获取复制后组件在 workspace 中的完整路径。

- 从 from 路径读取组件 JSON；若为分组或动态面板，则递归读取所有子节点，构建完整嵌套结构
- 暂停执行，将完整组件数据和目标位置交给前端渲染
- 前端分配真实 ID 并回传副本，后端写入工作区后返回可用于 read_file / edit_files 的 filePath

⚠️ 本工具已在 suspend 中完成前端实组件的创建，复制即已生效。切勿在其后再调用 create_component（会导致重复创建同一组件）。若需在复制后修改新组件，直接对返回的 filePath 执行 read_file / edit_files 即可。`,

  inputSchema: z.object({
    from: z.string().describe("源组件 JSON 文件路径（相对于 workspace 根目录，或绝对路径）"),
    to: z
      .string()
      .describe(
        "目标位置路径（相对于 workspace 根目录，或绝对路径）。可以是目录路径（如 bigscreen1/component/456/），表示放入该父级下"
      )
  }),

  suspendSchema: z.discriminatedUnion("type", [
    SuspendDefs[SuspendType.AskApprovalCopyComponent].suspend,
    SuspendDefs[SuspendType.CopyComponent].suspend
  ]),

  resumeSchema: SuspendDefs[SuspendType.AskApprovalCopyComponent].resume,

  outputSchema: z.object({
    success: z.boolean(),
    filePath: z.string().optional().describe("复制后的组件在 workspace 中的完整嵌套路径"),
    message: z.string(),
    change: z.array(ChangeSchema).optional()
  }),

  execute: async ({ from, to }, context) => {
    const { suspend, resumeData } = context?.agent ?? {};
    const mode = context?.requestContext?.get("mode") as AgentMode | undefined;

    // ── 恢复阶段：用户拒绝 ────────────────────────────────────────────
    if (resumeData?.approved === false) {
      return { success: false, message: "用户取消了组件复制操作" };
    }

    // ── 恢复阶段：前端已创建组件或返回错误 ────────────────────────────
    if (resumeData?.error) {
      return {
        success: false,
        message: `前端创建组件失败: ${resumeData.error}`
      };
    }

    // ── 恢复阶段：前端建好了副本，这时才由后端过 core 落盘 ────────────────────
    // 与 create_component 同一条路：真实 id 只有业务接口能分配，所以副本实例必须前端来建；
    // 放进树、整屏落盘、推导路径归后端，工作区因此只有一个写入者。
    if (resumeData?.component) {
      const absTo = resolveFilePath(to);
      const screenKey = getScreenVersionKeyFromPath(absTo);
      if (!screenKey) {
        return { success: false, message: `组件已在前端复制，但目标路径不在任何大屏目录下: ${to}` };
      }

      // 回来的这一份跟发过去的源组件不是同一个东西（新 id、新位置、菜单默认值），得重新过一遍
      // schema：组件 json 在**读**的时候 ScreenReader 会因为校验不过整屏抛错，写的时候不挡就是埋雷
      const validation = validateComponentContent(JSON.stringify(resumeData.component));
      if (!validation.ok) {
        return {
          success: false,
          message: `组件已在前端复制，但它的结构过不了校验，未写入工作区：${validation.message}`
        };
      }

      try {
        // 用原始对象而不是 validation.data：zod 会补默认值并重排 key，那些值会一路写进工作区
        const created = await applyComponentCreate(
          screenKey,
          resumeData.component as unknown as ComponentType,
          resolveCopyPlacement(absTo)
        );
        if (!created) {
          return { success: false, message: "组件已在前端复制，但落盘后未能在工作区中定位到它" };
        }
        const createdFile = await readCreatedChange(getAgentWorkspacePath(), created.filePath);
        return {
          success: true,
          filePath: created.filePath,
          message: `组件已复制，路径: ${created.filePath}` + formatValidationWarnings(validation.warnings),
          ...(createdFile ? { change: [createdFile] } : {})
        };
      } catch (error) {
        return {
          success: false,
          message: `组件已在前端复制，但写入工作区失败: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }

    // ── 1. 解析 from 路径，读取源组件 ────────────────────────────────────────
    const absFrom = resolveFilePath(from);
    let component: Record<string, unknown>;
    try {
      const componentDir = path.dirname(absFrom);
      const basename = path.basename(absFrom, ".json");
      const componentId = extractIdFromIdName(basename);
      if (componentId === null) {
        return { success: false, message: `from 路径文件名不是有效组件 ID: ${basename}` };
      }
      // 2. 递归读取完整组件树（含所有子节点）
      component = await readFullComponentTree(componentDir, basename);
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        // 报出真正缺失的文件路径（可能是嵌套子组件），而非顶层 absFrom，避免误导排查
        return { success: false, message: `源组件文件不存在: ${err.path ?? absFrom}` };
      }
      return { success: false, message: `读取源组件失败: ${(e as Error).message}` };
    }

    // ── 3. 解析 to 路径，推导目标 placement ──────────────────────────────────
    const placement = resolveCopyPlacement(resolveFilePath(to));

    if (!suspend) {
      return { success: false, message: "当前上下文不支持 suspend（非 agent 流式调用）" };
    }

    // ── ASK_BEFORE_EDIT：先弹审批框，用户接受后再交前端复制 ──────────────────
    if (mode === AgentMode.ASK_BEFORE_EDIT) {
      return suspend({
        type: SuspendType.AskApprovalCopyComponent,
        purpose: "复制组件到前端",
        component,
        placement
      }) as never;
    }

    // 4. 自动模式：直接 suspend 交给前端创建，等待返回复制后路径
    return suspend({ type: SuspendType.CopyComponent, component, placement }) as never;
  }
});
