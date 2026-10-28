import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { type MastraDBMessage, MessageList } from "@mastra/core/agent";
import type { ProcessToolResultArgs } from "@mastra/core/processors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ workspace: "" }));
vi.mock("@/agent-resources/workspace-path", () => ({ getAgentWorkspacePath: () => mocks.workspace }));

import { compactionConfig } from "@/mastra/lib/compaction/config";
import { ToolResultLimitProcessor } from "@/mastra/lib/compaction/processors/toolResultLimit";
import type { ToolResultPolicy } from "@/mastra/lib/compaction/tool-result/limitReadFileResult";

const tempPrefix = path.join(os.tmpdir(), "funbi-context-");
let workspace: string;

const textMessage = (id: string, role: "user" | "assistant", text: string): MastraDBMessage => ({
  id,
  role,
  threadId: "thread",
  resourceId: "resource",
  createdAt: new Date(),
  content: { format: 2, parts: [{ type: "text", text }] }
});

const toolMessage = (id: string, toolCallId: string, result: unknown): MastraDBMessage => ({
  ...textMessage(id, "assistant", ""),
  content: {
    format: 2,
    parts: [
      {
        type: "tool-invocation",
        toolInvocation: { state: "result", toolCallId, toolName: "readFileTool", args: { path: "test.json" }, result }
      }
    ]
  }
});

const resultOf = (list: MessageList, toolCallId: string) => {
  for (const message of list.get.all.db()) {
    for (const part of message.content.parts) {
      if (part.type === "tool-invocation" && part.toolInvocation.toolCallId === toolCallId) {
        return part.toolInvocation.result;
      }
    }
  }
  throw new Error(`Missing tool call: ${toolCallId}`);
};

const toolContext = () => {
  const original = { content: "full file content", totalLines: 99 };
  const list = new MessageList({ threadId: "thread", resourceId: "resource" });
  list.add(
    [textMessage("old-user", "user", "old request"), toolMessage("old-tool", "old-call", { content: "old" })],
    "memory"
  );
  list.add([toolMessage("new-tool", "new-call", original)], "response");
  return {
    original,
    list,
    context: {
      toolName: "readFileTool",
      toolCallId: "new-call",
      args: { path: "test.json" },
      result: original,
      messageList: list,
      messages: list.get.all.db()
    } as unknown as ProcessToolResultArgs
  };
};

beforeEach(async () => {
  workspace = await mkdtemp(tempPrefix);
  mocks.workspace = workspace;
});

afterEach(async () => {
  vi.restoreAllMocks();
  if (!path.resolve(workspace).startsWith(path.resolve(tempPrefix))) {
    throw new Error("Refusing to remove an unexpected test directory.");
  }
  await rm(workspace, { recursive: true, force: true });
});

describe("读取结果限长处理器", () => {
  it("策略选择保留原样时透传，不写存档", async () => {
    const { context, list, original } = toolContext();
    await new ToolResultLimitProcessor(async () => undefined).processToolResult(context);
    expect(resultOf(list, "new-call")).toEqual(original);
    expect(await readdir(workspace)).toEqual([]);
  });

  it("只修改当前调用，原文可从工作区读回，旧调用保持不变", async () => {
    const { context, list, original } = toolContext();
    let savedPath = "";
    const policy: ToolResultPolicy = async ({ archiveOriginal, maxBytes }) => {
      expect(maxBytes).toBe(compactionConfig.toolResult.maxBytes);
      savedPath = await archiveOriginal();
      expect(await archiveOriginal()).toBe(savedPath);
      return { result: { content: "short", originalPath: savedPath } };
    };
    await new ToolResultLimitProcessor(policy).processToolResult(context);
    expect(resultOf(list, "old-call")).toEqual({ content: "old" });
    expect(resultOf(list, "new-call")).toEqual({ content: "short", originalPath: savedPath });
    expect(original.content).toBe("full file content");
    expect(JSON.parse(await readFile(path.join(workspace, savedPath), "utf8"))).toMatchObject({
      toolCallId: "new-call",
      result: original
    });
    expect(await readdir(path.join(workspace, ".tool-results"))).toHaveLength(1);
  });

  it("策略改动副本后失败，不会污染真实结果", async () => {
    const { context, list, original } = toolContext();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const policy: ToolResultPolicy = async ({ result }) => {
      (result as { content: string }).content = "broken";
      throw new Error("policy failed");
    };
    await new ToolResultLimitProcessor(policy).processToolResult(context);
    expect(resultOf(list, "new-call")).toEqual(original);
    expect(original.content).toBe("full file content");
  });

  it("原文无法存档时不提交裁剪结果", async () => {
    const { context, list, original } = toolContext();
    const blocked = path.join(workspace, "not-a-directory");
    await writeFile(blocked, "file");
    mocks.workspace = blocked;
    vi.spyOn(console, "error").mockImplementation(() => {});
    await new ToolResultLimitProcessor(async () => ({ result: { content: "short" } })).processToolResult(context);
    expect(resultOf(list, "new-call")).toEqual(original);
  });

  it("默认策略再次读取存档时复用原路径，不产生嵌套存档", async () => {
    await mkdir(path.join(workspace, ".tool-results"));
    const archived = JSON.stringify({ result: { content: "x".repeat(50_000) } });
    await writeFile(path.join(workspace, ".tool-results/original.json"), archived);
    const { context, list } = toolContext();
    context.args = { path: ".tool-results/original.json" };
    context.result = { content: archived, totalLines: 1, encoding: "utf8", lineEnding: "LF", isPartialView: false };
    list.updateToolInvocation({
      type: "tool-invocation",
      toolInvocation: {
        state: "result",
        toolCallId: "new-call",
        toolName: "readFileTool",
        args: context.args,
        result: context.result
      }
    });
    await new ToolResultLimitProcessor().processToolResult(context);
    expect(resultOf(list, "new-call")).toMatchObject({ truncated: true, archivePath: ".tool-results/original.json" });
    expect(await readdir(path.join(workspace, ".tool-results"))).toEqual(["original.json"]);
  });
});
