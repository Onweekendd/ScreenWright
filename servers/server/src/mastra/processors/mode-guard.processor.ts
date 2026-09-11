import type { ProcessInputStepArgs, ProcessInputStepResult, Processor } from "@mastra/core/processors";

import { createPlanTool, editPlanTool } from "../tools/plan";
import { AgentMode } from "../types/bi-chat";

// PLAN 模式下确定性注入的计划维护工具。
// 不走 ToolSearchProcessor（语义检索 topK/minScore 可能漏召回，导致 agent 看不到 create_plan
// 而退而求其次用始终可见的 execute_command 去写计划文件）。规划工具必须每步稳定可见。
const PLAN_TOOLS = { createPlanTool, editPlanTool } as const;

const WRITE_TOOL_KEYS = new Set([
  "editFilesTool",
  "deleteFileTool",
  "createComponentTool",
  "copyComponentTool",
  "createDataFilterTool",
  "createEventTemplate",
  "createConditionTemplate",
  "createActionTemplate",
  // Artifact App 会切换任务分支并修改前端项目源码，PLAN 模式禁止执行。
  "delegateAppCodeTool",
  // 施工子 agent 的委派工具（Mastra 以 `agent-${name}` 为 key 注入）。
  // PLAN 模式剥掉，避免规划阶段误派活；dataFlowVerificationAgent 只读不剥。
  "agent-swExecutorAgent"
]);

/**
 * 告诉 agent 这一步的工具集被动过了，以及动了哪些。
 *
 * **静默剥离比剥错更贵。** 实测：PLAN 模式剥掉写工具但不作任何说明，agent 不知道工具没了、
 * 更不知道为什么，于是一轮里调了 21 次 `search_tools` 去找已经不存在的工具，最后撞满
 * 540s 超时。剥离本身是对的，缺的是那句「为什么」。
 *
 * **内容必须逐字稳定。** `MessageList.addOneSystem` 按内容哈希去重（`message-list:12621`），
 * 同一条消息每步重复添加只会落一次；但只要有一个字不同就是新消息，会一条条堆进 prompt。
 * 所以这里从 {@link WRITE_TOOL_KEYS} / {@link PLAN_TOOLS} 两个**常量**生成，而不是拿实时
 * `tools` 求差集——`ToolSearchProcessor` 排在本处理器之前，会中途往 `tools` 里注入工具，
 * 按实时差集算出来的名单每步都可能变。
 *
 * 代价是名单里可能出现这一步本来就没有的工具。这不算错：对 agent 来说「别去找这些」
 * 与「这些刚被拿走」是同一个行动结论。
 */
const buildToolChangeNotice = (): string => {
  const removed = [...WRITE_TOOL_KEYS].sort().join("、");
  const added = Object.keys(PLAN_TOOLS).sort().join("、");
  return [
    "【当前处于 PLAN 模式：本步的工具集已被调整】",
    `已移除（写类工具，计划阶段不得落盘）：${removed}`,
    `已加入（计划维护）：${added}`,
    "找不到写工具是预期的，不要用 search_tools 去找，也不要改用 execute_command 绕过去写文件。",
    "要写/改计划就用上面加入的那两个工具；要真正动手，先 submitPlanTool 交给用户批准，退出 PLAN 后写工具会自动回来。"
  ].join("\n");
};

export class ModeGuardProcessor implements Processor {
  id = "mode-guard";

  async processInputStep({
    tools,
    requestContext,
    messageList
  }: ProcessInputStepArgs): Promise<ProcessInputStepResult> {
    const mode = requestContext?.get("mode") as AgentMode | undefined;
    if (mode !== AgentMode.PLAN || !tools) {
      return {};
    }

    // mode 由 bi-chat-turn-stream.ts 的 resolveModeFromResumeData 预判：
    // resume run 里 processInputStep 先于挂起工具 execute() 执行，读 metadata 会慢一轮，
    // 故在 run 入口按 resumeData（用户审批意图）预先算出正确 mode 写入 requestContext。
    const filteredTools = Object.fromEntries(Object.entries(tools).filter(([key]) => !WRITE_TOOL_KEYS.has(key)));

    // 打上 tag：本条归本处理器所有，不会被别的处理器替换未标记系统消息时连带清掉。
    messageList?.addSystem(buildToolChangeNotice(), "mode-guard");

    // 剥掉写工具后，确定性补回计划维护工具，确保 PLAN 阶段稳定可调用。
    return { tools: { ...filteredTools, ...PLAN_TOOLS } };
  }
}
