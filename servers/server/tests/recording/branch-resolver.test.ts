import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { InMemoryStore } from "@mastra/core/storage";
import { Memory } from "@mastra/memory";
import { MockLanguageModelV3, simulateReadableStream } from "ai/test";
import { describe, expect, it } from "vitest";

import { createObservability } from "@/mastra/observability";
import { initMastraRecordingBridge } from "@/mastra/record/branch-resolver";
import { allocateStepSlot } from "@/recording/recording-scope";

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 }
};
const callTool = (toolName: string, input: unknown) => ({
  stream: simulateReadableStream({
    chunks: [
      { type: "tool-call" as const, toolCallId: `call-${toolName}`, toolName, input: JSON.stringify(input) },
      { type: "finish" as const, finishReason: { unified: "tool-calls" as const, raw: "tool_calls" }, usage }
    ]
  })
});
const reply = () => ({
  stream: simulateReadableStream({
    chunks: [
      { type: "text-start" as const, id: "text" },
      { type: "text-delta" as const, id: "text", delta: "完成" },
      { type: "text-end" as const, id: "text" },
      { type: "finish" as const, finishReason: { unified: "stop" as const, raw: "stop" }, usage }
    ]
  })
});

describe("录制的执行链归属（agent-trace 泳道的依据）", () => {
  it("主 agent 的步骤记在本 thread 下，委派出去的子 agent 记在派生的子 thread 下", async () => {
    initMastraRecordingBridge();
    const seen: Array<{ who: string; branchKey?: string }> = [];

    const executor = new Agent({
      id: "executor",
      name: "executor",
      description: "施工",
      instructions: "x",
      model: new MockLanguageModelV3({
        doStream: async () => {
          seen.push({ who: "executor", branchKey: allocateStepSlot().branchKey });
          return reply();
        }
      }) as never
    });
    let supervisorCalls = 0;
    const supervisor = new Agent({
      id: "supervisor",
      name: "supervisor",
      instructions: "x",
      model: new MockLanguageModelV3({
        doStream: async () => {
          seen.push({ who: "supervisor", branchKey: allocateStepSlot().branchKey });
          return supervisorCalls++ === 0 ? callTool("agent-executor", { prompt: "做任务" }) : reply();
        }
      }) as never,
      memory: new Memory({ options: { lastMessages: 20 } }),
      agents: { executor }
    });
    const mastra = new Mastra({
      agents: { supervisor, executor },
      storage: new InMemoryStore(),
      observability: createObservability()
    });

    try {
      const output = await supervisor.stream("搭大屏", { memory: { thread: "trace-thread", resource: "r" } });
      await output.consumeStream();
    } finally {
      await mastra.shutdown();
    }

    expect(seen.map(({ who }) => who)).toEqual(["supervisor", "executor", "supervisor"]);
    expect(seen[0].branchKey).toBe("trace-thread");
    expect(seen[1].branchKey).toMatch(/^trace-thread-.+/);
    expect(seen[2].branchKey).toBe("trace-thread");
  });
});
