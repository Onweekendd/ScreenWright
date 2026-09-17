import type { Job, JobStatus, JobStore } from "./job";

/**
 * 内存版 JobStore：测试和练习用，进程重启即丢。
 * 这是参考实现，帮你理解 JobStore 每个方法的语义；
 * 第二阶段写 Prisma 版本时，可以对照这里的行为。
 */
export class MemoryJobStore implements JobStore {
  private readonly jobs = new Map<string, Job>();

  async insert(job: Job): Promise<void> {
    this.jobs.set(job.id, { ...job });
  }

  async get(id: string): Promise<Job | null> {
    const job = this.jobs.get(id);
    return job ? { ...job } : null;
  }

  async update(id: string, patch: Partial<Omit<Job, "id">>): Promise<Job | null> {
    const existing = this.jobs.get(id);
    if (!existing) {
      return null;
    }
    const updated: Job = { ...existing, ...patch, id, updatedAt: Date.now() };
    this.jobs.set(id, updated);
    return { ...updated };
  }

  async claimNext(now: number): Promise<Job | null> {
    // 这段同步代码中间没有 await，JS 单线程保证它不会被打断，
    // 所以"找到 + 改状态"是原子的。
    for (const job of this.jobs.values()) {
      if (job.status === "pending" && job.runAfter <= now) {
        job.status = "running";
        job.attempts += 1;
        job.updatedAt = now;
        return { ...job };
      }
    }
    return null;
  }

  async resetRunning(): Promise<number> {
    let count = 0;
    for (const job of this.jobs.values()) {
      if (job.status === "running") {
        job.status = "pending";
        count += 1;
      }
    }
    return count;
  }

  async list(filter?: { status?: JobStatus; type?: string }): Promise<Job[]> {
    return [...this.jobs.values()]
      .filter((j) => (filter?.status ? j.status === filter.status : true))
      .filter((j) => (filter?.type ? j.type === filter.type : true))
      .map((j) => ({ ...j }));
  }
}
