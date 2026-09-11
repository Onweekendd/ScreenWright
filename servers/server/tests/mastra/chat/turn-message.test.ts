import { describe, expect, it } from "vitest";

import { extractUserMessageId, extractUserMessageText } from "@/mastra/services/chat/turn-message";
import type { BIChatRequest } from "@/mastra/services/chat/types";

type Messages = BIChatRequest["messages"];

function userMessage(text: string, id = "msg-1"): Messages {
  return [{ id, role: "user", parts: [{ type: "text", text }] }] as unknown as Messages;
}

describe("extractUserMessageText", () => {
  it("剥掉编辑器上下文，只取 <user-message> 标签内的问题", () => {
    const messages = userMessage(
      "<editor-context>大段上下文</editor-context>\n<user-message>\n订单表有几行\n</user-message>"
    );

    expect(extractUserMessageText(messages)).toBe("订单表有几行");
  });

  it("没有 <user-message> 标签时退回整段文本", () => {
    expect(extractUserMessageText(userMessage("订单表有几行"))).toBe("订单表有几行");
  });

  it("只取首行，多行提问不会把整段写进 commit message", () => {
    expect(extractUserMessageText(userMessage("第一行\n第二行\n第三行"))).toBe("第一行");
  });

  it("超过 100 字截断并加省略号", () => {
    const long = "字".repeat(150);
    const result = extractUserMessageText(userMessage(long));

    expect(result).toBe(`${"字".repeat(100)}…`);
  });

  it("resume / 后台续接轮 messages 为空时返回空串", () => {
    expect(extractUserMessageText([] as unknown as Messages)).toBe("");
    expect(extractUserMessageText(undefined)).toBe("");
  });

  it("最后一条不是用户消息时返回空串（不会把 AI 回复当成提问）", () => {
    const messages = [
      { id: "msg-1", role: "user", parts: [{ type: "text", text: "订单表有几行" }] },
      { id: "msg-2", role: "assistant", parts: [{ type: "text", text: "一共 42 行" }] }
    ] as unknown as Messages;

    expect(extractUserMessageText(messages)).toBe("");
  });

  it("忽略非 text 类型的 part（如图片）", () => {
    const messages = [
      {
        id: "msg-1",
        role: "user",
        parts: [
          { type: "file", url: "https://example.com/a.png" },
          { type: "text", text: "这张图什么意思" }
        ]
      }
    ] as unknown as Messages;

    expect(extractUserMessageText(messages)).toBe("这张图什么意思");
  });
});

describe("extractUserMessageId", () => {
  it("取最后一条用户消息的 id 作为撤销锚点", () => {
    expect(extractUserMessageId(userMessage("订单表有几行", "msg-42"))).toBe("msg-42");
  });

  it("无用户消息时返回空串", () => {
    expect(extractUserMessageId(undefined)).toBe("");
  });
});
