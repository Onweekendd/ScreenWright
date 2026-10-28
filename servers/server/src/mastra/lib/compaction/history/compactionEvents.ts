import { EventEmitter } from "node:events";

import type { MastraDBMessage } from "@mastra/core/agent";

/**
 * 自动压缩的进度事件，按 threadId 广播。
 *
 * 自动压缩跑在输入处理器里：那时这一轮的流还没建好，处理器也拿不到 writer，没法直接往流里写。
 * 会话层（services/chat/stream-session）按 threadId 订阅，转成 data-compaction 帧推给前端——
 * 开始时提示「正在压缩」（摘要模型要跑十几秒到几十秒），完成后把摘要插进对话。
 */
export type CompactionEvent =
  | { status: "started" }
  | {
      status: "completed";
      summary: MastraDBMessage;
      /** 压缩后保留的当前这轮从哪条消息开始；摘要排在它前面 */
      keptFromMessageId?: string;
    }
  | { status: "failed" };

const emitter = new EventEmitter();
// 每个活着的会话挂一个监听，数量随并发会话增长，不是泄漏
emitter.setMaxListeners(0);

export const emitCompactionEvent = (threadId: string, event: CompactionEvent): void => {
  emitter.emit(threadId, event);
};

/** 返回取消订阅的函数 */
export const onCompactionEvent = (threadId: string, listener: (event: CompactionEvent) => void): (() => void) => {
  emitter.on(threadId, listener);
  return () => {
    emitter.off(threadId, listener);
  };
};
