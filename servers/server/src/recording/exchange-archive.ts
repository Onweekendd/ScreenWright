/**
 * 记录类：把一次 LLM 往返归档成一个 step_NN.json，并在 minio sink 下写一行可查询索引。
 *
 * 与来源无关——只要能提供「请求侧快照 + 完整响应文本」，Mastra 与 Pi 都用同一个实例流程。
 * 落盘目标（fs / minio）由 record-sink 按环境变量决定，这里不关心。
 */
import { EXCHANGE_FORMAT_VERSION, type ExchangeRecord, type ExchangeSource } from "./exchange-record";
import { extractTokenUsage, formatResponse, summarizeResponse } from "./openai-sse";
import { indexLlmExchange } from "./record-index";
import { joinKey, writeRecord } from "./record-sink";
import { allocateStepSlot, type StepSlot } from "./recording-scope";

/** 响应文本到手前即可确定的记录字段（请求侧快照）。 */
export interface ExchangeHead {
  url: string;
  status: number;
  ok: boolean;
  model?: string;
  /** 完整请求体（已解析成对象；非 JSON 时为原文） */
  request: unknown;
  /** 请求发起时刻（Date.now()），用于算 generationTimeMs */
  requestStartedAt: number;
}

/** 一次已开档、等待响应收尾的往返。 */
export interface OpenExchange {
  /** 该往返在档案里的相对 key，如 "<thread>/turn_00/step_00.json" */
  readonly key: string;
  /** 响应文本到手：解析 → 写 step_NN.json → 写索引。出错不影响主流程。 */
  commit(raw: string): void;
}

/**
 * 未完成的归档写入（落盘 + 索引）。
 *
 * 归档是 fire-and-forget——`commit()` 里两个 Promise 都被 `void` 掉了。服务进程里这没问题：
 * 进程一直活着，写迟早会完成。**一次性进程不行**：跑完就 `process.exit()`，飞在半空的写会被
 * 直接掐掉。而且两半掐掉的概率不一样——本地文件几毫秒就落了，上传要先 `ensureBucket` 再
 * `putObject` 两个网络往返，多半还没回来。症状是 DB 索引行有、MinIO 对象没有，两边对不上，
 * 且**不报任何错**。
 *
 * 所以把两个 Promise 登记进来，退出前 `await flushArchiveWrites()`。
 */
const pending = new Set<Promise<unknown>>();

function track(promise: Promise<unknown>): void {
  pending.add(promise);
  void promise.finally(() => pending.delete(promise));
}

/**
 * 等所有已发起的归档写入落地。
 *
 * 循环是必要的：await 期间可能又有新的写入登记进来（比如最后一步的索引跟在落盘后面）。
 * 服务进程用不上这个函数——它不退出。
 */
export async function flushArchiveWrites(): Promise<void> {
  while (pending.size > 0) {
    await Promise.allSettled([...pending]);
  }
}

/**
 * 数这一步的请求里有多少个失败的工具结果。
 *
 * 工具结果不在发起调用的那一步，而在**下一步**请求的消息尾巴上（`role: "tool"`）。而每一步的
 * request 都带着全部历史，所以这个数是「到本步为止累计的失败数」，不是「本步新增的」——
 * 消费方按分支取最大值就是该分支的总失败数，**逐步累加会把同一个失败数很多次**，步数越多
 * 放大得越厉害。
 *
 * 判定口径：工具返回体能解析出 `success === false`。我们的工具统一是 `{ success, message }`
 * （见各 tool 的 outputSchema），解析不出来的一律不算失败——宁可少报，也不要把正常返回
 * 误判成失败，那会让这个指标失去参考价值。
 */
export function countToolFailures(request: unknown): number {
  const messages = (request as { messages?: unknown[] } | undefined)?.messages;
  if (!Array.isArray(messages)) {
    return 0;
  }
  let failures = 0;
  for (const message of messages) {
    const { role, content } = (message ?? {}) as { role?: string; content?: unknown };
    if (role !== "tool" || typeof content !== "string") {
      continue;
    }
    try {
      if ((JSON.parse(content) as { success?: unknown }).success === false) {
        failures++;
      }
    } catch {
      // 非 JSON 的工具返回（纯文本结果）——不算失败
    }
  }
  return failures;
}

/** 写一条记录（sink 由 record-sink 决定），出错不影响主流程 */
async function safeWrite(key: string, record: ExchangeRecord): Promise<void> {
  try {
    await writeRecord(key, record);
  } catch (e) {
    console.error("[exchange-archive] 写入失败:", e);
  }
}

/**
 * 生产步骤名称（step_NN.json）对应的落盘 key。
 * @param slot
 * @returns
 */
function stepKey(slot: StepSlot): string {
  return joinKey(slot.turnDir, `step_${String(slot.step).padStart(2, "0")}.json`);
}

export class ExchangeArchive {
  constructor(private readonly source: ExchangeSource) {}

  /**
   * 开档：同步占用 step 槽位并定格落盘 key。
   *
   * 必须在响应刚到手时同步调用——序号来自 AsyncLocalStorage，跨过 await 边界后
   * 上下文可能已经不属于本次请求。真正的写入发生在 commit()。
   */
  open(head: ExchangeHead): OpenExchange {
    const slot = allocateStepSlot();
    const key = stepKey(slot);
    const at = new Date().toISOString();
    const source = this.source;

    return {
      key,
      commit(raw: string): void {
        const completedAt = Date.now();
        const generationTimeMs = Math.max(0, completedAt - head.requestStartedAt);
        const summary = summarizeResponse(raw);
        const tokenUsage = extractTokenUsage(raw);

        // 字段顺序即落盘顺序，见 exchange-record 的说明
        track(
          safeWrite(key, {
            step: slot.step,
            at,
            startedAt: new Date(head.requestStartedAt).toISOString(),
            threadId: slot.threadId,
            runId: slot.runId,
            url: head.url,
            status: head.status,
            ok: head.ok,
            request: head.request,
            completedAt: new Date(completedAt).toISOString(),
            generationTimeMs,
            tokenUsage,
            summary,
            response: formatResponse(raw),
            formatVersion: EXCHANGE_FORMAT_VERSION,
            source,
            branchKey: slot.branchKey
          })
        );

        track(
          indexLlmExchange({
            key,
            threadId: slot.threadId,
            runId: slot.runId,
            turnIndex: slot.turnIndex,
            step: slot.step,
            url: head.url,
            status: head.status,
            ok: head.ok,
            model: head.model,
            toolNames: summary.toolCalls.map((t) => t.name),
            at,
            generationTimeMs,
            promptTokens: tokenUsage?.promptTokens,
            completionTokens: tokenUsage?.completionTokens,
            totalTokens: tokenUsage?.totalTokens,
            cachedPromptTokens: tokenUsage?.cachedPromptTokens,
            reasoningTokens: tokenUsage?.reasoningTokens,
            branchKey: slot.branchKey,
            toolFailures: countToolFailures(head.request)
          }).catch((e) => console.error("[exchange-archive] 索引失败:", e))
        );
      }
    };
  }
}
