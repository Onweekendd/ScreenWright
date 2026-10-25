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
const modelReply = (tool?: string) => ({
  stream: tool
    ? simulateReadableStream({
        chunks: [
          { type: "tool-call" as const, toolCallId: `call-${tool}`, toolName: tool, input: "{}" },
          { type: "finish" as const, finishReason: { unified: "tool-calls" as const, raw: "tool_calls" }, usage }
        ]
      })
    : simulateReadableStream({
        chunks: [
          { type: "text-start" as const, id: "text" },
          { type: "text-delta" as const, id: "text", delta: "完成" },
          { type: "text-end" as const, id: "text" },
          { type: "finish" as const, finishReason: { unified: "stop" as const, raw: "stop" }, usage }
        ]
      })
});

describe("Mastra untilIdle 的前台挂起边界", () => {
  it.each(["before", "after"] as const)(
    "后台审批在前台结束 %s 到达时，保持流直到后台恢复完成",
    async (order) => {
      let releaseBackground!: () => void;
      let releaseForeground!: () => void;
      const background = new Promise<void>((resolve) => {
        releaseBackground = resolve;
      });
      const foreground = new Promise<void>((resolve) => {
        releaseForeground = resolve;
      });
      let first = true;
      const agent = new Agent({
        id: "background-approval-test",
        name: "background-approval-test",
        instructions: "x",
        model: new MockLanguageModelV3({
          doStream: async () => {
            const tool = first ? "collect" : undefined;
            first = false;
            if (!tool && order === "before") {
              await foreground;
            }
            return modelReply(tool);
          }
        }) as never,
        memory: new Memory({ options: { lastMessages: 20 } }),
        tools: {
          collect: createTool({
            id: "collect",
            description: "collect",
            inputSchema: z.object({}),
            background: { enabled: true },
            suspendSchema: z.object({ type: z.literal("approval") }),
            resumeSchema: z.object({ approved: z.boolean() }),
            execute: async (_, context) => {
              if (context?.agent?.resumeData) {
                return { url: "http://example.com/asset.jpg" };
              }
              if (order === "after") {
                await background;
              }
              return context?.agent?.suspend?.({ type: "approval" }) as never;
            }
          })
        }
      });
      const storage = new InMemoryStore();
      const mastra = new Mastra({ agents: { agent }, storage, backgroundTasks: { enabled: true } });
      const abort = new AbortController();
      const chunks: Array<{ type: string; payload?: { taskId?: string } }> = [];
      let drain: Promise<void> | undefined;
      try {
        const initial = await agent.stream("收集素材", {
          memory: { thread: "bg-approval", resource: "r" },
          untilIdle: true,
          abortSignal: abort.signal
        });
        drain = (async () => {
          for await (const chunk of initial.fullStream) {
            chunks.push(chunk as never);
          }
        })();
        if (order === "after") {
          await vi.waitFor(() => expect(chunks.some((chunk) => chunk.type === "finish")).toBe(true), { timeout: 3000 });
          releaseBackground();
        }
        await vi.waitFor(() => expect(chunks.some((chunk) => chunk.type === "background-task-suspended")).toBe(true), {
          timeout: 3000
        });
        releaseForeground();
        await vi.waitFor(() => expect(chunks.some((chunk) => chunk.type === "finish")).toBe(true), { timeout: 3000 });
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
        expect(
          await Promise.race([
            drain.then(() => "closed"),
            new Promise((resolve) => setTimeout(() => resolve("waiting"), 50))
          ])
        ).toBe("waiting");
        await mastra.backgroundTaskManager!.resume(taskId, { approved: true });
        await drain;
        expect(chunks.some((chunk) => chunk.type === "background-task-completed")).toBe(true);
      } finally {
        releaseBackground();
        releaseForeground();
        abort.abort();
        await drain?.catch(() => {});
        await mastra.shutdown();
      }
    },
    15000
  );

  it.each([1, 2])(
    "后台任务未完成时释放审批恢复队列，%s 个后台结果回填后仍保留编辑回执",
    async (count) => {
      let releaseBackground!: () => void;
      const background = new Promise<void>((resolve) => {
        releaseBackground = resolve;
      });
      const bgStarted = vi.fn();
      const resumed = vi.fn();
      const names = Array.from({ length: count }, (_, index) => `collect${index}`);
      let step = 0;
      const doStream = vi.fn(async () => modelReply([...names, "edit"][step++]));
      const model = new MockLanguageModelV3({ doStream });
      const agent = new Agent({
        id: "suspend-idle-test",
        name: "suspend-idle-test",
        instructions: "x",
        model: model as never,
        memory: new Memory({ options: { lastMessages: 20 } }),
        tools: {
          ...Object.fromEntries(
            names.map((name) => [
              name,
              createTool({
                id: name,
                description: name,
                inputSchema: z.object({}),
                background: { enabled: true },
                execute: async () => {
                  bgStarted();
                  await background;
                  return { url: `http://example.com/${name}.jpg` };
                }
              })
            ])
          ),
          edit: createTool({
            id: "edit",
            description: "edit",
            inputSchema: z.object({}),
            suspendSchema: z.object({ type: z.literal("approval") }),
            resumeSchema: z.object({ approved: z.boolean() }),
            execute: async (_, context) => {
              if (context?.agent?.resumeData) {
                resumed(context.agent.resumeData);
                return { success: true };
              }
              return context?.agent?.suspend?.({ type: "approval" }) as never;
            }
          })
        }
      });
      const mastra = new Mastra({
        agents: { agent },
        storage: new InMemoryStore(),
        backgroundTasks: { enabled: true }
      });
      const abort = new AbortController();
      const memory = { thread: "thread-suspend-idle", resource: "resource-suspend-idle" };
      const chunks: Array<{ type: string }> = [];
      let ended = false;
      let drain: Promise<void> | undefined;
      try {
        const initial = await agent.stream("收集素材并修改组件", {
          memory,
          untilIdle: true,
          abortSignal: abort.signal
        });
        drain = (async () => {
          for await (const chunk of initial.fullStream) {
            chunks.push(chunk);
          }
          ended = true;
        })();
        await vi.waitFor(() => expect(chunks.some((chunk) => chunk.type === "tool-call-suspended")).toBe(true), {
          timeout: 3000
        });
        await vi.waitFor(() => expect(ended).toBe(true), { timeout: 1500 });
        expect(bgStarted).toHaveBeenCalledTimes(count);
        expect(doStream).toHaveBeenCalledTimes(count + 1);
        const output = await agent.resumeStream(
          { approved: true },
          { runId: initial.runId, toolCallId: "call-edit", memory, untilIdle: true, abortSignal: abort.signal }
        );
        const resumedDrain = (async () => {
          for await (const _chunk of output.fullStream) {
            /* consume */
          }
        })();
        await vi.waitFor(() => expect(resumed).toHaveBeenCalledWith({ approved: true }), { timeout: 3000 });
        const recallParts = async () =>
          (
            await (await agent.getMemory())!.recall({
              threadId: memory.thread,
              resourceId: memory.resource,
              perPage: 20
            })
          ).messages.flatMap((message) => message.content.parts);
        const editReceipt = (parts: Awaited<ReturnType<typeof recallParts>>) =>
          parts.find((part) => part.type === "tool-invocation" && part.toolInvocation.toolCallId === "call-edit");
        // 回执先落库，再让后台任务结束，复现旧快照把 result 覆盖回 call 的真实顺序。
        await vi.waitFor(async () =>
          expect(editReceipt(await recallParts())).toMatchObject({
            toolInvocation: { state: "result", result: { success: true } }
          })
        );
        releaseBackground();
        await resumedDrain;
        const parts = await recallParts();
        expect(editReceipt(parts)).toMatchObject({ toolInvocation: { state: "result", result: { success: true } } });
        for (const name of names) {
          expect(
            parts.find((part) => part.type === "tool-invocation" && part.toolInvocation.toolCallId === `call-${name}`)
          ).toMatchObject({ toolInvocation: { state: "result", result: { url: `http://example.com/${name}.jpg` } } });
        }
      } finally {
        releaseBackground();
        abort.abort();
        await drain?.catch(() => {});
        await mastra.shutdown();
      }
    },
    15000
  );
});
