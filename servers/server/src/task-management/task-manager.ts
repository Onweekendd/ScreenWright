import { EventEmitter } from "events";
import { readdir, unlink, writeFile } from "fs/promises";

import {
  ensureTaskListLockFile,
  findHighestTaskId,
  findHighestTaskIdFromFiles,
  getTaskPath,
  getTasksDir,
  lockfile,
  readHighWaterMark,
  writeHighWaterMark
} from "./file-task-storage";
import type { Task } from "./task";
import { TaskSchema } from "./task";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ClaimTaskResult =
  | { success: true; task: Task }
  | {
      success: false;
      reason: "task_not_found" | "already_claimed" | "already_running" | "already_resolved" | "blocked" | "agent_busy";
      task?: Task;
      blockedByTasks?: string[];
      busyWithTasks?: string[];
    };

export interface ClaimTaskOptions {
  /** 认领前检查 agent 是否正在处理其他任务 */
  checkAgentBusy?: boolean;
}

export interface ClaimTaskInput extends ClaimTaskOptions {
  /** 要认领的任务 ID。 */
  taskId: string;

  /** 负责执行该任务的 Agent ID。 */
  claimantAgentId: string;
}

export interface TaskManagerOptions {
  taskListId: string;
  storageRoot: string;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function getErrnoCode(e: unknown): string | undefined {
  return (e as NodeJS.ErrnoException)?.code;
}

/** 将 Task 对象序列化为 JSON 字符串 */
function serializeTask(task: Task): string {
  return JSON.stringify(task, null, 2);
}

/** 从 JSON 字符串反序列化并校验为 Task，失败返回 null */
function parseTask(content: string): Task | null {
  try {
    const parsed = TaskSchema.safeParse(JSON.parse(content));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// ─── Lock options ─────────────────────────────────────────────────────────────

const LOCK_OPTIONS = {
  retries: { retries: 30, minTimeout: 5, maxTimeout: 100 }
};

// ─── TaskManager ─────────────────────────────────────────────────────────────

/**
 * 基于文件系统的任务管理器。
 * 每个实例对应一个 taskListId（独立的存储目录）。
 * 所有写操作使用 proper-lockfile 保证并发安全。
 */
export class TaskManager {
  private readonly taskListId: string;
  private readonly storageRoot: string;
  private readonly emitter = new EventEmitter();

  constructor({ taskListId, storageRoot }: TaskManagerOptions) {
    this.taskListId = taskListId;
    this.storageRoot = storageRoot;
  }

  // ─── 事件订阅 ──────────────────────────────────────────────────────────────

  /** 订阅任务列表变更事件，返回取消订阅函数 */
  onTasksUpdated(listener: () => void): () => void {
    this.emitter.on("updated", listener);
    return () => this.emitter.off("updated", listener);
  }

  private notifyTasksUpdated(): void {
    try {
      this.emitter.emit("updated");
    } catch {
      // 不让事件监听器的错误影响调用方
    }
  }

  // ─── 内部写工具（调用方持有锁时使用，避免死锁） ──────────────────────────

  private async updateTaskUnsafe(taskId: string, updates: Partial<Omit<Task, "id">>): Promise<Task | null> {
    const existing = await this.getTask(taskId);
    if (!existing) {
      return null;
    }
    const updated: Task = { ...existing, ...updates, id: taskId };
    await writeFile(getTaskPath(this.storageRoot, this.taskListId, taskId), serializeTask(updated));
    this.notifyTasksUpdated();
    return updated;
  }

  // ─── 公开方法 ─────────────────────────────────────────────────────────────

  /**
   * 创建任务，返回自增的任务 ID。
   * 使用列表级锁防止并发 ID 重复。
   */
  async createTask(taskData: Omit<Task, "id">): Promise<string> {
    const lockPath = await ensureTaskListLockFile(this.storageRoot, this.taskListId);
    let release: (() => Promise<void>) | undefined;
    try {
      release = await lockfile.lock(lockPath, LOCK_OPTIONS);
      const highestId = await findHighestTaskId(this.storageRoot, this.taskListId);
      const id = String(highestId + 1);
      const task: Task = { id, ...taskData };
      await writeFile(getTaskPath(this.storageRoot, this.taskListId, id), serializeTask(task));
      this.notifyTasksUpdated();
      return id;
    } finally {
      await release?.();
    }
  }

  /**
   * 读取单个任务，不存在或解析失败时返回 null。
   */
  async getTask(taskId: string): Promise<Task | null> {
    const { readFile } = await import("fs/promises");
    const taskPath = getTaskPath(this.storageRoot, this.taskListId, taskId);
    try {
      const content = await readFile(taskPath, "utf-8");
      return parseTask(content);
    } catch (e) {
      if (getErrnoCode(e) === "ENOENT") {
        return null;
      }
      throw e;
    }
  }

  /**
   * 列出当前列表中所有任务（排除元文件）。
   */
  async listTasks(): Promise<Task[]> {
    const dir = getTasksDir(this.storageRoot, this.taskListId);
    let files: string[];
    try {
      files = await readdir(dir);
    } catch {
      return [];
    }
    const taskIds = files.filter((f) => f.endsWith(".json") && !f.startsWith(".")).map((f) => f.replace(".json", ""));
    const results = await Promise.all(taskIds.map((id) => this.getTask(id)));
    return results.filter((t): t is Task => t !== null);
  }

  /**
   * 更新任务字段（使用任务级锁）。
   * 任务不存在时返回 null。
   */
  async updateTask(taskId: string, updates: Partial<Omit<Task, "id">>): Promise<Task | null> {
    const taskBeforeLock = await this.getTask(taskId);
    if (!taskBeforeLock) {
      return null;
    }

    const taskPath = getTaskPath(this.storageRoot, this.taskListId, taskId);
    let release: (() => Promise<void>) | undefined;
    try {
      release = await lockfile.lock(taskPath, LOCK_OPTIONS);
      return await this.updateTaskUnsafe(taskId, updates);
    } finally {
      await release?.();
    }
  }

  /**
   * 认领任务（设置 owner）。
   * 使用任务级锁防止多 agent 抢占同一任务。
   *
   * 可选 checkAgentBusy=true：升级为列表级锁，原子检查 agent 是否已有进行中任务。
   */
  async claimTask(input: ClaimTaskInput): Promise<ClaimTaskResult> {
    const { taskId, claimantAgentId, checkAgentBusy = false } = input;
    const taskBeforeLock = await this.getTask(taskId);
    if (!taskBeforeLock) {
      return { success: false, reason: "task_not_found" };
    }

    return checkAgentBusy
      ? this.claimTaskWithBusyCheck(taskId, claimantAgentId)
      : this.claimTaskSimple(taskId, claimantAgentId);
  }

  private async claimTaskSimple(taskId: string, claimantAgentId: string): Promise<ClaimTaskResult> {
    const taskPath = getTaskPath(this.storageRoot, this.taskListId, taskId);
    let release: (() => Promise<void>) | undefined;
    try {
      release = await lockfile.lock(taskPath, LOCK_OPTIONS);

      const task = await this.getTask(taskId);
      if (!task) {
        return { success: false, reason: "task_not_found" };
      }
      if (task.status === "completed" || task.status === "cancelled") {
        return { success: false, reason: "already_resolved", task };
      }
      if (task.owner && task.owner !== claimantAgentId) {
        return { success: false, reason: "already_claimed", task };
      }
      if (task.status === "in_progress") {
        return { success: false, reason: "already_running", task };
      }

      const blockedByTasks = await this.getUnresolvedBlockers(task);
      if (blockedByTasks.length > 0) {
        return { success: false, reason: "blocked", task, blockedByTasks };
      }

      const updated = await this.updateTaskUnsafe(taskId, {
        owner: claimantAgentId,
        status: "in_progress",
        attemptCount: (task.attemptCount ?? 0) + 1,
        lastError: undefined
      });
      return { success: true, task: updated! };
    } catch {
      return { success: false, reason: "task_not_found" };
    } finally {
      await release?.();
    }
  }

  private async claimTaskWithBusyCheck(taskId: string, claimantAgentId: string): Promise<ClaimTaskResult> {
    const lockPath = await ensureTaskListLockFile(this.storageRoot, this.taskListId);
    let release: (() => Promise<void>) | undefined;
    try {
      release = await lockfile.lock(lockPath, LOCK_OPTIONS);

      const allTasks = await this.listTasks();
      const task = allTasks.find((t) => t.id === taskId);
      if (!task) {
        return { success: false, reason: "task_not_found" };
      }
      if (task.status === "completed" || task.status === "cancelled") {
        return { success: false, reason: "already_resolved", task };
      }
      if (task.owner && task.owner !== claimantAgentId) {
        return { success: false, reason: "already_claimed", task };
      }
      if (task.status === "in_progress") {
        return { success: false, reason: "already_running", task };
      }

      const unresolvedIds = new Set(allTasks.filter((t) => t.status !== "completed").map((t) => t.id));
      const blockedByTasks = task.blockedBy.filter((id) => unresolvedIds.has(id));
      if (blockedByTasks.length > 0) {
        return { success: false, reason: "blocked", task, blockedByTasks };
      }

      const agentOpenTasks = allTasks.filter(
        (t) => t.status === "in_progress" && t.owner === claimantAgentId && t.id !== taskId
      );
      if (agentOpenTasks.length > 0) {
        return { success: false, reason: "agent_busy", task, busyWithTasks: agentOpenTasks.map((t) => t.id) };
      }

      const updated = await this.updateTask(taskId, {
        owner: claimantAgentId,
        status: "in_progress",
        attemptCount: (task.attemptCount ?? 0) + 1,
        lastError: undefined
      });
      return { success: true, task: updated! };
    } catch {
      return { success: false, reason: "task_not_found" };
    } finally {
      await release?.();
    }
  }

  /**
   * 删除任务，并从其他任务的 blocks/blockedBy 中清除引用。
   * 删除前更新高水位，防止 ID 复用。
   */
  async deleteTask(taskId: string): Promise<boolean> {
    const taskPath = getTaskPath(this.storageRoot, this.taskListId, taskId);
    try {
      const numericId = parseInt(taskId, 10);
      if (!isNaN(numericId)) {
        const currentMark = await readHighWaterMark(this.storageRoot, this.taskListId);
        if (numericId > currentMark) {
          await writeHighWaterMark(this.storageRoot, this.taskListId, numericId);
        }
      }

      try {
        await unlink(taskPath);
      } catch (e) {
        if (getErrnoCode(e) === "ENOENT") {
          return false;
        }
        throw e;
      }

      // 清理其他任务中对该 ID 的依赖引用
      const allTasks = await this.listTasks();
      await Promise.all(
        allTasks
          .filter((t) => t.blocks.includes(taskId) || t.blockedBy.includes(taskId))
          .map((t) =>
            this.updateTask(t.id, {
              blocks: t.blocks.filter((id) => id !== taskId),
              blockedBy: t.blockedBy.filter((id) => id !== taskId)
            })
          )
      );

      this.notifyTasksUpdated();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 清空任务列表。保留高水位以防 ID 复用。
   * 使用列表级锁保证原子性。
   */
  async resetTaskList(): Promise<void> {
    const dir = getTasksDir(this.storageRoot, this.taskListId);
    const lockPath = await ensureTaskListLockFile(this.storageRoot, this.taskListId);
    let release: (() => Promise<void>) | undefined;
    try {
      release = await lockfile.lock(lockPath, LOCK_OPTIONS);

      const currentHighest = await findHighestTaskIdFromFiles(this.storageRoot, this.taskListId);
      if (currentHighest > 0) {
        const existingMark = await readHighWaterMark(this.storageRoot, this.taskListId);
        if (currentHighest > existingMark) {
          await writeHighWaterMark(this.storageRoot, this.taskListId, currentHighest);
        }
      }

      let files: string[];
      try {
        files = await readdir(dir);
      } catch {
        files = [];
      }

      await Promise.all(
        files.filter((f) => f.endsWith(".json") && !f.startsWith(".")).map((f) => unlink(`${dir}/${f}`).catch(() => {}))
      );

      this.notifyTasksUpdated();
    } finally {
      await release?.();
    }
  }

  // ─── 私有工具 ─────────────────────────────────────────────────────────────

  /** 返回尚未完成的 blockedBy 任务 ID 列表 */
  private async getUnresolvedBlockers(task: Task): Promise<string[]> {
    if (task.blockedBy.length === 0) {
      return [];
    }
    const allTasks = await this.listTasks();
    const unresolvedIds = new Set(allTasks.filter((t) => t.status !== "completed").map((t) => t.id));
    return task.blockedBy.filter((id) => unresolvedIds.has(id));
  }
}
