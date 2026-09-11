import type { TaskIdentifier } from "@/task-management";

import type { AppCodeTaskError } from "./app-code-task-error";

export interface AppCodeCheckResult {
  name: string;
  status: "passed" | "failed" | "skipped";
  output?: string;
}

export interface AppCodeExecutionError {
  code: AppCodeTaskError;
  message: string;
}

interface AppCodeExecutionResultBase extends TaskIdentifier {
  status: "completed" | "failed";
  summary: string;
  changedFiles: string[];
  checks: AppCodeCheckResult[];
}

/** Artifact App 编码任务成功完成后的结果。 */
export interface AppCodeExecutionCompletedResult extends AppCodeExecutionResultBase {
  appId: string;
  sessionId: string;
  status: "completed";
  error?: never;
}

/** Artifact App 编码任务失败后的结果；早期失败可能尚未创建 App 或 Session。 */
export interface AppCodeExecutionFailedResult extends AppCodeExecutionResultBase {
  appId?: string;
  sessionId?: string;
  status: "failed";
  error: AppCodeExecutionError;
}

export type AppCodeExecutionResult = AppCodeExecutionCompletedResult | AppCodeExecutionFailedResult;

/** 构造失败执行结果所需的定位信息与错误详情。 */
export interface CreateFailedResultInput {
  taskIdentifier: TaskIdentifier;
  appId?: string;
  sessionId?: string;
  code: AppCodeTaskError;
  message: string;
}

/** 构造一个不携带文件变更与检查结果的失败执行结果。 */
export function createFailedResult(input: CreateFailedResultInput): AppCodeExecutionResult {
  const { taskIdentifier, appId, sessionId, code, message } = input;
  return {
    ...taskIdentifier,
    ...(appId ? { appId } : {}),
    ...(sessionId ? { sessionId } : {}),
    status: "failed",
    summary: message,
    changedFiles: [],
    checks: [],
    error: { code, message }
  };
}
