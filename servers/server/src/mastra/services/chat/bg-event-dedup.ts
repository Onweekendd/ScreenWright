/**
 * 后台任务事件去重：在「订阅重叠窗口」内丢掉同一事件的第二份副本。
 *
 * 双发的成因：后台任务 suspend 后，streamUntilIdle 建立的订阅 #1 还活着（续接 LLM turn 要 2-5s），
 * 而 attachTaskStream 此时已建起订阅 #2 —— 同一条 pubsub 事件被两条订阅各投递一次。
 *
 * 只在重叠窗口内去重是硬性要求，不是优化：普通单订阅流式期间根本不存在双发，
 * 此时若仍去重，会把同任务连续到达的 text-delta / reasoning-delta（无内层 toolCallId、
 * key 相同）在窗口内误判为重复丢弃 → 前端文本残缺。这是踩过的事故，别把 hasActiveAttach 去掉。
 */

/**
 * 去重时间窗口。同进程 pubsub 的两份副本在微秒级先后到达（实测 < 2ms），
 * 而不同 step 的同类事件通常间隔 > 100ms，20ms 既能吃掉副本又不会误杀合法事件。
 */
export const BG_EVENT_DEDUP_WINDOW_MS = 20;

/** 去重只关心 chunk 的这两个字段；真实 chunk 是 mastra 的 ChunkType，字段远多于此。 */
export interface BgEventChunk {
  type?: string;
  data?: Record<string, unknown>;
}

const BG_EVENT_PREFIX = "data-background-task-";
const BG_OUTPUT_TYPE = "data-background-task-output";

/**
 * 算出这条 chunk 的去重键；返回 null 表示「不参与去重，直接放行」。
 *
 * @param hasActiveAttach 当前是否存在 attachTaskStream 建立的旁路订阅（= 是否处于重叠窗口）
 */
export function bgEventDedupKey(chunk: BgEventChunk, hasActiveAttach: boolean): string | null {
  const type = chunk.type;
  if (typeof type !== "string" || !type.startsWith(BG_EVENT_PREFIX)) {
    return null; // 非后台任务事件，与双发无关
  }

  const data = chunk.data ?? {};

  if (type === BG_OUTPUT_TYPE) {
    if (!hasActiveAttach) {
      return null; // 不在重叠窗口内：放行，否则会误杀连续 delta
    }
    // 双发的两份逐字节相同，key 必须带上增量内容，
    // 才能区分「同任务的不同 delta」与「同一 delta 的第二份副本」。
    const output = (data.output as Record<string, unknown>) ?? {};
    const outerToolCallId = (data.toolCallId as string) ?? "";
    const outputType = (output.type as string) ?? "";
    const innerToolCallId = (output.toolCallId as string) ?? "";
    const content = (output.delta as string) ?? (output.text as string) ?? "";
    return `${type}:${outerToolCallId}:${outputType}:${innerToolCallId}:${content}`;
  }

  // 其他 task 级事件：type + taskId + 时间戳字段（区分同一任务的不同 retry / run）
  const timeField = (data.completedAt ?? data.suspendedAt ?? data.startedAt ?? "") as string;
  return `${type}:${(data.taskId as string) ?? ""}:${timeField}`;
}

/**
 * 一条会话流的去重台账。按 key 记住上次放行时刻，窗口内的重复副本不再放行。
 *
 * 生命周期跟随会话：会话结束即整体丢弃，无需单独清理。
 */
export class BgEventDedup {
  private readonly lastAdmittedAt = new Map<string, number>();

  /**
   * 尝试为这条 chunk 占用发送名额（有副作用：占到则记下时刻）。
   *
   * @returns true = 放行，false = 窗口内已发过同样的，丢弃
   */
  tryAdmit(chunk: BgEventChunk, hasActiveAttach: boolean, now: number = Date.now()): boolean {
    const key = bgEventDedupKey(chunk, hasActiveAttach);
    if (key === null) {
      return true;
    }

    const lastAdmitted = this.lastAdmittedAt.get(key);
    if (lastAdmitted !== undefined && now - lastAdmitted < BG_EVENT_DEDUP_WINDOW_MS) {
      return false;
    }

    this.lastAdmittedAt.set(key, now);
    return true;
  }
}
