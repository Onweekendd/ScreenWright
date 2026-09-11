/**
 * LLM 往返记录的可查询索引：每次往返在 DB 写一行，指向 `recordStore()` 里的完整内容。
 * 供 agent-trace 与离线评估按 thread / 工具 / 状态筛选聚合，命中后再按 objectKey 拉完整内容。
 *
 * 只要有 threadId 就入库（不再区分 fs / minio）：完整内容恒在本地文件系统，
 * `objectKey` 是 fs 与 minio 共用的同一份 key，`bucket` 仅在镜像了 minio 时有值。
 */
import { recordMirrorsMinio } from "@/lib/storage";
import { prismaClient } from "@/mastra/storage/prisma";

import { recordKey } from "./record-sink";

const mirrorBucket = (): string => (recordMirrorsMinio() ? process.env.MINIO_BUCKET || "screenwright" : "");

export interface LlmExchangeIndexInput {
  /** 相对 key，如 "<thread>/turn_00/step_00.json" */
  key: string;
  threadId?: string;
  runId?: string;
  turnIndex: number;
  step: number;
  url: string;
  status: number;
  ok: boolean;
  model?: string;
  toolNames: string[];
  /** LLM 往返时间戳（ISO 字符串） */
  at: string;
  generationTimeMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cachedPromptTokens?: number;
  reasoningTokens?: number;
  branchKey?: string;
  /** 到本步为止请求历史里可见的失败工具结果数（累计值，见 exchange-archive 的 countToolFailures） */
  toolFailures?: number;
}

/**
 * 这一批记录属于哪次 eval。
 *
 * 走环境变量而不是层层传参：它在整个进程生命周期里是常量，而调用链
 * （fetch 拦截 → exchange-archive → 这里）中间那几层跟 eval 毫无关系，为它加一个参数
 * 只会让它们各自多背一个自己用不上的字段。
 *
 * **必须在函数体里读**，不能提到模块顶层——`evals/harness/run.ts` 是先设 env 再动态 import
 * 被测代码的，模块级常量会在 import 那一刻定格成 undefined。
 */
const evalRunId = (): string | null => process.env.EVAL_RUN_ID ?? null;

/** 写入/更新一条 LLM 往返索引（幂等：按 threadId+turnIndex+step upsert）。 */
export async function indexLlmExchange(input: LlmExchangeIndexInput): Promise<void> {
  // 无 threadId 的调用跑在 turn 上下文之外，不进索引。
  if (!input.threadId) {
    return;
  }

  const { threadId, turnIndex, step } = input;
  const data = {
    threadId,
    turnIndex,
    step,
    runId: input.runId ?? null,
    url: input.url,
    model: input.model ?? null,
    status: input.status,
    ok: input.ok,
    toolNames: input.toolNames,
    toolCallCount: input.toolNames.length,
    at: new Date(input.at),
    generationTimeMs: input.generationTimeMs,
    promptTokens: input.promptTokens ?? null,
    completionTokens: input.completionTokens ?? null,
    totalTokens: input.totalTokens ?? null,
    cachedPromptTokens: input.cachedPromptTokens ?? null,
    reasoningTokens: input.reasoningTokens ?? null,
    bucket: mirrorBucket(),
    objectKey: recordKey(input.key),
    branchKey: input.branchKey ?? null,
    toolFailures: input.toolFailures ?? null,
    evalRunId: evalRunId()
  };

  await prismaClient.llmExchangeRecord.upsert({
    where: { threadId_turnIndex_step: { threadId, turnIndex, step } },
    create: data,
    update: data
  });
}
