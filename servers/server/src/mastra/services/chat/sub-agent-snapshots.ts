/**
 * 子 agent 还原工具
 *
 * Mastra 默认只持久化子 agent 的最终 text + tool results，缺少每步推理文本。
 * 这里负责：
 *   - 流式期间从 data-tool-agent 帧抽取 { text, reasoning } 快照；
 *   - 历史回读时把快照与原生 tool result 拼回 data-tool-agent part，供前端渲染。
 */

import type { UIMessage } from "ai";

import type { SubAgentSnapshotMap, SubAgentStepInfo } from "../../types/bi-chat";

/**
 * 从单帧 data-tool-agent chunk 中抽出 "子 agent 内部 toolCallId → { text, reasoning }" 的映射。
 * 只取每步的可见文本和思考文本，丢弃 args / result，避免落库大字段。
 * 不再跳过空 text 的 step——只要有 reasoning 也要捕获。
 */
export const extractAgentTextMap = (chunkData: unknown): Record<string, SubAgentStepInfo> => {
  interface StepShape {
    text?: string;
    reasoningText?: string;
    reasoning?: string[];
    toolCalls?: Array<{ toolCallId?: string }>;
  }
  const steps = (chunkData as { steps?: StepShape[] } | undefined)?.steps;
  const map: Record<string, SubAgentStepInfo> = {};
  if (!Array.isArray(steps)) {
    return map;
  }
  for (const step of steps) {
    const text = step?.text ?? "";
    const reasoning = step?.reasoningText?.length ? step.reasoningText : (step?.reasoning ?? []).join("");
    if (!text && !reasoning) {
      continue;
    }
    for (const tc of step?.toolCalls ?? []) {
      if (tc?.toolCallId) {
        map[tc.toolCallId] = { text, reasoning };
      }
    }
  }
  return map;
};

/**
 * 把磁盘里的 snapshot 展平成 Record<innerToolCallId, SubAgentStepInfo>。
 * 历史数据可能是三种形态：
 *   1. 旧的两层 outer→inner map（outer 是 sub-agent runId）：{ runId: { call_xxx: "text" } }
 *   2. 旧的两层但 inner 已是 SubAgentStepInfo：           { runId: { call_xxx: { text, reasoning } } }
 *   3. 新的扁平结构：                                    { call_xxx: { text, reasoning } }
 * 统一压成第 3 种。
 */
export const normalizeSubAgentSnapshots = (raw: unknown): SubAgentSnapshotMap => {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  const flat: SubAgentSnapshotMap = {};
  const assignInner = (key: string, value: unknown) => {
    if (typeof value === "string") {
      flat[key] = { text: value };
    } else if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      flat[key] = {
        text: typeof obj.text === "string" ? obj.text : "",
        reasoning: typeof obj.reasoning === "string" ? obj.reasoning : ""
      };
    }
  };
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string") {
      // 形态 1 退化版：直接 inner→string
      flat[k] = { text: v };
    } else if (v && typeof v === "object") {
      const obj = v as Record<string, unknown>;
      // 形态 3：自身就是 SubAgentStepInfo
      if ("text" in obj || "reasoning" in obj) {
        assignInner(k, obj);
      } else {
        // 形态 1/2：外层 key 是 runId，展开内层
        for (const [innerK, innerV] of Object.entries(obj)) {
          assignInner(innerK, innerV);
        }
      }
    }
  }
  return flat;
};

interface HistoricalToolResult {
  toolCallId: string;
  toolName: string;
  args: unknown;
  result: unknown;
}
interface AgentToolPart {
  type: string;
  toolName?: string;
  toolCallId?: string;
  output?: unknown;
}

/**
 * 把一个 tool-agent-* part 重写为 data-tool-agent part（与流式 AgentStreamData 同形）。
 * - steps 主体由 subAgentToolResults（Mastra 原生持久化）拼出；
 * - textMap 命中时补每步推理文本，未命中则 text 为空；
 * - 末尾用 output.text 作为收尾 step，与流式最后一帧对齐。
 * 返回 null 表示该 part 不应被注入（不是 agent 工具、或没有可还原数据）。
 */
const buildAgentDataPart = (part: AgentToolPart, snapshot: SubAgentSnapshotMap): unknown => {
  if (!part.type.startsWith("tool-")) {
    return null;
  }
  const toolName = part.toolName ?? part.type.replace(/^tool-/, "");
  if (!toolName.startsWith("agent-")) {
    return null;
  }

  const output = part.output as { text?: string; subAgentToolResults?: HistoricalToolResult[] } | undefined;
  const toolResults = output?.subAgentToolResults ?? [];

  const steps = toolResults.map((tr) => {
    const info = snapshot[tr.toolCallId] ?? {};
    return {
      text: info.text ?? "",
      reasoningText: info.reasoning ?? "",
      toolCalls: [{ toolCallId: tr.toolCallId, toolName: tr.toolName, args: tr.args }],
      toolResults: [{ toolCallId: tr.toolCallId, result: tr.result }]
    };
  });
  if (output?.text) {
    steps.push({ text: output.text, reasoningText: "", toolCalls: [], toolResults: [] });
  }
  if (!steps.length) {
    return null;
  }

  return {
    type: "data-tool-agent",
    id: part.toolCallId,
    data: {
      id: toolName.replace(/^agent-/, ""),
      text: output?.text ?? "",
      toolCalls: [],
      steps,
      status: "completed"
    }
  };
};

/**
 * 遍历 messages，将每个 assistant 消息里的 tool-agent-* part 就地替换为对应的 data-tool-agent part。
 * snapshot 是整个 thread 的扁平 inner toolCallId 索引，buildAgentDataPart 内部按 subAgentToolResults
 * 里的 inner toolCallId 直查，不依赖父工具 toolCallId 与外层 key 的对应关系。
 */
export const injectSubAgentDataParts = (messages: UIMessage[], snapshot: SubAgentSnapshotMap): void => {
  for (const msg of messages) {
    if (msg.role !== "assistant" || !Array.isArray(msg.parts)) {
      continue;
    }
    const oldParts = msg.parts as unknown[];
    const newParts: unknown[] = [];
    for (const part of oldParts as AgentToolPart[]) {
      const dataPart = buildAgentDataPart(part, snapshot);
      if (dataPart) {
        newParts.push(dataPart);
      } else {
        newParts.push(part);
      }
    }
    (msg.parts as unknown[]).length = 0;
    (msg.parts as unknown[]).push(...newParts);
  }
};
