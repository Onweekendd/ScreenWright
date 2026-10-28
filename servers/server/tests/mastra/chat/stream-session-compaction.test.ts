import type { MastraDBMessage } from "@mastra/core/agent";
import type { ChunkType } from "@mastra/core/stream";
import { beforeEach, describe, expect, it, vi } from "vitest";

// 与 stream-session-terminate.test.ts 同样的挡板：只测会话怎么把压缩事件推给前端
vi.mock("@/mastra/services/chat/bi-chat-turn-stream", () => ({
  createBIChatTurnStream: vi.fn(),
  renameBackgroundChunk: vi.fn()
}));
vi.mock("@/mastra/services/version/version-history", () => ({
  commitScreenSnapshot: vi.fn().mockResolvedValue(undefined)
}));
// 包一层退订，好断言会话收尾时确实摘掉了监听（关闭后 push 本来就是空操作，看输出验证不了）
const offSpy = vi.hoisted(() => vi.fn());
vi.mock("@/mastra/lib/compaction/history/compactionEvents", async (importOriginal) => {
  const actual = await importOriginal<typeof CompactionEvents>();
  return {
    ...actual,
    onCompactionEvent: (...args: Parameters<typeof actual.onCompactionEvent>) => {
      const off = actual.onCompactionEvent(...args);
      return () => {
        offSpy(args[0]);
        off();
      };
    }
  };
});

import type * as CompactionEvents from "@/mastra/lib/compaction/history/compactionEvents";
import { emitCompactionEvent } from "@/mastra/lib/compaction/history/compactionEvents";
import { createBIChatTurnStream } from "@/mastra/services/chat/bi-chat-turn-stream";
import { toCompactionChunk } from "@/mastra/services/chat/compaction-chunk";
import { SessionRegistry } from "@/mastra/services/chat/session-registry";

const summary: MastraDBMessage = {
  id: "summary-1",
  role: "assistant",
  threadId: "thread-c",
  createdAt: new Date(Date.UTC(2026, 9, 1)),
  content: {
    format: 2,
    parts: [{ type: "text", text: "<!-- compaction-summary-v1 -->\n摘要" }],
    metadata: { kind: "compaction_summary" }
  }
};

const drain = async (stream: ReadableStream<ChunkType>): Promise<unknown[]> => {
  const out: unknown[] = [];
  for await (const chunk of stream as unknown as AsyncIterable<ChunkType>) {
    out.push(chunk);
  }
  return out;
};

let registry: SessionRegistry;

beforeEach(() => {
  registry = new SessionRegistry();
  vi.mocked(createBIChatTurnStream).mockReset();
});

describe("toCompactionChunk", () => {
  it("完成事件带上转成 UIMessage 的摘要，metadata.kind 原样保留给前端识别", () => {
    const chunk = toCompactionChunk({ status: "completed", summary, keptFromMessageId: "u-current" });

    expect(chunk.type).toBe("data-compaction");
    expect(chunk.data).toMatchObject({
      status: "completed",
      keptFromMessageId: "u-current",
      summary: { id: "summary-1", role: "assistant", metadata: { kind: "compaction_summary" } }
    });
    expect(chunk.data.summary?.parts).toEqual([{ type: "text", text: "<!-- compaction-summary-v1 -->\n摘要" }]);
  });

  it("开始、失败只带状态", () => {
    expect(toCompactionChunk({ status: "started" })).toEqual({ type: "data-compaction", data: { status: "started" } });
    expect(toCompactionChunk({ status: "failed" })).toEqual({ type: "data-compaction", data: { status: "failed" } });
  });
});

describe("BIChatStreamSession 推送自动压缩进度", () => {
  it("压缩发生在起流期间（输入处理器里），开始和完成帧按顺序排在本轮输出之前", async () => {
    vi.mocked(createBIChatTurnStream).mockImplementation(async () => {
      emitCompactionEvent("thread-c", { status: "started" });
      emitCompactionEvent("thread-c", { status: "completed", summary, keptFromMessageId: "u-current" });
      return new ReadableStream<ChunkType>({
        start(controller) {
          controller.enqueue({ type: "text-delta", delta: "好的" } as unknown as ChunkType);
          controller.close();
        }
      });
    });
    const session = registry.getOrCreate("thread-c", "resource");
    const collected = drain(session.getStream());

    await session.runTurn({ messages: [] });

    const chunks = (await collected) as { type: string; data?: { status?: string } }[];
    expect(chunks.map((chunk) => chunk.data?.status ?? chunk.type)).toEqual([
      "started",
      "completed",
      "text-delta",
      "data-version-committed"
    ]);
  });

  it("别的 thread 的压缩不会推到这条会话", async () => {
    vi.mocked(createBIChatTurnStream).mockImplementation(async () => {
      emitCompactionEvent("thread-other", { status: "started" });
      return new ReadableStream<ChunkType>({ start: (controller) => controller.close() });
    });
    const session = registry.getOrCreate("thread-c", "resource");
    const collected = drain(session.getStream());

    await session.runTurn({ messages: [] });

    expect((await collected).some((chunk) => (chunk as { type: string }).type === "data-compaction")).toBe(false);
  });

  it("正常收尾时退订", async () => {
    vi.mocked(createBIChatTurnStream).mockResolvedValue(
      new ReadableStream<ChunkType>({ start: (controller) => controller.close() })
    );
    const session = registry.getOrCreate("thread-closed", "resource");
    void drain(session.getStream());

    await session.runTurn({ messages: [] });

    expect(offSpy).toHaveBeenCalledWith("thread-closed");
  });

  it("出错收尾时也退订", async () => {
    vi.mocked(createBIChatTurnStream).mockRejectedValue(new Error("模型请求失败"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const session = registry.getOrCreate("thread-failed", "resource");
    void drain(session.getStream()).catch(() => {});

    await session.runTurn({ messages: [] });

    expect(offSpy).toHaveBeenCalledWith("thread-failed");
    log.mockRestore();
  });
});
