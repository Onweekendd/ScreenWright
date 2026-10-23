import { z } from "zod";

import { type CanvasOp, SuspendDefs, SuspendType } from "../../../types/suspend";
import { canvasOpsPayload } from "../../canvas-ops";
import type { ReplaceResult } from "../apply-edits";
import { type ReadFileRecord, readFileState } from "../state";
import { formatSuccessMessage } from "../utils";

// ── 挂起协议 ─────────────────────────────────────────────────────────────────

/**
 * edit_files 能向前端提出的全部请求：普通文件在 ASK 模式下那一轮纯审批，加上组件 / 过滤器 / 屏幕配置
 * 三类同步——后者统一走 `canvas_ops`（审批与否由载荷里的 `approval` 决定）。
 */
export const editFilesSuspendSchema = z.union([
  SuspendDefs[SuspendType.AskApproval].suspend,
  SuspendDefs[SuspendType.CanvasOps].suspend
]);

export const editFilesResumeSchema = z.union([
  SuspendDefs[SuspendType.AskApproval].resume,
  SuspendDefs[SuspendType.CanvasOps].resume
]);

export type EditFilesSuspendPayload = z.infer<typeof editFilesSuspendSchema>;
export type EditFilesResumeData = z.infer<typeof editFilesResumeSchema>;

/** 需要推给前端的三类同步。vue-part 与组件 json 都归 "component"：前端收到的是同一种载荷。 */
export type SyncKind = "component" | "filter" | "screenInfo";

/**
 * 前端执行成功之后才执行的落盘动作。返回 core 重算派生值的说明（没有则不返回）；抛错表示落盘失败。
 *
 * 存在即意味着「这次挂起时工作区还没动」。工作区要反映画布的真实状态，所以顺序是
 * **先推给前端、前端执行成功、再落盘**——用户拒绝、前端离线、或者压根没人来 resume，
 * 工作区都保持原样，不会出现「文件说改了、画布上没有」的分叉。
 */
export type DeferredCommit = (resumeData: EditFilesResumeData) => Promise<{ notice?: string } | void>;

// ── 处理器契约 ───────────────────────────────────────────────────────────────

/** 一次编辑走到「这类文件需要前端同步」时，处理器手里有的全部东西。 */
export interface EditContext {
  /** agent 给的原始路径，只用于回显在结果消息里 */
  filePath: string;
  absPath: string;
  /** 编辑后的内容，**尚未落盘** */
  result: ReplaceResult;
  /** 编辑开始时读到的原文；判断改名之类「改之前是什么」的问题只能问它 */
  readRecord: ReadFileRecord;
  needsApproval: boolean;
}

/**
 * prepare 的产物：要么这次编辑当场作废（工作区一个字节没动），要么挂起等前端。
 *
 * 失败一律带上给 agent 看的完整消息，由调用方原样塞进 FileEditResult——处理器不认识批次状态。
 */
export type PreparedEdit =
  | { ok: false; message: string; frontendSynced?: boolean; validationErrors?: string[] }
  | {
      ok: true;
      kind: SyncKind;
      /** core 重算派生值留下的说明，结算时拼进结果消息 */
      notice?: string;
      commit: DeferredCommit;
      /** 不含 batchId / operationId：批次上下文由调用方补，处理器不碰 */
      payload: EditFilesSuspendPayload;
    };

/**
 * 「这类文件编辑完要怎么跟前端同步」的一条策略。
 *
 * 拆成一个个处理器而不是一串 if，是因为同一种同步类型的知识过去散在三处：谁需要同步（审批分支里
 * 那一长串布尔取反）、怎么同步（if 链里的一大段）、以及新增时还得记得改 SYNC_MESSAGES。
 * 现在前两处收进了各自的文件，加一种类型 = 加一个文件 + 在 index 注册 + 加一行 SYNC_MESSAGES。
 *
 * 不做成责任链：命中与否是路径上的纯谓词（见 file-kind.ts），每个文件恰好命中一类，
 * 没有「我处理不了、交给下一个」这回事，引入链只是凭空多一层顺序语义。
 */
export interface SyncHandler {
  matches: (normalizedPath: string) => boolean;
  prepare: (ctx: EditContext) => Promise<PreparedEdit>;
}

// ── 处理器共用的小工具 ───────────────────────────────────────────────────────

/** 落盘推迟到前端确认之后，所以这一类失败的文案统一是「未写入工作区」。 */
export const notWritten = (ctx: EditContext, reason: string): PreparedEdit => ({
  ok: false,
  message: formatSuccessMessage(ctx.result.replacements, ctx.absPath, `未写入工作区: ${reason}`),
  frontendSynced: false
});

/**
 * 一次同步对应一个 `canvas_ops` 的 op；ASK 模式下载荷带 `approval`（前端先弹审批框），AUTO 模式直接推。
 * 审批与否只在这里判断一次——处理器只管产出 op。
 */
export const syncPayload = (ctx: EditContext, purpose: string, op: CanvasOp): EditFilesSuspendPayload =>
  canvasOpsPayload({ needsApproval: ctx.needsApproval, purpose, ops: [op] });

/** 整屏回写换掉了磁盘内容，之前读到的快照全部失效，下次编辑必须重读。 */
export const invalidateReadState = (...absPaths: string[]): void => {
  absPaths.forEach((absPath) => readFileState.delete(absPath));
};
