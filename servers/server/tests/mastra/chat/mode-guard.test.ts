import { RequestContext } from "@mastra/core/request-context";
import { describe, expect, it, vi } from "vitest";

import { ModeGuardProcessor } from "@/mastra/processors/mode-guard.processor";
import { AgentMode } from "@/mastra/types/bi-chat";

/** 只用到 addSystem，其余方法本处理器不碰。 */
const fakeMessageList = () => ({ addSystem: vi.fn() });

const run = async (mode: AgentMode, tools: Record<string, unknown>) => {
  const messageList = fakeMessageList();
  const requestContext = new RequestContext<{ mode: AgentMode }>([["mode", mode]]);
  const result = await new ModeGuardProcessor().processInputStep({
    tools,
    requestContext,
    messageList
  } as never);
  return { result, messageList };
};

const TOOLS = {
  readFileTool: {},
  editFilesTool: {},
  createComponentTool: {},
  "agent-swExecutorAgent": {},
  "agent-dataFlowVerificationAgent": {}
};

describe("ModeGuardProcessor", () => {
  it("非 PLAN 模式不动工具，也不发通知", async () => {
    const { result, messageList } = await run(AgentMode.AUTO_EDIT, TOOLS);

    expect(result.tools).toBeUndefined();
    expect(messageList.addSystem).not.toHaveBeenCalled();
  });

  it("PLAN 模式剥掉写工具、补回计划工具", async () => {
    const { result } = await run(AgentMode.PLAN, TOOLS);
    const keys = Object.keys(result.tools ?? {});

    expect(keys).not.toContain("editFilesTool");
    expect(keys).not.toContain("createComponentTool");
    expect(keys).not.toContain("agent-swExecutorAgent");
    // 只读工具与只读校验子 agent 必须留下
    expect(keys).toContain("readFileTool");
    expect(keys).toContain("agent-dataFlowVerificationAgent");
    expect(keys).toEqual(expect.arrayContaining(["createPlanTool", "editPlanTool"]));
  });

  it("必须把增减了哪些工具告诉 agent —— 静默剥离会让它满世界 search_tools", async () => {
    const { messageList } = await run(AgentMode.PLAN, TOOLS);

    expect(messageList.addSystem).toHaveBeenCalledTimes(1);
    const [notice, tag] = messageList.addSystem.mock.calls[0];
    expect(tag).toBe("mode-guard");
    expect(notice).toContain("editFilesTool");
    expect(notice).toContain("agent-swExecutorAgent");
    expect(notice).toContain("createPlanTool");
    // 必须点名劝阻那两条已知的错误退路
    expect(notice).toContain("search_tools");
    expect(notice).toContain("execute_command");
  });

  it("通知内容必须逐字稳定 —— MessageList 按内容去重，变体会一条条堆进 prompt", async () => {
    const first = await run(AgentMode.PLAN, TOOLS);
    // 第二步 ToolSearchProcessor 往 tools 里动态塞了新工具，通知不该因此变样
    const second = await run(AgentMode.PLAN, { ...TOOLS, createEventTemplate: {}, create_data_filter: {} });

    expect(second.messageList.addSystem.mock.calls[0][0]).toBe(first.messageList.addSystem.mock.calls[0][0]);
  });
});
