import fsp from "node:fs/promises";
import path from "node:path";

import { ComponentFlatSchema, type ComponentProp, componentPropSchemaMap } from "@screenwright/types/schemas";
import type { z } from "zod";

// ── 组件文件名（id_name）──────────────────────────────────────────────────────

/**
 * 文件名净化：白名单——只保留「文字（含中日韩）/ 数字 / 连字符」，其余一律剔除。
 * 比逐个拉黑文件系统非法字符更严：连引号（含弯引号 “”）、各类中英文标点、空格、下划线都会去掉，
 * 避免这些字符在 agent 拼路径时被写成等价但不同的码点（如 ASCII " vs 弯引号 “）导致 File not found。
 * 下划线是段分隔符，作为净化目标剔除可防止 name 内部出现 "_" 干扰 id 解析。
 */
const UNSAFE_FILENAME_CHARS = /[^\p{L}\p{N}-]/gu;
const MAX_NAME_LEN = 10;

/**
 * 生成安全的 id_name 基础名（不含扩展名）。
 * 格式为 `{id}_{name}`；调用方通常传 `name ?? title`，故 name 为空时会退回组件类型（如"柱状图"），
 * name 净化后为空的段自动省略，最差退化为纯 id，
 * 保证旧数据/异常场景下文件名仍可用 extractIdFromIdName 还原（id 始终在首段）。
 */
export function buildIdNameBase(id: number, name: string): string {
  const safeName = name.replace(UNSAFE_FILENAME_CHARS, "").trim().slice(0, MAX_NAME_LEN);
  return [String(id), safeName].filter(Boolean).join("_");
}

/**
 * 从 "123_柱状图"、"123_柱状图.json"、纯 "123"、"123.json" 中提取数字 id。
 * 兼容旧格式（纯数字文件名），便于新旧 workspace 数据混存期间平滑过渡。
 */
export function extractIdFromIdName(idNameOrFile: string): number | null {
  const match = /^(\d+)(?:_|\.|$)/.exec(idNameOrFile);
  if (!match) {
    return null;
  }
  return parseInt(match[1], 10);
}

/**
 * 生成动态面板状态子目录名："{stateId}_{stateName}"。
 * 状态 id 是字符串（通常为 uuid），不是纯数字，不能复用 buildIdNameBase 的提取规则，
 * 因此目录名与文件名一致用 "_" 分隔，但还原时按"第一个下划线之前"取 stateId（见 extractStateIdFromDirName）。
 */
export function buildStateDirName(stateId: string, stateName: string | undefined): string {
  const safeName = (stateName ?? "").replace(UNSAFE_FILENAME_CHARS, "").trim().slice(0, MAX_NAME_LEN);
  return safeName ? `${stateId}_${safeName}` : stateId;
}

/** 从 "{stateId}_{stateName}" 目录名中提取原始 stateId（取第一个下划线之前的部分；无下划线则原样返回，兼容旧数据） */
export function extractStateIdFromDirName(dirName: string): string {
  const idx = dirName.indexOf("_");
  return idx === -1 ? dirName : dirName.slice(0, idx);
}

/**
 * 带屏作用域的组件引用：`"{screenId}_{versionCode}/{componentId}"`，如 `"29445_1/4177"`。
 *
 * **组件 id 单独拿出来是不足以定位一个组件的**——工作区里多块屏并存（线上就是 screen_73/74/75/76
 * 这样躺着的），同一个 id 在两块屏上都存在时，按 id 全区搜只会撞见目录序上的第一个。
 * 实测代价：`ungroup_component({groupIds:["4177"]})` 解散了另一块屏的分组。
 *
 * `copy_component`（收路径）和 `create_component`（收 screenId）本来就是对的，这个形态是把
 * 剩下四个工具补齐到同一水准。前缀省略时仍然可用，但会退化成全区搜（见 findComponentFileInWorkspace）。
 */
export function parseScopedComponentId(ref: string | number): { screenKey: string | null; componentId: number | null } {
  if (typeof ref === "number") {
    return { screenKey: null, componentId: ref };
  }
  const trimmed = ref.trim();
  const slash = trimmed.lastIndexOf("/");
  if (slash === -1) {
    return { screenKey: null, componentId: extractIdFromIdName(trimmed) };
  }
  // 容忍 agent 把目录名整个抄进来："screen_29445_1/4177" 与 "29445_1/4177" 都认
  const screenKey = trimmed.slice(0, slash).replace(/^screen_/u, "");
  return { screenKey: screenKey || null, componentId: extractIdFromIdName(trimmed.slice(slash + 1)) };
}

/**
 * 查找组件文件。入参可以是带屏前缀的作用域引用（`"29445_1/4177"`，推荐）或裸 id。
 *
 * - **给了屏** → 只在 `screen_{screenKey}/` 下找，绝不会碰到别的屏
 * - **没给屏** → 全工作区找；**命中多于一处时返回 `ambiguous`**，不再静默取第一个
 *
 * 最后那条是重点：裸 id 撞车时，让它变成一句 agent 读得懂的报错，比悄悄改错一块屏强得多。
 * 找不到返回 null。
 */
export async function findComponentFileInWorkspace(
  workspaceBase: string,
  componentId: string | number
): Promise<{ file: string; base: string } | { ambiguous: string[] } | null> {
  const { screenKey, componentId: targetId } = parseScopedComponentId(componentId);
  if (targetId === null) {
    return null;
  }

  async function collect(dir: string, out: string[]): Promise<void> {
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await collect(path.join(dir, entry.name), out);
      } else if (entry.name.endsWith(".json") && extractIdFromIdName(entry.name) === targetId) {
        out.push(path.join(dir, entry.name));
      }
    }
  }

  const root = screenKey ? path.join(workspaceBase, `screen_${screenKey}`) : workspaceBase;
  const hits: string[] = [];
  await collect(root, hits);

  if (hits.length === 0) {
    return null;
  }
  // 同一块屏里 id 唯一，所以歧义只可能来自「没给屏 + 多屏共存」
  if (hits.length > 1 && !screenKey) {
    return { ambiguous: hits.map((f) => path.relative(workspaceBase, f).replace(/\\/gu, "/")) };
  }
  return { file: hits[0], base: path.basename(hits[0], ".json") };
}

/** `findComponentFileInWorkspace` 的结果是不是歧义。 */
export const isAmbiguousMatch = (
  found: Awaited<ReturnType<typeof findComponentFileInWorkspace>>
): found is { ambiguous: string[] } => found !== null && "ambiguous" in found;

/** 歧义时给 agent 的话：告诉它该怎么改这次调用，而不只是「失败了」。 */
export const describeAmbiguity = (ref: string, matches: string[]): string =>
  `组件 id "${ref}" 在多块大屏下都存在（${matches.join("、")}），无法确定你要操作哪一块。` +
  `请改用带大屏前缀的形态，例如 "${matches[0].split("/")[0].replace(/^screen_/u, "")}/${ref}"。`;

/**
 * 把 Windows 文件系统非法字符（\ / : * ? " < > |）替换成等价全角字符（合法且视觉一致），
 * 控制字符直接剔除。用于「名字本身就是唯一标识、没有 id 锚点」的落盘场景（如数据过滤器名），
 * 不能像组件名那样用 buildIdNameBase 激进白名单净化（会截断/去标点导致不同名字碰撞或不可读）。
 * 真实名仍保留在文件内容的 name 字段里，回推前端时以 name 为准，文件名仅供落盘。
 */
const FS_ILLEGAL_MAP: Record<string, string> = {
  "\\": "＼",
  "/": "／",
  ":": "：",
  "*": "＊",
  "?": "？",
  '"': "＂",
  "<": "＜",
  ">": "＞",
  "|": "｜"
};
const FS_ILLEGAL_RE = new RegExp(
  "[" +
    Object.keys(FS_ILLEGAL_MAP)
      .map((c) => "\\" + c)
      .join("") +
    "]",
  "g"
);
/**
 * 编辑结果的统一文案。suffix 用来补充「然后发生了什么」——落盘推迟到前端确认之后，
 * 所以这句话经常是「未写入工作区: …」而不是成功。
 */
export function formatSuccessMessage(replacements: number, absPath: string, suffix?: string): string {
  const noun = replacements === 1 ? "occurrence" : "occurrences";
  const base = `Replaced ${replacements} ${noun} in ${absPath}`;
  return suffix ? `${base}. ${suffix}` : base;
}

export function sanitizeFsName(name: string): string {
  return name.replace(FS_ILLEGAL_RE, (c) => FS_ILLEGAL_MAP[c] ?? "_");
}
// ── 组件校验 ──────────────────────────────────────────────────────────────────

type ComponentFlatType = z.infer<typeof ComponentFlatSchema>;

/**
 * 把分组/动态面板的子引用归一成数字 id 数组，好让 ComponentFlatSchema 校验得动。
 *
 * 同一个容器节点会以三种形态出现，这里一并收口：
 * - **磁盘形态**：children / panelData[i].config 是 "{id}_{name}" 字符串（便于人和 agent 直接识别）；
 * - **内存形态**：是内联好的完整子组件对象（前端建好回传的分组、复制出来的子树都是这样）；
 * - 已经是 id 的，原样放过。
 *
 * 内联对象必须换成 id 而不是留着让 schema 去啃：扁平 schema 描述的是**这一个节点**，
 * 子组件各自作为独立节点校验，塞在这里只会得到一串「children[i] 应为 number」的假报错。
 */
function toChildId(child: unknown): unknown {
  if (typeof child === "string") {
    return extractIdFromIdName(child) ?? child;
  }
  if (child && typeof child === "object" && "id" in child) {
    return (child as { id: unknown }).id;
  }
  return child;
}

export function normalizeChildRefs(parsed: Record<string, unknown>): void {
  if (Array.isArray(parsed.children)) {
    parsed.children = (parsed.children as unknown[]).map(toChildId);
  }
  if (Array.isArray(parsed.panelData)) {
    for (const state of parsed.panelData as Array<Record<string, unknown>>) {
      if (Array.isArray(state.config)) {
        state.config = (state.config as unknown[]).map(toChildId);
      }
    }
  }
}

const issuesOf = (error: z.ZodError): string[] =>
  error.issues.map((issue) => `[${issue.path.join(".") || "(root)"}] ${issue.message}`);

/**
 * 顶层多出来的、schema 不认识的键——默认 `z.object()` 会静默丢弃，不报错也不警告，
 * 写的人以为生效了，实际这个键从落盘那一刻起就是死的。
 *
 * 典型案例：`cbArgs`（组件抛回调参数用的字段）写成了 `callbackArgs`——这两个词在
 * `agent-workspace/skills/executor/sw-data-flow/references/` 里挨着出现、
 * 含义却不同（`cbArgs` 是源组件的声明字段，`callbackArgs` 是过滤器 JS 里能读到的运行时
 * 聚合变量），很容易记混。混了之后 `editFilesTool` 照样返回成功，实际组件的回调链路
 * 永远不会触发——这类「看起来做完了、其实零效果」的坑，比结构校验直接报错更难查。
 *
 * 跟属性层同样的理由不能硬拦：不确定是否有旧数据合法地带着未知键，拦了可能锁死组件。
 * 所以走同一条「警告不阻断」的路——用 `.strict()` 单跑一次只为抓 `unrecognized_keys`，
 * 不影响真正决定放行与否的那次 `safeParse`。
 */
function unrecognizedTopLevelKeys(candidate: Record<string, unknown>): string[] {
  const strict = ComponentFlatSchema.strict().safeParse(candidate);
  if (strict.success) {
    return [];
  }
  return strict.error.issues.flatMap((issue) => (issue.code === "unrecognized_keys" ? issue.keys : []));
}

/**
 * 组件校验，**分两层**。
 *
 * | 层 | schema | 不过怎么办 |
 * |---|---|---|
 * | 结构层 | `ComponentFlatSchema` | 拒绝——id/component/name/left/top/zIndex 坏了，整屏就读不回来 |
 * | 属性层 | `componentPropSchemaMap[prop]` 的 option/data | **只警告**，照常放行 |
 *
 * 为什么属性层不能拦：那些 per-prop schema 比真实数据严。实测从产品接口导出的 9 个组件里有 3 个
 * 过不了（`echartlineAndBar` 缺 `option.yAxisIndex`、`subtabs` 缺 `option.seriesTabsList`），
 * 而它们在画布上跑得好好的。硬拦的后果是**组件被历史脏数据永久锁死**：改一个完全无关的字段
 * （比如宽度）也会被这些旧账拒绝，agent 只能要么放弃、要么去补一堆它并不理解的字段——
 * 实测一次「把宽度改成 800」为此烧掉 60 轮。
 *
 * 所以属性层的结论进 `warnings`，由调用方拼进工具返回文本告诉 agent，但不阻断落盘。
 * 要给某条路单独收紧（比如新建组件时必须完全合法），以后加 strict 入参，别改这里的默认值。
 *
 * 顶层多余键（见 `unrecognizedTopLevelKeys`）也走 `warnings`，跟属性层的警告合并返回。
 */
export function validateComponentContent(
  content: string
):
  | { ok: true; data: ComponentFlatType; warnings?: string[] }
  | { ok: false; message: string; validationErrors?: string[] } {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;

    // 磁盘格式：children / panelData[i].config 是 "{id}_{name}" 字符串数组，推送前还原为数字 id
    normalizeChildRefs(parsed);

    const candidate = { cbArgs: [], ...parsed };

    // ── 结构层：唯一的硬闸门 ──────────────────────────────────────────────
    const structural = ComponentFlatSchema.safeParse(candidate);
    if (!structural.success) {
      const errors = issuesOf(structural.error);
      return {
        ok: false,
        message: `Component validation failed (ComponentFlatSchema) with ${errors.length} error(s). Fix the issues and retry.`,
        validationErrors: errors
      };
    }

    // 顶层多余键：跟属性层warnings 合并返回，两处校验共用这一份判定
    const unknownKeys = unrecognizedTopLevelKeys(candidate);
    const unknownKeyWarnings = unknownKeys.length
      ? [`顶层有 ${unknownKeys.length} 个 schema 不认识的键，已静默忽略、没有生效：${unknownKeys.join("、")}`]
      : [];

    // ── 属性层：只诊断，不拦 ─────────────────────────────────────────────
    const prop = (parsed?.component as Record<string, unknown> | undefined)?.prop as ComponentProp | undefined;
    const propEntry = prop ? componentPropSchemaMap[prop] : undefined;
    if (!propEntry) {
      return unknownKeyWarnings.length
        ? { ok: true, data: structural.data, warnings: unknownKeyWarnings }
        : { ok: true, data: structural.data };
    }

    const typed = ComponentFlatSchema.omit({ data: true, option: true })
      .extend({ data: propEntry.data, option: propEntry.option })
      .safeParse(candidate);
    if (typed.success) {
      // 属性层也过了：用它的结果，zod 会按 prop schema 补上默认值
      return unknownKeyWarnings.length
        ? { ok: true, data: typed.data as ComponentFlatType, warnings: unknownKeyWarnings }
        : { ok: true, data: typed.data as ComponentFlatType };
    }

    const warnings = issuesOf(typed.error);
    return {
      ok: true,
      // 属性层没过就不能用它的 data（parse 失败没有产物），退回结构层那份
      data: structural.data,
      warnings: [
        `${prop} schema 有 ${warnings.length} 处不匹配（已放行，未阻断落盘）`,
        ...warnings,
        ...unknownKeyWarnings
      ]
    };
  } catch (e) {
    return {
      ok: false,
      message: `Result is not valid JSON: ${e instanceof Error ? e.message : String(e)}`
    };
  }
}

/** 把 warnings 拼成一句可以直接接在工具返回 message 后面的话；没有警告时返回空串。 */
export function formatValidationWarnings(warnings: string[] | undefined): string {
  return warnings?.length ? ` 注意：${warnings.join("；")}` : "";
}

// ── 组件推送 ──────────────────────────────────────────────────────────────────

interface Writer {
  custom: (event: { type: string; data: unknown; transient?: boolean }) => Promise<void>;
}

export async function pushComponentUpdate(
  writer: Writer | null | undefined,
  component: ComponentFlatType,
  absPath: string
): Promise<void> {
  if (!writer) {
    return;
  }
  const placement = parsePlacementFromPath(absPath) ?? undefined;
  await writer.custom({
    type: "data-component-update",
    data: { component, placement },
    transient: true
  });
}

// ── 编码检测 ──────────────────────────────────────────────────────────────────

export function detectEncoding(buf: Buffer): "utf16le" | "utf8" {
  return buf[0] === 0xff && buf[1] === 0xfe ? "utf16le" : "utf8";
}

export function detectLineEnding(content: string): "\r\n" | "\n" {
  return content.includes("\r\n") ? "\r\n" : "\n";
}

// ── 二进制检测（取前 8KB 采样） ───────────────────────────────────────────────

export function isBinaryBuffer(buf: Buffer): boolean {
  const sample = buf.slice(0, Math.min(buf.length, 8192));
  for (const byte of sample) {
    if (byte === 0) {
      return true;
    } // null byte → 二进制
  }
  return false;
}

// ── 引号归一化 ────────────────────────────────────────────────────────────────

/** 把弯引号/特殊引号全部转成直引号，用于容错匹配 */
export function normalizeQuotes(s: string): string {
  return s
    .replace(/[\u2018\u2019\u02bc\u0060]/g, "'") // ' ' ʼ `
    .replace(/[\u201c\u201d\u00ab\u00bb]/g, '"'); // " " « »
}

// ── 字符串匹配（三层容错） ────────────────────────────────────────────────────

export class StringNotFoundError extends Error {
  constructor(public readonly searchString: string) {
    super(
      "The specified text was not found in the file. Make sure you use the exact text from the file (read it first if needed)."
    );
    this.name = "StringNotFoundError";
  }
}

export class StringNotUniqueError extends Error {
  constructor(
    public readonly searchString: string,
    public readonly occurrences: number
  ) {
    super(
      `The specified text appears ${occurrences} times. Provide more surrounding context to make old_string unique, or set replace_all=true.`
    );
    this.name = "StringNotUniqueError";
  }
}

function countOccurrences(content: string, search: string): number {
  if (!search) {
    return 0;
  }
  let count = 0,
    pos = 0;
  while ((pos = content.indexOf(search, pos)) !== -1) {
    count++;
    pos += search.length;
  }
  return count;
}

/**
 * 三层容错匹配：
 *   1. 精确匹配
 *   2. 引号归一化后匹配（在归一化后的内容上找，然后还原到原始内容的真实位置）
 *   3. 均失败 → StringNotFoundError
 *
 * @returns 在原始内容中实际存在的 oldString（可能经过引号还原）
 */
export function findActualString(content: string, oldString: string): string {
  // 1. 精确匹配
  if (content.includes(oldString)) {
    return oldString;
  }

  // 2. 引号归一化匹配
  const normContent = normalizeQuotes(content);
  const normOld = normalizeQuotes(oldString);
  if (normContent.includes(normOld)) {
    // 在归一化内容上找到位置，然后截取原始内容的对应片段
    const idx = normContent.indexOf(normOld);
    return content.slice(idx, idx + normOld.length);
  }

  throw new StringNotFoundError(oldString);
}

/**
 * 执行替换，返回新内容和替换次数。
 */
export function replaceString(
  content: string,
  actualOld: string,
  newString: string,
  replaceAll: boolean
): { content: string; replacements: number } {
  const count = countOccurrences(content, actualOld);

  if (count === 0) {
    throw new StringNotFoundError(actualOld);
  }
  if (!replaceAll && count > 1) {
    throw new StringNotUniqueError(actualOld, count);
  }

  // 转义 $ 防止 String.prototype.replace 的替换模式被误解
  const escapedNew = newString.replace(/\$/g, "$$$$");

  if (replaceAll) {
    return {
      content: content.split(actualOld).join(newString),
      replacements: count
    };
  } else {
    return { content: content.replace(actualOld, escapedNew), replacements: 1 };
  }
}

// ── 组件路径推导 ──────────────────────────────────────────────────────────────

export type ComponentPlacement =
  | { parentId: number; parentType: "group" }
  | { parentId: number; parentType: "dynamicPanel"; stateId: string };

/**
 * 从组件文件的绝对路径倒序推导最近父节点。
 *
 * workspace 路径规则（workspace-structure.md）：
 *   component/{id}_{name}.json                                        → 根目录，无父级
 *   component/.../{groupId}_{groupName}/{id}_{name}.json              → 分组（最近目录可提取出数字 id）
 *   component/.../{panelId}_{panelName}/{stateId}_{stateName}/{id}_{name}.json → 动态面板（最近目录提取不出数字 id，上一级可提取出数字 id）
 */
/**
 * 从 component/ 之后的目录段列表推导父节点，供 parsePlacementFromPath / parsePlacementFromDir 复用。
 */
function parsePlacementFromDirs(dirs: string[]): ComponentPlacement | null {
  if (dirs.length === 0) {
    return null;
  }

  const nearest = dirs[dirs.length - 1];
  const nearestId = extractIdFromIdName(nearest);

  if (nearestId !== null) {
    return { parentId: nearestId, parentType: "group" };
  }

  if (dirs.length >= 2) {
    const panelDir = dirs[dirs.length - 2];
    const panelId = extractIdFromIdName(panelDir);
    if (panelId !== null) {
      return {
        parentId: panelId,
        parentType: "dynamicPanel",
        stateId: extractStateIdFromDirName(nearest)
      };
    }
  }

  return null;
}

export function parsePlacementFromPath(absPath: string): ComponentPlacement | null {
  const normalized = absPath.replace(/\\/g, "/");
  const marker = "/component/";
  const idx = normalized.lastIndexOf(marker);
  if (idx === -1) {
    return null;
  }

  const parts = normalized.slice(idx + marker.length).split("/");
  const dirs = parts.slice(0, -1); // 去掉文件名

  return parsePlacementFromDirs(dirs);
}

/** 从组件所在目录的绝对路径推导父节点（适用于已知目录、无需文件名的场景） */
export function parsePlacementFromDir(absDir: string): ComponentPlacement | null {
  const normalized = absDir.replace(/\\/g, "/");
  const marker = "/component/";
  const idx = normalized.lastIndexOf(marker);
  if (idx === -1) {
    return null;
  }

  const dirs = normalized
    .slice(idx + marker.length)
    .split("/")
    .filter(Boolean);

  return parsePlacementFromDirs(dirs);
}

// ── 文件读取（带编码 + 行尾符检测） ──────────────────────────────────────────

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB

export async function readFileWithMeta(filePath: string): Promise<{
  content: string; // 统一 LF
  mtimeMs: number;
  encoding: "utf8" | "utf16le";
  lineEnding: "\r\n" | "\n";
}> {
  const stat = await fsp.stat(filePath);

  if (stat.size > MAX_FILE_SIZE) {
    throw new Error(
      `File is too large (${(stat.size / 1024 / 1024 / 1024).toFixed(2)} GB). Maximum supported size is 1 GB.`
    );
  }

  const buf = await fsp.readFile(filePath);

  if (isBinaryBuffer(buf)) {
    throw new Error("Cannot edit binary files. Use a write-file tool to overwrite the entire file.");
  }

  const encoding = detectEncoding(buf);
  const raw = buf.toString(encoding);
  const lineEnding = detectLineEnding(raw);
  const content = raw.replace(/\r\n/g, "\n"); // 统一 LF

  return { content, mtimeMs: stat.mtimeMs, encoding, lineEnding };
}
