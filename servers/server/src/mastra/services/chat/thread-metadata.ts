/**
 * thread metadata 的读改写
 */

import { memory } from "../../storage/storage";
import type { CustomStorageThreadType } from "../../types/bi-chat";

type ThreadMetadata = CustomStorageThreadType["metadata"];

/**
 * 以「最新 thread」为基底，只覆盖 buildPatch 返回的那几个 metadata 键。
 *
 * 为什么必须重新拉一次、不能用调用方手上的旧快照：标题生成(generate-title)与对话流并发，
 * 会先把 title 写成生成结果；若拿流开始时的快照整体写回，会把 title 覆盖回旧的"新对话"。
 * metadata 同理 —— 逐键 merge 而非整体替换，避免踩掉 mode / subAgentSnapshots 等并发写入的字段。
 *
 * buildPatch 收到当前 metadata，便于「基于已有值再合并」的场景（如子 agent 快照累积）。
 * thread 不存在时静默跳过；写失败会原样抛出，由调用方决定要不要吞。
 */
export async function patchThreadMetadata(
  threadId: string,
  buildPatch: (current: ThreadMetadata | undefined) => Partial<ThreadMetadata>
): Promise<void> {
  const latest = (await memory.getThreadById({ threadId })) as CustomStorageThreadType | null;
  if (!latest) {
    return;
  }
  await memory.updateThread({
    // updateThread 要求 id + title 齐全，从最新快照原样带上
    ...(latest as { id: string; title: string }),
    metadata: { ...latest.metadata, ...buildPatch(latest.metadata) }
  });
}
