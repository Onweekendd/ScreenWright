import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getThreadById: vi.fn(),
  updateThread: vi.fn(),
  getStore: vi.fn(),
  listTasks: vi.fn()
}));
vi.mock("@/mastra/storage/storage", () => ({
  storage: { getStore: mocks.getStore },
  memory: { getThreadById: mocks.getThreadById, updateThread: mocks.updateThread }
}));

import { threadNoticeLedger } from "@/mastra/processors/background-task-notices";

const thread = (metadata: Record<string, unknown>) => ({ id: "t1", title: "上海夜游", resourceId: "5", metadata });

const task = (toolCallId: string, status = "completed") => ({
  id: `task-${toolCallId}`,
  toolCallId,
  toolName: "createImageTool",
  status,
  result: { url: `http://x/${toolCallId}.png` },
  error: undefined,
  createdAt: new Date(2000)
});

/** updateThread 最后一次写进去的 metadata */
const writtenMetadata = () => mocks.updateThread.mock.lastCall?.[0].metadata;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getStore.mockResolvedValue({ listTasks: mocks.listTasks });
});

describe("threadNoticeLedger.listUnnotified", () => {
  it("第一次见到这个 thread：建台账，之前的任务一律不补报，也不查任务表", async () => {
    vi.useFakeTimers({ now: 5000 });
    mocks.getThreadById.mockResolvedValue(thread({ mode: "BUILD" }));

    expect(await threadNoticeLedger.listUnnotified("t1")).toEqual([]);

    expect(writtenMetadata()).toEqual({ mode: "BUILD", bgTaskNotices: { since: 5000, notified: [] } });
    expect(mocks.listTasks).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("thread 不存在就返回空，也不写库", async () => {
    mocks.getThreadById.mockResolvedValue(null);

    expect(await threadNoticeLedger.listUnnotified("t1")).toEqual([]);
    expect(mocks.updateThread).not.toHaveBeenCalled();
  });

  it("只查台账建立之后派发、已经结束的任务，滤掉告知过的", async () => {
    mocks.getThreadById.mockResolvedValue(thread({ bgTaskNotices: { since: 1000, notified: ["call_a"] } }));
    mocks.listTasks.mockResolvedValue({ tasks: [task("call_a"), task("call_b", "failed")], total: 2 });

    const unnotified = await threadNoticeLedger.listUnnotified("t1");

    expect(mocks.listTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        threadId: "t1",
        status: ["completed", "failed", "cancelled", "timed_out"],
        fromDate: new Date(1000)
      })
    );
    expect(unnotified).toEqual([
      {
        toolCallId: "call_b",
        toolName: "createImageTool",
        status: "failed",
        result: { url: "http://x/call_b.png" },
        error: undefined
      }
    ]);
  });

  it("没有后台任务存储域时返回空", async () => {
    mocks.getThreadById.mockResolvedValue(thread({ bgTaskNotices: { since: 1000, notified: [] } }));
    mocks.getStore.mockResolvedValue(undefined);

    expect(await threadNoticeLedger.listUnnotified("t1")).toEqual([]);
  });
});

describe("threadNoticeLedger.markNotified", () => {
  it("合并去重，since 和其它 metadata 键原样保留", async () => {
    mocks.getThreadById.mockResolvedValue(
      thread({ lastUsage: { inputTokens: 9 }, bgTaskNotices: { since: 1000, notified: ["call_a"] } })
    );

    await threadNoticeLedger.markNotified("t1", ["call_a", "call_b"]);

    expect(mocks.updateThread).toHaveBeenCalledWith(expect.objectContaining({ id: "t1", title: "上海夜游" }));
    expect(writtenMetadata()).toEqual({
      lastUsage: { inputTokens: 9 },
      bgTaskNotices: { since: 1000, notified: ["call_a", "call_b"] }
    });
  });

  it("没有要记的就不碰库", async () => {
    await threadNoticeLedger.markNotified("t1", []);

    expect(mocks.getThreadById).not.toHaveBeenCalled();
    expect(mocks.updateThread).not.toHaveBeenCalled();
  });
});
