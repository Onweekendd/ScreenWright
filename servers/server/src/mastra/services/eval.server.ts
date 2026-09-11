/**
 * eval 结果查询。数据源是 `eval_runs` / `eval_cases`，由 `evals/harness/report.ts` 在每场
 * eval 收尾时写入。
 *
 * 与 `llm-exchange.server.ts` 的分工：这里回答「过没过、哪条断言红了」，那边回答「那次对话
 * 具体聊了什么」。两者用 `threadId` 串起来——点一个格子跳过去看原始往返。
 */

import { HTTPException } from "hono/http-exception";

import { prismaClient } from "@/mastra/storage/prisma";
import type { EvalAssertion, EvalCaseResult, EvalMatrixRow } from "@/mastra/types/eval";
import { EvalCaseSchema, EvalRunSchema } from "@/mastra/types/eval";

const ok = <T>(data: T) => ({ code: 200 as const, message: "ok", data });

/** Json 列存的就是落盘那份，结构由 harness 保证；解析不出来时退成空数组而不是让整个请求 500。 */
const asAssertions = (value: unknown): EvalAssertion[] => (Array.isArray(value) ? (value as EvalAssertion[]) : []);

const serializeCase = (row: {
  id: string;
  runId: string;
  caseId: string;
  title: string;
  attempt: number;
  passed: boolean;
  threadId: string | null;
  timedOut: boolean;
  errorMessage: string | null;
  elapsedMs: number;
  steps: number;
  toolCalls: number;
  toolFailures: number;
  totalTokens: number;
  invariants: unknown;
  assertions: unknown;
  suspends: unknown;
}): EvalCaseResult =>
  EvalCaseSchema.parse({
    ...row,
    invariants: asAssertions(row.invariants),
    assertions: asAssertions(row.assertions),
    suspends: Array.isArray(row.suspends) ? row.suspends : []
  });

const serializeRun = (row: {
  id: string;
  startedAt: Date;
  finishedAt: Date;
  totalCases: number;
  passedCases: number;
  uploaded: boolean;
}) =>
  EvalRunSchema.parse({
    ...row,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt.toISOString()
  });

/**
 * 最近若干次运行 + case × run 矩阵。
 *
 * **矩阵而不是「批次 → case」的树**，是因为天天要看的是同一个 case 横向的稳定性：
 * 「三次过两次」说明能力在但不稳，通常是 prompt 里某句话有歧义——按批次分组一次只能看一列，
 * 这个信号就看不出来。批次在这里是列，是筛选维度，不是主干。
 *
 * @param limit 取最近多少次运行（列数）
 */
export async function listEvalRuns(limit = 12) {
  const runs = await prismaClient.evalRun.findMany({
    orderBy: { startedAt: "desc" },
    take: limit
  });
  // 列按时间从早到晚排，读起来才是「往右走 = 往后跑」
  const ordered = [...runs].reverse();

  const cases = await prismaClient.evalCase.findMany({
    where: { runId: { in: ordered.map((r) => r.id) } },
    select: {
      runId: true,
      caseId: true,
      title: true,
      attempt: true,
      passed: true,
      threadId: true,
      steps: true,
      toolFailures: true,
      totalTokens: true
    }
  });

  // caseId → runId → 该格子的所有 attempt
  const byCase = new Map<string, { title: string; byRun: Map<string, typeof cases> }>();
  for (const row of cases) {
    const entry = byCase.get(row.caseId) ?? { title: row.title, byRun: new Map() };
    entry.title = row.title; // 标题以最新一次为准
    entry.byRun.set(row.runId, [...(entry.byRun.get(row.runId) ?? []), row]);
    byCase.set(row.caseId, entry);
  }

  const matrix: EvalMatrixRow[] = [...byCase.entries()]
    .map(([caseId, entry]) => ({
      caseId,
      title: entry.title,
      cells: ordered
        .filter((run) => entry.byRun.has(run.id))
        .map((run) => {
          const attempts = entry.byRun.get(run.id)!;
          return {
            runId: run.id,
            passed: attempts.filter((a) => a.passed).length,
            attempts: attempts.length,
            totalTokens: attempts.reduce((acc, a) => acc + a.totalTokens, 0),
            steps: attempts.reduce((acc, a) => acc + a.steps, 0),
            toolFailures: attempts.reduce((acc, a) => acc + a.toolFailures, 0),
            threadId: attempts.find((a) => a.threadId)?.threadId ?? null
          };
        })
    }))
    .sort((a, b) => a.caseId.localeCompare(b.caseId, "en", { numeric: true }));

  return ok({ runs: ordered.map(serializeRun), matrix });
}

/** 一次运行的全部 case 明细，含断言逐条结果。 */
export async function getEvalRun(runId: string) {
  if (!runId) {
    throw new HTTPException(400, { message: "runId is required" });
  }
  const run = await prismaClient.evalRun.findUnique({ where: { id: runId } });
  if (!run) {
    throw new HTTPException(404, { message: `找不到 eval 批次: ${runId}` });
  }
  const cases = await prismaClient.evalCase.findMany({
    where: { runId },
    orderBy: [{ caseId: "asc" }, { attempt: "asc" }]
  });

  return ok({ run: serializeRun(run), cases: cases.map(serializeCase) });
}
