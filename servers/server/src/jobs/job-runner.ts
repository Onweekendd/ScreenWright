import { randomUUID } from "node:crypto";

import type { EnqueueOptions, Job, JobHandler, JobStore } from "./job";

export interface JobRunnerOptions {
  store: JobStore;
  /** 同时最多执行多少个作业，默认 1 */
  concurrency?: number;
  /** 队列空闲时轮询间隔（ms），默认 500 */
  pollIntervalMs?: number;
  /** 时钟注入，测试时可以控制"现在几点" */
  now?: () => number;
  /** 第 attempt 次失败后等多久再重试（ms）。默认指数退避：1s, 2s, 4s ... */
  backoffMs?: (attempt: number) => number;
  idGenerator?: () => string;
}

const DEFAULT_BACKOFF = (attempt: number) => 1000 * 2 ** (attempt - 1);

/**
 * 进程内后台作业执行器（麻雀版 BullMQ）。
 *
 * 生命周期：enqueue → pending → (claim) running → completed
 *                                        └→ 失败: attempts < maxAttempts ? 回 pending（带退避）: failed
 *
 * 练习目标：把下面标了 TODO 的方法补齐，让 tests/jobs/job-runner.test.ts 全绿。
 * 建议顺序：enqueue → tick + runJob → start/stop。
 */
export class JobRunner {
  private readonly store: JobStore;
  private readonly concurrency: number;
  private readonly pollIntervalMs: number;
  private readonly now: () => number;
  private readonly backoffMs: (attempt: number) => number;
  private readonly idGenerator: () => string;
  private readonly handlers = new Map<string, JobHandler>();

  private running = false;
  private loopPromise: Promise<void> | null = null;

  constructor(options: JobRunnerOptions) {
    this.store = options.store;
    this.concurrency = options.concurrency ?? 1;
    this.pollIntervalMs = options.pollIntervalMs ?? 500;
    this.now = options.now ?? Date.now;
    this.backoffMs = options.backoffMs ?? DEFAULT_BACKOFF;
    this.idGenerator = options.idGenerator ?? randomUUID;
  }

  register<TPayload, TResult>(type: string, handler: JobHandler<TPayload, TResult>): void {
    this.handlers.set(type, handler as JobHandler);
  }

  getJob(id: string): Promise<Job | null> {
    return this.store.get(id);
  }

  /**
   * 进程启动时调用：上次崩溃时遗留在 running 状态的作业，全部重置为 pending。
   * 返回恢复的数量。
   */
  recover(): Promise<number> {
    return this.store.resetRunning();
  }

  /**
   * TODO(1): 入队。
   * - 用 idGenerator 生成 id，用 now() 取当前时间
   * - status 初始为 pending，progress 0，attempts 0
   * - maxAttempts 默认 3；runAfter = now + (options.delayMs ?? 0)
   * - 写进 store，返回 id
   */
  async enqueue<TPayload>(type: string, payload: TPayload, options: EnqueueOptions = {}): Promise<string> {
    void type;
    void payload;
    void options;
    void this.idGenerator; // 本方法会用到
    void this.now;
    throw new Error("TODO: JobRunner.enqueue");
  }

  /**
   * TODO(2): 执行一轮。
   * - 最多领取 concurrency 个可执行作业（store.claimNext(now())，返回 null 就停）
   * - 领到的作业并行执行（Promise.all + runJob），全部结束后返回本轮处理的数量
   * - 一个都没领到时返回 0（start 的循环会据此决定要不要 sleep）
   */
  async tick(): Promise<number> {
    void this.concurrency; // 本方法会用到
    void this.runJob;
    throw new Error("TODO: JobRunner.tick");
  }

  /**
   * TODO(3): 执行单个作业并落盘结果。
   * - 找 handler，找不到视为失败（lastError 写明原因），且不重试
   * - 构造 JobContext：reportProgress 把 progress 写回 store
   * - handler 成功 → status completed, progress 100, result
   * - handler 抛错 →
   *     job.attempts < job.maxAttempts：status 回 pending，runAfter = now + backoffMs(attempts)，记录 lastError
   *     否则：status failed，记录 lastError
   * - 注意 handler 抛出的可能不是 Error 实例，lastError 要兜底成字符串
   */
  private async runJob(job: Job): Promise<void> {
    void job;
    void this.handlers; // 本方法会用到
    void this.backoffMs;
    throw new Error("TODO: JobRunner.runJob");
  }

  /**
   * TODO(4): 启动后台循环。
   * - 重复调用 start 应该是幂等的（已在跑就直接返回）
   * - 循环：running 为 true 时，await tick()；如果本轮处理数为 0，sleep pollIntervalMs 再继续
   * - 把循环的 Promise 存到 loopPromise，供 stop 等待
   */
  start(): void {
    void this.running; // 本方法会用到
    void this.pollIntervalMs;
    throw new Error("TODO: JobRunner.start");
  }

  /**
   * TODO(5): 优雅停止。
   * - 把 running 置 false，然后 await loopPromise（等正在执行的那一轮 tick 跑完）
   * - 不要粗暴中断正在执行的 handler；"等它做完"就是桌面端关窗口前该有的行为
   */
  async stop(): Promise<void> {
    void this.loopPromise; // 本方法会用到
    throw new Error("TODO: JobRunner.stop");
  }
}
