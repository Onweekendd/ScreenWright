import { createHash } from "node:crypto";
import { readdirSync } from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import { createTool } from "@mastra/core/tools";
import sharp from "sharp";
import { z } from "zod";

import { assetStore } from "@/lib/storage";
import { TOOL_IMAGES_FIELD } from "@/mastra/provider/image-middleware";

import { readFileState, resolveFilePath, WORKSPACE_BASE } from "./state";
import { readFileWithMeta } from "./utils";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".tif", ".tiff"]);
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const MODEL_IMAGE_FORMATS: Record<string, { extension: string; mime: string }> = {
  png: { extension: "png", mime: "image/png" },
  jpeg: { extension: "jpg", mime: "image/jpeg" },
  webp: { extension: "webp", mime: "image/webp" },
  gif: { extension: "gif", mime: "image/gif" }
};

async function readImage(absPath: string, filePath: string) {
  const stat = await fsp.stat(absPath);
  if (stat.size > MAX_IMAGE_BYTES) {
    throw new Error(`Image is too large: ${filePath}. Maximum supported size is 50 MB.`);
  }
  const bytes = await fsp.readFile(absPath);
  const image = sharp(bytes);
  const { width, height, format } = await image.metadata().catch(() => {
    throw new Error(`Cannot decode image: ${filePath}`);
  });
  if (!width || !height || !format) {
    throw new Error(`Cannot decode image: ${filePath}`);
  }
  // 中间件按存储 key 推断 MIME；AVIF / TIFF 转成它已有支持的 PNG，原文件保持不变。
  const knownFormat = MODEL_IMAGE_FORMATS[format];
  const preview = knownFormat ? bytes : await image.png().toBuffer();
  const { extension, mime } = knownFormat ?? MODEL_IMAGE_FORMATS.png;
  const hash = createHash("sha256").update(preview).digest("hex");
  const { url } = await assetStore().put(`read-file-images/${hash}.${extension}`, preview, { contentType: mime });
  readFileState.delete(absPath);
  return {
    type: "image" as const,
    content: `Image ${filePath} (${width}×${height}). The image is attached for visual inspection.`,
    url,
    mimeType: mime,
    width,
    height,
    size: bytes.length,
    [TOOL_IMAGES_FIELD]: [{ url, label: `read_file：${filePath} ${width}×${height}` }]
  };
}

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
  description: `Read a text file or view an image. Use text reads to obtain exact content before structural edits with edit_files.

Usage:
- Provide a path relative to the workspace root (e.g. "screen_123/component/456.json").
- Text files return their content as a string and track file state for subsequent edits.
- PNG, JPEG, WebP, GIF, AVIF and TIFF images are attached for you to see through the image middleware; the result also includes URL, dimensions and size. Images are not decoded as text or tracked for text edits.
- Images are read in full (up to 50 MB); offset and limit apply only to text files. SVG files remain readable as text.`,

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

  outputSchema: z.union([
    z.object({
      content: z.string(),
      totalLines: z.number(),
      encoding: z.enum(["utf8", "utf16le"]),
      lineEnding: z.enum(["LF", "CRLF"]),
      isPartialView: z.boolean(),
      schemaDoc: z.string().optional().describe("组件 schema 文档路径（相对 workspace），修改前必须先读取"),
      notice: z.string().optional().describe("读的是 skill 文件时的提示：下次该用哪个工具")
    }),
    z.object({
      type: z.literal("image"),
      content: z.string(),
      url: z.string(),
      mimeType: z.string(),
      width: z.number(),
      height: z.number(),
      size: z.number(),
      [TOOL_IMAGES_FIELD]: z.array(z.object({ url: z.string(), label: z.string() }))
    })
  ]),

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

    if (IMAGE_EXTENSIONS.has(path.extname(absPath).toLowerCase())) {
      return readImage(absPath, filePath);
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
