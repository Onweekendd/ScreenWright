import { randomUUID } from "node:crypto";
import fsp from "node:fs/promises";

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { TOOL_IMAGES_FIELD } from "../../provider/image-middleware";
import { ScreenTreeSet } from "../../services/bi-data-sync/screen-tree-set";
import { AgentMode } from "../../types/bi-chat";
import { CanvasCaptureResultSchema, type CanvasOp, type OpResult, SuspendType } from "../../types/suspend";
import { canvasOpsPayload, readCanvasOpResults } from "../canvas-ops";
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
    readRecord.encoding === "utf16le" ? Buffer.from("﻿" + finalContent, "utf16le") : Buffer.from(finalContent, "utf8");

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
  files: z.array(fileEditSchema).min(1).max(100).describe("Files to edit. Each file owns its replacement list."),
  capture: z
    .boolean()
    .optional()
    .default(true)
    .describe("整批组件编辑完成后统一返回一张画布截图，默认 true；false 时跳过截图和上传。对普通文件无影响。")
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
  screenshot: CanvasCaptureResultSchema.optional().describe("整批修改完成后的统一画布截图；截图失败不影响编辑结果"),
  change: z.array(ChangeSchema).optional().describe("本批全部改动的汇总，与各 result.change 同源"),
  [TOOL_IMAGES_FIELD]: z.array(z.object({ url: z.string(), label: z.string() })).optional()
});

type FileEditInput = z.input<typeof fileEditSchema>;
export type FileEditResult = z.infer<typeof fileEditResultSchema>;

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

interface PendingBase {
  index: number;
  absPath: string;
  replacements: number;
}

/**
 * 一段里等前端回话的一项。
 * - `plain`：ASK 模式下的普通文件，不用推给前端，只等这一段的审批，批准了才写；
 * - 其余：推给前端的同步编辑，前端执行成功才落盘（见 {@link DeferredCommit}）。
 */
type PendingItem =
  | (PendingBase & { kind: "plain"; write: () => Promise<FileEditResult> })
  | (PendingBase & {
      kind: SyncKind;
      /** core 重算派生值时留下的提示，结算时拼进结果消息 */
      notice?: string;
      /** 挂起前算好的改动回执，结算成功时填进结果 */
      change?: Change[];
      commit: DeferredCommit;
      op: CanvasOp;
      purpose: string;
    });

type SyncItem = Exclude<PendingItem, { kind: "plain" }>;

const isSyncItem = (item: PendingItem): item is SyncItem => item.kind !== "plain";

/** 一次挂起带出去的一段编辑：互不覆盖、可以叠在同一棵整屏树上的那几个文件。 */
interface PendingSegment extends BatchOperationContext {
  items: PendingItem[];
}

interface EditFilesBatchState {
  batchId: string;
  inputSignature: string;
  /** 下一个还没处理的文件；挂起中那一段的文件已经在 cursor 之前 */
  cursor: number;
  /** 一次批准覆盖这次工具调用的全部文件，不延续到其他调用。 */
  approved: boolean;
  pending?: PendingSegment;
  capturePending?: BatchOperationContext;
  captureRequested?: boolean;
  hasComponentEdits?: boolean;
  screenshot?: z.infer<typeof CanvasCaptureResultSchema>;
  results: Array<FileEditResult | undefined>;
}

type FileProcessOutcome =
  | { status: "completed"; result: FileEditResult }
  | { status: "pending"; item: PendingItem }
  /** 跟这一段已经上树的编辑有交集：先把这一段落盘，再回来处理这个文件 */
  | { status: "conflict" };

const batchStates = new Map<string, EditFilesBatchState>();

function completeFile(
  path: string,
  success: boolean,
  replacements: number,
  message: string,
  options: Pick<FileEditResult, "frontendSynced" | "validationErrors" | "change"> = {}
): { status: "completed"; result: FileEditResult } {
  return {
    status: "completed",
    result: { path, success, replacements, message, ...options }
  };
}

function operationContext(state: EditFilesBatchState, index: number): BatchOperationContext {
  return { batchId: state.batchId, operationId: `${state.batchId}:${index}` };
}

function buildBatchOutput(state: EditFilesBatchState) {
  const results = state.results.filter((result): result is FileEditResult => result !== undefined);
  const succeeded = results.filter((result) => result.success).length;
  const failed = results.length - succeeded;
  const replacements = results.reduce((sum, result) => sum + result.replacements, 0);
  const images =
    state.screenshot?.ok && state.screenshot.url
      ? [{ url: state.screenshot.url, label: "本批文件编辑完成后的画布截图" }]
      : [];
  return {
    success: failed === 0 && results.length === state.results.length,
    total: state.results.length,
    succeeded,
    failed,
    replacements,
    message: `Edited ${succeeded}/${state.results.length} files; ${failed} failed; ${replacements} replacements.`,
    results,
    ...(state.screenshot ? { screenshot: state.screenshot } : {}),
    change: capChanges(results.flatMap((result) => result.change ?? [])),
    ...(images.length ? { [TOOL_IMAGES_FIELD]: images } : {})
  };
}

/** 用户拒绝之后，还没轮到的文件一律不做。 */
function rejectRemaining(state: EditFilesBatchState): void {
  for (let index = state.cursor; index < state.results.length; index += 1) {
    state.results[index] = {
      path: state.results[index]?.path ?? "",
      success: false,
      replacements: 0,
      message: "用户拒绝了本批编辑，工作区未改动"
    };
  }
  state.cursor = state.results.length;
}

/** 前端回执（或审批结果）对不对得上挂起中的这一段；对不上就是协议被破坏，直接抛。 */
function readSegmentReceipts(segment: PendingSegment, resumeData: EditFilesResumeData): OpResult[] {
  const syncCount = segment.items.filter(isSyncItem).length;
  if (syncCount === 0) {
    // 只剩等审批的普通文件，挂起的是纯审批
    if (!("approved" in resumeData && resumeData.approved)) {
      throw new Error("edit_files received incompatible resumeData for approval.");
    }
    return [];
  }
  const reply = readCanvasOpResults(resumeData, syncCount);
  if (reply.status !== "done") {
    throw new Error(`edit_files received incompatible resumeData for canvas_ops (${reply.status}).`);
  }
  return reply.results;
}

/**
 * 结算挂起中的那一段。
 *
 * 整段共用一棵提交树：前端接住的每一项依次上树，最后 {@link ScreenTreeSet.flush} 每块屏只写一次。
 * 落盘时重新建树而不是复用预览那棵，是因为中间隔着一次前端往返，工作区可能已被别的操作改过。
 */
async function settleSegment(state: EditFilesBatchState, resumeData: EditFilesResumeData): Promise<void> {
  const segment = state.pending;
  if (!segment) {
    throw new Error("edit_files received resumeData without a pending operation.");
  }
  if (resumeData.batchId !== segment.batchId || resumeData.operationId !== segment.operationId) {
    throw new Error(
      `edit_files resume mismatch: expected ${segment.operationId}, received ${String(resumeData.operationId)}.`
    );
  }

  const settleSync = (item: SyncItem, synced: boolean, outcome: string) => {
    state.results[item.index] = {
      path: state.results[item.index]?.path ?? "",
      success: synced,
      replacements: item.replacements,
      message: formatSuccessMessage(item.replacements, item.absPath, outcome),
      frontendSynced: synced,
      // 只有真落盘了才报改动：失败/拒绝的那几条明确说过「工作区未改动」，
      // 再附一份 change 就是自相矛盾
      ...(synced && item.change ? { change: item.change } : {})
    };
  };

  if ("approved" in resumeData && resumeData.approved === false) {
    for (const item of segment.items) {
      if (isSyncItem(item)) {
        // 落盘被推迟到了这里，拒绝就等于这次编辑从未发生——如实说「未改动工作区」
        settleSync(item, false, "用户拒绝了本次编辑，工作区未改动");
      } else {
        state.results[item.index] = {
          path: state.results[item.index]?.path ?? "",
          success: false,
          replacements: 0,
          message: "用户取消了编辑操作"
        };
      }
    }
    state.pending = undefined;
    rejectRemaining(state);
    return;
  }

  const receipts = readSegmentReceipts(segment, resumeData);
  // 前端返回执行回执或批准，说明这一段的审批已通过；后面的段共享这次批准。
  state.approved = true;
  state.pending = undefined;

  const trees = new ScreenTreeSet();
  /** 已上提交树、等整屏写完才算数的那几项，带着落盘时重算出来的 notice */
  const staged: Array<{ item: SyncItem; notice?: string }> = [];
  // 前端说成功不等于写进去了，没写进去就如实报，不谎报成功
  const commitFailed = (item: SyncItem, error: unknown) => {
    const reason = error instanceof Error ? error.message : String(error);
    settleSync(item, false, `前端已接受，但写入工作区失败: ${reason}`);
  };

  let receiptIndex = 0;
  for (const item of segment.items) {
    if (!isSyncItem(item)) {
      state.results[item.index] = await item.write();
      continue;
    }
    const receipt = receipts[receiptIndex];
    receiptIndex += 1;
    if (!receipt.ok) {
      // 前端失败就不落盘：工作区要跟画布对齐，前端没接住这次更新，工作区也不该单方面改掉
      // ——否则下一次前端整屏同步过来，这笔改动又会被画布状态盖回去，等于悄悄丢了。
      settleSync(item, false, `${SYNC_MESSAGES[item.kind][1]}: ${receipt.error ?? "未知错误"}`);
      continue;
    }
    try {
      const committed = await item.commit(trees);
      // 落盘时重算出来的 notice 比挂起前那份新，以它为准
      staged.push({ item, notice: committed?.notice ?? item.notice });
    } catch (error) {
      commitFailed(item, error);
    }
  }

  try {
    trees.flush();
  } catch (error) {
    staged.forEach(({ item }) => commitFailed(item, error));
    return;
  }

  for (const { item, notice } of staged) {
    // notice 是 core 重算派生值留下的说明（例如分组尺寸被按成员覆盖）——
    // 不带出去 agent 会以为自己写的值生效了，然后反复改同一个字段
    const okMessage = SYNC_MESSAGES[item.kind][0];
    settleSync(item, true, notice ? `${okMessage}（${notice}）` : okMessage);
    if (item.kind === "component") {
      state.hasComponentEdits = true;
    }
  }
}

/** 普通文件：读、改、写一气呵成。ASK 模式下批准之后才调，所以重新读盘，不用挂起前读到的那份。 */
async function editPlainFile(file: FileEditInput, absPath: string): Promise<FileEditResult> {
  const readRecord = await readFileWithMeta(absPath).catch(() => null);
  if (!readRecord) {
    return completeFile(file.path, false, 0, `File not found: ${absPath}`).result;
  }
  readFileState.set(absPath, readRecord);

  let result: ReplaceResult;
  try {
    // 一个文件内的 edit 是原子的：任一条失败就整体不落盘
    result = applyEdits(readRecord.content, file.edits);
  } catch (error) {
    if (error instanceof StringNotFoundError || error instanceof StringNotUniqueError) {
      return completeFile(file.path, false, 0, error.message).result;
    }
    throw error;
  }

  await persistEdit(absPath, result, readRecord);
  return completeFile(file.path, true, result.replacements, formatSuccessMessage(result.replacements, absPath), {
    change: diffChange(file.path, readRecord.content, result.content)
  }).result;
}

/**
 * 处理一个文件：要么当场有结果，要么进这一段等前端，要么跟这一段冲突、留到下一段。
 *
 * @param trees 这一段共用的预览树
 * @param pendingPaths 这一段里已经在等前端的文件：同一个文件第二次编辑要看到第一次的结果，只能等它落盘
 */
async function processFileEdit(
  file: FileEditInput,
  state: EditFilesBatchState,
  mode: AgentMode | undefined,
  trees: ScreenTreeSet,
  pendingPaths: ReadonlySet<string>
): Promise<FileProcessOutcome> {
  const { path: filePath, edits } = file;
  const absPath = resolveFilePath(filePath);
  if (pendingPaths.has(absPath)) {
    return { status: "conflict" };
  }
  const normalizedPath = absPath.replace(/\\/g, "/");
  // 需要跟前端同步的文件由处理器认领；认领不了的就是普通文件
  const handler = findSyncHandler(normalizedPath);

  const noopIndex = findNoopEditIndex(edits);
  if (noopIndex !== -1) {
    return completeFile(
      filePath,
      false,
      0,
      `edits[${noopIndex}]: old_string and new_string are identical. No edit needed.`
    );
  }

  // 会推给前端的那几类自带审批形态（canvas_ops 载荷里的 approval），不必单独问；
  // agent 产物是它自己的中间文件，也不该拿去烦用户。剩下的普通文件在 ASK 模式下进这一段等审批，
  // 不需要的就没有「等前端执行完再落盘」这回事，直接写。
  if (!handler) {
    const needsApproval =
      mode === AgentMode.ASK_BEFORE_EDIT && !state.approved && !isAgentArtifactFilePath(normalizedPath);
    if (!needsApproval) {
      return { status: "completed", result: await editPlainFile(file, absPath) };
    }
    return {
      status: "pending",
      item: { kind: "plain", index: state.cursor, absPath, replacements: 0, write: () => editPlainFile(file, absPath) }
    };
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

  const prepared = await handler.prepare({ filePath, absPath, result, readRecord, trees, capture: false });
  if (prepared.ok === "conflict") {
    return { status: "conflict" };
  }
  if (!prepared.ok) {
    return completeFile(filePath, false, 0, prepared.message, {
      ...(prepared.frontendSynced === undefined ? {} : { frontendSynced: prepared.frontendSynced }),
      ...(prepared.validationErrors ? { validationErrors: prepared.validationErrors } : {})
    });
  }
  return {
    status: "pending",
    item: {
      kind: prepared.kind,
      index: state.cursor,
      absPath,
      replacements: result.replacements,
      notice: prepared.notice,
      commit: prepared.commit,
      op: prepared.op,
      purpose: prepared.purpose,
      // 落盘推迟到 resume，但改前改后的内容只有此刻手上有，先算好随 pending 带过去
      change: diffChange(filePath, readRecord.content, result.content)
    }
  };
}

/**
 * 从 cursor 往后收一段：能叠在同一棵整屏树上的连续文件。不需要等前端的文件当场出结果，
 * 遇到冲突就停，冲突的那个留给下一段（它要看到这一段落盘之后的工作区）。
 *
 * 原来是一个文件挂起一次，每次都是一整轮「前端执行 → resume → 整屏读写」；合成一段之后，
 * 互不相干的编辑（最常见的就是一次改一批组件）只需要一次往返。
 */
async function collectSegment(
  files: FileEditInput[],
  state: EditFilesBatchState,
  mode: AgentMode | undefined
): Promise<PendingItem[]> {
  const trees = new ScreenTreeSet();
  const items: PendingItem[] = [];
  const pendingPaths = new Set<string>();

  while (state.cursor < files.length) {
    const index = state.cursor;
    let outcome: FileProcessOutcome;
    try {
      outcome = await processFileEdit(files[index], state, mode, trees, pendingPaths);
    } catch (error) {
      outcome = completeFile(files[index].path, false, 0, error instanceof Error ? error.message : String(error));
    }

    if (outcome.status === "conflict") {
      break;
    }
    state.cursor += 1;
    if (outcome.status === "completed") {
      state.results[index] = outcome.result;
      continue;
    }
    items.push(outcome.item);
    pendingPaths.add(outcome.item.absPath);
  }
  return items;
}

/**
 * 一段编辑的挂起载荷。有要推前端的就是一次 canvas_ops（ops 按段内顺序排，回执按下标对应）；
 * 只剩 ASK 模式下等审批的普通文件时，退回纯审批。
 */
function segmentPayload(
  files: FileEditInput[],
  segment: PendingSegment,
  needsApproval: boolean
): EditFilesSuspendPayload {
  // 首次确认展示整个调用的文件范围；批准后后面的段继续同步，不再弹确认。
  const batchPurpose =
    files.length > 1
      ? `批量编辑以下 ${files.length} 个文件（一次批准整批修改）：\n${files.map((file) => file.path).join("\n")}`
      : undefined;
  const batch = { batchId: segment.batchId, operationId: segment.operationId };
  const syncItems = segment.items.filter(isSyncItem);

  if (syncItems.length === 0) {
    const first = files[segment.items[0].index];
    return {
      type: SuspendType.AskApproval,
      purpose: batchPurpose ?? "编辑文件",
      filePath: first.path,
      edits: first.edits.map((edit) => ({ oldString: edit.old_string, newString: edit.new_string })),
      ...batch
    };
  }
  return canvasOpsPayload({
    needsApproval,
    purpose: batchPurpose ?? syncItems[0].purpose,
    ops: syncItems.map((item) => item.op),
    batch
  });
}

export const editFilesTool = createTool({
  id: "edit_files",
  description: `Edit one or more files with exact text replacements.

Input is files: [{ path, edits }]. Each file owns its edits.

Rules:
- Edits within one file are atomic and applied in order. If one edit fails, that file is not written.
- Files are independent. A failure in one file never stops or rolls back other files.
- In ask-before-edit mode, one approval covers all files in this call. Rejecting cancels the remaining edits.
- Component, filter, and screen-info updates in one call are synchronized to the frontend together after batch approval.
- capture defaults to true: after all files finish, capture and upload the canvas once if any component edit succeeded. The shared screenshot is returned through screenshot and imagesForModel. Set capture: false to skip it. Screenshot failure does not fail the edits.
- Do not use this tool on binary or Jupyter (.ipynb) files.
- Never use shell commands to modify workspace component files; use edit_files so validation and frontend synchronization run.`,

  inputSchema: editFilesInputSchema,
  outputSchema: editFilesOutputSchema,
  suspendSchema: editFilesSuspendSchema,
  resumeSchema: editFilesResumeSchema,

  execute: async ({ files, capture = true }, context) => {
    const mode = context?.requestContext?.get("mode") as AgentMode | undefined;
    const { resumeData, suspend, toolCallId } = context?.agent ?? {};
    const executionKey = toolCallId ?? `direct:${randomUUID()}`;
    // resume 时 mastra 跳过 inputSchema 校验（tool.execute 里 skipInputValidation = isResuming），
    // 首次拿到的是 zod 补过 default 的 files，resume 拿到的是模型原始 args。
    // 直接 stringify 会因 replace_all 有无而不等，指纹必须先补齐 default 再算。
    const inputSignature = JSON.stringify({
      capture,
      files: (files as FileEditInput[]).map((file) => ({
        path: file.path,
        edits: file.edits.map((edit) => ({
          old_string: edit.old_string,
          new_string: edit.new_string,
          replace_all: edit.replace_all ?? false
        }))
      }))
    });
    let state = batchStates.get(executionKey);

    if (!state) {
      if (resumeData) {
        const missingState: EditFilesBatchState = {
          batchId: randomUUID(),
          inputSignature,
          cursor: files.length,
          approved: false,
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
        approved: false,
        results: files.map((file) => ({ path: file.path, success: false, replacements: 0, message: "Pending" }))
      };
      batchStates.set(executionKey, state);
    } else if (state.inputSignature !== inputSignature) {
      throw new Error("edit_files input changed while the batch was suspended.");
    }

    if (resumeData) {
      if (state.capturePending) {
        if (
          resumeData.batchId !== state.capturePending.batchId ||
          resumeData.operationId !== state.capturePending.operationId
        ) {
          throw new Error("edit_files capture resume mismatch.");
        }
        state.screenshot = CanvasCaptureResultSchema.parse(resumeData);
        state.capturePending = undefined;
      } else {
        await settleSegment(state, resumeData);
      }
    }

    while (state.cursor < files.length) {
      const items = await collectSegment(files as FileEditInput[], state, mode);
      if (items.length === 0) {
        // 冲突来自上了预览树却没走完的编辑（比如认领之后 core 接不上），这一段没有要等的：换一棵新树接着收
        continue;
      }

      if (!suspend) {
        for (const item of items) {
          const sync = isSyncItem(item);
          state.results[item.index] = {
            path: files[item.index].path,
            success: false,
            replacements: item.replacements,
            // 等前端的编辑还悬在内存里，没人能批准也就没落盘——如实说清楚，别让调用方以为写进去了
            message: sync
              ? "Frontend synchronization is required, but suspend is unavailable. The edit was not written."
              : "Frontend synchronization is required, but suspend is unavailable.",
            ...(sync ? { frontendSynced: false } : {})
          };
        }
        continue;
      }

      const needsApproval = mode === AgentMode.ASK_BEFORE_EDIT && !state.approved;
      state.pending = { ...operationContext(state, items[0].index), items };
      return suspend(segmentPayload(files as FileEditInput[], state.pending, needsApproval)) as never;
    }

    if (capture && state.hasComponentEdits && !state.captureRequested) {
      state.captureRequested = true;
      if (suspend) {
        state.capturePending = { batchId: state.batchId, operationId: `${state.batchId}:capture` };
        return suspend({ type: SuspendType.CaptureCanvas, ...state.capturePending }) as never;
      }
      state.screenshot = { ok: false, error: "当前上下文不支持截图" };
    }

    const output = buildBatchOutput(state);
    batchStates.delete(executionKey);
    return output;
  }
});
