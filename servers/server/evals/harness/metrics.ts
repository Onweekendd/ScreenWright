/**
 * L2 过程指标：读 Postgres 索引算出来，driver 不埋点。
 *
 * **数据源是 `llm_exchange_records`，跟 agent-trace 读的是同一张表。** 这是它最重要的性质：
 * eval 报告里的轮数/token 和你在 agent-trace 里看到的必然一致，对不上账就是索引本身出了问题，
 * 而不是两套统计口径打架。原先读本地录制目录，数字虽然也对，但它和 agent-trace 是两条独立的路，
 * 迟早会分叉。
 *
 * 索引行只要有 threadId 就会写（`record-index.ts` 不再区分 fs / minio），所以 `EVAL_UPLOAD=0`
 * 的纯本地批次照样能算 L2。返回全 0 通常意味着 `RECORD_LLM` 没开、或这个 threadId 压根没录到。
 *
 * 指标只入报告、不设阈值——L2 看的是趋势。其中最灵敏的是**工具失败次数**：功能还对但
 * 轮数从 6 涨到 20，说明工具描述或 prompt 退化了，L1 全绿也该报警。
 */

import { prismaClient } from "@/mastra/storage/prisma";

/** 索引行里 L2 用得上的那些列。只声明用到的字段，跟 Prisma 的 select 一一对应。 */
export interface ExchangeIndexRow {
  turnIndex: number;
  step: number;
  model: string | null;
  toolCallCount: number;
  toolFailures: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  generationTimeMs: number | null;
  branchKey: string | null;
}

export interface BranchMetrics {
  /** 执行者身份。主干是 threadId 本身，子 agent 是 `<threadId>-<uuid>` */
  branchKey: string;
  isMain: boolean;
  /** LLM 往返次数，即「轮数」 */
  steps: number;
  toolCalls: number;
  /** 工具返回 `success: false` 的次数。L2 里最灵敏的那个 */
  toolFailures: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  /** 模型侧生成耗时之和，不含我们这边的编排开销 */
  generationTimeMs: number;
  models: string[];
}

export interface RunMetrics {
  threadId: string;
  stepCount: number;
  turnCount: number;
  branches: BranchMetrics[];
  /** 各分支合计，报告摘要用 */
  total: Omit<BranchMetrics, "branchKey" | "isMain" | "models">;
}

/**
 * 读一个 thread 的索引行 → 分支级指标。
 *
 * 查不到行时返回空结果而不是抛错：没上传是最常见的情形，不该让整场 eval 崩在采指标这一步。
 */
export const collectMetrics = async (threadId: string): Promise<RunMetrics> => {
  const rows = await prismaClient.llmExchangeRecord.findMany({
    where: { threadId },
    orderBy: [{ turnIndex: "asc" }, { step: "asc" }],
    // select **写成内联字面量**，别抽成 `as const` 常量：抽出去就绕开了多余属性检查，
    // 列名写错 tsc 不报，直到真跑时才炸在 PrismaClientValidationError 上。踩过一次。
    select: {
      turnIndex: true,
      step: true,
      model: true,
      toolCallCount: true,
      toolFailures: true,
      promptTokens: true,
      completionTokens: true,
      totalTokens: true,
      generationTimeMs: true,
      branchKey: true
    }
  });
  return summarizeMetrics(threadId, rows);
};

/**
 * 纯函数：给一组索引行算指标。
 *
 * 跟取数分开，是为了让它能在**没有数据库、没有 LLM 调用**的情况下被完整覆盖——单测直接喂行。
 */
export const summarizeMetrics = (threadId: string, rows: ExchangeIndexRow[]): RunMetrics => {
  // branchKey 缺失的是加分支追踪之前的记录，或 span 取不到的场合——归到主干，
  // 这样老档案仍能算出总量，只是分不开子 agent。
  const grouped = new Map<string, ExchangeIndexRow[]>();
  for (const row of rows) {
    const key = row.branchKey ?? threadId;
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(row);
    } else {
      grouped.set(key, [row]);
    }
  }

  const branches = [...grouped.entries()]
    .map(([branchKey, group]) => summarize(branchKey, branchKey === threadId, group))
    // 主干排头，其余按 branchKey 稳定排序，报告每次跑出来顺序一致
    .sort((a, b) => Number(b.isMain) - Number(a.isMain) || a.branchKey.localeCompare(b.branchKey));

  return {
    threadId,
    stepCount: rows.length,
    turnCount: new Set(rows.map((r) => r.turnIndex)).size,
    branches,
    total: {
      steps: sum(branches, (b) => b.steps),
      toolCalls: sum(branches, (b) => b.toolCalls),
      toolFailures: sum(branches, (b) => b.toolFailures),
      promptTokens: sum(branches, (b) => b.promptTokens),
      completionTokens: sum(branches, (b) => b.completionTokens),
      totalTokens: sum(branches, (b) => b.totalTokens),
      generationTimeMs: sum(branches, (b) => b.generationTimeMs)
    }
  };
};

const summarize = (branchKey: string, isMain: boolean, group: ExchangeIndexRow[]): BranchMetrics => ({
  branchKey,
  isMain,
  steps: group.length,
  toolCalls: sum(group, (r) => r.toolCallCount),
  // 取**最大值**不是求和：每一步的 toolFailures 是「到那一步为止的累计数」（每步 request 都带
  // 全部历史），逐步累加会把同一个失败数很多次，步数越多放大得越厉害。
  toolFailures: Math.max(0, ...group.map((r) => r.toolFailures ?? 0)),
  promptTokens: sum(group, (r) => r.promptTokens ?? 0),
  completionTokens: sum(group, (r) => r.completionTokens ?? 0),
  totalTokens: sum(group, (r) => r.totalTokens ?? 0),
  generationTimeMs: sum(group, (r) => r.generationTimeMs ?? 0),
  models: [...new Set(group.map((r) => r.model).filter((m): m is string => Boolean(m)))].sort()
});

const sum = <T>(items: T[], pick: (item: T) => number): number => items.reduce((acc, item) => acc + pick(item), 0);
