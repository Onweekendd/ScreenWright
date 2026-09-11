import type { ScreenEditor } from "@screenwright/core";
import type { Filter, ParsedLargeScreenInfo } from "@screenwright/types";
import { FilterSchema } from "@screenwright/types/schemas";
import type { ZodType } from "zod";

import { getScreenVersionKeyFromPath } from "../screen-workspace";
import { applyFilterSave, runScreenMutation } from "./screen-mutation";
import { ScreenInfoSchema, type ScreenReader } from "./screen-read";

type ScreenInfo = Omit<ParsedLargeScreenInfo, "layers" | "dataFilterArr" | "aniFrameSet" | "statusAnimation">;

export interface DataFilterEditInput {
  originalName: string;
  filter: Filter;
}

/** 与组件那条路的 validateComponentContent 同口径的校验结果，失败时可直接喂给 completeFile */
export type ContentValidation<T> = { ok: true; data: T } | { ok: false; message: string; validationErrors?: string[] };

/**
 * 落盘前的 schema 校验。
 *
 * info.json 与 dataFilterArr 的 json 在**读**的时候本来就过 schema（{@link ScreenReader} 的
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
 * 按**被编辑文件的路径**定位大屏，其余交给 {@link runScreenMutation}。
 *
 * 与那批 apply* 的区别只在入口形态：edit_files 手里有的是一个文件路径，而前端确认后落盘的那批
 * 手里有的是 screenKey。改的规矩是同一套——内存变更一律经 core 的管理器，不在这里直接 setState
 * 或伸手改 reader.navInfo：那些语义（哪些字段归谁管、改名要摘掉哪些绑定）前端也要用。
 */
const runScreenEdit = async <T>(
  absPath: string,
  update: (editor: ScreenEditor, reader: ScreenReader) => T | Promise<T>,
  write: boolean
): Promise<T | null> => {
  const screenKey = getScreenVersionKeyFromPath(absPath);
  if (!screenKey) {
    return null;
  }
  return runScreenMutation(screenKey, update, { write });
};

const runScreenInfoEdit = (absPath: string, editedContent: string, write: boolean): Promise<ScreenInfo | null> => {
  const screenInfo = JSON.parse(editedContent) as ScreenInfo;
  return runScreenEdit(
    absPath,
    (editor) => {
      // info.json 是这些字段的唯一来源，所以是**替换**不是合并：agent 删掉的字段就真的消失。
      // 哪些字段归这份元信息管、哪些（dataFilterArr / 两份动画）要原样留下，由 core 说了算。
      editor.screen.replaceNavInfo(screenInfo);
      return screenInfo;
    },
    write
  );
};

/** 保存本身归 {@link applyFilterSave}，这里只把路径换算成 screenKey——跟 create_data_filter 那条路是同一份保存逻辑。 */
const runDataFilterEdit = async (
  absPath: string,
  input: DataFilterEditInput,
  write: boolean
): Promise<Filter | null> => {
  const screenKey = getScreenVersionKeyFromPath(absPath);
  if (!screenKey) {
    return null;
  }
  return applyFilterSave(screenKey, input.filter, input.originalName, { write });
};

export const previewScreenInfoEdit = (absPath: string, editedContent: string): Promise<ScreenInfo | null> =>
  runScreenInfoEdit(absPath, editedContent, false);

export const applyScreenInfoEdit = (absPath: string, editedContent: string): Promise<ScreenInfo | null> =>
  runScreenInfoEdit(absPath, editedContent, true);

export const previewDataFilterEdit = (absPath: string, input: DataFilterEditInput): Promise<Filter | null> =>
  runDataFilterEdit(absPath, input, false);

export const applyDataFilterEdit = (absPath: string, input: DataFilterEditInput): Promise<Filter | null> =>
  runDataFilterEdit(absPath, input, true);
