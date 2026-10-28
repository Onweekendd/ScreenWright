import type { MastraDBMessage } from "@mastra/core/agent";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("@/mastra/agents/compaction-summarizer-agent", () => ({
  compactionSummarizerAgent: { generate: mocks.generate }
}));
vi.mock("@/agent-resources/prompts", () => ({ loadPrompt: () => "continue from summary" }));

import { summarizeHistory } from "@/mastra/lib/compaction/history/summarize";
import { buildSummaryMessage, buildSummaryText } from "@/mastra/lib/compaction/history/summaryMessage";

const textMessage = (id: string, role: "user" | "assistant", text: string): MastraDBMessage => ({
  id,
  role,
  createdAt: new Date(),
  threadId: "thread",
  resourceId: "resource",
  content: { format: 2, parts: [{ type: "text", text }] }
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.generate.mockResolvedValue({ text: "  summary body  " });
});

describe("全量历史摘要", () => {
  it.each(["user", "assistant"] as const)("最后消息为 %s 时仍然全量压缩", async (lastRole) => {
    const messages: MastraDBMessage[] = [
      textMessage("u1", "user", "keep blue"),
      {
        ...textMessage("tool", "assistant", ""),
        content: {
          format: 2,
          parts: [
            {
              type: "tool-invocation",
              toolInvocation: {
                state: "result",
                toolCallId: "call",
                toolName: "readFileTool",
                args: { path: "a.json" },
                result: { color: "blue" }
              }
            }
          ]
        }
      },
      textMessage("last", lastRole, "last message")
    ];
    const original = structuredClone(messages);
    expect(await summarizeHistory(messages)).toBe("summary body");
    const request = mocks.generate.mock.calls[0][0][0].content;
    expect(request).toContain("[role:user] keep blue");
    expect(request).toContain('[tool:readFileTool args={"path":"a.json"} result={"color":"blue"}]');
    expect(request).toContain(`[role:${lastRole}] last message`);
    expect(messages).toEqual(original);
    expect(mocks.generate).toHaveBeenCalledOnce();
  });

  it("空历史在模型调用前报错", async () => {
    await expect(summarizeHistory([])).rejects.toThrow("没有可压缩");
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it("空摘要及模型错误不生成替代历史", async () => {
    const messages = [textMessage("u", "user", "keep original")];
    mocks.generate.mockResolvedValueOnce({ text: " \n " });
    await expect(summarizeHistory(messages)).rejects.toThrow("空内容");
    mocks.generate.mockRejectedValueOnce(new Error("model failed"));
    await expect(summarizeHistory(messages)).rejects.toThrow("model failed");
    expect(messages[0].content.parts).toEqual([{ type: "text", text: "keep original" }]);
  });

  it("外围创建有效消息，统计与持久化使用同一份 XML 包裹文本", () => {
    const createdAt = new Date("2026-10-01T00:00:00Z");
    const message = buildSummaryMessage({
      threadId: "thread",
      resourceId: "resource",
      summaryText: "summary body",
      createdAt
    });
    expect(message.id).not.toBe("");
    expect(message.createdAt).toBe(createdAt);
    expect(message).toMatchObject({
      role: "assistant",
      threadId: "thread",
      resourceId: "resource",
      content: {
        format: 2,
        metadata: { kind: "compaction_summary" },
        parts: [{ type: "text", text: buildSummaryText("summary body") }]
      }
    });
    expect(buildSummaryText("summary body")).toContain("<conversation-summary>\nsummary body\n</conversation-summary>");
  });
});
