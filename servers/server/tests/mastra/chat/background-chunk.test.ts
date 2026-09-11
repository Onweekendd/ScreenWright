import type { ChunkType } from "@mastra/core/stream";
import { describe, expect, it } from "vitest";

import {
  flattenBackgroundOutput,
  renameBackgroundChunk,
  withRenamedBackgroundChunks
} from "@/mastra/services/chat/background-chunk";
import type { BackgroundTaskOutputRawPayload } from "@/mastra/types/bi-chat";

/** 子 agent 的一帧文本增量（Mastra 原生形状） */
const textDelta = (text: string, runId = "sub-run-1") => ({
  type: "text-delta",
  runId,
  from: "AGENT",
  payload: { id: "m1", text }
});

/** background-task-output 的 payload：外层任务标识 + 内层 { output, toolCallId, toolName } */
const rawOutputPayload = (sub: unknown, toolCallId = "inner-1") =>
  ({
    taskId: "task-1",
    toolName: "agent-swExecutorAgent",
    toolCallId: "outer-1",
    runId: "run-1",
    agentId: "swExecutorAgent",
    payload: { payload: { output: sub, toolCallId, toolName: "agent-swExecutorAgent" } }
  }) as unknown as BackgroundTaskOutputRawPayload;

const outputChunk = (sub: unknown) =>
  ({ type: "background-task-output", payload: rawOutputPayload(sub) }) as unknown as ChunkType;

const streamOf = (chunks: unknown[]) =>
  new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(chunk));
      controller.close();
    }
  });

const drain = async (stream: ReadableStream): Promise<{ type: string }[]> => {
  const reader = stream.getReader();
  const out: { type: string }[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return out;
    }
    out.push(value as { type: string });
  }
};

describe("renameBackgroundChunk", () => {
  it("非 background-task-* 的帧原样返回，连引用都不换", () => {
    const chunk = textDelta("你好") as unknown as ChunkType;
    expect(renameBackgroundChunk(chunk)).toBe(chunk);
  });

  it("普通 background-task-* 只改名，payload 整体搬到 data", () => {
    // toAISdkStream 只透传 data- 前缀类型，且见到 payload 会把它 spread 进根对象，故必须搬到 data
    const payload = { taskId: "task-1", toolCallId: "outer-1" };
    const chunk = { type: "background-task-suspended", payload } as unknown as ChunkType;

    const renamed = renameBackgroundChunk(chunk) as unknown as { type: string; data: unknown };

    expect(renamed.type).toBe("data-background-task-suspended");
    expect(renamed.data).toBe(payload);
  });

  it("background-task-output 拍平成前端 wire 形状", () => {
    const renamed = renameBackgroundChunk(outputChunk(textDelta("你好"))) as unknown as {
      type: string;
      data: { output: { type: string; delta: string }; toolCallId: string; toolName: string };
    };

    expect(renamed.type).toBe("data-background-task-output");
    expect(renamed.data.output).toMatchObject({ type: "text-delta", delta: "你好" });
    // toolCallId 取的是最内层（父 agent 委派的那个），前端靠它把子流挂到对应工具上
    expect(renamed.data.toolCallId).toBe("inner-1");
    expect(renamed.data.toolName).toBe("agent-swExecutorAgent");
  });

  it("output 映射不出 UIMessageChunk 时整帧丢弃，不给前端只能跳过的空帧", () => {
    // outputWriter 会转发子 agent 的任意 chunk，object / object-result 等没有 .payload
    const noInnerOutput = { type: "background-task-output", payload: { payload: {} } } as unknown as ChunkType;

    expect(renameBackgroundChunk(noInnerOutput)).toBeNull();
  });
});

describe("flattenBackgroundOutput", () => {
  it("记下子 agent 的 runId，供上层过滤它的原生 data-tool-agent（同内容会重复渲染）", () => {
    const bgSubRunIds = new Set<string>();

    flattenBackgroundOutput(rawOutputPayload(textDelta("甲", "sub-run-9")), bgSubRunIds);

    expect([...bgSubRunIds]).toEqual(["sub-run-9"]);
  });

  it("原地删掉 request / response 重字段——单帧挂着完整 messages + 整个 tools 数组可达数百 KB", () => {
    const stepStart = {
      type: "step-start",
      runId: "sub-run-1",
      from: "AGENT",
      payload: { messageId: "m1", request: { messages: ["很大"] }, response: { tools: ["很大"] }, warnings: [] }
    };

    flattenBackgroundOutput(rawOutputPayload(stepStart));

    // 删的是入参引用的同一个对象，故直接断言原对象
    expect(stepStart.payload).not.toHaveProperty("request");
    expect(stepStart.payload).not.toHaveProperty("response");
    expect(stepStart.payload.messageId).toBe("m1");
  });

  it("最内层缺失时不炸，toolCallId / toolName 退化成空串", () => {
    const result = flattenBackgroundOutput({ payload: {} } as unknown as BackgroundTaskOutputRawPayload);

    expect(result).toEqual({ output: undefined, toolCallId: "", toolName: "" });
  });
});

describe("withRenamedBackgroundChunks", () => {
  /** 模拟 mastra 的流对象：fullStream 是只读属性，且带一个读 #private 的 getter */
  class FakeAgentStream {
    #secret = "私有字段还在";
    readonly runId = "run-1";
    readonly fullStream: ReadableStream;

    constructor(chunks: unknown[]) {
      this.fullStream = streamOf(chunks);
    }

    get secret() {
      return this.#secret;
    }
  }

  it("fullStream 换成改名后的流，其余属性原样透传", async () => {
    const source = new FakeAgentStream([
      textDelta("你好"),
      { type: "background-task-completed", payload: { taskId: "task-1" } }
    ]);

    const proxied = withRenamedBackgroundChunks(source, new Set());

    expect(proxied.runId).toBe("run-1");
    expect((await drain(proxied.fullStream)).map((c) => c.type)).toEqual([
      "text-delta",
      "data-background-task-completed"
    ]);
  });

  it("被判丢弃的帧不会流到下游", async () => {
    const source = new FakeAgentStream([
      { type: "background-task-output", payload: { payload: {} } },
      textDelta("你好")
    ]);

    const proxied = withRenamedBackgroundChunks(source, new Set());

    expect((await drain(proxied.fullStream)).map((c) => c.type)).toEqual(["text-delta"]);
  });

  it("透传属性时以原对象为 this —— 读 #private 的 getter 不能被代理弄炸", () => {
    // Reflect.get 若把 Proxy 当 receiver 传下去，getter 里的 this 就是 Proxy，
    // 读 #secret 会直接 TypeError；这是包装外部对象最常见的翻车点。
    const proxied = withRenamedBackgroundChunks(new FakeAgentStream([]), new Set());

    expect(proxied.secret).toBe("私有字段还在");
  });
});
