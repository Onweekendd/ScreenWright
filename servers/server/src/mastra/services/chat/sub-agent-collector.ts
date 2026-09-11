/**
 * 流式期间累积子 agent 每步的 { text, reasoning }，轮末落 thread metadata。
 *
 * 为什么要累积：Mastra 默认只持久化子 agent 的最终 text + tool results，缺每步推理文本，
 * 历史重载时那些步骤会是空的。这里在流里顺手收着，结束时补写回去。
 */

import type { SubAgentSnapshotMap, SubAgentStepInfo } from "../../types/bi-chat";
import { extractAgentTextMap, normalizeSubAgentSnapshots } from "./sub-agent-snapshots";
import { patchThreadMetadata } from "./thread-metadata";

export class SubAgentSnapshotCollector {
  /** key 是子 agent 内部 toolCallId（全局唯一），故直接扁平累积 */
  private readonly steps = new Map<string, SubAgentStepInfo>();

  /**
   * 吃一帧 data-tool-agent 的 data，把其中每步的文本并进来。
   *
   * 每帧的 steps[] 不保证全量，用 Map 累积才不会被后续帧的短数组覆盖掉早先的步骤。
   */
  collect(chunkData: unknown): void {
    for (const [innerToolCallId, info] of Object.entries(extractAgentTextMap(chunkData))) {
      this.steps.set(innerToolCallId, info);
    }
  }

  /**
   * 落 thread metadata。与磁盘已有快照合并（新值优先），空则直接跳过。
   * 失败只记日志不抛：快照是锦上添花，不该因为它让整条流以 error 收场。
   */
  async persist(threadId: string): Promise<void> {
    if (this.steps.size === 0) {
      return;
    }
    try {
      await patchThreadMetadata(threadId, (current) => {
        const merged: SubAgentSnapshotMap = {
          ...normalizeSubAgentSnapshots(current?.subAgentSnapshots),
          ...Object.fromEntries(this.steps)
        };
        return { subAgentSnapshots: merged };
      });
    } catch (err) {
      console.error("[bi-chat] persist subAgentSnapshots failed:", err);
    }
  }
}
