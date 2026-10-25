import { describe, expect, it, vi } from "vitest";

import { NO_SUSPEND_RESULT, readCanvasOpResults, suspendCanvasOps } from "@/mastra/tools/canvas-ops";
import type { CanvasOp } from "@/mastra/types/suspend";

const op: CanvasOp = { op: "ungroup", groupIds: [1] };

describe("suspendCanvasOps", () => {
  const contextOf = (mode: string | undefined, suspend = vi.fn()) => ({
    requestContext: { get: (key: string) => (key === "mode" ? mode : undefined) },
    agent: { suspend }
  });

  it("自动模式：不带 approval", async () => {
    const suspend = vi.fn();

    await suspendCanvasOps(contextOf("auto_edit", suspend), { purpose: "解散", ops: [op] });

    expect(suspend).toHaveBeenCalledWith({ type: "canvas_ops", ops: [op] });
  });

  it("ASK 模式：带上 approval.purpose，整批只问一次", async () => {
    const suspend = vi.fn();

    await suspendCanvasOps(contextOf("ask_before_edit", suspend), { purpose: "解散", ops: [op, op] });

    expect(suspend).toHaveBeenCalledWith({
      type: "canvas_ops",
      approval: { purpose: "解散" },
      ops: [op, op]
    });
  });

  it("edit_files 的批次字段原样带上", async () => {
    const suspend = vi.fn();

    await suspendCanvasOps(contextOf(undefined, suspend), {
      purpose: "x",
      ops: [op],
      batch: { batchId: "b", operationId: "o" }
    });

    expect(suspend).toHaveBeenCalledWith({ type: "canvas_ops", ops: [op], batchId: "b", operationId: "o" });
  });

  it("没有 suspend 能力（非 agent 流式调用）时返回失败结果，不抛", () => {
    expect(suspendCanvasOps({ requestContext: { get: () => undefined } }, { purpose: "x", ops: [op] })).toBe(
      NO_SUSPEND_RESULT
    );
    expect(suspendCanvasOps(undefined, { purpose: "x", ops: [op] })).toBe(NO_SUSPEND_RESULT);
  });
});

describe("readCanvasOpResults", () => {
  it("没有 resumeData：首次执行", () => {
    expect(readCanvasOpResults(undefined, 1)).toEqual({ status: "pending" });
  });

  it("用户拒绝", () => {
    expect(readCanvasOpResults({ approved: false }, 1)).toEqual({ status: "rejected" });
  });

  it("按下标取回执", () => {
    const results = [{ ok: true }, { ok: false, error: "炸了" }];

    expect(readCanvasOpResults({ results }, 2)).toEqual({ status: "done", results });
  });

  it("回执数量和 ops 数不一致：协议被破坏，不能按下标取", () => {
    const reply = readCanvasOpResults({ results: [{ ok: true }] }, 2);

    expect(reply.status).toBe("invalid");
    expect(reply).toMatchObject({ message: expect.stringContaining("发出 2 个操作，收到 1 个") });
  });
});
