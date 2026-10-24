import type { UIMessage } from "ai";

type MessagePart = UIMessage["parts"][number];

export interface ExecutionProcessPart {
  type: "data-execution-process";
  id: string;
  parts: MessagePart[];
  toolCount: number;
  running: boolean;
  activity?: string;
}

export type AssistantDisplayPart = MessagePart | ExecutionProcessPart;

export const isProcessPart = (part: { type: string; state?: string }): boolean => {
  if (part.type === "reasoning") {
    return true;
  }
  if (part.type === "data-tool-agent" || part.type === "data-tool-workflow") {
    return true;
  }
  if (!part.type.startsWith("tool-")) {
    return false;
  }
  const tool = part as { state?: string };
  return tool.state !== "output-error" && tool.state !== "output-denied";
};

/** 用实际未完成的调用推导当前操作，已返回结果的工具不再显示为调用中。 */
const activityOf = (parts: MessagePart[], latest: MessagePart | undefined): string | undefined => {
  if (latest?.type === "reasoning" && latest.state === "streaming") {
    return "正在思考";
  }
  const active = parts.flatMap((part) => {
    if (part.type === "data-tool-agent" || part.type === "data-tool-workflow") {
      const data = (part.data ?? {}) as {
        id?: string;
        name?: string;
        status?: string;
        statistics?: unknown;
        output?: unknown;
      };
      const running =
        part.type === "data-tool-agent" ? data.status === "running" : !data.statistics && data.output === undefined;
      return running ? [{ name: data.name || data.id || "子任务", preparing: false }] : [];
    }
    if (!part.type.startsWith("tool-")) {
      return [];
    }
    const tool = part as { toolName?: string; state?: string; output?: unknown };
    const backgroundPending =
      tool.state === "output-available" &&
      typeof tool.output === "string" &&
      /^Background task started/.test(tool.output);
    if (tool.state !== "input-streaming" && tool.state !== "input-available" && !backgroundPending) {
      return [];
    }
    return [{ name: tool.toolName || part.type.replace(/^tool-/, ""), preparing: tool.state === "input-streaming" }];
  });
  if (active.length) {
    const prefix = active.every((tool) => tool.preparing) ? "准备调用" : "正在调用";
    return `${prefix} ${active.map((tool) => tool.name).join("、")}`;
  }
  if (latest?.type === "text") {
    return latest.state === "streaming" ? "正在回复" : undefined;
  }
  return "正在思考";
};

/** 正文分隔执行阶段；每一阶段的工具与思考合并，协议帧不拆分阶段。 */
export function groupAssistantParts(
  parts: MessagePart[],
  isLoading = false,
  expanded: boolean | ReadonlySet<string> = false
): AssistantDisplayPart[] {
  const headers = new Map<number, ExecutionProcessPart>();
  const members = new Map<number, ExecutionProcessPart>();
  let group: ExecutionProcessPart | undefined;
  let latest: MessagePart | undefined;
  const updateActivity = () => {
    if (group && isLoading) {
      group.activity = activityOf(group.parts, latest);
      group.running = Boolean(group.activity);
    }
  };
  parts.forEach((part, index) => {
    // step-start 等不可见协议帧不打断同一段执行过程。
    if (part.type === "step-start" || (part.type === "text" && !part.text.trim())) {
      return;
    }
    if (isProcessPart(part)) {
      if (!group) {
        group = { type: "data-execution-process", id: `process-${index}`, parts: [], toolCount: 0, running: false };
        headers.set(index, group);
      }
      members.set(index, group);
      group.parts.push(part);
      latest = part;
      if (part.type !== "reasoning") {
        group.toolCount += 1;
      }
    } else {
      if (part.type === "text" || part.type.startsWith("tool-")) {
        latest = part;
      }
      if (part.type === "text") {
        updateActivity();
        group = undefined;
      }
    }
  });
  // 过程状态只用于入口提示，不自动展开明细。
  updateActivity();
  // 从原顺序恢复各段明细，独立展开，并保留正文及错误在主时间线的位置。
  return parts.flatMap((part, index): AssistantDisplayPart[] => {
    if (part.type === "step-start" || (part.type === "text" && !part.text.trim())) {
      return [];
    }
    const header = headers.get(index);
    const owner = members.get(index);
    const visible = !owner || expanded === true || (expanded !== false && expanded.has(owner.id));
    return [...(header ? [header] : []), ...(visible ? [part] : [])];
  });
}
