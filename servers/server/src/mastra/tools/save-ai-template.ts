import fsp from "node:fs/promises";

import { createTool } from "@mastra/core/tools";
import z from "zod";

import { SuspendDefs, SuspendType } from "../types/suspend";
import { resolveFilePath } from "./file/state";

/** 模板 JSON 的关键字段键名（中文键，来源见 scripts/create-template.ts 骨架） */
const KEY_NAME = "模板名称";
const KEY_TAGS = "AI匹配语义标签";
const KEY_EMBEDDING = "嵌入摘要";

/** create-template 骨架占位统一带 "TODO" 前缀（如 "TODO(agent填)：..."） */
const TODO_MARK = "TODO";

const hasTodo = (v: unknown): boolean => typeof v === "string" && v.includes(TODO_MARK);

/**
 * 递归扫描对象里所有「仍含 TODO 占位」的字符串字段，返回点分路径列表。
 * 用于在弹窗前拦截「子 agent 没填完语义字段」的半成品模板。
 */
const collectTodoPaths = (node: unknown, prefix: string, out: string[]): void => {
  if (typeof node === "string") {
    if (node.includes(TODO_MARK)) {
      out.push(prefix);
    }
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item, i) => collectTodoPaths(item, `${prefix}[${i}]`, out));
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      collectTodoPaths(v, prefix ? `${prefix}.${k}` : k, out);
    }
  }
};

/**
 * 校验模板完整性。返回问题列表（空数组=通过）。
 * 文案明确点名缺失字段及原因（为空 / 残留 TODO），便于主 agent 精准回去补。
 */
const validateTemplate = (template: Record<string, unknown>): string[] => {
  const issues: string[] = [];

  // 1) 关键字段：模板名称
  const name = template[KEY_NAME];
  if (typeof name !== "string" || !name.trim()) {
    issues.push(`「${KEY_NAME}」为空，未填写范式中文名`);
  } else if (hasTodo(name)) {
    issues.push(`「${KEY_NAME}」仍是 TODO 占位，未填写`);
  }

  // 2) 关键字段：AI匹配语义标签（检索命中率核心，必须非空数组）
  const tags = template[KEY_TAGS];
  if (!Array.isArray(tags) || tags.length === 0) {
    issues.push(`「${KEY_TAGS}」为空，子 agent 未生成检索标签`);
  } else if (tags.some((t) => typeof t !== "string" || !t.trim() || hasTodo(t))) {
    issues.push(`「${KEY_TAGS}」存在空标签或 TODO 占位`);
  }

  // 3) 关键字段：嵌入摘要（向量化原文，必须非空且非占位）
  const embedding = template[KEY_EMBEDDING];
  if (typeof embedding !== "string" || !embedding.trim()) {
    issues.push(`「${KEY_EMBEDDING}」为空，未填写向量化检索原文`);
  } else if (hasTodo(embedding)) {
    issues.push(`「${KEY_EMBEDDING}」仍是 TODO 占位，未填写`);
  }

  // 4) 其余字段残留 TODO（排除上面已专门报过的关键字段，避免重复）
  const todoPaths: string[] = [];
  collectTodoPaths(template, "", todoPaths);
  const handled = new Set([KEY_NAME, KEY_TAGS, KEY_EMBEDDING]);
  const otherTodos = todoPaths.filter((p) => !handled.has(p.split(/[.[]/)[0]));
  if (otherTodos.length > 0) {
    issues.push(`以下字段仍残留 TODO 占位，未填写：${otherTodos.join("、")}`);
  }

  return issues;
};

export const saveAiTemplateTool = createTool({
  id: "save_ai_template",
  description: `把模板提取子 agent 产出的 template-{screenId}.json 交给用户确认并保存为「AI 模板」资产。

调用时机：templateExtractorAgent 返回模板文件路径、且你已审阅无误后调用。

行为：
- 工具读取模板文件并**先做完整性校验**（无残留 TODO、且「${KEY_NAME}」「${KEY_TAGS}」「${KEY_EMBEDDING}」均已填写）。
- 校验不通过：直接返回 { saved:false, issues }，**不会弹窗**。请根据 issues 回去补全（重跑提取或用 edit_files 修改模板），再重新调用本工具。
- 校验通过：弹出预填弹窗，用户复核/修改后自行保存（前端会附带当前大屏数据与封面截图）。用户保存返回 { saved:true, templateId }，取消返回 { saved:false, canceled:true }。`,

  inputSchema: z.object({
    templatePath: z.string().describe('模板文件的 workspace 相对路径，例 "screen_30551_1/template-30551.json"')
  }),

  outputSchema: z.object({
    saved: z.boolean(),
    templateId: z.number().optional(),
    canceled: z.boolean().optional(),
    issues: z.array(z.string()).optional().describe("校验未通过时的问题列表")
  }),

  suspendSchema: SuspendDefs[SuspendType.SaveAiTemplate].suspend,
  resumeSchema: SuspendDefs[SuspendType.SaveAiTemplate].resume,

  execute: async ({ templatePath }, context) => {
    const { suspend, resumeData } = context?.agent ?? {};

    // resume 重跑：直接回传前端给的结果
    if (resumeData) {
      return resumeData;
    }

    // 读取模板文件
    const absPath = resolveFilePath(templatePath);
    let raw: string;
    try {
      raw = await fsp.readFile(absPath, "utf-8");
    } catch {
      return { saved: false, issues: [`模板文件不存在或无法读取：${templatePath}`] };
    }

    // 解析
    let template: Record<string, unknown>;
    try {
      template = JSON.parse(raw) as Record<string, unknown>;
    } catch (e) {
      return { saved: false, issues: [`模板文件不是合法 JSON：${(e as Error).message}`] };
    }

    // 读取即校验：不通过则不弹窗，把问题原样回给主 agent
    const issues = validateTemplate(template);
    if (issues.length > 0) {
      return { saved: false, issues };
    }

    // 映射预填字段并挂起，交前端弹窗
    const name = template[KEY_NAME] as string;
    const tags = template[KEY_TAGS] as string[];
    const embeddingText = template[KEY_EMBEDDING] as string;

    return suspend!({
      type: SuspendType.SaveAiTemplate,
      name,
      tags,
      embeddingText,
      payload: raw
    }) as never;
  }
});
