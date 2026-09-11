import { describe, expect, it } from "vitest";

import { BG_EVENT_DEDUP_WINDOW_MS, BgEventDedup, bgEventDedupKey } from "@/mastra/services/chat/bg-event-dedup";

/** 后台任务 output 事件：外层带 toolCallId，内层 output 带真正的增量内容 */
function outputChunk(delta: string, innerToolCallId = "inner-1") {
  return {
    type: "data-background-task-output",
    data: {
      taskId: "task-1",
      toolCallId: "outer-1",
      output: { type: "text-delta", toolCallId: innerToolCallId, delta }
    }
  };
}

describe("bgEventDedupKey", () => {
  it("非后台任务事件不参与去重", () => {
    expect(bgEventDedupKey({ type: "text-delta", data: { delta: "你好" } }, true)).toBeNull();
    expect(bgEventDedupKey({ data: { delta: "你好" } }, true)).toBeNull();
  });

  it("无 attach 旁路订阅时，output 事件一律放行（不在双发重叠窗口内）", () => {
    expect(bgEventDedupKey(outputChunk("甲"), false)).toBeNull();
  });

  it("output 的键必须带上增量内容，才能区分不同 delta 与同一 delta 的副本", () => {
    const first = bgEventDedupKey(outputChunk("甲"), true);
    const second = bgEventDedupKey(outputChunk("乙"), true);
    const copyOfFirst = bgEventDedupKey(outputChunk("甲"), true);

    expect(first).not.toBe(second);
    expect(first).toBe(copyOfFirst);
  });

  it("task 级事件按 taskId + 时间戳字段区分不同 retry/run", () => {
    const runA = {
      type: "data-background-task-completed",
      data: { taskId: "task-1", completedAt: "2026-08-20T00:00:00Z" }
    };
    const runB = {
      type: "data-background-task-completed",
      data: { taskId: "task-1", completedAt: "2026-08-20T00:05:00Z" }
    };

    expect(bgEventDedupKey(runA, true)).not.toBe(bgEventDedupKey(runB, true));
  });

  it("task 级事件即使没有 attach 订阅也参与去重", () => {
    expect(
      bgEventDedupKey({ type: "data-background-task-suspended", data: { taskId: "task-1" } }, false)
    ).not.toBeNull();
  });
});

describe("BgEventDedup.tryAdmit", () => {
  it("重叠窗口内的第二份逐字节相同副本应被丢弃", () => {
    const dedup = new BgEventDedup();

    expect(dedup.tryAdmit(outputChunk("甲"), true, 1_000)).toBe(true);
    expect(dedup.tryAdmit(outputChunk("甲"), true, 1_001)).toBe(false);
  });

  it("同任务连续到达的不同 delta 必须全部放行（误杀会导致前端文本残缺）", () => {
    const dedup = new BgEventDedup();

    expect(dedup.tryAdmit(outputChunk("今"), true, 1_000)).toBe(true);
    expect(dedup.tryAdmit(outputChunk("天"), true, 1_001)).toBe(true);
    expect(dedup.tryAdmit(outputChunk("天"), true, 1_002)).toBe(false); // 这一条才是副本
  });

  it("无 attach 订阅时，重复内容的 delta 也要放行（普通流式不存在双发）", () => {
    const dedup = new BgEventDedup();

    expect(dedup.tryAdmit(outputChunk("。"), false, 1_000)).toBe(true);
    expect(dedup.tryAdmit(outputChunk("。"), false, 1_001)).toBe(true);
  });

  it("超出窗口后同样的键应重新放行", () => {
    const dedup = new BgEventDedup();

    expect(dedup.tryAdmit(outputChunk("甲"), true, 1_000)).toBe(true);
    expect(dedup.tryAdmit(outputChunk("甲"), true, 1_000 + BG_EVENT_DEDUP_WINDOW_MS - 1)).toBe(false);
    expect(dedup.tryAdmit(outputChunk("甲"), true, 1_000 + BG_EVENT_DEDUP_WINDOW_MS)).toBe(true);
  });

  it("不同内层 toolCallId 的同内容 delta 属于不同事件，都要放行", () => {
    const dedup = new BgEventDedup();

    expect(dedup.tryAdmit(outputChunk("好", "inner-1"), true, 1_000)).toBe(true);
    expect(dedup.tryAdmit(outputChunk("好", "inner-2"), true, 1_000)).toBe(true);
  });
});
