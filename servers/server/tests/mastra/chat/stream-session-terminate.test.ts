import type { ChunkType } from "@mastra/core/stream";
import { beforeEach, describe, expect, it, vi } from "vitest";

// 与 session-registry.test.ts 同样的挡板：建会话本身不做 IO，但模块图会拉进整个 mastra
// 实例和 git 操作。这里只测「拒绝 → 掐流」这一段控制流。
vi.mock("@/mastra/services/chat/bi-chat-turn-stream", () => ({
  createBIChatTurnStream: vi.fn(),
  renameBackgroundChunk: vi.fn()
}));
vi.mock("@/mastra/services/version-history", () => ({
  commitScreenSnapshot: vi.fn().mockResolvedValue(undefined)
}));

import { createBIChatTurnStream } from "@/mastra/services/chat/bi-chat-turn-stream";
import { SessionRegistry } from "@/mastra/services/chat/session-registry";

const REJECTED_CALL = "call-rejected";

/** 造一条把给定帧依次吐出的上游流，模拟 turnStream。 */
const streamOf = (chunks: unknown[]): ReadableStream<ChunkType> =>
  new ReadableStream<ChunkType>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk as ChunkType);
      }
      controller.close();
    }
  });

/** 把会话 readable 抽干，拿到真正推给前端的帧。 */
const drain = async (stream: ReadableStream<ChunkType>): Promise<ChunkType[]> => {
  const out: ChunkType[] = [];
  for await (const chunk of stream as unknown as AsyncIterable<ChunkType>) {
    out.push(chunk);
  }
  return out;
};

let registry: SessionRegistry;
/** 会话建流时传进工厂的 abortController——用它断言上游有没有被掐掉。 */
let capturedAbort: AbortController | undefined;

beforeEach(() => {
  registry = new SessionRegistry();
  capturedAbort = undefined;
  vi.mocked(createBIChatTurnStream).mockReset();
});

const mockTurnStream = (chunks: unknown[]) => {
  vi.mocked(createBIChatTurnStream).mockImplementation(async (_args, deps) => {
    capturedAbort = deps.abortController;
    return streamOf(chunks);
  });
};

describe("BIChatStreamSession 的拒绝终止", () => {
  it("被拒工具的结果帧要先推给前端，之后的帧一律不再推", async () => {
    mockTurnStream([
      { type: "text-delta", text: "我来创建组件" },
      { type: "tool-output-available", toolCallId: REJECTED_CALL, output: { approved: false } },
      { type: "text-delta", text: "那我换个方式再试一次" }
    ]);
    const session = registry.getOrCreate("thread-1", "resource-1");
    const collected = drain(session.getStream());

    await session.runTurn({ terminateAfterToolCallId: REJECTED_CALL });
    const chunks = await collected;

    // 回执必须到达：否则前端看不到"这一步被拒了"
    expect(chunks).toContainEqual(
      expect.objectContaining({ type: "tool-output-available", toolCallId: REJECTED_CALL })
    );
    // 拒绝之后模型的"换个方式再试"绝不能流出去——那正是本功能要禁止的
    expect(chunks.map((c) => (c as { text?: string }).text)).not.toContain("那我换个方式再试一次");
  });

  it("终止时必须掐掉上游，不能只关 readable", async () => {
    mockTurnStream([{ type: "tool-output-available", toolCallId: REJECTED_CALL, output: { approved: false } }]);
    const session = registry.getOrCreate("thread-2", "resource-2");
    void drain(session.getStream());

    await session.runTurn({ terminateAfterToolCallId: REJECTED_CALL });

    // 只 close() 的话 agent 那条 untilIdle 流还在跑，模型会接着换路线重试
    expect(capturedAbort?.signal.aborted).toBe(true);
  });

  it("终止后会话应从注册表摘除，不再被后续 resume 命中", async () => {
    mockTurnStream([{ type: "tool-output-available", toolCallId: REJECTED_CALL, output: { approved: false } }]);
    const session = registry.getOrCreate("thread-3", "resource-3");
    void drain(session.getStream());

    await session.runTurn({ terminateAfterToolCallId: REJECTED_CALL });

    expect(registry.find("thread-3")).toBeUndefined();
  });

  it("toolCallId 对不上时不得终止——同一轮里别的工具照常跑完", async () => {
    mockTurnStream([
      { type: "tool-output-available", toolCallId: "call-other", output: { approved: true } },
      { type: "text-delta", text: "继续下一步" }
    ]);
    const session = registry.getOrCreate("thread-4", "resource-4");
    const collected = drain(session.getStream());

    await session.runTurn({ terminateAfterToolCallId: REJECTED_CALL });
    const chunks = await collected;

    expect(chunks.map((c) => (c as { text?: string }).text)).toContain("继续下一步");
    expect(capturedAbort?.signal.aborted).toBe(false);
  });

  it("没传 terminateAfterToolCallId 的普通轮不受影响", async () => {
    mockTurnStream([
      { type: "tool-output-available", toolCallId: REJECTED_CALL, output: { approved: false } },
      { type: "text-delta", text: "正常收尾" }
    ]);
    const session = registry.getOrCreate("thread-5", "resource-5");
    const collected = drain(session.getStream());

    await session.runTurn({});
    const chunks = await collected;

    expect(chunks.map((c) => (c as { text?: string }).text)).toContain("正常收尾");
  });
});
