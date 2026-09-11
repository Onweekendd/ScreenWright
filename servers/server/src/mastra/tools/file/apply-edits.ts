import { findActualString, replaceString, StringNotFoundError, StringNotUniqueError } from "./utils";

/**
 * 单条替换指令。结构上与 edit_files 的 inputSchema 一致，但这里**不引用那个 zod 类型**——
 * 它定义在 edit-files.ts 里，反向 import 会成环，而本模块存在的意义就是不依赖那一整套。
 */
export interface TextEdit {
  old_string: string;
  new_string: string;
  replace_all?: boolean;
}

export interface ReplaceResult {
  content: string;
  replacements: number;
}

/**
 * 把一串 edit 顺序应用到文本上，返回新内容与总替换次数。
 *
 * **纯函数**：不碰磁盘、不看文件类型、不认识 suspend/batch 那一套。抽出来是因为它此前埋在
 * processFileEdit 中段三十几行，只能靠跑整个工具间接测到，而它其实是这个工具里最该被直接
 * 覆盖的一段（唯一性判定、错误前缀、逐条累积）。
 *
 * 语义与原地内联时逐字一致：
 * - **一个文件内的 edit 是原子的**：任一条失败就整体抛出，调用方不落盘（见 edit_files 的工具描述）
 * - 每条 edit 作用在**上一条的结果**上，不是原始内容
 * - 未开 replace_all 时命中多处即报错，避免误改
 * - 错误消息统一带 `edits[i]: ` 前缀，让模型知道是第几条挂的
 *
 * @throws {StringNotFoundError} old_string 找不到
 * @throws {StringNotUniqueError} 未开 replace_all 却命中多处
 */
/**
 * 给错误消息补上 `edits[i]: `，让模型知道是第几条挂的。
 *
 * 原实现写的是 `new StringNotFoundError(`${prefix}${error.message}`)`，看着是在拼前缀，
 * 实际上那两个错误类的构造参数是 **searchString 而不是 message**，message 在构造函数里写死，
 * 于是前缀被塞进了一个没人读的字段，模型收到的永远是那句不带下标的通用文案。
 * 抽成纯函数、直接测消息之后才露出来。这里改成就地改写 message，instanceof 判定不受影响。
 */
function prefixEditError(error: unknown, editIndex: number): unknown {
  if (error instanceof StringNotFoundError || error instanceof StringNotUniqueError) {
    error.message = `edits[${editIndex}]: ${error.message}`;
  }
  return error;
}

export function applyEdits(content: string, edits: readonly TextEdit[]): ReplaceResult {
  let workingContent = content;
  let totalReplacements = 0;

  edits.forEach(({ old_string: stepOld, new_string: stepNew, replace_all: stepReplaceAll }, editIndex) => {
    try {
      const actualOld = findActualString(workingContent, stepOld);

      if (!stepReplaceAll) {
        // 检查是否会修改多处
        const occurrences = workingContent.split(actualOld).length - 1;
        if (occurrences > 1) {
          throw new StringNotUniqueError(actualOld, occurrences);
        }
      }

      const stepResult = replaceString(workingContent, actualOld, stepNew, stepReplaceAll ?? false);
      workingContent = stepResult.content;
      totalReplacements += stepResult.replacements;
    } catch (error) {
      throw prefixEditError(error, editIndex);
    }
  });

  return { content: workingContent, replacements: totalReplacements };
}

/** 找出第一条「改了等于没改」的 edit 下标；没有返回 -1 */
export function findNoopEditIndex(edits: readonly TextEdit[]): number {
  return edits.findIndex((edit) => edit.old_string === edit.new_string);
}
