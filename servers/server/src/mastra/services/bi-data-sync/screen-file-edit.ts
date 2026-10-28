import type { Filter, ParsedLargeScreenInfo } from "@screenwright/types";
import { FilterSchema } from "@screenwright/types/schemas";
import type { ZodType } from "zod";

import { ScreenInfoSchema } from "./screen-read";
import { type ScreenTree, ScreenTreeSet } from "./screen-tree-set";

export type ScreenInfo = Omit<ParsedLargeScreenInfo, "layers" | "dataFilterArr" | "aniFrameSet" | "statusAnimation">;

export interface DataFilterEditInput {
  originalName: string;
  filter: Filter;
}

/** 与组件那条路的 validateComponentContent 同口径的校验结果，失败时可直接喂给 completeFile */
export type ContentValidation<T> = { ok: true; data: T } | { ok: false; message: string; validationErrors?: string[] };

/**
 * 落盘前的 schema 校验。
 *
 * info.json 与 dataFilterArr 的 json 在**读**的时候本来就过 schema（ScreenReader 的
 * readAndValidate 不过就抛），写的时候却一直什么都不校验。这个缺口是致命的：agent 往 info.json 写一个
 * `"scale": "big"`，整屏回写照写不误，之后每一次 `new ScreenReader` 都抛 Screen data validation failed
 * ——这块大屏的读取、组件编辑、整屏回写全部瘫掉，只能手工改文件救回来。所以写之前先用同一份 schema 挡一道。
 *
 * **只校验，不采用 `parse` 的产物**：zod 会给带 `.default()` 的字段补值、并按 schema 声明顺序重排 key，
 * 那些值会一路写进工作区，把跟这次编辑无关的字段也改掉（与 readAndValidate 返回原始对象是同一个理由）。
 */
const validateAgainstSchema = <T>(value: unknown, schema: ZodType, label: string): ContentValidation<T> => {
  const result = schema.safeParse(value);
  if (result.success) {
    return { ok: true, data: value as T };
  }
  const validationErrors = result.error.issues.map((issue) => `[${issue.path.join(".") || "(root)"}] ${issue.message}`);
  return {
    ok: false,
    message: `${label} validation failed with ${validationErrors.length} error(s). Fix the issues and retry.`,
    validationErrors
  };
};

/** 校验 agent 编辑后的 info.json 文本。 */
export const validateScreenInfoContent = (content: string): ContentValidation<ScreenInfo> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    return { ok: false, message: `Screen info is not valid JSON: ${(error as Error).message}` };
  }
  return validateAgainstSchema(parsed, ScreenInfoSchema, "Screen info");
};

/** 校验合并了伴生 .js 之后的过滤器对象——这一份就是要放进树、随后整屏落盘的那一份。 */
export const validateDataFilterContent = (filter: unknown): ContentValidation<Filter> =>
  validateAgainstSchema(filter, FilterSchema, "Data filter");

/**
 * 把编辑后的 info.json 换进树里。
 *
 * info.json 是这些字段的唯一来源，所以是**替换**不是合并：agent 删掉的字段就真的消失。
 * 哪些字段归这份元信息管、哪些（dataFilterArr / 两份动画）要原样留下，由 core 说了算。
 * 内存变更一律经 core 的管理器，不在这里直接 setState 或伸手改 reader.navInfo。
 */
export const editScreenInfoInTree = (tree: ScreenTree, screenInfo: ScreenInfo): ScreenInfo => {
  tree.editor.screen.replaceNavInfo(screenInfo);
  return screenInfo;
};

/**
 * 保存过滤器并改好各组件上的绑定——跟 create_data_filter 那条路（screen-mutation 的 applyFilterSave）同一个 core 函数。
 * 拷一份再交给 core：core 会就地改它，而同一个入参在预览与提交里各用一次。
 */
export const editDataFilterInTree = async (tree: ScreenTree, input: DataFilterEditInput): Promise<Filter> =>
  (await tree.editor.dataFilter.saveFilterWithBindings(structuredClone(input.filter), input.originalName)).filter;

/**
 * 单独改一次 info.json：建树、替换、整屏落盘。
 *
 * 编辑后的 info.json 已经过 validateScreenInfoContent，拿它建树而不是去读磁盘上的旧版：
 * 旧版要是本身就不合 schema（历史脏数据），照常读会在动手之前就抛错，这次修复永远落不了地。
 */
export const applyScreenInfoEdit = async (absPath: string, editedContent: string): Promise<ScreenInfo | null> => {
  const screenInfo = JSON.parse(editedContent) as ScreenInfo;
  const trees = new ScreenTreeSet();
  const tree = trees.open(absPath, screenInfo);
  if (!tree) {
    return null;
  }
  editScreenInfoInTree(tree, screenInfo);
  trees.markDirty(tree);
  trees.flush();
  return screenInfo;
};
