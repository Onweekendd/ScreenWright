/// <reference lib="dom" />
import { hc } from "hono/client";

import type { AppType } from "../routes/index";

const BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as Record<string, any>).env?.VITE_FUNAI_API_URL) ||
  "http://localhost:4111";

const TOKEN_KEY = "bi_token";

type TokenProvider = () => string | null | undefined;

/** 默认从 localStorage 取令牌（与 app 的 getToken 同 key）；Web Worker 等无 localStorage 的环境用 setApiAuthTokenProvider 注入 */
let tokenProvider: TokenProvider = () => {
  try {
    return globalThis.localStorage?.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

let unauthorizedHandler: (() => void) | undefined;

/** 覆盖令牌来源（如 Worker 内由主线程消息下发） */
export function setApiAuthTokenProvider(provider: TokenProvider): void {
  tokenProvider = provider;
}

/** 注册 401 回调（令牌失效 / 过期时由应用决定是否登出跳登录页） */
export function setApiUnauthorizedHandler(handler: (() => void) | undefined): void {
  unauthorizedHandler = handler;
}

export const apiClient = hc<AppType>(BASE_URL, {
  headers: (): Record<string, string> => {
    const token = tokenProvider();
    return token ? { "X-Access-Token": token } : {};
  },
  fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await fetch(input, init);
    if (res.status === 401) {
      unauthorizedHandler?.();
    }
    return res;
  }
});

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
