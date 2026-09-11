import type { EvalCaseResult } from "@screenwright/server/rpc";

import { EvalsView } from "@/components/evals/evals-view";

import { type EvalOverview, fetchEvalOverview, fetchEvalRun } from "./data";

export const dynamic = "force-dynamic";

/**
 * eval 结果页。
 *
 * 数据源是 Screenwright 的 `eval_runs` / `eval_cases`，由 `evals/harness/persist.ts` 在每场 eval 收尾时
 * 写入。点某个 case 的「看对话」跳到 /sessions——那边读的是同一批录制的 llm_exchange_records，
 * 靠 threadId 串起来。
 */
export default async function EvalsPage({ searchParams }: { searchParams: Promise<{ run?: string }> }) {
  const { run: runParam } = await searchParams;

  let overview: EvalOverview | null = null;
  let error: string | null = null;

  try {
    overview = await fetchEvalOverview();
  } catch (err) {
    error = err instanceof Error ? err.message : "加载 eval 批次失败，请确认 Screenwright 已启动";
  }

  // 没指定就看最近一次——列是按时间从早到晚排的，所以取最后一个
  const selectedRunId = runParam ?? overview?.runs.at(-1)?.id ?? null;

  let cases: EvalCaseResult[] = [];
  if (selectedRunId) {
    // 明细拉不动不该让整页空掉，矩阵本身还是有用的
    const detail = await fetchEvalRun(selectedRunId).catch(() => null);
    cases = detail?.cases ?? [];
  }

  return (
    <div className="space-y-4 p-4">
      <EvalsView
        runs={overview?.runs ?? []}
        matrix={overview?.matrix ?? []}
        selectedRunId={selectedRunId}
        cases={cases}
        error={error}
      />
    </div>
  );
}
