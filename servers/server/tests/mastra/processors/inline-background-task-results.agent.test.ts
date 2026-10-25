import { Agent } from "@mastra/core/agent";
import { MockLanguageModelV3, simulateReadableStream } from "ai/test";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/mastra/storage/storage", () => ({ storage: { getStore: vi.fn() } }));

import { InlineBackgroundTaskResults } from "@/mastra/processors/inlineBackgroundTaskResults";

const DIRECTIVE =
  " IMPORTANT: The following tool-call IDs completed successfully: call_a (createImageTool). " +
  "Their results are now in the conversation. Do not call the same tool again — the result is already available. ";

const URL = "http://localhost:4111/blobs/generated-images/a.png";

/** 记下模型每次真正收到的 prompt */
const recordingModel = (prompts: unknown[]) =>
  new MockLanguageModelV3({
    doStream: async (options) => {
      prompts.push(options.prompt);
      return {
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start", id: "t" },
            { type: "text-delta", id: "t", delta: "好的" },
            { type: "text-end", id: "t" },
            {
              type: "finish",
              finishReason: { unified: "stop", raw: "stop" },
              usage: {
                inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
                outputTokens: { total: 1, text: 1, reasoning: 0 }
              }
            }
          ]
        })
      };
    }
  });

/**
 * 续接轮的真实形态：`agent.stream([], { context: [directive] })`。
 * 这里用真实的 Agent + 处理器，看模型最终收到的 prompt，而不是只看处理器的返回值。
 */
describe("续接轮里模型收到的 prompt", () => {
  it("续接提示里带着后台任务的结果（url）", async () => {
    const prompts: unknown[] = [];
    const lookup = async () => ({ status: "completed", result: { id: "img-1", url: URL } });
    const agent = new Agent({
      id: "t",
      name: "t",
      instructions: "x",
      model: recordingModel(prompts) as never,
      inputProcessors: [new InlineBackgroundTaskResults(lookup)]
    });

    const output = await agent.stream([], { context: [{ role: "user", content: DIRECTIVE }] });
    await output.consumeStream();

    const sent = JSON.stringify(prompts[0]);
    expect(sent).toContain("〔后台任务结果〕");
    expect(sent).toContain(URL);
    expect(sent).toContain("createImageTool（call_a）");
  });

  it("没有处理器时模型只会收到那句只有任务 id 的提示（现状对照）", async () => {
    const prompts: unknown[] = [];
    const agent = new Agent({ id: "t", name: "t", instructions: "x", model: recordingModel(prompts) as never });

    const output = await agent.stream([], { context: [{ role: "user", content: DIRECTIVE }] });
    await output.consumeStream();

    expect(JSON.stringify(prompts[0])).not.toContain(URL);
  });

  it("图片真的到了模型手里：模型收到的是图片的二进制和具体类型，不只是一串 url", async () => {
    const prompts: unknown[] = [];
    const png = new Uint8Array([137, 80, 78, 71]);
    const lookup = async () => ({
      status: "completed",
      result: { id: "img-1", url: URL, imagesForModel: [{ url: URL, label: "生成的图片 1465×1074" }] }
    });
    // Mastra 会先把文件 part 的 url 下载成字节（用户贴的图同样如此），测试里没有真的 blobs 服务
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => new Response(png, { headers: { "Content-Type": "image/png" } }));
    const agent = new Agent({
      id: "t",
      name: "t",
      instructions: "x",
      model: recordingModel(prompts) as never,
      inputProcessors: [new InlineBackgroundTaskResults(lookup)]
    });

    const output = await agent.stream([], { context: [{ role: "user", content: DIRECTIVE }] });
    await output.consumeStream();
    fetchSpy.mockRestore();

    const user = (prompts[0] as Array<{ role: string; content: Array<Record<string, unknown>> }>).find(
      (message) => message.role === "user"
    )!;
    const file = user.content.find((part) => part.type === "file")!;
    expect(file.data).toEqual(png);
    expect(file.mediaType).toBe("image/png");
  });
});

/** 挂起了、前端还没回执的调用：状态是 call，元数据里登记了 suspendedTools */
const suspendedHistory = {
  id: "m-call-x",
  role: "assistant",
  createdAt: new Date(Date.now() - 60_000),
  content: {
    format: 2,
    parts: [
      {
        type: "tool-invocation",
        toolInvocation: {
          toolCallId: "call_x",
          toolName: "createComponentTool",
          state: "call",
          args: { components: [{ componentName: "文本框", overrides: { name: "标题-夏至" } }] }
        }
      }
    ],
    metadata: { suspendedTools: { call_x: { toolCallId: "call_x", toolName: "createComponentTool" } } }
  }
};

describe("续接轮里挂起未回执的调用", () => {
  it("Mastra 自己会把它从给模型的历史里过滤掉，处理器补一段说明后模型才知道（标题-夏至）", async () => {
    const withProcessor: unknown[] = [];
    const without: unknown[] = [];
    const build = (prompts: unknown[], processors: InlineBackgroundTaskResults[]) =>
      new Agent({
        id: "t",
        name: "t",
        instructions: "x",
        model: recordingModel(prompts) as never,
        inputProcessors: processors
      });
    const messages = [suspendedHistory] as never;
    const context = [{ role: "user" as const, content: DIRECTIVE }];

    const plain = await build(without, []).stream(messages, { context });
    await plain.consumeStream();
    const fixed = await build(withProcessor, [new InlineBackgroundTaskResults(async () => null)]).stream(messages, {
      context
    });
    await fixed.consumeStream();

    expect(JSON.stringify(without[0])).not.toContain("标题-夏至");
    const sent = JSON.stringify(withProcessor[0]);
    expect(sent).toContain("〔待回传的工具调用〕");
    expect(sent).toContain("标题-夏至");
  });
});
