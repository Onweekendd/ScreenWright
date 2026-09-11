/**
 * 报告：判定一场 eval 的结果，落成 `runs/<runId>/report.json` 并写入数据库，
 * 再生成一份终端摘要。
 *
 * json 才是正式产出——趋势对比、将来进 agent-trace 都读它，所以**永远完整落盘**，
 * 哪怕这一场全红。终端摘要只是给跑的人扫一眼用的。
 *
 * ⚠️ `runs/` 已在 .gitignore 里，别去掉：报告里带着每个 case 的挂起载荷，而挂起载荷里
 * 有完整组件定义。真正敏感的 `request`（system prompt + 全部工具定义 + 历史消息）
 * 留在录制档案里，报告只引用 threadId 不复制内容。
 */

import fs from "node:fs";
import path from "node:path";

import type { Prisma } from "~/generated/prisma/client";

import { prismaClient } from "@/mastra/storage/prisma";

import type { Assertion, DriverResult } from "./case";
import type { RunMetrics } from "./metrics";

export interface CaseReport {
  caseId: string;
  title: string;
  /** 同一个 case 跑多遍时区分第几遍 */
  attempt: number;
  /** L0 + L1 全过才算 passed；driver 出错或超时直接算不过 */
  passed: boolean;
  invariants: Assertion[];
  assertions: Assertion[];
  metrics: RunMetrics;
  run: Omit<DriverResult, "suspends"> & { suspendCount: number };
  /** 挂起流水账留摘要：类型 + 通道，够回答「问了几次、都问了什么」 */
  suspends: Array<{ type: string; channel: string; toolName: string }>;
}

export interface EvalReport {
  /** 这一批的编号，与 Postgres `llm_exchange_records.eval_run_id` 和 runs/ 下的目录名同值 */
  runId: string;
  startedAt: string;
  finishedAt: string;
  totalCases: number;
  passedCases: number;
  cases: CaseReport[];
}

/** 一个 case 过没过：不变量和断言都得全过，且 driver 没出错、没超时。 */
export const judge = (report: Omit<CaseReport, "passed">): boolean =>
  !report.run.error &&
  !report.run.timedOut &&
  report.invariants.every((a) => a.passed) &&
  report.assertions.every((a) => a.passed);

export const writeReport = (report: EvalReport, runsDir: string): string => {
  // 目录名就是批次号：拿到一条 DB 记录的 eval_run_id，直接就能找到本地这份报告
  const dir = path.join(runsDir, report.runId);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "report.json");
  fs.writeFileSync(file, JSON.stringify(report, null, 2), "utf-8");
  return file;
};

/**
 * 把一场 eval 的报告写进 `eval_runs` / `eval_cases`。
 *
 * JSON 仍然先落盘再入库：入库失败不该让已经花钱跑出的结果丢掉。
 * 按 `(runId, caseId, attempt)` upsert，保证同一批次的写入是幂等的。
 *
 * @param uploaded 这一批跑的时候有没有开上传。没开的话 L2 指标全是 0，
 *   画趋势时要把这些点排除掉，否则会看成「token 突然掉到 0」。
 */
export const persistReport = async (report: EvalReport, uploaded: boolean): Promise<void> => {
  const run = {
    startedAt: new Date(report.startedAt),
    finishedAt: new Date(report.finishedAt),
    totalCases: report.totalCases,
    passedCases: report.passedCases,
    uploaded
  };

  await prismaClient.evalRun.upsert({
    where: { id: report.runId },
    create: { id: report.runId, ...run },
    update: run
  });

  for (const reportCase of report.cases) {
    const data = {
      title: reportCase.title,
      passed: reportCase.passed,
      threadId: reportCase.run.threadId || null,
      timedOut: reportCase.run.timedOut,
      errorMessage: reportCase.run.error?.message ?? null,
      elapsedMs: reportCase.run.elapsedMs,
      steps: reportCase.metrics.total.steps,
      toolCalls: reportCase.metrics.total.toolCalls,
      toolFailures: reportCase.metrics.total.toolFailures,
      totalTokens: reportCase.metrics.total.totalTokens,
      // Prisma 的 Json 列不接受 `Assertion[]` 这类具名类型。这里的数据同时也是可落盘的
      // EvalReport 内容，结构上已满足 JSON，因此只做边界处的类型收窄，不重复序列化。
      invariants: reportCase.invariants as unknown as Prisma.InputJsonValue,
      assertions: reportCase.assertions as unknown as Prisma.InputJsonValue,
      suspends: reportCase.suspends as unknown as Prisma.InputJsonValue
    };

    await prismaClient.evalCase.upsert({
      where: {
        runId_caseId_attempt: {
          runId: report.runId,
          caseId: reportCase.caseId,
          attempt: reportCase.attempt
        }
      },
      create: {
        runId: report.runId,
        caseId: reportCase.caseId,
        attempt: reportCase.attempt,
        ...data
      },
      update: data
    });
  }
};

/**
 * 终端摘要，一行一 case：
 * `✓ A1 创建组件（根级） 4/4 · 轮数 6 工具 8 失败 0 · 12.4s · 84k tok`
 *
 * 失败的 case 把没过的那几条断言缩进列在下面——只列没过的，全绿时一行就够。
 */
export const formatSummary = (report: EvalReport): string => {
  const lines: string[] = [];

  for (const c of report.cases) {
    const checks = [...c.invariants, ...c.assertions];
    const ok = checks.filter((a) => a.passed).length;
    const m = c.metrics.total;
    const flags = [c.run.timedOut ? "超时" : "", c.run.error ? "出错" : ""].filter(Boolean).join(" ");

    lines.push(
      `${c.passed ? "✓" : "✗"} ${c.caseId} ${c.title}${c.attempt > 1 ? ` #${c.attempt}` : ""} ` +
        `${ok}/${checks.length} · 轮数 ${m.steps} 工具 ${m.toolCalls} 失败 ${m.toolFailures} · ` +
        `${(c.run.elapsedMs / 1000).toFixed(1)}s · ${formatTokens(m.totalTokens)}${flags ? ` · ${flags}` : ""}`
    );

    for (const failed of checks.filter((a) => !a.passed)) {
      lines.push(`    ✗ ${failed.name}${failed.detail ? ` — ${failed.detail}` : ""}`);
    }
    if (c.run.error) {
      lines.push(`    ! ${c.run.error.message}`);
    }
    // 指标全 0 十有八九是没录到（索引没入库），而不是 agent 一步没走——省得查半天
    if (c.metrics.stepCount === 0) {
      lines.push("    ! 索引里没有这个 thread 的行，L2 指标为 0。检查 RECORD_LLM 是否为 true");
    }
  }

  // 子 agent 分支单独列一次总量，主干和分支混在一起看不出并发那批的开销
  const withBranches = report.cases.filter((c) => c.metrics.branches.length > 1);
  if (withBranches.length > 0) {
    lines.push("", "子 agent 分支：");
    for (const c of withBranches) {
      for (const b of c.metrics.branches.filter((x) => !x.isMain)) {
        lines.push(
          `    ${c.caseId} ${b.branchKey.slice(-12)} · ${b.steps} 步 · ${formatTokens(b.totalTokens)} · ${b.models.join("/")}`
        );
      }
    }
  }

  lines.push("", `${report.passedCases}/${report.totalCases} 通过`);
  return lines.join("\n");
};

const formatTokens = (n: number): string => (n >= 1000 ? `${(n / 1000).toFixed(1)}k tok` : `${n} tok`);
