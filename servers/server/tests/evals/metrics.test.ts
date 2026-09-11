import { describe, expect, it } from "vitest";

import { type ExchangeIndexRow, summarizeMetrics } from "../../evals/harness/metrics";

// 指标的取数（读 Postgres 索引）与计算是分开的，这里只测计算那一半——纯函数，喂几行进去就行，
// 不连数据库、不花一分钱 LLM。取数那半薄到只有一次 findMany，真出问题会在真跑时立刻暴露。

/** 一行最小索引记录。字段对应 llm_exchange_records 里 L2 用到的那些列。 */
const row = (over: Partial<ExchangeIndexRow> = {}): ExchangeIndexRow => ({
  turnIndex: 0,
  step: 0,
  model: "deepseek-chat",
  toolCallCount: 0,
  toolFailures: 0,
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  generationTimeMs: 0,
  branchKey: null,
  ...over
});

describe("eval L2 指标", () => {
  it("没有索引行时返回空结果，而不是抛错", () => {
    // EVAL_UPLOAD=0 跑出来的批次就是这样：索引没入库，但整场 eval 不该崩在采指标这一步
    const metrics = summarizeMetrics("t1", []);

    expect(metrics.stepCount).toBe(0);
    expect(metrics.branches).toEqual([]);
    expect(metrics.total.totalTokens).toBe(0);
  });

  it("按 branchKey 分组，主干是 threadId 本身", () => {
    const threadId = "thread-a";

    const { branches, total } = summarizeMetrics(threadId, [
      row({ branchKey: threadId, totalTokens: 100 }),
      row({ branchKey: `${threadId}-sub-1`, totalTokens: 30 }),
      row({ branchKey: `${threadId}-sub-1`, totalTokens: 20 })
    ]);

    expect(branches).toHaveLength(2);
    expect(branches[0]!.isMain).toBe(true); // 主干排头
    expect(branches[0]!.steps).toBe(1);
    expect(branches[1]!.branchKey).toBe(`${threadId}-sub-1`);
    expect(branches[1]!.steps).toBe(2);
    expect(total.totalTokens).toBe(150);
  });

  it("没有 branchKey 的老记录归到主干", () => {
    const { branches } = summarizeMetrics("thread-legacy", [row(), row()]);

    expect(branches).toHaveLength(1);
    expect(branches[0]!.isMain).toBe(true);
    expect(branches[0]!.steps).toBe(2);
  });

  it("工具失败取分支内最大值，不逐步累加", () => {
    // 每行的 toolFailures 是「到那一步为止的累计数」（每步 request 都带全部历史）。
    // 逐步累加的话这里会数出 0+1+2=3，正确答案是 2。
    const threadId = "thread-fail";

    const { branches, total } = summarizeMetrics(threadId, [
      row({ branchKey: threadId, toolCallCount: 1, toolFailures: 0 }),
      row({ branchKey: threadId, toolCallCount: 1, toolFailures: 1 }),
      row({ branchKey: threadId, toolCallCount: 0, toolFailures: 2 })
    ]);

    expect(branches[0]!.toolFailures).toBe(2);
    expect(total.toolFailures).toBe(2);
    // 工具调用数则是逐步累加的——每行的 toolCallCount 是「这一步发起的」，不重复
    expect(total.toolCalls).toBe(2);
  });

  it("各分支的失败数分别取最大值后再相加", () => {
    // 分支之间的对话历史是独立的，所以累计值不能跨分支比大小
    const threadId = "thread-branch-fail";

    const { total } = summarizeMetrics(threadId, [
      row({ branchKey: threadId, toolFailures: 1 }),
      row({ branchKey: `${threadId}-sub`, toolFailures: 3 }),
      row({ branchKey: `${threadId}-sub`, toolFailures: 5 })
    ]);

    expect(total.toolFailures).toBe(6);
  });

  it("toolFailures 为 null 的老记录按 0 算", () => {
    const { total } = summarizeMetrics("thread-null", [row({ toolFailures: null }), row({ toolFailures: null })]);

    expect(total.toolFailures).toBe(0);
  });

  it("turnCount 数的是不同的 turnIndex，不是行数", () => {
    const metrics = summarizeMetrics("thread-multi", [
      row({ turnIndex: 0, generationTimeMs: 1000 }),
      row({ turnIndex: 1, generationTimeMs: 500 }),
      row({ turnIndex: 1, generationTimeMs: 500 })
    ]);

    expect(metrics.turnCount).toBe(2);
    expect(metrics.stepCount).toBe(3);
    expect(metrics.total.generationTimeMs).toBe(2000);
  });

  it("同一分支用过的模型去重后排序列出", () => {
    const threadId = "thread-models";

    const { branches } = summarizeMetrics(threadId, [
      row({ branchKey: threadId, model: "deepseek-reasoner" }),
      row({ branchKey: threadId, model: "deepseek-chat" }),
      row({ branchKey: threadId, model: "deepseek-chat" }),
      row({ branchKey: threadId, model: null })
    ]);

    expect(branches[0]!.models).toEqual(["deepseek-chat", "deepseek-reasoner"]);
  });
});
