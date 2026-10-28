import { describe, expect, it } from "vitest";

import type { UIMessage } from "ai";

import {
  createAssistantMessageGrouper,
  groupAssistantMessages
} from "@/views/build/components/agentBI/hooks/message/groupAssistantMessages";
import { groupAssistantParts } from "@/views/build/components/agentBI/hooks/message/groupAssistantParts";

type Part = UIMessage["parts"][number];
const assistant = (id: string, parts: Part[]): UIMessage => ({ id, role: "assistant", parts });
const user = (id: string): UIMessage => ({ id, role: "user", parts: [{ type: "text", text: "继续" }] });
const tool = (id: string): Part => ({
  type: "tool-captureCanvasTool",
  toolCallId: id,
  state: "output-available",
  input: {},
  output: { ok: true }
});

describe("连续 assistant 消息的展示合并", () => {
  it("截图、工具恢复产生的多个 messageId 合并成一个过程，调用和顺序不丢失", () => {
    const messages = [
      user("user"),
      ...Array.from({ length: 10 }, (_, i) => assistant(`message-${i}`, [tool(`call-${i}`)]))
    ];
    const rows = groupAssistantMessages(messages);
    expect(rows).toHaveLength(2);
    expect(rows[1].id).toBe("message-0");
    const parts = groupAssistantParts(rows[1].parts);
    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({ type: "data-execution-process", toolCount: 10, running: false });
    expect(rows[1].parts).toEqual(messages.slice(1).flatMap((message) => message.parts));
  });

  it("正文仍隔开前后工具阶段，不受 messageId 边界影响", () => {
    const text: Part = { type: "text", text: "布局已经确定，现在生成素材。" };
    const rows = groupAssistantMessages([
      assistant("first", [tool("before")]),
      assistant("reply", [text]),
      assistant("resumed", [tool("after")])
    ]);
    expect(groupAssistantParts(rows[0].parts)).toMatchObject([
      { type: "data-execution-process", toolCount: 1 },
      text,
      { type: "data-execution-process", toolCount: 1 }
    ]);
  });

  it("不跨越用户消息，也不合并到其他角色", () => {
    const messages: UIMessage[] = [
      assistant("first", [tool("a")]),
      user("next"),
      assistant("second", [tool("b")]),
      { id: "system", role: "system", parts: [{ type: "text", text: "提示" }] },
      assistant("third", [tool("c")])
    ];
    expect(groupAssistantMessages(messages)).toEqual(messages);
  });

  it("空消息和协议帧不再生成额外的折叠入口", () => {
    const rows = groupAssistantMessages([
      assistant("first", [tool("a")]),
      assistant("empty", []),
      assistant("protocol", [{ type: "step-start" }]),
      assistant("last", [tool("b")])
    ]);
    expect(rows).toHaveLength(1);
    expect(groupAssistantParts(rows[0].parts)).toMatchObject([{ type: "data-execution-process", toolCount: 2 }]);
  });

  it("不修改历史消息及 parts，保留工具对象引用", () => {
    const first = assistant("first", [tool("a")]);
    const second = assistant("second", [tool("b")]);
    Object.freeze(first.parts);
    Object.freeze(second.parts);
    Object.freeze(first);
    Object.freeze(second);
    const rows = groupAssistantMessages([first, second]);
    expect(first.parts).toHaveLength(1);
    expect(second.parts).toHaveLength(1);
    expect(rows[0]).not.toBe(first);
    expect(rows[0].parts[0]).toBe(first.parts[0]);
    expect(rows[0].parts[1]).toBe(second.parts[0]);
  });

  it("新消息追加后沿用首条 id，旧 parts 的序号和引用稳定", () => {
    const first = assistant("first", [tool("a")]);
    const before = groupAssistantMessages([first, assistant("second", [tool("b")])]);
    const after = groupAssistantMessages([first, assistant("second", [tool("b")]), assistant("third", [tool("c")])]);
    expect(after[0].id).toBe(before[0].id);
    expect(after[0].parts[0]).toBe(before[0].parts[0]);
    expect(before[0].parts).toHaveLength(2);
    expect(after[0].parts).toHaveLength(3);
  });

  it("保留错误和正文；没有历史时返回空列表", () => {
    const error = { type: "error", errorText: "网络中断" } as unknown as Part;
    const rows = groupAssistantMessages([assistant("a", [tool("a")]), assistant("b", [error])]);
    expect(rows[0].parts).toContain(error);
    expect(groupAssistantMessages([])).toEqual([]);
  });

  it("流式更新只替换当前段，历史段和历史 part 引用保持不变", () => {
    const group = createAssistantMessageGrouper();
    const history = [assistant("old-1", [tool("old-a")]), assistant("old-2", [tool("old-b")])];
    const prefix = [...history, user("next"), assistant("new-1", [tool("new-a")])];
    const before = group([...prefix, assistant("new-2", [{ type: "text", text: "开始", state: "streaming" }])]);
    const after = group([...prefix, assistant("new-2", [{ type: "text", text: "开始处理", state: "streaming" }])]);
    expect(after[0]).toBe(before[0]);
    expect(after[0].parts).toBe(before[0].parts);
    expect(after[2]).not.toBe(before[2]);
    expect(after[2].id).toBe(before[2].id);
    expect(after[2].parts[0]).toBe(before[2].parts[0]);
    expect(group([...prefix, assistant("new-3", [tool("new-c")])])[0]).toBe(before[0]);
    expect(group([])).toEqual([]);
  });
});
