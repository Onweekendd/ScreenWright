import { ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import type { AskUserQuestion } from "@screenwright/server/rpc";

export type SubmitPlanAction =
  | { action: "auto_edit" }
  | { action: "ask_before_edit" }
  | { action: "keep_plan" }
  | { action: "reject"; feedback: string };

type PendingDialog =
  | { type: "confirm"; message: string; resolve: (ok: boolean) => void }
  | { type: "question"; questions: AskUserQuestion[]; resolve: (answers: Record<string, string>) => void }
  | { type: "submit_plan"; summary: string; plan: string; resolve: (result: SubmitPlanAction) => void };

export const useConfirm = createGlobalState(() => {
  const pendingDialog = ref<PendingDialog | null>(null);

  const confirm = (message: string): Promise<boolean> =>
    new Promise((resolve) => {
      pendingDialog.value = { type: "confirm", message, resolve };
    });

  const askQuestion = (questions: AskUserQuestion[]): Promise<Record<string, string>> =>
    new Promise((resolve) => {
      pendingDialog.value = { type: "question", questions, resolve };
    });

  const showSubmitPlan = (summary: string, plan: string): Promise<SubmitPlanAction> =>
    new Promise((resolve) => {
      pendingDialog.value = { type: "submit_plan", summary, plan, resolve };
    });

  const resolveConfirm = (ok: boolean) => {
    if (pendingDialog.value?.type === "confirm") {
      pendingDialog.value.resolve(ok);
      pendingDialog.value = null;
    }
  };

  const resolveQuestion = (answers: Record<string, string>) => {
    if (pendingDialog.value?.type === "question") {
      pendingDialog.value.resolve(answers);
      pendingDialog.value = null;
    }
  };

  const resolveSubmitPlan = (result: SubmitPlanAction) => {
    if (pendingDialog.value?.type === "submit_plan") {
      pendingDialog.value.resolve(result);
      pendingDialog.value = null;
    }
  };

  const closeDialog = () => {
    if (pendingDialog.value?.type === "confirm") {
      pendingDialog.value.resolve(false);
    } else if (pendingDialog.value?.type === "submit_plan") {
      pendingDialog.value.resolve({ action: "keep_plan" });
    }
    pendingDialog.value = null;
  };

  return {
    pendingDialog,
    confirm,
    askQuestion,
    showSubmitPlan,
    resolveConfirm,
    resolveQuestion,
    resolveSubmitPlan,
    closeDialog
  };
});
