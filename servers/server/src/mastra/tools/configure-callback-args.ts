import { randomUUID } from "node:crypto";
import fsp from "node:fs/promises";
import path from "node:path";

import { createTool } from "@mastra/core/tools";
import type { ComponentType } from "@screenwright/types";
import z from "zod";

import { getAgentWorkspacePath } from "@/agent-resources/workspace-path";

import { applyComponentEdit } from "../services/bi-data-sync/component-edit";
import { AgentMode } from "../types/bi-chat";
import { SuspendDefs, SuspendType } from "../types/suspend";
import { type Change, diffChange, fieldChange } from "./change-report";
import { findComponentFileInWorkspace, isAmbiguousMatch, validateComponentContent } from "./file/utils";

const WORKSPACE_BASE = getAgentWorkspacePath();

/**
 * echart 系列 `click` 抛出的固定四个键（`packages/material/.../Echart/useEcharts.ts:115`）。
 * 它们不在组件的 `data[0]` 里，但确实抛得出来，所以校验时要一并放行。
 */
const ECHART_CLICK_KEYS = ["name", "value", "seriesName", "data"];

const ArgSchema = z.object({
  origin: z
    .string()
    .min(1)
    .describe("抛出对象上的字段名。抛出对象就是该组件渲染数据的一项，所以填 data[0] 里真实存在的 key"),
  target: z.string().min(1).describe("回调变量名，下游过滤器用 callbackArgs.<这个名字> 取值。全屏唯一")
});

const InputSchema = z.object({
  componentRef: z
    .string()
    .min(1)
    .describe('源组件引用，推荐带屏前缀的 "{screenId}_{versionCode}/{componentId}"，如 "9001_1/4181"'),
  args: z.array(ArgSchema).min(1).describe("要抛出的回调参数列表"),
  mode: z
    .enum(["replace", "append"])
    .optional()
    .default("replace")
    .describe("replace（默认）整体替换 cbArgs；append 追加到现有 cbArgs 末尾，同名 target 会被覆盖")
});

/** 组件上「抛得出来」的字段名集合：data[0] 的键 + dataRemark 的 key/map + echart click 的四个固定键。 */
export const collectAvailableFields = (component: Record<string, unknown>): string[] => {
  const fields = new Set<string>(ECHART_CLICK_KEYS);
  const data = component.data;
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
    for (const k of Object.keys(data[0] as Record<string, unknown>)) {
      fields.add(k);
    }
  }
  const remarks = component.dataRemark;
  if (Array.isArray(remarks)) {
    for (const r of remarks) {
      if (r && typeof r === "object") {
        const { key, map } = r as { key?: unknown; map?: unknown };
        if (typeof key === "string") {
          fields.add(key);
        }
        if (typeof map === "string") {
          fields.add(map);
        }
      }
    }
  }
  return [...fields].sort();
};

/** 把 { origin, target } 补成 CallbackSchema 要求的完整形状。样板字段全部由这里生成。 */
export const buildCallbackEntry = (origin: string, target: string) => ({
  id: `callback_${randomUUID()}`,
  name: "回调",
  type: "object",
  method: "default",
  value: {
    origin: { displayName: "字段值" as const, type: "input" as const, value: origin },
    target: { displayName: "变量名" as const, type: "input" as const, value: target }
  }
});

const relativeToWorkspace = (abs: string): string => path.relative(WORKSPACE_BASE, abs).replace(/\\/gu, "/");

/**
 * resume 之后重读组件文件，摘出 `cbArgs` 当前的样子。
 *
 * 这条路上写入是前端做的，拿不到改前快照，所以报的是「这个字段现在长什么样」而不是 diff
 * （见 change-report.ts 头注释）。`append` 模式下合并结果 agent 自己算不出来，尤其得报。
 */
const readCbArgsChange = async (componentRef: string): Promise<Change[]> => {
  const found = await findComponentFileInWorkspace(WORKSPACE_BASE, componentRef);
  if (!found || isAmbiguousMatch(found)) {
    return [];
  }
  try {
    const content = await fsp.readFile(found.file, "utf8");
    const change = fieldChange(relativeToWorkspace(found.file), content, "cbArgs");
    return change ? [change] : [];
  } catch {
    return [];
  }
};

export const configureCallbackArgs = createTool({
  // id 必须与 agent 里的注册键一致：常驻工具在模型眼里的名字取自 tools 对象的键，
  // 两者不一致时文档写的名字调不出来（createEventTemplate / listAvailableEvents 同此约定）
  id: "configureCallbackArgs",
  description:
    "为源组件配置 cbArgs（点击/数据变化时抛出的回调参数），一步完成校验、写入组件文件并推送前端。" +
    "只需给 origin（抛出对象上的字段名）和 target（下游过滤器用的变量名），" +
    "id/name/type/method 等样板字段由工具生成。" +
    "origin 不在该组件可抛出的字段里时会直接报错并列出全部可选字段——不要手写 cbArgs，" +
    "也不要为了确认字段名去 grep 组件文件。",
  inputSchema: InputSchema,

  suspendSchema: z.union([
    SuspendDefs[SuspendType.PushComponentUpdate].suspend,
    SuspendDefs[SuspendType.AskApprovalPushComponentUpdate].suspend
  ]),
  resumeSchema: z.union([
    SuspendDefs[SuspendType.AskApprovalPushComponentUpdate].resume,
    SuspendDefs[SuspendType.PushComponentUpdate].resume
  ]),

  execute: async (input, context) => {
    const { componentRef, args, mode: writeMode } = input as unknown as z.infer<typeof InputSchema>;
    const mode = context?.requestContext?.get("mode") as AgentMode | undefined;
    const { resumeData, suspend } = context?.agent ?? {};

    // 前端应用完回到这里：写入在挂起之前就做完了，这一轮只负责如实转述结果
    if (resumeData && "componentUpdated" in resumeData) {
      const r = resumeData as { componentUpdated?: boolean; error?: string };
      if (r.componentUpdated === false) {
        throw new Error(`配置 cbArgs 时前端应用失败: ${r.error ?? "未提供原因"}`);
      }
      return {
        ok: true,
        message: `已为组件 ${componentRef} 配置 ${args.length} 个回调参数：${args
          .map((a) => `${a.origin} → ${a.target}`)
          .join("、")}`,
        change: await readCbArgsChange(componentRef)
      };
    }

    const found = await findComponentFileInWorkspace(WORKSPACE_BASE, componentRef);
    if (!found) {
      throw new Error(`找不到组件 ${componentRef}`);
    }
    if (isAmbiguousMatch(found)) {
      throw new Error(
        `组件引用 ${componentRef} 在多块屏上都命中了：${found.ambiguous.join("、")}。` +
          `请带上屏前缀，如 "9001_1/4181"`
      );
    }

    const raw = await fsp.readFile(found.file, "utf8");
    let component: Record<string, unknown>;
    try {
      component = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error(`组件文件不是合法 JSON：${found.file}`);
    }

    // origin 必须是真抛得出来的字段。抛不出来的话回调恒为 undefined 且**不报错**
    // （`CallbackArguments.ts:280` 用 `throwValue[originKey] !== undefined` 做存在性判断），
    // 那种静默失效极难排查，所以在这里挡住，并把可选字段全列出来省掉 agent 一轮探查。
    const available = collectAvailableFields(component);
    const hasData = Array.isArray(component.data) && component.data.length > 0;
    const unknownArgs = args.filter((a) => !available.includes(a.origin));
    if (unknownArgs.length > 0 && hasData) {
      throw new Error(
        `origin 字段不存在：${unknownArgs.map((a) => a.origin).join("、")}。\n` +
          `该组件可抛出的字段：${available.join("、")}\n` +
          `（抛出对象就是这个组件渲染数据的一项，形状 = 它 data[0] 的形状；` +
          `echart 的 click 另外固定抛 name/value/seriesName/data 四个键）`
      );
    }

    const entries = args.map((a) => buildCallbackEntry(a.origin, a.target));
    const existing = Array.isArray(component.cbArgs)
      ? (component.cbArgs as ReturnType<typeof buildCallbackEntry>[])
      : [];
    const merged =
      writeMode === "append"
        ? [...existing.filter((e) => !args.some((a) => a.target === e?.value?.target?.value)), ...entries]
        : entries;
    component.cbArgs = merged;

    // 顺手清掉这个死键：它不在 ComponentFlatSchema 里、全仓没有任何一处读组件上的
    // callbackArgs，却在 21/23 个真实组件文件里躺着，持续把人和 agent 引向错误的字段名。
    const strippedDeadKey = "callbackArgs" in component;
    delete component.callbackArgs;

    const newContent = JSON.stringify(component, null, 2);
    const validation = validateComponentContent(newContent);
    if (!validation.ok) {
      throw new Error(
        `写入后组件校验失败: ${validation.message}${
          validation.validationErrors ? "\n" + validation.validationErrors.join("\n") : ""
        }`
      );
    }

    // 与 edit_files / createEventTemplate 同一条：文本交给 core 合进整屏树再落盘，
    // 工作区只有这一条写入路径
    const applied = await applyComponentEdit(found.file, newContent);
    if (!applied) {
      throw new Error(`组件 ${componentRef} 不在大屏树上，改动未写入工作区`);
    }

    if (suspend) {
      const componentForPush = applied.component as ComponentType;
      return suspend(
        mode === AgentMode.ASK_BEFORE_EDIT
          ? {
              type: SuspendType.AskApprovalPushComponentUpdate,
              purpose: `为组件 ${componentRef} 配置回调参数`,
              component: componentForPush,
              replacements: 1
            }
          : { type: SuspendType.PushComponentUpdate, component: componentForPush, replacements: 1 }
      ) as never;
    }

    return {
      ok: true,
      change: diffChange(relativeToWorkspace(found.file), raw, newContent),
      message:
        `已写入 ${merged.length} 个回调参数：${args.map((a) => `${a.origin} → ${a.target}`).join("、")}` +
        (strippedDeadKey ? "；顺带清掉了组件上无效的 callbackArgs 死键" : "") +
        `。下一步：消费方过滤器的 callBack 要声明这些变量名，且消费组件 openFilter 必须为 true` +
        `（openFilter 只管消费侧，源组件不需要开）`
    };
  }
});
