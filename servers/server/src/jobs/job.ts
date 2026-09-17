export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface Job<TPayload = unknown, TResult = unknown> {
  id: string;
  type: string;
  payload: TPayload;
  status: JobStatus;
  /** 0~100 */
  progress: number;
  /** 已开始执行的次数（每次被 claim 时 +1） */
  attempts: number;
  maxAttempts: number;
  /** 早于该时间戳（ms）不允许被领取；用于重试退避 */
  runAfter: number;
  result?: TResult;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

export interface JobContext {
  job: Job;
  /** 0~100，执行过程中随时调用，供前端轮询/推送 */
  reportProgress(progress: number): Promise<void>;
}

export type JobHandler<TPayload = unknown, TResult = unknown> = (
  payload: TPayload,
  ctx: JobContext
) => Promise<TResult>;

export interface EnqueueOptions {
  maxAttempts?: number;
  /** 延迟多少 ms 后才允许执行 */
  delayMs?: number;
}

/**
 * 作业存储抽象。JobRunner 只依赖这个接口，
 * 内存实现用于测试和练习，SQLite（Prisma）实现在第二阶段接入。
 */
export interface JobStore {
  insert(job: Job): Promise<void>;
  get(id: string): Promise<Job | null>;
  update(id: string, patch: Partial<Omit<Job, "id">>): Promise<Job | null>;
  /**
   * 原子地领取一个可执行的 pending 作业并把它标记为 running。
   * "可执行"= status 为 pending 且 runAfter <= now。
   * 没有可领取的作业时返回 null。
   *
   * 注意：这个方法必须是原子的（读 + 改在同一个不可分割的操作里），
   * 否则两个并发的 claim 可能领到同一个作业——这就是我们之前聊的
   * "两个 await 之间的竞态"。内存实现靠 JS 单线程天然原子；
   * SQLite 实现要靠 UPDATE ... WHERE status='pending' 的条件更新。
   */
  claimNext(now: number): Promise<Job | null>;
  /** 把所有 running 状态的作业重置为 pending（进程崩溃后恢复用） */
  resetRunning(): Promise<number>;
  list(filter?: { status?: JobStatus; type?: string }): Promise<Job[]>;
}
