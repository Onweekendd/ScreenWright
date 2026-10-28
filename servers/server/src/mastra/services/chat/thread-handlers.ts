/**
 * 线程相关请求处理：压缩、增删改查、历史消息回读
 */

import { convertMessages } from "@mastra/core/agent";
import type { UIMessage } from "ai";

import { manualCompact } from "../../lib/compaction/manualCompact";
import { memory, storage } from "../../storage/storage";
import type { CustomStorageThreadType } from "../../types/bi-chat";
import type { ThreadModelSelection } from "../../types/thread-model";
import { initThreadModels } from "../ai-model/thread-model.server";
import { restoreFilePartsFromAttachedImages } from "./attached-images";
import { toSummaryUIMessage } from "./compaction-chunk";
import { injectSubAgentDataParts, normalizeSubAgentSnapshots } from "./sub-agent-snapshots";

/**
 * 用户主动压缩当前 thread 的上下文(手动触发历史摘要)
 */
export async function handleCompactThread(threadId: string, resourceId: string) {
  const result = await manualCompact(threadId, resourceId);
  return result.compacted ? { ...result, summary: toSummaryUIMessage(result.summary) } : result;
}

/**
 * 创建对话线程
 */
export async function handleCreateThread(
  resourceId: string,
  title?: string,
  metadata?: Record<string, unknown>,
  models?: ThreadModelSelection
) {
  const thread = await memory.createThread({ resourceId, title: title ?? "新对话", metadata });
  if (models) {
    await initThreadModels(thread.id, models);
  }
  return thread;
}

/**
 * 列出资源下的所有线程
 */
export async function handleListThreads(resourceId: string) {
  const result = await memory.listThreads({
    filter: { resourceId },
    perPage: false
  });
  return result;
}

/**
 * 更新线程标题
 */
export async function handleUpdateThread(threadId: string, title: string, metadata: Record<string, unknown>) {
  const currentThread = await memory.getThreadById({ threadId });
  if (!currentThread) {
    throw new Error(`Thread not found: ${threadId}`);
  }

  const updated = await memory.updateThread({
    ...currentThread,
    title,
    metadata
  });
  return updated;
}

/**
 * 获取线程消息
 */
export async function handleListThreadMessages(
  threadId: string,
  resourceId: string,
  page = 0,
  perPage = 10
): Promise<{ messages: UIMessage[]; threadId: string; hasMore: boolean; total: number }> {
  const thread = await memory.getThreadById({ threadId });
  if (!thread) {
    throw new Error(`Thread not found: ${threadId}`);
  }

  const memoryStore = await storage.getStore("memory");
  if (!memoryStore) {
    throw new Error("Memory store not available");
  }

  const result = await memoryStore.listMessages({
    threadId,
    resourceId,
    page,
    perPage,
    orderBy: { field: "createdAt", direction: "DESC" }
  });

  // DESC 取回后逆序，让前端展示为时间正序（旧→新）
  const messages = convertMessages([...result.messages].reverse()).to("AIV5.UI");

  const snapshot = normalizeSubAgentSnapshots((thread as CustomStorageThreadType).metadata?.subAgentSnapshots);
  injectSubAgentDataParts(messages, snapshot);
  restoreFilePartsFromAttachedImages(messages);

  return {
    messages,
    threadId,
    hasMore: result.hasMore,
    total: result.total
  };
}
