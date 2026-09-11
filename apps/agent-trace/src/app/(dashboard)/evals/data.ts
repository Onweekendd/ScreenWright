import type { EvalCaseResult, EvalMatrixRow, EvalRunSummary } from "@screenwright/server/rpc";

import { serverRpc } from "@/lib/server-rpc";

import "server-only";

export interface EvalOverview {
  runs: EvalRunSummary[];
  matrix: EvalMatrixRow[];
}

export interface EvalRunDetail {
  run: EvalRunSummary;
  cases: EvalCaseResult[];
}

/** 最近若干次运行 + case × run 矩阵。仅在服务端组件中调用。 */
export async function fetchEvalOverview(limit = 12): Promise<EvalOverview> {
  const res = await serverRpc.customApi.evals.runs.$get({ query: { limit: String(limit) } });
  if (!res.ok) {
    throw new Error(`加载 eval 批次失败 (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

/** 某一批次的 case 明细（含逐条断言）。 */
export async function fetchEvalRun(runId: string): Promise<EvalRunDetail> {
  const res = await serverRpc.customApi.evals.runs[":runId"].$get({ param: { runId } });
  if (!res.ok) {
    throw new Error(`加载批次 ${runId} 失败 (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}
