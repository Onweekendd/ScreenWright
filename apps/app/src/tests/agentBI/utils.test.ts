import { describe, expect, it } from "vitest";

import type { UIMessage } from "ai";

import {
  detectStepStatusChange,
  extractPendingClientTools,
  extractUserText,
  isUIMessage,
  mergeToolResultsIntoMessage,
  shouldContinueProcessing,
  tryParseSSELine,
  updateMessageById
} from "@/views/build/components/agentBI/utils";

// ---------------------------------------------------------------------------
// extractUserText
// ---------------------------------------------------------------------------

describe("extractUserText", () => {
  it("extractUserText，传入字符串，返回 trim 后的字符串", () => {
    expect(extractUserText("  hello  ")).toBe("hello");
  });

  it("extractUserText，传入 UIMessage 对象，返回 text part 的内容", () => {
    const msg: UIMessage = {
      id: "1",
      role: "user",
      // @ts-expect-error - UIMessage doesn't have content field in new version
      content: "",
      parts: [{ type: "text", text: "你好" }]
    };
    expect(extractUserText(msg)).toBe("你好");
  });

  it("extractUserText，传入 undefined，返回 fallbackText", () => {
    expect(extractUserText(undefined, "fallback")).toBe("fallback");
  });

  it("extractUserText，传入 UIMessage 无 text part，返回 fallbackText", () => {
    const msg: UIMessage = {
      id: "1",
      role: "user",
      // @ts-expect-error - UIMessage doesn't have content field in new version
      content: "",
      parts: [{ type: "tool-invocation" } as any]
    };
    expect(extractUserText(msg, "fallback")).toBe("fallback");
  });
});

// ---------------------------------------------------------------------------
// tryParseSSELine
// ---------------------------------------------------------------------------

describe("tryParseSSELine", () => {
  it("tryParseSSELine，合法 data 行，返回解析后的对象", () => {
    const result = tryParseSSELine('data: {"type":"text-delta","textDelta":"hi"}');
    expect(result).toEqual({ type: "text-delta", textDelta: "hi" });
  });

  it("tryParseSSELine，data: [DONE] 行，返回 null", () => {
    expect(tryParseSSELine("data: [DONE]")).toBeNull();
  });

  it("tryParseSSELine，非 data: 前缀，返回 null", () => {
    expect(tryParseSSELine("event: ping")).toBeNull();
  });

  it("tryParseSSELine，data 后 JSON 格式错误，返回 null", () => {
    expect(tryParseSSELine("data: {invalid}")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// extractPendingClientTools
// ---------------------------------------------------------------------------

describe("extractPendingClientTools", () => {
  const toolNames = new Set(["routeChange", "listAvailableActions"]);

  it("extractPendingClientTools，有 input-available 状态且名称在 set 内，返回该工具", () => {
    const msg: UIMessage = {
      id: "1",
      role: "assistant",
      // @ts-expect-error - UIMessage doesn't have content field in new version
      content: "",
      parts: [{ type: "tool-routeChange", toolCallId: "tc-1", state: "input-available", input: {} } as any]
    };
    const result = extractPendingClientTools(msg, toolNames);
    expect(result).toHaveLength(1);
    expect(result[0].toolName).toBe("routeChange");
  });

  it("extractPendingClientTools，状态非 input-available，返回空数组", () => {
    const msg: UIMessage = {
      id: "1",
      role: "assistant",
      // @ts-expect-error - UIMessage doesn't have content field in new version
      content: "",
      parts: [{ type: "tool-routeChange", toolCallId: "tc-1", state: "output-available", input: {} } as any]
    };
    expect(extractPendingClientTools(msg, toolNames)).toHaveLength(0);
  });

  it("extractPendingClientTools，工具名不在 availableToolNames 中，返回空数组", () => {
    const msg: UIMessage = {
      id: "1",
      role: "assistant",
      // @ts-expect-error - UIMessage doesn't have content field in new version
      content: "",
      parts: [{ type: "tool-unknownTool", toolCallId: "tc-1", state: "input-available", input: {} } as any]
    };
    expect(extractPendingClientTools(msg, toolNames)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// mergeToolResultsIntoMessage
// ---------------------------------------------------------------------------

describe("mergeToolResultsIntoMessage", () => {
  it("mergeToolResultsIntoMessage，toolCallId 匹配，part 更新为 output-available", () => {
    const msg: UIMessage = {
      id: "1",
      role: "assistant",
      // @ts-expect-error - UIMessage doesn't have content field in new version
      content: "",
      parts: [{ type: "tool-routeChange", toolCallId: "tc-1", state: "input-available", input: {} } as any]
    };
    const result = mergeToolResultsIntoMessage(msg, [{ toolCallId: "tc-1", result: { success: true } }]);
    const part = result.parts[0] as any;
    expect(part.state).toBe("output-available");
    expect(part.output).toEqual({ success: true });
  });

  it("mergeToolResultsIntoMessage，toolCallId 不匹配，part 保持不变", () => {
    const msg: UIMessage = {
      id: "1",
      role: "assistant",
      // @ts-expect-error - UIMessage doesn't have content field in new version
      content: "",
      parts: [{ type: "tool-routeChange", toolCallId: "tc-1", state: "input-available", input: {} } as any]
    };
    const result = mergeToolResultsIntoMessage(msg, [{ toolCallId: "tc-999", result: { success: true } }]);
    const part = result.parts[0] as any;
    expect(part.state).toBe("input-available");
  });
});

// ---------------------------------------------------------------------------
// updateMessageById
// ---------------------------------------------------------------------------

describe("updateMessageById", () => {
  const messages: UIMessage[] = [
    // @ts-expect-error - UIMessage doesn't have content field in new version
    { id: "m1", role: "user", content: "hi", parts: [{ type: "text", text: "hi" }] },
    // @ts-expect-error - UIMessage doesn't have content field in new version
    { id: "m2", role: "assistant", content: "hey", parts: [{ type: "text", text: "hey" }] }
  ];

  it("updateMessageById，id 匹配，updater 结果替换该消息", () => {
    const updated = updateMessageById(messages, "m2", (m) => ({
      ...m,
      content: "hello",
      parts: [{ type: "text", text: "hello" }]
    })) as any;
    expect(updated[1].content).toBe("hello");
    expect(updated[0].content).toBe("hi");
  });

  it("updateMessageById，id 不匹配，消息内容不变", () => {
    const updated = updateMessageById(messages, "m99", (m) => m);
    expect(updated[0]).toBe(messages[0]);
    expect(updated[1]).toBe(messages[1]);
  });
});

// ---------------------------------------------------------------------------
// shouldContinueProcessing
// ---------------------------------------------------------------------------

describe("shouldContinueProcessing", () => {
  it("shouldContinueProcessing，isStreaming=false，返回 true", () => {
    expect(shouldContinueProcessing(false, false)).toBe(true);
  });

  it("shouldContinueProcessing，isStreaming=true 且 hasExistingMessages=false，返回 false", () => {
    expect(shouldContinueProcessing(true, false)).toBe(false);
  });

  it("shouldContinueProcessing，isStreaming=true 且 hasExistingMessages=true，返回 true", () => {
    expect(shouldContinueProcessing(true, true)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isUIMessage
// ---------------------------------------------------------------------------

describe("isUIMessage", () => {
  it("isUIMessage，传入含 parts 字段的对象，返回 true", () => {
    expect(isUIMessage({ id: "1", role: "user", parts: [] })).toBe(true);
  });

  it("isUIMessage，传入普通字符串，返回 false", () => {
    expect(isUIMessage("hello")).toBe(false);
  });

  it("isUIMessage，传入 null，返回 false", () => {
    expect(isUIMessage(null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// detectStepStatusChange
// ---------------------------------------------------------------------------

describe("detectStepStatusChange", () => {
  it("detectStepStatusChange，stepId 匹配且状态变为 success，返回 true", () => {
    expect(detectStepStatusChange(undefined, "success", "step-1", "step-1")).toBe(true);
  });

  it("detectStepStatusChange，stepId 不匹配，返回 false", () => {
    expect(detectStepStatusChange(undefined, "success", "step-1", "step-2")).toBe(false);
  });

  it("detectStepStatusChange，状态未变化（之前已 success），返回 false", () => {
    expect(detectStepStatusChange("success", "success", "step-1", "step-1")).toBe(false);
  });
});
