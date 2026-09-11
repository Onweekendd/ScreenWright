import { ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import type { AskUserQuestion } from "@screenwright/server/rpc";

export type SubmitPlanAction =
  | { action: "auto_edit" }
  | { action: "ask_before_edit" }
  | { action: "keep_plan" }
  | { action: "reject"; feedback: string };

/** AI 模板弹窗的预填字段（由后端解析模板 JSON 得到） */
export interface SaveAiTemplatePreset {
  name: string;
  embeddingText: string;
  tags: string[];
  payload: string;
}

/** AI 模板弹窗的返回结果，回灌给 suspend 的 resumeData */
export interface SaveAiTemplateResult {
  saved: boolean;
  templateId?: number;
  canceled?: boolean;
}

/** 应用 AI 模板弹窗的返回结果，回灌给 suspend 的 resumeData */
export interface ApplyAiTemplateResult {
  applied: boolean;
  templateId?: number;
  /** 应用后回写的范式描述文件路径，供 agent 读取继续修改 */
  describePath?: string;
  canceled?: boolean;
}

type PendingDialog =
  | { type: "confirm"; message: string; resolve: (ok: boolean) => void }
  | { type: "question"; questions: AskUserQuestion[]; resolve: (answers: Record<string, string>) => void }
  | { type: "submit_plan"; summary: string; plan: string; resolve: (result: SubmitPlanAction) => void }
  | {
      type: "save_ai_template";
      preset: SaveAiTemplatePreset;
      resolve: (result: SaveAiTemplateResult) => void;
    }
  | {
      type: "apply_ai_template";
      templateIds: number[];
      resolve: (result: ApplyAiTemplateResult) => void;
    };

/**
 * 审批弹窗 store（全局单例，按 sessionId 排队）。
 *
 * 多 tab 下每个会话各自可能挂起一个审批弹窗，互不覆盖：用 `dialogs` 这张
 * `Map<sessionId, PendingDialog>` 同时持有所有 tab 的待审批项。UI（ApprovalDialog）
 * 只渲染「当前激活 tab」对应 sessionId 的那一条；其余 tab 的审批排队等待，
 * 在该 tab 被激活时才弹出。TabBar 也据此（dialogs.has(sessionId)）显示待审批角标。
 *
 * `dialogs` 用 ref 包裹 Map，Vue 会把它转成响应式 Map 代理，
 * `.set/.delete/.has/.get` 均能正确触发/收集依赖。
 */
export const useConfirm = createGlobalState(() => {
  const dialogs = ref<Map<string, PendingDialog>>(new Map());

  const confirm = (sessionId: string, message: string): Promise<boolean> =>
    new Promise((resolve) => {
      dialogs.value.set(sessionId, { type: "confirm", message, resolve });
    });

  const askQuestion = (sessionId: string, questions: AskUserQuestion[]): Promise<Record<string, string>> =>
    new Promise((resolve) => {
      dialogs.value.set(sessionId, { type: "question", questions, resolve });
    });

  const showSubmitPlan = (sessionId: string, summary: string, plan: string): Promise<SubmitPlanAction> =>
    new Promise((resolve) => {
      dialogs.value.set(sessionId, { type: "submit_plan", summary, plan, resolve });
    });

  const showSaveAiTemplate = (sessionId: string, preset: SaveAiTemplatePreset): Promise<SaveAiTemplateResult> =>
    new Promise((resolve) => {
      dialogs.value.set(sessionId, { type: "save_ai_template", preset, resolve });
    });

  const showApplyAiTemplate = (sessionId: string, templateIds: number[]): Promise<ApplyAiTemplateResult> =>
    new Promise((resolve) => {
      dialogs.value.set(sessionId, { type: "apply_ai_template", templateIds, resolve });
    });

  const resolveConfirm = (sessionId: string, ok: boolean) => {
    const dialog = dialogs.value.get(sessionId);
    if (dialog?.type === "confirm") {
      dialog.resolve(ok);
      dialogs.value.delete(sessionId);
    }
  };

  const resolveQuestion = (sessionId: string, answers: Record<string, string>) => {
    const dialog = dialogs.value.get(sessionId);
    if (dialog?.type === "question") {
      dialog.resolve(answers);
      dialogs.value.delete(sessionId);
    }
  };

  const resolveSubmitPlan = (sessionId: string, result: SubmitPlanAction) => {
    const dialog = dialogs.value.get(sessionId);
    if (dialog?.type === "submit_plan") {
      dialog.resolve(result);
      dialogs.value.delete(sessionId);
    }
  };

  const resolveSaveAiTemplate = (sessionId: string, result: SaveAiTemplateResult) => {
    const dialog = dialogs.value.get(sessionId);
    if (dialog?.type === "save_ai_template") {
      dialog.resolve(result);
      dialogs.value.delete(sessionId);
    }
  };

  const resolveApplyAiTemplate = (sessionId: string, result: ApplyAiTemplateResult) => {
    const dialog = dialogs.value.get(sessionId);
    if (dialog?.type === "apply_ai_template") {
      dialog.resolve(result);
      dialogs.value.delete(sessionId);
    }
  };

  const closeDialog = (sessionId: string) => {
    const dialog = dialogs.value.get(sessionId);
    if (dialog?.type === "confirm") {
      dialog.resolve(false);
    } else if (dialog?.type === "submit_plan") {
      dialog.resolve({ action: "keep_plan" });
    } else if (dialog?.type === "save_ai_template") {
      // 取消时也要 resolve，避免 promise 悬挂导致 suspend 无法 resume、agent 卡死
      dialog.resolve({ saved: false, canceled: true });
    } else if (dialog?.type === "apply_ai_template") {
      // 同上：取消必须 resolve，否则 apply_ai_template 的 suspend 永远 resume 不回来
      dialog.resolve({ applied: false, canceled: true });
    }
    dialogs.value.delete(sessionId);
  };

  return {
    dialogs,
    confirm,
    askQuestion,
    showSubmitPlan,
    showSaveAiTemplate,
    showApplyAiTemplate,
    resolveConfirm,
    resolveQuestion,
    resolveSubmitPlan,
    resolveSaveAiTemplate,
    resolveApplyAiTemplate,
    closeDialog
  };
});
