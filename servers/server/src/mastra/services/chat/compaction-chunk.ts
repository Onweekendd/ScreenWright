/**
 * 上下文压缩 → 前端：摘要消息转成 UIMessage，自动压缩事件转成 data-compaction 帧
 */

import { convertMessages, type MastraDBMessage } from "@mastra/core/agent";
import type { UIMessage } from "ai";

import type { CompactionEvent } from "../../lib/compaction/history/compactionEvents";

/** 和 thread-messages 接口回读的消息同一形态；metadata.kind = compaction_summary 随之带给前端 */
export const toSummaryUIMessage = (summary: MastraDBMessage): UIMessage => convertMessages([summary]).to("AIV5.UI")[0];

export interface CompactionChunkData {
  status: CompactionEvent["status"];
  summary?: UIMessage;
  keptFromMessageId?: string;
}

export const toCompactionChunk = (event: CompactionEvent): { type: "data-compaction"; data: CompactionChunkData } => ({
  type: "data-compaction",
  data:
    event.status === "completed"
      ? { status: event.status, summary: toSummaryUIMessage(event.summary), keptFromMessageId: event.keptFromMessageId }
      : { status: event.status }
});
