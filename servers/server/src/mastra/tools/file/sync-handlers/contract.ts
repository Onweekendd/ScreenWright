import { z } from "zod";

import type { ScreenTreeSet } from "../../../services/bi-data-sync/screen-tree-set";
import { type CanvasOp, SuspendDefs, SuspendType } from "../../../types/suspend";
import type { ReplaceResult } from "../apply-edits";
import { type ReadFileRecord, readFileState } from "../state";
import { formatSuccessMessage } from "../utils";

// ── 挂起协议 ─────────────────────────────────────────────────────────────────

/**
 * edit_files 能向前端提出的全部请求：普通文件在 ASK 模式下那一轮纯审批，加上组件 / 过滤器 / 屏幕配置
 * 三类同步——后者统一走 `canvas_ops`（审批与否由载荷里的 `approval` 决定），批次末尾用 capture_canvas 统一截图。
 */
export const editFilesSuspendSchema = z.union([
  SuspendDefs[SuspendType.AskApproval].suspend,
  SuspendDefs[SuspendType.CanvasOps].suspend,
  SuspendDefs[SuspendType.CaptureCanvas].suspend
]);

export const editFilesResumeSchema = z.union([
  SuspendDefs[SuspendType.AskApproval].resume,
  SuspendDefs[SuspendType.CanvasOps].resume,
  SuspendDefs[SuspendType.CaptureCanvas].resume
]);

export type EditFilesSuspendPayload = z.infer<typeof editFilesSuspendSchema>;
export type EditFilesResumeData = z.infer<typeof editFilesResumeSchema>;

/** 需要推给前端的三类同步。vue-part 与组件 json 都归 "component"：前端收到的是同一种载荷。 */
export type SyncKind = "component" | "filter" | "screenInfo";

/**
 * 前端执行成功之后才执行的落盘动作：把这次编辑放到 `trees` 那棵整屏树上，**不写盘**——
 * 同一段里所有提交都上完树之后，由 edit_files 调一次 {@link ScreenTreeSet.flush} 统一写。
 * 返回 core 重算派生值的说明（没有则不返回）；抛错表示这一项没能上树。
 *
 * 存在即意味着「这次挂起时工作区还没动」。工作区要反映画布的真实状态，所以顺序是
 * **先推给前端、前端执行成功、再落盘**——用户拒绝、前端离线、或者压根没人来 resume，
 * 工作区都保持原样，不会出现「文件说改了、画布上没有」的分叉。
 */
export type DeferredCommit = (trees: ScreenTreeSet) => Promise<{ notice?: string } | void>;

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
  /**
   * 这一段编辑共用的预览树：处理器在上面算出要推给前端的那一份，但不写盘。
   * 上树前必须先 claim，跟同段已上树的编辑有交集就返回 {@link CONFLICT}。
   */
  trees: ScreenTreeSet;
  /** 编辑完成后是否截图；不传时默认开启。 */
  capture?: boolean;
}

/** 跟同一段里已经上树的编辑有交集：先把前面的落盘，再回来重新处理这个文件。 */
export const CONFLICT = { ok: "conflict" } as const;

/**
 * prepare 的产物：要么这次编辑当场作废（工作区一个字节没动），要么等前端，要么先让前面的落盘。
 *
 * 失败一律带上给 agent 看的完整消息，由调用方原样塞进 FileEditResult——处理器不认识批次状态。
 */
export type PreparedEdit =
  | { ok: false; message: string; frontendSynced?: boolean; validationErrors?: string[] }
  | typeof CONFLICT
  | {
      ok: true;
      kind: SyncKind;
      /** core 重算派生值留下的说明，结算时拼进结果消息 */
      notice?: string;
      commit: DeferredCommit;
      /** 要推给前端的那一个画布操作；同一段的 op 由调用方合进一次 canvas_ops 挂起 */
      op: CanvasOp;
      /** 只有这一个文件需要审批时，审批框里的说明 */
      purpose: string;
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

/** 整屏回写换掉了磁盘内容，之前读到的快照全部失效，下次编辑必须重读。 */
export const invalidateReadState = (...absPaths: string[]): void => {
  absPaths.forEach((absPath) => readFileState.delete(absPath));
};
