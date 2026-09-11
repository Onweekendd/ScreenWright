import { readdirSync } from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { readFileState, resolveFilePath, WORKSPACE_BASE } from "./state";
import { readFileWithMeta } from "./utils";

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

function isComponentFilePath(normalizedPath: string): boolean {
  return normalizedPath.endsWith(".json") && normalizedPath.includes("/component/");
}

function isUnderSkillsDir(absPath: string): boolean {
  const skillsDir = path.resolve(WORKSPACE_BASE, "skills");
  const normalized = path.normalize(absPath);
  return normalized === skillsDir || normalized.startsWith(skillsDir + path.sep);
}

export const readFileTool = createTool({
  id: "read_file",
  description: `Read a file's content. Use it to obtain exact content before structural edits with edit_files.

Usage:
- Provide a path relative to the workspace root (e.g. "screen_123/component/456.json").
- Returns the file content as a string.
- Tracks the file state to allow subsequent edits.`,

  inputSchema: z.object({
    path: z.string().describe('Workspace-relative path to the file (e.g. "screen_123/component/456.json")'),
    offset: z.coerce
      .number()
      .int()
      .min(0)
      .optional()
      .describe("Start reading from this line number (1-based). Requires limit."),
    limit: z.coerce
      .number()
      .int()
      .min(0)
      .optional()
      .describe("Maximum number of lines to read; 0 or omitted reads the whole file")
  }),

  outputSchema: z.object({
    content: z.string(),
    totalLines: z.number(),
    encoding: z.enum(["utf8", "utf16le"]),
    lineEnding: z.enum(["LF", "CRLF"]),
    isPartialView: z.boolean(),
    schemaDoc: z.string().optional().describe("组件 schema 文档路径（相对 workspace），修改前必须先读取"),
    notice: z.string().optional().describe("读的是 skill 文件时的提示：下次该用哪个工具")
  }),

  execute: async ({ path: filePath, offset, limit }) => {
    // LLM 偶尔用 offset:0 / limit:0 表达「从头读全部」；0 在分页语义里没有意义，
    // 统一归一化为「未指定」，避免切出空内容、也避免下游对非法 0 的处理踩坑。
    const offsetNum = typeof offset === "number" && offset > 0 ? offset : undefined;
    const limitNum = typeof limit === "number" && limit > 0 ? limit : undefined;
    const absPath = resolveFilePath(filePath);

    // skills/** 该走 skill / skill_read（框架按 skills 配置统一加载）。之前这里直接拒绝，
    // 实测 agent 撞上之后下一步就改用 skill_read 读同一个文件——引导起效了，但白花一次往返。
    // 内容是同一份，读给它、附一句提示，效果一样、少一轮
    const skillHint = isUnderSkillsDir(absPath)
      ? "这是 skill 文件，下次直接用 skill({name}) 或 skill_read({skillName, path}) 读，不用走 read_file"
      : undefined;

    try {
      await fsp.access(absPath);
    } catch {
      throw new Error(`File not found: ${filePath}`);
    }

    const { content, mtimeMs, encoding, lineEnding } = await readFileWithMeta(absPath);
    const lines = content.split("\n");
    const totalLines = lines.length;

    let viewContent = content;
    let isPartialView = false;

    if (offsetNum !== undefined || limitNum !== undefined) {
      const start = Math.max(0, (offsetNum ?? 1) - 1);
      const end = limitNum !== undefined ? start + limitNum : lines.length;
      viewContent = lines.slice(start, end).join("\n");
      isPartialView = start > 0 || end < lines.length;
    }

    // 记录读取状态（供 EditFileTool 校验）
    readFileState.set(absPath, {
      content, // 始终存整个文件，用于竞态检测
      mtimeMs,
      encoding,
      lineEnding
    });

    const normalizedPath = absPath.replace(/\\/g, "/");
    let schemaDoc: string | undefined;
    if (isComponentFilePath(normalizedPath)) {
      try {
        const parsed = JSON.parse(content) as { component?: { prop?: string } };
        const prop = parsed.component?.prop;
        if (prop) {
          schemaDoc =
            findComponentDoc(
              path.join(WORKSPACE_BASE, "skills/executor/sw-component-schema/references/components"),
              prop
            ) ?? undefined;
        }
      } catch {
        // 解析失败时不附带文档路径
      }
    }

    return {
      content: viewContent,
      totalLines,
      encoding,
      lineEnding: (lineEnding === "\r\n" ? "CRLF" : "LF") as "CRLF" | "LF",
      isPartialView,
      ...(schemaDoc ? { schemaDoc } : {}),
      ...(skillHint ? { notice: skillHint } : {})
    };
  }
});
