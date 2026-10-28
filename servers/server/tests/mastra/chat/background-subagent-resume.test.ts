import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { InMemoryStore } from "@mastra/core/storage";
import { createTool } from "@mastra/core/tools";
import { Memory } from "@mastra/memory";
import { MockLanguageModelV3, simulateReadableStream } from "ai/test";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 }
};
const callTool = (toolName: string, input: unknown = {}) => ({
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
/** 最后一条工具结果的工具名；没有就是刚开始 */
const lastToolResult = ({ prompt }: Parameters<MockLanguageModelV3["doStream"]>[0]) => {
  const last = prompt.at(-1);
  const part = last?.role === "tool" ? last.content.at(-1) : undefined;
  return part?.type === "tool-result" ? part.toolName : undefined;
};

describe("后台子 agent 挂起后恢复", () => {
  it("从挂起点原地继续：不重跑前面的步骤，线程不变", async () => {
    const claims: string[] = [];
    const resumedOn: string[] = [];
    let delegated = false;
    // 子 agent 的回复由上下文决定：从头跑就会再认领一次，原地继续则直接收尾
    const executor = new Agent({
      id: "executor",
      name: "executor",
      description: "执行任务",
      instructions: "x",
      model: new MockLanguageModelV3({
        doStream: async (options) => {
          const last = lastToolResult(options);
          return last === undefined ? callTool("claim") : last === "claim" ? callTool("write") : reply();
        }
      }) as never,
      memory: new Memory({ options: { lastMessages: 20 } }),
      tools: {
        claim: createTool({
          id: "claim",
          description: "claim",
          inputSchema: z.object({}),
          execute: async (_, context) => {
            claims.push(context?.agent?.threadId ?? "");
            return { success: true };
          }
        }),
        // 画布写工具：挂起交给前端，回执到了才算完成
        write: createTool({
          id: "write",
          description: "write",
          inputSchema: z.object({}),
          suspendSchema: z.object({ type: z.literal("canvas") }),
          resumeSchema: z.object({ status: z.string() }),
          execute: async (_, context) => {
            if (context?.agent?.resumeData) {
              resumedOn.push(context.agent.threadId ?? "");
              return { success: true };
            }
            return context?.agent?.suspend?.({ type: "canvas" }) as never;
          }
        })
      }
    });
    const supervisor = new Agent({
      id: "supervisor",
      name: "supervisor",
      instructions: "x",
      // 只委派一次：后台任务结束后的续接轮也会调模型，不能借机再派
      model: new MockLanguageModelV3({
        doStream: async () => {
          if (delegated) {
            return reply();
          }
          delegated = true;
          return callTool("agent-executor", { prompt: "做任务" });
        }
      }) as never,
      memory: new Memory({ options: { lastMessages: 20 } }),
      agents: { executor },
      backgroundTasks: { tools: { executor: { enabled: true } } }
    });
    const storage = new InMemoryStore();
    const mastra = new Mastra({ agents: { supervisor, executor }, storage, backgroundTasks: { enabled: true } });
    const abort = new AbortController();
    const chunks: Array<{ type: string; payload?: { taskId?: string } }> = [];
    let drain: Promise<void> | undefined;
    try {
      const initial = await supervisor.stream("搭大屏", {
        memory: { thread: "bg-subagent", resource: "r" },
        untilIdle: true,
        abortSignal: abort.signal
      });
      drain = (async () => {
        for await (const chunk of initial.fullStream) {
          chunks.push(chunk as never);
        }
      })();
      await vi.waitFor(() => expect(chunks.some((chunk) => chunk.type === "background-task-suspended")).toBe(true), {
        timeout: 5000
      });
      const taskId = chunks.find((chunk) => chunk.type === "background-task-suspended")!.payload!.taskId!;
      const workflows = await storage.getStore("workflows");
      await vi.waitFor(async () =>
        expect(
          (
            (await workflows!.loadWorkflowSnapshot({ workflowName: "__background-task", runId: taskId })) as {
              status?: string;
            }
          )?.status
        ).toBe("suspended")
      );

      await mastra.backgroundTaskManager!.resume(taskId, { status: "applied" });

      await vi.waitFor(() => expect(chunks.some((chunk) => chunk.type === "background-task-completed")).toBe(true), {
        timeout: 5000
      });
      // 未修复时恢复会换新线程从头跑：再认领一次，又在 write 处挂起，永远等不到回执
      expect(claims).toHaveLength(1);
      expect(resumedOn).toEqual(claims);
    } finally {
      abort.abort();
      await drain?.catch(() => {});
      await mastra.shutdown();
    }
  }, 20000);
});
