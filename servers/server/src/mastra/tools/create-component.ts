import { readdirSync } from "node:fs";
import path from "node:path";

import { createTool } from "@mastra/core/tools";
import type { ComponentPlacement } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";
import { z } from "zod";

import { getAgentWorkspacePath } from "@/agent-resources/workspace-path";
import { applyComponentCreate } from "@/mastra/services/bi-data-sync/screen-mutation";

import { prismaClient } from "../storage/prisma";
import { AgentMode } from "../types/bi-chat";
import { SuspendDefs, SuspendType } from "../types/suspend";
import { ChangeSchema, readCreatedChange } from "./change-report";
import { formatValidationWarnings, validateComponentContent } from "./file/utils";

const WORKSPACE_BASE = getAgentWorkspacePath();

/** 在 dir 下递归查找 {prop}.md，返回相对于 WORKSPACE_BASE 的路径，未找到返回 null */
function findComponentDoc(dir: string, prop: string): string | null {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const found = findComponentDoc(path.join(dir, entry.name), prop);
      if (found) {
        return found;
      }
    } else if (entry.name === `${prop}.md`) {
      return path.relative(WORKSPACE_BASE, path.join(dir, entry.name)).replace(/\\/g, "/");
    }
  }
  return null;
}

function fixFttext(template: Record<string, unknown>, componentName: string): void {
  const component = template.component as Record<string, unknown> | undefined;
  if (component?.prop !== "swtext") {
    return;
  }

  let option = template.option as Record<string, unknown> | undefined;
  if (!option) {
    option = {};
    template.option = option;
  }

  const typeMapping: Record<string, "text" | "marquee" | "link"> = {
    文本框: "text",
    跑马灯: "marquee",
    超链接: "link"
  };

  option.type = typeMapping[componentName] || "text";
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** 简易相似度：互为子串，或编辑距离 ≤ 2（仅用于给错误键名提建议） */
function isSimilar(a: string, b: string): boolean {
  const lowerA = a.toLowerCase();
  const lowerB = b.toLowerCase();
  if (lowerA.includes(lowerB) || lowerB.includes(lowerA)) {
    return true;
  }
  if (Math.abs(a.length - b.length) > 2) {
    return false;
  }
  // Levenshtein，长度已受限，直接算
  const rows = Array.from({ length: lowerA.length + 1 }, (_, i) => [i, ...Array<number>(lowerB.length).fill(0)]);
  for (let j = 0; j <= lowerB.length; j++) {
    rows[0][j] = j;
  }
  for (let i = 1; i <= lowerA.length; i++) {
    for (let j = 1; j <= lowerB.length; j++) {
      const cost = lowerA[i - 1] === lowerB[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
    }
  }
  return rows[lowerA.length][lowerB.length] <= 2;
}

/**
 * 校验 overrides 的每个键路径在模板中已存在。
 *
 * 深合并会静默接受任何键：把 option.title 误写成 option.titel 时，模板里正确的 title 仍是默认值，
 * 组件创建成功但配置没生效且无任何报错。故合并前必须逐层确认键存在。
 *
 * 只在双方都是普通对象时递归；数组与原始值整体替换，不检查内部结构。
 */
function collectUnknownPaths(
  template: Record<string, unknown>,
  overrides: Record<string, unknown>,
  prefix = ""
): string[] {
  const errors: string[] = [];

  for (const [key, value] of Object.entries(overrides)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (!(key in template)) {
      const candidates = Object.keys(template);
      const similar = candidates.filter((candidate) => isSimilar(candidate, key)).slice(0, 5);
      const hint = similar.length
        ? `是否想写：${similar.join(" / ")}`
        : `该层可用字段：${candidates.slice(0, 20).join(", ")}${candidates.length > 20 ? ` …（共 ${candidates.length} 个）` : ""}`;
      errors.push(`${currentPath} —— ${hint}`);
      continue;
    }

    const templateValue = template[key];
    if (isPlainObject(templateValue) && isPlainObject(value)) {
      errors.push(...collectUnknownPaths(templateValue, value, currentPath));
    }
  }

  return errors;
}

interface PlacementInput {
  parentId?: number | null;
  parentType?: "group" | "dynamicPanel" | null;
  stateId?: string | null;
}

/**
 * 把 agent 传来的 placement 收成 core 认的形态：**null 一律当「没给」**。
 *
 * 模型表达「不适用」的方式是把每个键填上 null，而不是省略整个对象——实测收到过
 * `{ parentId: null, parentType: null, stateId: null }`，意思是根级新建。zod 的 `.optional()` 不收 null，
 * 于是最常见的那条路（往大屏根上放一个组件）直接被入参校验拦死，agent 得靠报错文本自己猜回去。
 * 所以 schema 侧收 null，语义归这里定：下游（前端的 resolvePlacementFlags、core 的 resolveContainer）
 * 只认 undefined 一种「没有」，别让两种空值形态漏过去。
 *
 * @returns ok:false 时 message 是给 agent 看的修正提示，不再 suspend
 */
function normalizePlacement(
  input: PlacementInput | null | undefined
): { ok: true; placement?: ComponentPlacement } | { ok: false; message: string } {
  const parentId = input?.parentId ?? undefined;
  const parentType = input?.parentType ?? undefined;
  const stateId = input?.stateId ?? undefined;

  // 光有 parentType 没有 parentId 不算数：没有容器 id 就无处可挂，只能是根级
  if (parentId === undefined) {
    return { ok: true };
  }

  if (!parentType) {
    return {
      ok: false,
      message: `placement.parentId 给了 ${parentId}，但没给 parentType：分组填 "group"，动态面板填 "dynamicPanel"。放在大屏根级则整个 placement 都不要传。`
    };
  }

  return { ok: true, placement: stateId === undefined ? { parentId, parentType } : { parentId, parentType, stateId } };
}

/** 深合并 overrides 到 target，数组与原始值整体替换。调用前须先通过 collectUnknownPaths 校验。 */
function deepMerge(target: Record<string, unknown>, overrides: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(overrides)) {
    const current = target[key];
    if (isPlainObject(current) && isPlainObject(value)) {
      deepMerge(current, value);
    } else {
      target[key] = value;
    }
  }
}

export const createComponentTool = createTool({
  id: "create_component",
  description: `在大屏中创建一个新组件，并直接推送到前端完成创建，返回真实组件路径。

- 从数据库读取该组件类型的完整模板（Module.javaScript），模板已包含全部默认值
- 通过 overrides 只传需要定制的字段，其余字段沿用模板默认值
- 校验后暂停执行交前端创建，前端分配真实 ID 并回传组件，后端写入工作区后返回可用于 read_file / edit_files 的 filePath
- 放在大屏根级（绝大多数情况）时**不要传 placement**；只有放进分组或动态面板才传，且 parentId 与 parentType 必须成对给出

关于 overrides：
- 仅传用户明确要求的字段，如 { title: "销售额", left: 100, option: { ... } }
- **键名必须与模板一致**，写错会被拒绝并返回可用字段列表
- 不确定 option / data 结构时，先不传 overrides 创建默认组件，用返回的 schemaDoc 查阅文档后再用 edit_files 调整`,

  inputSchema: z.object({
    screenId: z.string().describe('大屏目录标识，格式为 "{screenId}_{versionCode}"，如 "29445_1"'),
    componentName: z.string().describe('组件的中文名称（即 Module.name / 组件 title 字段），如 "柱状图"、"折线图"'),
    placement: z
      .object({
        parentId: z.number().nullish().describe("父组件 ID（分组或动态面板）；根级新建时不传或传 null"),
        parentType: z.enum(["group", "dynamicPanel"]).nullish().describe("父组件类型；给了 parentId 就必须给它"),
        stateId: z.string().nullish().describe("动态面板状态 ID（parentType 为 dynamicPanel 时必填）")
      })
      .nullish()
      .describe("嵌套位置；根级新建时省略整个对象（各键填 null 也按根级处理）"),
    overrides: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("需要覆盖的字段，深合并进模板。键名必须在模板中已存在，否则拒绝执行")
  }),

  suspendSchema: z.discriminatedUnion("type", [
    SuspendDefs[SuspendType.AskApprovalCreateComponent].suspend,
    SuspendDefs[SuspendType.CreateComponent].suspend
  ]),

  resumeSchema: SuspendDefs[SuspendType.CreateComponent].resume,

  outputSchema: z.object({
    success: z.boolean(),
    filePath: z
      .string()
      .optional()
      .describe("组件在 workspace 中的完整嵌套路径，创建成功后可直接用于 read_file / edit_files"),
    schemaDoc: z.string().optional().describe("组件 schema 文档路径（相对 workspace），后续调整字段前应先读取"),
    message: z.string(),
    validationErrors: z.array(z.string()).optional(),
    change: z.array(ChangeSchema).optional()
  }),

  execute: async ({ screenId, componentName, placement: placementInput, overrides }, context) => {
    const { suspend, resumeData } = context?.agent ?? {};
    const mode = context?.requestContext?.get("mode") as AgentMode | undefined;

    // 挂起前后都要用它（suspend 载荷、resume 落盘），且 resume 时 mastra 回放的是同一份原始入参，
    // 所以收口放在最前面一次，后面各处拿到的都是同一个已规整的值
    const normalized = normalizePlacement(placementInput);
    if (!normalized.ok) {
      return { success: false, message: normalized.message };
    }
    const placement = normalized.placement;

    // ── 恢复阶段：用户拒绝 ─────────────────────────────────────────────────────
    if (resumeData?.approved === false) {
      return { success: false, message: "用户取消了组件创建操作" };
    }

    // ── 恢复阶段：前端创建失败 ────────────────────────────────────────────────
    if (resumeData?.error) {
      return { success: false, message: resumeData.error as string };
    }

    // ── 恢复阶段：前端建好了，这时才由后端过 core 落盘 ────────────────────────
    // 工作区只有一个写入者（前端那侧传 syncWorkspace: false）。落盘发生在这里而不是前端，
    // 好处是返回给 agent 的 filePath 一定已经存在：前端的工作区回写是 debounce + 不 await 的，
    // 由它写就可能 resume 都回来了文件还没落地，agent 紧接着 read_file 会扑空。
    if (resumeData?.component) {
      // 回来的这一份跟首次执行时校验过的 template 不是同一个东西（前端套了组件菜单默认值、
      // 跑了位置尺寸分配），得重新过一遍 schema。组件 json 在**读**的时候 ScreenReader 会因为
      // 校验不过整屏抛错，写的时候不挡就是往工作区里埋一颗读不回来的雷。
      const validation = validateComponentContent(JSON.stringify(resumeData.component));
      if (!validation.ok) {
        return {
          success: false,
          message: `组件已在前端创建，但它的结构过不了校验，未写入工作区：${validation.message}`,
          validationErrors: validation.validationErrors
        };
      }

      try {
        // 用原始对象而不是 validation.data：zod 会补默认值并重排 key，那些值会一路写进工作区
        const created = await applyComponentCreate(screenId, resumeData.component as ComponentType, placement);
        if (!created) {
          return { success: false, message: "组件已在前端创建，但落盘后未能在工作区中定位到它" };
        }
        const createdFile = await readCreatedChange(WORKSPACE_BASE, created.filePath);
        return {
          success: true,
          filePath: created.filePath,
          // 属性层不匹配只警告不拦（见 validateComponentContent），但要让 agent 知道，
          // 否则它建出一个 option 跟 prop schema 对不上的组件而毫不知情
          message: `组件已创建，路径: ${created.filePath}` + formatValidationWarnings(validation.warnings),
          ...(createdFile ? { change: [createdFile] } : {})
        };
      } catch (error) {
        return {
          success: false,
          message: `组件已在前端创建，但写入工作区失败: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }

    // ── 首次执行：读取模板 ────────────────────────────────────────────────────
    const module = await prismaClient.module.findUnique({
      where: { name: componentName },
      select: { javaScript: true }
    });

    if (!module) {
      return { success: false, message: `未找到组件类型 "${componentName}"，请检查 componentName 是否正确` };
    }

    if (!module.javaScript) {
      return { success: false, message: `组件 "${componentName}" 没有完整模板（Module.javaScript 为空）` };
    }

    let template: Record<string, unknown>;
    try {
      const cleanData = module.javaScript
        .replace(/\\[rnt]/g, " ") // literal \r \n \t escape sequences stored in DB
        .replace(/[\r\n\t]/g, " ") // actual control characters
        .trim();

      template = JSON.parse(cleanData);
    } catch (e) {
      return {
        success: false,
        message: `组件 "${componentName}" 的模板不是合法 JSON: ${e instanceof Error ? e.message : String(e)}`
      };
    }

    // ── 新建组件的初始状态 ────────────────────────────────────────────────────
    // id 仅为占位，真实 ID 由前端业务接口分配；组件不落盘，故无需 _draftId 标记与映射表。
    template.id = Date.now();
    template.left = 0;
    template.top = 0;
    template.zIndex = 0;
    template.events = [];
    template.data = template.data ?? [];
    template.dataSource = {};
    template.dataType = 0;
    template.cbArgs = [];

    fixFttext(template, componentName);

    const prop = (template.component as Record<string, unknown> | undefined)?.prop as string | undefined;
    const schemaDoc = prop
      ? (findComponentDoc(
          path.join(WORKSPACE_BASE, "skills/executor/sw-component-schema/references/components"),
          prop
        ) ?? undefined)
      : undefined;

    // ── 合并 overrides ────────────────────────────────────────────────────────
    if (overrides && Object.keys(overrides).length > 0) {
      const unknownPaths = collectUnknownPaths(template, overrides);
      if (unknownPaths.length > 0) {
        return {
          success: false,
          message: `overrides 中以下字段在 "${componentName}" 模板中不存在，请修正后重试${schemaDoc ? `。组件文档：${schemaDoc}` : ""}`,
          schemaDoc,
          validationErrors: unknownPaths
        };
      }
      deepMerge(template, overrides);
    }

    // ── 校验 ──────────────────────────────────────────────────────────────────
    const validation = validateComponentContent(JSON.stringify(template));
    if (!validation.ok) {
      return {
        success: false,
        message: validation.message,
        schemaDoc,
        validationErrors: validation.validationErrors
      };
    }

    if (!suspend) {
      return { success: false, message: "当前上下文不支持 suspend（非 agent 流式调用）" };
    }

    const component = validation.data as ComponentType;

    // ── ASK_BEFORE_EDIT：审批 + 创建合并为一次 suspend ────────────────────────
    if (mode === AgentMode.ASK_BEFORE_EDIT) {
      return suspend({
        type: SuspendType.AskApprovalCreateComponent,
        purpose: `创建组件「${componentName}」`,
        component,
        placement
      }) as never;
    }

    // ── 自动模式：直接交给前端创建 ────────────────────────────────────────────
    return suspend({
      type: SuspendType.CreateComponent,
      component,
      placement
    }) as never;
  }
});
