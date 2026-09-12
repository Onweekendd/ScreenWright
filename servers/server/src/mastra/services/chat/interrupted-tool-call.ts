/**
 * 会话被中止（客户端断连 / 出错）时，若正好有工具调用已经发起但还没等到结果，
 * 把一个占位结果直接补写回持久化的那条 assistant 消息，而不是任由它被 Mastra
 * 的 MessageHistory processor 落盘时过滤掉（见 docs/processors/message-history.md
 * 「Filters out incomplete tool calls」）。
 *
 * 不补的后果：那条工具调用从下一轮历史里彻底消失，像是没发生过——但工具的副作用
 * （比如已经改了文件）是真实发生的，模型会在毫不知情的情况下继续，容易重复执行
 * 或凭空得出"任务失败"之类的错误结论。长任务尤其被动：一次网络抖动就等于白跑。
 *
 * 占位结果不下"成功"或"失败"的结论——中断那一刻我们真的不知道工具有没有跑完，
 * 只告诉模型"状态未知，先去核实真实情况再决定下一步"，交由模型自己判断。
 */

import type { MastraDBMessage } from "@mastra/core/agent";
import type { Memory } from "@mastra/memory";

/** 工具调用因会话中断而未拿到真实结果时，写回的占位结果。 */
const INTERRUPTED_RESULT = {
  status: "interrupted",
  note: "连接中断，本次工具调用未能返回结果，实际执行状态未知（可能已执行完成、部分执行或未执行）。请先核实当前实际状态（如相关文件/数据是否已生效），再决定是否需要重试或采取补救措施，不要假设它已经成功或已经失败。"
} as const;

/** message.content.parts 里的单个 tool-invocation part（只取用到的字段，其余原样保留）。 */
interface ToolInvocationPart {
  type: "tool-invocation";
  toolInvocation: {
    toolCallId?: string;
    state?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const isToolInvocationPart = (part: unknown): part is ToolInvocationPart =>
  !!part && typeof part === "object" && (part as { type?: unknown }).type === "tool-invocation";

interface MarkInterruptedArgs {
  memory: Memory;
  threadId: string;
  resourceId: string;
  /** 中断那一刻还没等到 tool-output 的 toolCallId 列表。 */
  toolCallIds: readonly string[];
}

/**
 * 在最近几条消息里找到这些 toolCallId 对应的 tool-invocation part，把它从
 * 'call'/'partial-call' 补成 'result'，写回存储。
 *
 * 只在最近一页消息里找——中断时刚发起的调用必然在最新的 assistant 消息里，
 * 不需要翻全部历史。找不到（比如那条 assistant 消息本身还没来得及落盘）就
 * 静默跳过：没什么可补的，不算错误。
 */
export const markToolCallsInterrupted = async ({
  memory,
  threadId,
  resourceId,
  toolCallIds
}: MarkInterruptedArgs): Promise<void> => {
  const pending = new Set(toolCallIds);
  if (pending.size === 0) {
    return;
  }

  const { messages } = await memory.recall({
    threadId,
    resourceId,
    perPage: 20,
    orderBy: { field: "createdAt", direction: "DESC" }
  });

  const updates: Array<Partial<MastraDBMessage> & { id: string }> = [];

  for (const message of messages) {
    if (pending.size === 0) {
      break;
    }
    if (message.role !== "assistant" || message.content?.format !== 2 || !Array.isArray(message.content.parts)) {
      continue;
    }

    let changed = false;
    const parts = message.content.parts.map((part) => {
      if (!isToolInvocationPart(part)) {
        return part;
      }
      const { toolCallId, state } = part.toolInvocation;
      if (!toolCallId || !pending.has(toolCallId) || state === "result") {
        return part;
      }
      pending.delete(toolCallId);
      changed = true;
      return {
        ...part,
        toolInvocation: {
          ...part.toolInvocation,
          state: "result",
          result: INTERRUPTED_RESULT
        }
      };
    }) as typeof message.content.parts;

    if (changed) {
      updates.push({ id: message.id, content: { ...message.content, parts } });
    }
  }

  if (updates.length > 0) {
    await memory.updateMessages({ messages: updates });
  }
};
