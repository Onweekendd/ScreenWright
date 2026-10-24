import type { UIMessage } from "ai";

type MessagePart = UIMessage["parts"][number];

export interface ExecutionProcessPart {
  type: "data-execution-process";
  id: string;
  parts: MessagePart[];
  toolCount: number;
  running: boolean;
}

export type AssistantDisplayPart = MessagePart | ExecutionProcessPart;

const isProcessPart = (part: MessagePart): boolean => {
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

/** 一条助手回复的全部工具和思考归入同一个块，单次调用也折叠；正文及错误仍直接展示。 */
export function groupAssistantParts(parts: MessagePart[], isLoading = false, expanded = false): AssistantDisplayPart[] {
  const result: AssistantDisplayPart[] = [];
  let group: ExecutionProcessPart | undefined;
  let endsWithProcess = false;
  parts.forEach((part, index) => {
    // step-start 等不可见协议帧不打断同一段执行过程。
    if (part.type === "step-start" || (part.type === "text" && !part.text.trim())) {
      return;
    }
    if (isProcessPart(part)) {
      if (!group) {
        group = { type: "data-execution-process", id: `process-${index}`, parts: [], toolCount: 0, running: false };
        result.push(group);
      }
      group.parts.push(part);
      endsWithProcess = true;
      if (part.type !== "reasoning") {
        group.toolCount += 1;
      }
    } else {
      result.push(part);
      endsWithProcess = false;
    }
  });
  // 过程状态只用于入口提示，不自动展开明细。
  if (group && endsWithProcess && isLoading) {
    group.running = true;
  }
  // 展开时恢复原始时间顺序，每个步骤直接回到主时间线，汇总入口仍只有一个。
  if (group && expanded) {
    const header = group;
    const firstProcessIndex = parts.findIndex(isProcessPart);
    return parts.flatMap((part, index): AssistantDisplayPart[] => {
      if (part.type === "step-start" || (part.type === "text" && !part.text.trim())) {
        return [];
      }
      return index === firstProcessIndex ? [header, part] : [part];
    });
  }
  return result;
}
