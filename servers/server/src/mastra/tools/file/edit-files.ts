import { randomUUID } from "node:crypto";
import fsp from "node:fs/promises";

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { AgentMode } from "../../types/bi-chat";
import { SuspendType } from "../../types/suspend";
import { capChanges, type Change, ChangeSchema, diffChange } from "../change-report";
import { applyEdits, findNoopEditIndex, type ReplaceResult } from "./apply-edits";
import { isAgentArtifactFilePath } from "./file-kind";
import { readFileState, resolveFilePath } from "./state";
import {
  type DeferredCommit,
  type EditFilesResumeData,
  editFilesResumeSchema,
  type EditFilesSuspendPayload,
  editFilesSuspendSchema,
  findSyncHandler,
  type SyncKind
} from "./sync-handlers";
import { formatSuccessMessage, readFileWithMeta, StringNotFoundError, StringNotUniqueError } from "./utils";

// ── 辅助函数 ─────────────────────────────────────────────────────────────────

type ReadRecord = NonNullable<ReturnType<typeof readFileState.get>>;
/** 写入文件并同步 readFileState */
async function persistEdit(absPath: string, result: ReplaceResult, readRecord: ReadRecord): Promise<void> {
  let finalContent = result.content;
  if (readRecord.lineEnding === "\r\n") {
    finalContent = finalContent.replace(/\n/g, "\r\n");
  }

  const writeBuffer =
    readRecord.encoding === "utf16le"
      ? Buffer.from("\ufeff" + finalContent, "utf16le")
      : Buffer.from(finalContent, "utf8");

  await fsp.writeFile(absPath, writeBuffer);

  const newStat = await fsp.stat(absPath);
  readFileState.set(absPath, {
    content: result.content,
    mtimeMs: newStat.mtimeMs,
    encoding: readRecord.encoding,
    lineEnding: readRecord.lineEnding
  });
}

// ── Batch tool ───────────────────────────────────────────────────────────────

const editSchema = z.object({
  old_string: z.string().describe("The exact text to find and replace for this step."),
  new_string: z.string().describe("The text to replace old_string with for this step."),
  replace_all: z.boolean().optional().default(false).describe("Replace all occurrences (default: false)")
});

const fileEditSchema = z.object({
  path: z.string().describe("File path to edit (absolute or relative to workspace root)"),
  edits: z
    .array(editSchema)
    .min(1)
    .describe("Replacements applied in order. A failure makes only this file fail; other files continue.")
});

const editFilesInputSchema = z.object({
  files: z.array(fileEditSchema).min(1).max(100).describe("Files to edit. Each file owns its replacement list.")
});

const fileEditResultSchema = z.object({
  path: z.string(),
  success: z.boolean(),
  replacements: z.number(),
  message: z.string(),
  frontendSynced: z.boolean().optional(),
  validationErrors: z.array(z.string()).optional(),
  change: z.array(ChangeSchema).optional().describe("这个文件改动后的样子，不必再读回来确认")
});

const editFilesOutputSchema = z.object({
  success: z.boolean().describe("True only when every file succeeded."),
  total: z.number(),
  succeeded: z.number(),
  failed: z.number(),
  replacements: z.number(),
  message: z.string(),
  results: z.array(fileEditResultSchema),
  change: z.array(ChangeSchema).optional().describe("本批全部改动的汇总，与各 result.change 同源")
});

type FileEditInput = z.input<typeof fileEditSchema>;
export type FileEditResult = z.infer<typeof fileEditResultSchema>;
/** "approval" 是普通文件在 ASK 模式下那一轮纯审批，不产生前端同步；其余三种见 SyncKind。 */
type PendingKind = "approval" | SyncKind;

/**
 * 三条前端同步路径的结算文案：[同步成功, 同步失败前缀]。新增同步类型时在此加一行。
 *
 * 成败两句是**对照着写的**：一句「已推送到前端并写入工作区」，一句「前端未…，工作区未改动」。
 * agent 只看得到这行字，它要判断的正是「这次编辑到底落没落盘」，两句话必须都把工作区的状态说死。
 * 顺序也是真实顺序：先推给前端，前端接住了才落盘（见 DeferredCommit）。
 */
const SYNC_MESSAGES: Record<SyncKind, readonly [string, string]> = {
  component: ["组件已推送到前端并写入工作区。", "前端未接受本次组件更新，工作区未改动"],
  filter: ["过滤器已推送到前端并写入工作区。", "前端未保存该过滤器，工作区未改动"],
  screenInfo: ["屏幕配置已推送到前端并写入工作区。", "前端未保存屏幕配置，工作区未改动"]
};

interface BatchOperationContext {
  batchId: string;
  operationId: string;
}

interface PendingOperation extends BatchOperationContext {
  index: number;
  kind: PendingKind;
  absPath: string;
  replacements: number;
  /** core 重算派生值时留下的提示，结算时拼进结果消息 */
  notice?: string;
  /** 挂起前算好的改动回执，结算成功时填进结果 */
  change?: Change[];
  /** 见 {@link DeferredCommit}。要推给前端的编辑都带；纯审批挂起（kind="approval"）不带 */
  commit?: DeferredCommit;
}

interface EditFilesBatchState {
  batchId: string;
  inputSignature: string;
  cursor: number;
  approvedIndexes: Set<number>;
  pending?: PendingOperation;
  results: Array<FileEditResult | undefined>;
}

type FileProcessOutcome =
  | { status: "completed"; result: FileEditResult }
  | {
      status: "suspend";
      kind: PendingKind;
      absPath: string;
      replacements: number;
      notice?: string;
      /** 见 {@link DeferredCommit}：带上它就表示编辑还没落盘，等前端执行成功再写 */
      commit?: DeferredCommit;
      /** 挂起前算好的改动回执；落盘成功后由 settlePendingOperation 填进结果 */
      change?: Change[];
      payload: EditFilesSuspendPayload;
    };

const batchStates = new Map<string, EditFilesBatchState>();

function completeFile(
  path: string,
  success: boolean,
  replacements: number,
  message: string,
  options: Pick<FileEditResult, "frontendSynced" | "validationErrors" | "change"> = {}
): FileProcessOutcome {
  return {
    status: "completed",
    result: { path, success, replacements, message, ...options }
  };
}

function operationContext(state: EditFilesBatchState, index: number): BatchOperationContext {
  return { batchId: state.batchId, operationId: `${state.batchId}:${index}` };
}

function withOperationContext<T extends Record<string, unknown>>(
  payload: T,
  state: EditFilesBatchState,
  index: number
): T & BatchOperationContext {
  return { ...payload, ...operationContext(state, index) };
}

function buildBatchOutput(state: EditFilesBatchState) {
  const results = state.results.filter((result): result is FileEditResult => result !== undefined);
  const succeeded = results.filter((result) => result.success).length;
  const failed = results.length - succeeded;
  const replacements = results.reduce((sum, result) => sum + result.replacements, 0);
  return {
    success: failed === 0 && results.length === state.results.length,
    total: state.results.length,
    succeeded,
    failed,
    replacements,
    message: `Edited ${succeeded}/${state.results.length} files; ${failed} failed; ${replacements} replacements.`,
    results,
    change: capChanges(results.flatMap((result) => result.change ?? []))
  };
}

async function settlePendingOperation(state: EditFilesBatchState, resumeData: EditFilesResumeData): Promise<void> {
  const pending = state.pending;
  if (!pending) {
    throw new Error("edit_files received resumeData without a pending operation.");
  }
  if (resumeData.batchId !== pending.batchId || resumeData.operationId !== pending.operationId) {
    throw new Error(
      `edit_files resume mismatch: expected ${pending.operationId}, received ${String(resumeData.operationId)}.`
    );
  }

  const filePath = state.results[pending.index]?.path;
  const pathForResult = filePath ?? "";
  const finish = (success: boolean, message: string, frontendSynced?: boolean) => {
    state.results[pending.index] = {
      path: pathForResult,
      success,
      replacements: pending.replacements,
      message,
      ...(frontendSynced === undefined ? {} : { frontendSynced }),
      // 只有真落盘了才报改动：失败/拒绝的那几条明确说过「工作区未改动」，
      // 再附一份 change 就是自相矛盾
      ...(success && pending.change ? { change: pending.change } : {})
    };
    state.cursor = pending.index + 1;
    state.pending = undefined;
  };

  /** 三条前端同步路径只差成败文案，结算流程完全相同。 */
  const settleSync = (synced: boolean, kind: SyncKind, error: string | undefined, notice = pending.notice) => {
    const [okMessage, failPrefix] = SYNC_MESSAGES[kind];
    const outcome = synced ? okMessage : `${failPrefix}: ${error ?? "未知错误"}`;
    // notice 是 core 重算派生值留下的说明（例如分组尺寸被按成员覆盖）——
    // 不带出去 agent 会以为自己写的值生效了，然后反复改同一个字段
    finish(
      synced,
      formatSuccessMessage(pending.replacements, pending.absPath, notice ? `${outcome}（${notice}）` : outcome),
      synced
    );
  };

  if (pending.kind === "approval") {
    if ("approved" in resumeData && resumeData.approved) {
      state.approvedIndexes.add(pending.index);
      state.pending = undefined;
      return;
    }
    finish(false, "用户取消了编辑操作");
    return;
  }

  if ("approved" in resumeData && resumeData.approved === false) {
    // 带 commit 说明落盘被推迟到了这里，拒绝就等于这次编辑从未发生——如实说「未改动工作区」。
    // 不带的（普通文件在函数开头已单独问过一轮）走到这里只是前端同步那一步被取消。
    const outcome = pending.commit ? "用户拒绝了本次编辑，工作区未改动" : "用户取消了前端同步";
    finish(false, formatSuccessMessage(pending.replacements, pending.absPath, outcome), false);
    return;
  }

  /**
   * 前端执行成功了，现在才真正落盘，然后按同步结果结算。
   *
   * **前端失败就不落盘**：工作区要跟画布对齐，前端没接住这次更新，工作区也不该单方面改掉
   * ——否则下一次前端整屏同步过来，这笔改动又会被画布状态盖回去，等于悄悄丢了。
   * commit 自身失败则如实报「前端已接受但没写进去」，不因为前端说成功就谎报。
   */
  const commitThenSettle = async (synced: boolean, kind: SyncKind, error: string | undefined) => {
    if (!pending.commit || !synced) {
      settleSync(synced, kind, error);
      return;
    }
    try {
      const committed = await pending.commit(resumeData);
      // 落盘时重算出来的 notice 比挂起前那份新，以它为准
      settleSync(synced, kind, error, committed?.notice ?? pending.notice);
    } catch (commitError) {
      const reason = commitError instanceof Error ? commitError.message : String(commitError);
      finish(
        false,
        formatSuccessMessage(pending.replacements, pending.absPath, `前端已接受，但写入工作区失败: ${reason}`),
        false
      );
    }
  };

  if (pending.kind === "component" && "componentUpdated" in resumeData) {
    await commitThenSettle(resumeData.componentUpdated, "component", resumeData.error);
    return;
  }

  if (pending.kind === "filter" && "filterSaved" in resumeData) {
    await commitThenSettle(resumeData.filterSaved, "filter", resumeData.error);
    return;
  }

  if (pending.kind === "screenInfo" && "screenInfoUpdated" in resumeData) {
    await commitThenSettle(resumeData.screenInfoUpdated, "screenInfo", resumeData.error);
    return;
  }

  throw new Error(`edit_files received incompatible resumeData for ${pending.kind}.`);
}

async function processFileEdit(
  file: FileEditInput,
  index: number,
  state: EditFilesBatchState,
  mode: AgentMode | undefined
): Promise<FileProcessOutcome> {
  const { path: filePath, edits } = file;
  const absPath = resolveFilePath(filePath);
  const normalizedPath = absPath.replace(/\\/g, "/");
  // 需要跟前端同步的文件由处理器认领；认领不了的就是普通文件
  const handler = findSyncHandler(normalizedPath);
  const needsApproval = mode === AgentMode.ASK_BEFORE_EDIT;

  // 会推给前端的那几类自带审批形态（ASK 模式下推的是 AskApprovalXxx），不必在这里先问一轮；
  // agent 产物是它自己的中间文件，也不该拿去烦用户。剩下的普通文件才走这一轮纯审批。
  if (needsApproval && !state.approvedIndexes.has(index) && !handler && !isAgentArtifactFilePath(normalizedPath)) {
    return {
      status: "suspend",
      kind: "approval",
      absPath,
      replacements: 0,
      payload: withOperationContext(
        {
          type: SuspendType.AskApproval,
          purpose: "编辑文件",
          filePath,
          edits: edits.map((edit) => ({ oldString: edit.old_string, newString: edit.new_string }))
        },
        state,
        index
      )
    };
  }

  const noopIndex = findNoopEditIndex(edits);
  if (noopIndex !== -1) {
    return completeFile(
      filePath,
      false,
      0,
      `edits[${noopIndex}]: old_string and new_string are identical. No edit needed.`
    );
  }

  /**
   * 读取文件内容
   */
  const readRecord = await readFileWithMeta(absPath).catch(() => null);
  if (!readRecord) {
    return completeFile(filePath, false, 0, `File not found: ${absPath}`);
  }
  readFileState.set(absPath, readRecord);

  let result: ReplaceResult;
  try {
    // 一个文件内的 edit 是原子的：任一条失败就整体不落盘
    result = applyEdits(readRecord.content, edits);
  } catch (error) {
    if (error instanceof StringNotFoundError || error instanceof StringNotUniqueError) {
      return completeFile(filePath, false, 0, error.message);
    }
    throw error;
  }

  if (handler) {
    const prepared = await handler.prepare({ filePath, absPath, result, readRecord, needsApproval });
    if (!prepared.ok) {
      return completeFile(filePath, false, 0, prepared.message, {
        ...(prepared.frontendSynced === undefined ? {} : { frontendSynced: prepared.frontendSynced }),
        ...(prepared.validationErrors ? { validationErrors: prepared.validationErrors } : {})
      });
    }
    return {
      status: "suspend",
      kind: prepared.kind,
      absPath,
      replacements: result.replacements,
      notice: prepared.notice,
      commit: prepared.commit,
      // 落盘推迟到 resume，但改前改后的内容只有此刻手上有，先算好随 pending 带过去
      change: diffChange(filePath, readRecord.content, result.content),
      payload: withOperationContext(prepared.payload, state, index)
    };
  }

  // 走到这里的都是普通文件：不需要前端同步，也就没有「等前端执行完再落盘」这回事，直接写。
  await persistEdit(absPath, result, readRecord);
  return completeFile(filePath, true, result.replacements, formatSuccessMessage(result.replacements, absPath), {
    change: diffChange(filePath, readRecord.content, result.content)
  });
}

export const editFilesTool = createTool({
  id: "edit_files",
  description: `Edit one or more files with exact text replacements.

Input is files: [{ path, edits }]. Each file owns its edits.

Rules:
- Edits within one file are atomic and applied in order. If one edit fails, that file is not written.
- Files are independent. A failure in one file never stops or rolls back other files.
- Each component, filter, or screen-info update is suspended and resumed separately so every frontend update is processed.
- Do not use this tool on binary or Jupyter (.ipynb) files.
- Never use shell commands to modify workspace component files; use edit_files so validation and frontend synchronization run.`,

  inputSchema: editFilesInputSchema,
  outputSchema: editFilesOutputSchema,
  suspendSchema: editFilesSuspendSchema,
  resumeSchema: editFilesResumeSchema,

  execute: async ({ files }, context) => {
    const mode = context?.requestContext?.get("mode") as AgentMode | undefined;
    const { resumeData, suspend, toolCallId } = context?.agent ?? {};
    const executionKey = toolCallId ?? `direct:${randomUUID()}`;
    // resume 时 mastra 跳过 inputSchema 校验（tool.execute 里 skipInputValidation = isResuming），
    // 首次拿到的是 zod 补过 default 的 files，resume 拿到的是模型原始 args。
    // 直接 stringify 会因 replace_all 有无而不等，指纹必须先补齐 default 再算。
    const inputSignature = JSON.stringify(
      (files as FileEditInput[]).map((file) => ({
        path: file.path,
        edits: file.edits.map((edit) => ({
          old_string: edit.old_string,
          new_string: edit.new_string,
          replace_all: edit.replace_all ?? false
        }))
      }))
    );
    let state = batchStates.get(executionKey);

    if (!state) {
      if (resumeData) {
        const missingState: EditFilesBatchState = {
          batchId: randomUUID(),
          inputSignature,
          cursor: files.length,
          approvedIndexes: new Set(),
          results: files.map((file) => ({
            path: file.path,
            success: false,
            replacements: 0,
            message: "edit_files batch state was lost before resume; no remaining operations were executed."
          }))
        };
        return buildBatchOutput(missingState);
      }
      state = {
        batchId: randomUUID(),
        inputSignature,
        cursor: 0,
        approvedIndexes: new Set(),
        results: new Array<FileEditResult | undefined>(files.length)
      };
      batchStates.set(executionKey, state);
    } else if (state.inputSignature !== inputSignature) {
      throw new Error("edit_files input changed while the batch was suspended.");
    }

    if (resumeData) {
      await settlePendingOperation(state, resumeData);
    }

    while (state.cursor < files.length) {
      const index = state.cursor;
      state.results[index] ??= {
        path: files[index].path,
        success: false,
        replacements: 0,
        message: "Pending"
      };

      let outcome: FileProcessOutcome;
      try {
        outcome = await processFileEdit(files[index], index, state, mode);
      } catch (error) {
        outcome = completeFile(files[index].path, false, 0, error instanceof Error ? error.message : String(error));
      }

      if (outcome.status === "completed") {
        state.results[index] = outcome.result;
        state.cursor += 1;
        continue;
      }

      const ids = operationContext(state, index);
      state.pending = {
        ...ids,
        index,
        kind: outcome.kind,
        absPath: outcome.absPath,
        replacements: outcome.replacements,
        notice: outcome.notice,
        commit: outcome.commit,
        change: outcome.change
      };

      if (!suspend) {
        state.results[index] = {
          path: files[index].path,
          success: false,
          replacements: outcome.replacements,
          // 带 commit 的编辑还悬在内存里，没人能批准也就没落盘——如实说清楚，别让调用方以为写进去了
          message: outcome.commit
            ? "Frontend synchronization is required, but suspend is unavailable. The edit was not written."
            : "Frontend synchronization is required, but suspend is unavailable.",
          frontendSynced: false
        };
        state.pending = undefined;
        state.cursor += 1;
        continue;
      }

      return suspend(outcome.payload) as never;
    }

    const output = buildBatchOutput(state);
    batchStates.delete(executionKey);
    return output;
  }
});
