"use client";

import type { EvalCaseResult, EvalMatrixRow, EvalRunSummary } from "@screenwright/server/rpc";
import { AlertTriangle, CheckCircle2, CircleDot, ExternalLink, XCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatDateTime, formatDuration, formatTokenCount } from "@/lib/utils";

/**
 * eval 结果视图。
 *
 * 主视图是 **case × run 矩阵**（行 case、列批次），不是「批次 → case」的树：天天要看的是同一个
 * case 横向的稳定性——「三次过两次」说明能力在但不稳，通常是 prompt 里某句话有歧义。按批次分组
 * 一次只能看一列，这个信号就看不出来。批次在这里是列，是筛选维度，不是主干。
 *
 * 数据全部由服务端组件注入；选中批次走 URL 查询参数，刷新和分享都还原得回来。
 */

interface EvalsViewProps {
  runs: EvalRunSummary[];
  matrix: EvalMatrixRow[];
  selectedRunId: string | null;
  cases: EvalCaseResult[];
  error: string | null;
}

/** 一个格子的状态：全过 / 全挂 / 不稳（同一批里部分通过） */
type CellState = "pass" | "fail" | "flaky";

const cellState = (passed: number, attempts: number): CellState =>
  passed === attempts ? "pass" : passed === 0 ? "fail" : "flaky";

const CELL_STYLE: Record<CellState, string> = {
  pass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  fail: "bg-red-500/15 text-red-600 dark:text-red-400",
  // 不稳最值得看，给一个跟成功/失败都不一样的颜色，扫一眼就能挑出来
  flaky: "bg-amber-500/20 text-amber-700 dark:text-amber-400"
};

export function EvalsView({ runs, matrix, selectedRunId, cases, error }: EvalsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectRun = (runId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("run", runId);
    router.push(`${pathname}?${params.toString()}`);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-10 text-center text-sm">{error}</CardContent>
      </Card>
    );
  }

  if (runs.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground space-y-2 py-10 text-center text-sm">
          <p>还没有任何 eval 批次。</p>
          <p className="text-xs">
            在 servers/server 下跑 <code className="bg-muted rounded px-1 py-0.5">pnpm eval</code>； 历史报告可用{" "}
            <code className="bg-muted rounded px-1 py-0.5">pnpm eval:import</code> 导入。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">通过率矩阵</CardTitle>
          <p className="text-muted-foreground text-xs">
            行 = case，列 = 批次（从左到右由早到晚）。格子里是「通过数/尝试数 · token」，
            <span className="text-amber-600 dark:text-amber-400">琥珀色</span>
            表示同一批里时过时不过——能力在但不稳，通常比全红更值得查。
          </p>
        </CardHeader>
        <CardContent>
          {/* 批次多了要横向滚，页面本身不能跟着横向滚 */}
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="bg-background sticky left-0 z-10 border-b px-3 py-2 text-left font-medium">case</th>
                  {runs.map((run) => (
                    <th key={run.id} className="border-b px-2 py-2 text-center font-normal">
                      <button
                        type="button"
                        onClick={() => selectRun(run.id)}
                        className={cn(
                          "hover:bg-muted w-full rounded px-2 py-1 text-xs transition-colors",
                          selectedRunId === run.id && "bg-muted font-medium"
                        )}
                        title={`${run.id}｜${run.passedCases}/${run.totalCases} 通过`}
                      >
                        <span className="tabular-nums">{run.id.slice(5, 16).replace("T", " ")}</span>
                        <span className="text-muted-foreground block">
                          {run.passedCases}/{run.totalCases}
                          {!run.uploaded && " ·无指标"}
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row) => (
                  <tr key={row.caseId}>
                    <td className="bg-background sticky left-0 z-10 border-b px-3 py-2 whitespace-nowrap">
                      <span className="font-mono text-xs">{row.caseId}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{row.title}</span>
                    </td>
                    {runs.map((run) => {
                      const cell = row.cells.find((c) => c.runId === run.id);
                      if (!cell) {
                        // 那一批没跑这个 case——留空，不要画成失败
                        return (
                          <td key={run.id} className="text-muted-foreground/30 border-b px-2 py-2 text-center">
                            ·
                          </td>
                        );
                      }
                      const state = cellState(cell.passed, cell.attempts);
                      return (
                        <td key={run.id} className="border-b px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => selectRun(run.id)}
                            className={cn("w-full rounded px-2 py-1 text-xs tabular-nums", CELL_STYLE[state])}
                            title={`${cell.passed}/${cell.attempts} 通过 · ${cell.steps} 轮 · 工具失败 ${cell.toolFailures} · ${formatTokenCount(cell.totalTokens)} token`}
                          >
                            <span className="block font-medium">
                              {cell.passed}/{cell.attempts}
                            </span>
                            <span className="opacity-70">
                              {cell.totalTokens > 0 ? `${Math.round(cell.totalTokens / 1000)}k` : "-"}
                            </span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedRunId && <RunDetail runId={selectedRunId} runs={runs} cases={cases} />}
    </div>
  );
}

function RunDetail({ runId, runs, cases }: { runId: string; runs: EvalRunSummary[]; cases: EvalCaseResult[] }) {
  const run = runs.find((r) => r.id === runId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          批次 <span className="font-mono text-sm">{runId}</span>
        </CardTitle>
        {run && (
          <p className="text-muted-foreground text-xs">
            {formatDateTime(run.startedAt)} · {run.passedCases}/{run.totalCases} 通过
            {!run.uploaded && " · 这一批没开上传，L2 指标全为 0"}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {cases.length === 0 && <p className="text-muted-foreground text-sm">这一批没有 case 记录。</p>}
        {cases.map((c) => (
          <CaseRow key={c.id} result={c} runId={runId} />
        ))}
      </CardContent>
    </Card>
  );
}

function CaseRow({ result, runId }: { result: EvalCaseResult; runId: string }) {
  // L0 不变量和 L1 断言一起列：不变量破了的时候，断言全绿也不能算数
  const failed = [...result.invariants, ...result.assertions].filter((a) => !a.passed);

  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {result.passed ? (
          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
        ) : (
          <XCircle className="size-4 shrink-0 text-red-500" />
        )}
        <span className="font-mono text-xs">{result.caseId}</span>
        <span className="text-sm font-medium">{result.title}</span>
        {result.attempt > 1 && <span className="text-muted-foreground text-xs">#{result.attempt}</span>}

        <span className="text-muted-foreground ml-auto flex items-center gap-3 text-xs tabular-nums">
          <span>{result.steps} 轮</span>
          <span>工具 {result.toolCalls}</span>
          <span className={cn(result.toolFailures > 0 && "text-amber-600 dark:text-amber-400")}>
            失败 {result.toolFailures}
          </span>
          <span>{formatDuration(result.elapsedMs)}</span>
          <span>{formatTokenCount(result.totalTokens)} tok</span>
          {result.threadId && (
            <Link
              href={`/sessions?thread=${result.threadId}&evalRun=${encodeURIComponent(runId)}`}
              className="text-primary inline-flex items-center gap-1 hover:underline"
            >
              看对话 <ExternalLink className="size-3" />
            </Link>
          )}
        </span>
      </div>

      {result.timedOut && (
        <p className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-3" /> 超时收场
        </p>
      )}
      {result.errorMessage && <p className="mt-2 text-xs text-red-500">! {result.errorMessage}</p>}

      {failed.length > 0 && (
        <ul className="mt-2 space-y-1">
          {failed.map((a, i) => (
            <li key={`${a.name}-${i}`} className="flex gap-2 text-xs">
              <CircleDot className="mt-0.5 size-3 shrink-0 text-red-500" />
              <span>
                <span className="font-medium">{a.name}</span>
                {a.detail && <span className="text-muted-foreground"> — {a.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
