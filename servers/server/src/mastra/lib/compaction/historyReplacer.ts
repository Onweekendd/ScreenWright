import type { MastraDBMessage } from "@mastra/core/agent";
import type { Memory } from "@mastra/memory";
import { randomUUID } from "crypto";

import { loadPrompt } from "@/agent-resources/prompts";

import { prismaClient } from "../../storage/prisma";
import type { CompactionResult } from "./compact";
import { SUMMARY_MESSAGE_MARKER } from "./compact";

/**
 * applyCompaction 的入参。
 */
interface ApplyParams {
  /** Mastra Memory 实例，用于持久化 summary 消息。 */
  memory: Memory;
  /** 当前会话线程 ID。 */
  threadId: string;
  /** 资源(用户/智能体)ID，可选。 */
  resourceId?: string;
  /** 压缩前的完整原始消息列表。 */
  originalMessages: MastraDBMessage[];
  /** 压缩计算结果，包含摘要文本与待隐藏的消息 ID。 */
  result: CompactionResult;
}

/**
 * 构造一条用于替代历史消息的「压缩摘要」消息。
 *
 * 消息正文由三部分拼接而成：摘要标记({@link SUMMARY_MESSAGE_MARKER})、
 * 摘要前缀提示词以及实际的摘要文本，并通过 metadata.kind 标记为
 * `compaction_summary` 以便后续识别。
 *
 * @param threadId - 该摘要所属的会话线程 ID。
 * @param resourceId - 资源(用户/智能体)ID，可选。
 * @param summaryText - 压缩生成的摘要文本。
 * @returns 一条可直接保存到 Memory 的 assistant 角色消息。
 */
const buildSummaryMessage = (
  threadId: string,
  resourceId: string | undefined,
  summaryText: string
): MastraDBMessage => {
  const prefix = loadPrompt("mastra/compact/summaryPrefix.md");
  const body = `${SUMMARY_MESSAGE_MARKER}\n${prefix}\n\n${summaryText}`;

  return {
    id: randomUUID(),
    role: "assistant",
    createdAt: new Date(),
    threadId,
    resourceId,
    content: {
      format: 2,
      parts: [{ type: "text", text: body }],
      metadata: { kind: "compaction_summary" }
    }
  };
};

/**
 * 应用一次历史压缩：保存摘要消息、记录压缩日志，并返回压缩后的消息视图。
 *
 * 执行流程：
 * 1. 根据 result 构造并持久化一条摘要消息;
 * 2. 在 compactionRecord 表中写入本次压缩记录(被隐藏的消息 ID、摘要消息 ID、
 *    压缩前后消息数量);
 * 3. 过滤掉被软删除(隐藏)的原始消息，把剩余的活动消息与新增的摘要消息拼接返回。
 *
 * 注意：被隐藏的消息仅为软删除，不会从存储中物理移除，仅在 LLM 视图中被摘要替代。
 *
 * @param params - 压缩入参，详见 {@link ApplyParams}。
 * @returns 压缩后的消息列表(保留的活动消息 + 末尾追加的摘要消息)。
 */
export const applyCompaction = async ({
  memory,
  threadId,
  resourceId,
  originalMessages,
  result
}: ApplyParams): Promise<MastraDBMessage[]> => {
  const summaryMessage = buildSummaryMessage(threadId, resourceId, result.summaryText);

  await memory.saveMessages({ messages: [summaryMessage] });

  const messageCountBefore = originalMessages.length;
  // hiddenIds 是被软删的,剩下的活动消息 + 新增的 summary 一条
  const messageCountAfter = originalMessages.length - result.hiddenIds.length + 1;

  await prismaClient.compactionRecord.create({
    data: {
      threadId,
      compactedMessageIds: result.hiddenIds,
      summaryMessageId: summaryMessage.id,
      messageCountBefore,
      messageCountAfter
    }
  });

  // 压缩后把绑定在 thread 上的 lastUsage 清零。
  // - 自动压缩(processor)路径下,本轮 stream 的 onStepFinish 仍会回填压缩后的真实 usage,
  //   这里提前清零让前端进度条立即归零,并避免下一轮 trigger 误用压缩前的高 token 值。
  // - 手动压缩(manualCompact)路径不经过 stream/onStepFinish,只能靠这里更新,否则前端与
  //   trigger 都会一直停留在压缩前的旧值。
  // 真实的压缩后上下文长度会在下一轮 stream 的 usage 中重新计算得到。
  // 注意:必须基于最新 metadata 做 merge,避免覆盖 mode / subAgentSnapshots 等其它字段。
  const latestThread = await memory.getThreadById({ threadId });
  if (latestThread) {
    await memory.updateThread({
      ...(latestThread as { id: string; title: string }),
      metadata: { ...latestThread.metadata, lastUsage: undefined }
    });
  }

  const hiddenSet = new Set(result.hiddenIds);
  const remaining = originalMessages.filter((m) => !hiddenSet.has(m.id));
  return [...remaining, summaryMessage];
};
