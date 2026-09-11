/**
 * 录制上下文：决定一次往返归属哪个 thread / turn / 第几步。
 *
 * 目录结构（key 相对 sink 根前缀，见 record-sink）：
 *   <threadId>/                ← 一个 thread 一个根文件夹（按 threadId 命名，稳定）
 *     turn_00/                   ← 第 1 次问答
 *       step_00.json             ← LLM 往返（exchange-archive 写）
 *       step_01.json
 *     turn_01/                   ← 第 2 次问答
 *
 * turn 归属规则：new 请求（无 runId）开启新 turn；resume 请求（带 runId）沿用当前 turn。
 * 这样「一次提问 + AI 多步推理 / 后台任务续接」会落进同一个 turn 文件夹，step 序号在整个
 * turn 内连续，不会因为 new/resume 拆成两个文件夹。
 *
 * 内存状态因热重载/重启丢失时，从已落地的 turn_NN / step_NN 推导序号续接，不会另起根文件夹。
 *
 * 两套 agent 系统共用同一个 AsyncLocalStorage 与同一个入口 withRecordingTurn，
 * fetch 层因此不需要知道自己在哪套系统里：
 *   - Mastra：BIChatStreamSession.runTurnWithRecording 包住「起流 + 消费流」整轮
 *   - Pi：    PiAgentRunner.run 包住一次任务执行
 */
import { AsyncLocalStorage } from "node:async_hooks";

import { isLlmRecordingEnabled } from "./exchange-record";
import { joinKey, listChildren } from "./record-sink";

/**
 * 一个 thread 的录制状态，跨多次请求复用，用于把 new + resume 归并到同一个 turn，
 * 并维持 turn 序号 / 根前缀。
 */
interface ThreadRecordingState {
  /** 该 thread 的根前缀 key（按 threadId 命名，稳定） */
  rootKey: string;
  /** 当前 turn 序号，初始 -1，第一个 new 请求会自增到 0 */
  turnIndex: number;
  /** 当前 turn 的前缀 key（如 "<threadId>/turn_00"） */
  turnDir: string;
  /** 当前 turn 内的 step 序号引用（同一 turn 的 new + resume 共享，保证连续） */
  stepSeq: { value: number };
}

const threadStates = new Map<string, ThreadRecordingState>();

/** 当前 turn 的上下文，由 withRecordingTurn 注入 */
interface TurnContext {
  threadId?: string;
  runId?: string;
  /** turn 序号（供索引入库用） */
  turnIndex: number;
  /** turn 级前缀 key */
  turnDir: string;
  /** turn 内 step 序号（指向 ThreadRecordingState.stepSeq 同一引用） */
  stepSeq: { value: number };
}

const turnStore = new AsyncLocalStorage<TurnContext>();

/**
 * 解析「当前这次往返属于哪条执行链」。
 *
 * 本模块框架无关（Mastra 与 Pi 共用同一套编号与落盘），不能直接依赖任何 agent 框架，
 * 所以执行链身份由宿主注册进来——与 mastra 自己 `initContextStorage()` 里
 * `setCurrentSpanResolver(getCurrentSpan)` 是同一个套路。
 *
 * 未注册时恒返回 undefined，退化成「整个 turn 只有一条链」，即当前行为。
 */
export type BranchResolver = () => string | undefined;

let branchResolver: BranchResolver = () => undefined;

/** 注册执行链解析器（进程级，启动时注册一次）。 */
export function setBranchResolver(resolver: BranchResolver): void {
  branchResolver = resolver;
}

/** 取当前执行链 ID；解析器抛错只打日志——录制是旁路，绝不能影响主流程。 */
function resolveBranchKey(): string | undefined {
  try {
    return branchResolver();
  } catch (e) {
    console.error("[recording-scope] 执行链解析失败:", e);
    return undefined;
  }
}

export interface RecordingTurnInput {
  threadId?: string;
  /** 带 runId 表示 resume，沿用当前 turn */
  runId?: string;
}

function sanitize(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, "-");
}

/** 列出根前缀下已存在的 turn 序号（升序）；无内容时返回空数组 */
async function listTurnIndexes(rootKey: string): Promise<number[]> {
  const { dirs } = await listChildren(rootKey);
  return dirs
    .filter((d) => /^turn_\d+$/.test(d))
    .map((d) => Number.parseInt(d.slice("turn_".length), 10))
    .filter((n) => Number.isInteger(n))
    .sort((a, b) => a - b);
}

/** 统计某 turn 前缀下已有的 step_NN.json 数量（用于跨重启续接 step 序号） */
async function countStepFiles(turnKey: string): Promise<number> {
  const { files } = await listChildren(turnKey);
  return files.filter((f) => f.startsWith("step_") && f.endsWith(".json")).length;
}

/**
 * 从已落地内容（本地 FS 或 MinIO）推导该 thread 的 turn / step 序号，填充内存态。
 * 由 withRecordingTurn 在开 turn 前调用；内存已缓存该 thread 时直接返回，不产生列举开销。
 */
export async function prepareRecordingTurn(ctx: { threadId?: string }): Promise<void> {
  const threadKey = ctx.threadId ?? "no-thread";
  if (threadStates.has(threadKey)) {
    return;
  }

  // 根前缀按 threadId 命名（稳定），同一对话所有 turn 落进同一前缀。
  // 内存缓存未命中（如热重载/重启）时，从已有 turn_*/step_* 推导序号，跨重启续接。
  const rootKey = sanitize(threadKey);
  const turns = await listTurnIndexes(rootKey);
  const lastTurn = turns.length ? turns[turns.length - 1] : -1;

  let turnDir = "";
  let stepValue = 0;
  if (lastTurn >= 0) {
    turnDir = joinKey(rootKey, `turn_${String(lastTurn).padStart(2, "0")}`);
    stepValue = await countStepFiles(turnDir);
  }

  // 双重检查：await 期间可能已被并发请求填充。
  if (threadStates.has(threadKey)) {
    return;
  }
  threadStates.set(threadKey, { rootKey, turnIndex: lastTurn, turnDir, stepSeq: { value: stepValue } });
}

/**
 * 推进该 thread 的 turn 状态并产出本次请求的上下文。
 *
 * - new 请求（无 runId）：开启新 turn（turnIndex++），step 序号归零。
 * - resume 请求（带 runId）：沿用当前 turn 与 step 序号，继续往下记。
 */
function nextTurnContext(ctx: RecordingTurnInput): TurnContext {
  const threadKey = ctx.threadId ?? "no-thread";
  let state = threadStates.get(threadKey);

  if (!state) {
    // 兜底：prepareRecordingTurn 未先行调用（或列举失败）时，从零开始不做续接。
    state = { rootKey: sanitize(threadKey), turnIndex: -1, turnDir: "", stepSeq: { value: 0 } };
    threadStates.set(threadKey, state);
  }

  if (!ctx.runId || !state.turnDir) {
    state.turnIndex += 1;
    state.turnDir = joinKey(state.rootKey, `turn_${String(state.turnIndex).padStart(2, "0")}`);
    state.stepSeq = { value: 0 };
  }

  return {
    threadId: ctx.threadId,
    runId: ctx.runId,
    turnIndex: state.turnIndex,
    turnDir: state.turnDir,
    stepSeq: state.stepSeq
  };
}

/**
 * 在一段有明确边界的执行里开启一个 turn：turn 内每次 LLM 往返写一个 step_NN.json。
 *
 * `fn` 必须把「起流」和「消费流」都包进去——模型往返是在消费流时才发生的，
 * 只包起流那一半，深层 fetch 拿不到上下文，记录会落到根前缀下的 step_-1.json。
 *
 * 未开启录制时直接执行 `fn`，不产生任何列举开销。
 */
export async function withRecordingTurn<T>(ctx: RecordingTurnInput, fn: () => Promise<T>): Promise<T> {
  if (!isLlmRecordingEnabled()) {
    return fn();
  }
  await prepareRecordingTurn(ctx);
  return turnStore.run(nextTurnContext(ctx), fn);
}

/** 本次往返在 turn 内占用的槽位：归属信息 + 序号 + turn 前缀。 */
export interface StepSlot {
  threadId?: string;
  runId?: string;
  turnIndex: number;
  turnDir: string;
  step: number;
  /**
   * 本步属于哪条执行链。与 threadId 的分工：
   *   threadId  案卷号——这条记录归哪次对话（也就是落进哪个根目录）
   *   branchKey 执行者——这一步是谁跑的（主 agent 还是某次委派的子 agent）
   * 主干两者相同；子 agent 的形如 `${父threadId}-${uuid}`，前缀关系即父子关系。
   */
  branchKey?: string;
}

/**
 * 占用当前 turn 的下一个 step 序号（有副作用：stepSeq 自增）。
 * 拿不到上下文时退化为 turnIndex/step = -1，记录落在根前缀下而不是丢弃，
 * 便于事后发现「有调用跑在 turn 上下文之外」。
 */
export function allocateStepSlot(): StepSlot {
  // 必须此刻现取、不能进 ALS：同一个 turn 里不同 step 可能属于不同执行链
  // （主 agent 与它委派出去的子 agent 共享同一个 turn 上下文），这正是本字段存在的理由。
  const branchKey = resolveBranchKey();
  const ctx = turnStore.getStore();

  // 跑在 turn 上下文之外：不占序号，记录落到根前缀下便于事后发现
  if (!ctx) {
    return { turnIndex: -1, turnDir: "", step: -1, branchKey };
  }

  const step = ctx.stepSeq.value++;

  return {
    threadId: ctx.threadId,
    runId: ctx.runId,
    turnIndex: ctx.turnIndex,
    turnDir: ctx.turnDir,
    step,
    branchKey
  };
}
