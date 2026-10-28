import type { BackgroundTaskStatus } from "@mastra/core/background-tasks";

import { patchThreadMetadata } from "../services/chat/thread-metadata";
import { memory, storage } from "../storage/storage";
import type { CustomStorageThreadType } from "../types/bi-chat";

/**
 * 后台任务「结果有没有告诉过主 agent」的台账，存在 thread metadata 的 bgTaskNotices 上。
 *
 * Mastra 只在任务结束那一刻发一次进程内事件，由 streamUntilIdle 的监听循环接住后开续接轮；
 * 事件不落库，重新订阅只补发 running 的任务。监听循环不在的空档里结束的任务——前台挂起关掉了循环
 * （见 patches/@mastra__core.patch）、两次循环交接之间、服务重启——主 agent 就永远收不到通知。
 * 结果虽然写回了 memory，却可能被压缩摘要盖住，摘要里还写着「在后台生成中」。
 *
 * 所以不再只靠事件：任务表是唯一可靠的来源，每一步拿它和台账对一次账，没告知过的补报给模型。
 */

/** 任务的终态：走到这里就不会再变，结果（或失败原因）可以告诉模型了 */
const FINISHED_STATUSES: BackgroundTaskStatus[] = ["completed", "failed", "cancelled", "timed_out"];

export interface FinishedBackgroundTask {
  toolCallId: string;
  toolName: string;
  status: BackgroundTaskStatus;
  result?: unknown;
  error?: { message?: string } | string | null;
}

export interface BackgroundTaskNoticeLedger {
  /** 本 thread 已经结束、但还没告诉过主 agent 的后台任务，按派发先后排 */
  listUnnotified(threadId: string): Promise<FinishedBackgroundTask[]>;
  /** 记下这些任务已经告诉过主 agent */
  markNotified(threadId: string, toolCallIds: string[]): Promise<void>;
}

export const threadNoticeLedger: BackgroundTaskNoticeLedger = {
  async listUnnotified(threadId) {
    const thread = (await memory.getThreadById({ threadId })) as CustomStorageThreadType | null;
    if (!thread) {
      return [];
    }
    const notices = thread.metadata?.bgTaskNotices;
    if (!notices) {
      // 第一次见到这个 thread 才建台账：新会话此时还没派发过任务；老会话之前的任务一律不补报
      await patchThreadMetadata(threadId, (current) =>
        current?.bgTaskNotices ? {} : { bgTaskNotices: { since: Date.now(), notified: [] } }
      );
      return [];
    }
    const store = await storage.getStore("backgroundTasks");
    if (!store) {
      return [];
    }
    const { tasks } = await store.listTasks({
      threadId,
      status: FINISHED_STATUSES,
      fromDate: new Date(notices.since),
      orderBy: "createdAt",
      orderDirection: "asc"
    });
    const notified = new Set(notices.notified);
    return tasks
      .filter((task) => !notified.has(task.toolCallId))
      .map(({ toolCallId, toolName, status, result, error }) => ({ toolCallId, toolName, status, result, error }));
  },

  async markNotified(threadId, toolCallIds) {
    if (toolCallIds.length === 0) {
      return;
    }
    await patchThreadMetadata(threadId, (current) => {
      const notices = current?.bgTaskNotices ?? { since: Date.now(), notified: [] };
      return { bgTaskNotices: { ...notices, notified: [...new Set([...notices.notified, ...toolCallIds])] } };
    });
  }
};
