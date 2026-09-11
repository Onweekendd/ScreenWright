import { z } from "zod";

import { SuspendDefs, SuspendType } from "../../../types/suspend";
import type { ReplaceResult } from "../apply-edits";
import { type ReadFileRecord, readFileState } from "../state";
import { formatSuccessMessage } from "../utils";

// ── 挂起协议 ─────────────────────────────────────────────────────────────────

/** edit_files 能向前端提出的全部请求。新增一种同步类型时，这里与 resume 那份要成对加。 */
export const editFilesSuspendSchema = z.union([
  SuspendDefs[SuspendType.AskApproval].suspend,
  SuspendDefs[SuspendType.PushComponentUpdate].suspend,
  SuspendDefs[SuspendType.AskApprovalPushComponentUpdate].suspend,
  SuspendDefs[SuspendType.SaveFilter].suspend,
  SuspendDefs[SuspendType.AskApprovalSaveFilter].suspend,
  SuspendDefs[SuspendType.UpdateScreenInfo].suspend,
  SuspendDefs[SuspendType.AskApprovalUpdateScreenInfo].suspend
]);

export const editFilesResumeSchema = z.union([
  SuspendDefs[SuspendType.AskApproval].resume,
  SuspendDefs[SuspendType.PushComponentUpdate].resume,
  SuspendDefs[SuspendType.AskApprovalPushComponentUpdate].resume,
  SuspendDefs[SuspendType.SaveFilter].resume,
  SuspendDefs[SuspendType.AskApprovalSaveFilter].resume,
  SuspendDefs[SuspendType.UpdateScreenInfo].resume,
  SuspendDefs[SuspendType.AskApprovalUpdateScreenInfo].resume
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
 * 同一件事的两种挂起形态：ASK 模式先弹审批框、AUTO 模式直接推。
 * 除了 type 与多出来的 purpose，载荷字段完全一样——分开写两遍迟早漏掉一边的字段。
 */
export const askOrPush = <F extends Record<string, unknown>>(
  ctx: EditContext,
  { approvalType, autoType, purpose }: { approvalType: SuspendType; autoType: SuspendType; purpose: string },
  fields: F
): EditFilesSuspendPayload =>
  (ctx.needsApproval
    ? { type: approvalType, purpose, ...fields }
    : { type: autoType, ...fields }) as unknown as EditFilesSuspendPayload;

/** 整屏回写换掉了磁盘内容，之前读到的快照全部失效，下次编辑必须重读。 */
export const invalidateReadState = (...absPaths: string[]): void => {
  absPaths.forEach((absPath) => readFileState.delete(absPath));
};
