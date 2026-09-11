import { z } from "zod";

/** 一条断言的结果，与 `evals/harness/case.ts` 的 Assertion 同形。 */
export const EvalAssertionSchema = z.object({
  name: z.string(),
  passed: z.boolean(),
  detail: z.string().optional()
});

export const EvalSuspendSchema = z.object({
  type: z.string(),
  channel: z.string(),
  toolName: z.string()
});

/** 一个 case 的一次尝试。 */
export const EvalCaseSchema = z.object({
  id: z.string(),
  runId: z.string(),
  caseId: z.string(),
  title: z.string(),
  attempt: z.number(),
  passed: z.boolean(),
  /** 点进去看那次对话；driver 崩到拿不到 thread 时为 null */
  threadId: z.string().nullable(),
  timedOut: z.boolean(),
  errorMessage: z.string().nullable(),
  elapsedMs: z.number(),
  steps: z.number(),
  toolCalls: z.number(),
  toolFailures: z.number(),
  totalTokens: z.number(),
  invariants: z.array(EvalAssertionSchema),
  assertions: z.array(EvalAssertionSchema),
  suspends: z.array(EvalSuspendSchema)
});

/** 一次运行（批次）。 */
export const EvalRunSchema = z.object({
  id: z.string(),
  startedAt: z.string(),
  finishedAt: z.string(),
  totalCases: z.number(),
  passedCases: z.number(),
  /** false 表示这一批没开上传，L2 指标全 0——画趋势要把这些点排除掉 */
  uploaded: z.boolean()
});

/** 某个 case 在某次运行里的格子。矩阵视图一格一条。 */
export const EvalMatrixCellSchema = z.object({
  runId: z.string(),
  /** 同一批里跑了 N 遍时的通过数 / 总数，`2/3` 比 `0/3` 更值得看 */
  passed: z.number(),
  attempts: z.number(),
  totalTokens: z.number(),
  steps: z.number(),
  toolFailures: z.number(),
  /** 该格子里任取一个 threadId，供「点进去看那次对话」 */
  threadId: z.string().nullable()
});

/** 一行：一个 case 在最近若干次运行里的表现。 */
export const EvalMatrixRowSchema = z.object({
  caseId: z.string(),
  title: z.string(),
  cells: z.array(EvalMatrixCellSchema)
});

export const ListEvalRunsResponseSchema = z.object({
  code: z.literal(200),
  message: z.string(),
  data: z.object({
    runs: z.array(EvalRunSchema),
    /** 行 = case，列 = runs 的顺序。没跑过某批次的 case 在那一列没有格子 */
    matrix: z.array(EvalMatrixRowSchema)
  })
});

export const GetEvalRunResponseSchema = z.object({
  code: z.literal(200),
  message: z.string(),
  data: z.object({
    run: EvalRunSchema,
    cases: z.array(EvalCaseSchema)
  })
});

export type EvalAssertion = z.infer<typeof EvalAssertionSchema>;
export type EvalCaseResult = z.infer<typeof EvalCaseSchema>;
export type EvalRunSummary = z.infer<typeof EvalRunSchema>;
export type EvalMatrixCell = z.infer<typeof EvalMatrixCellSchema>;
export type EvalMatrixRow = z.infer<typeof EvalMatrixRowSchema>;
