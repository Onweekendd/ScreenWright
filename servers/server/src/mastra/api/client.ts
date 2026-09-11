/// <reference lib="dom" />
import { hc } from "hono/client";

import type { AppType } from "../routes/index";

const BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as Record<string, any>).env?.VITE_FUNAI_API_URL) ||
  "http://localhost:4111";

export const apiClient = hc<AppType>(BASE_URL);

/** RPC 客户端类型，供消费端（如 Next 服务端）按自定义 baseURL 重建同类型客户端。 */
export type ApiClient = typeof apiClient;

export type { FileChange, HistoryNode, RollbackOp, RollbackPlan } from "../services/version-history";
export {
  AgentMode,
  type AskUserQuestion,
  type BackgroundTaskArgs,
  type BackgroundTaskChunk,
  type BackgroundTaskOutputData,
  type BackgroundTaskRef,
  type BackgroundTaskRunningData,
  type BackgroundTaskStartedData,
  type BackgroundTaskSuspendedData,
  type CustomStorageThreadType,
  type QuestionOption,
  type ResumeData,
  type SuspendPayload,
  SuspendType
} from "../types/bi-chat";
export type { EvalAssertion, EvalCaseResult, EvalMatrixCell, EvalMatrixRow, EvalRunSummary } from "../types/eval";
export type {
  LlmExchangeRecord,
  LlmExchangeThreadSummary,
  ParsedExchangeMessage,
  ParsedLlmExchangeContent,
  ThreadFileTree,
  ThreadFileTreeFile,
  ThreadFileTreeTurn
} from "../types/llm-exchange";
export type { ModelCapability } from "../types/model-capability";
export { SuspendTypeSchema } from "../types/suspend";
