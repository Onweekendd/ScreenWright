import type { AgentSessionEvent } from "@earendil-works/pi-coding-agent";

import type { AppCodeCheckResult, AppCodeExecutionResult } from "@/artifact-app/contracts";
import { AppCodeTaskError } from "@/artifact-app/contracts";
import { getErrorMessage } from "@/artifact-app/shared/error-message";

export interface PiExecutionIdentity {
  readonly taskListId: string;
  readonly taskId: string;
  readonly appId: string;
  readonly sessionId: string;
}

export interface FailedPiExecutionIdentity extends PiExecutionIdentity {
  readonly error: unknown;
}

interface PendingToolExecution {
  readonly toolName: string;
  readonly path?: string;
  readonly command?: string;
}

/** 收集一次 Pi Agent 执行期间产生的摘要、文件修改和命令检查结果。 */
export class PiExecutionCollector {
  private summary = "";
  private readonly changedFiles = new Set<string>();
  private readonly checks: AppCodeCheckResult[] = [];
  private readonly pendingTools = new Map<string, PendingToolExecution>();

  collect(event: AgentSessionEvent): void {
    if (event.type === "message_end") {
      this.collectSummary(event);
      return;
    }

    if (event.type === "tool_execution_start") {
      this.collectToolStart(event);
      return;
    }

    if (event.type === "tool_execution_end") {
      this.collectToolEnd(event);
    }
  }

  createResult(identity: PiExecutionIdentity): AppCodeExecutionResult {
    return {
      ...identity,
      status: "completed",
      summary: this.summary || "Pi Agent 已完成任务，但没有返回执行摘要。",
      changedFiles: [...this.changedFiles],
      checks: [...this.checks]
    };
  }

  createFailedResult(input: FailedPiExecutionIdentity): AppCodeExecutionResult {
    const { error, ...identity } = input;

    return {
      ...identity,
      status: "failed",
      summary: this.summary || "Pi Agent 执行任务失败。",
      changedFiles: [...this.changedFiles],
      checks: [...this.checks],
      error: {
        code: AppCodeTaskError.AGENT_EXECUTION_FAILED,
        message: getErrorMessage(error)
      }
    };
  }

  private collectSummary(event: Extract<AgentSessionEvent, { type: "message_end" }>): void {
    if (event.message.role !== "assistant") {
      return;
    }

    const summary = event.message.content
      .filter((content) => content.type === "text")
      .map((content) => content.text)
      .join("\n")
      .trim();

    if (summary.length > 0) {
      this.summary = summary;
    }
  }

  private collectToolStart(event: Extract<AgentSessionEvent, { type: "tool_execution_start" }>): void {
    this.pendingTools.set(event.toolCallId, {
      toolName: event.toolName,
      path: getStringProperty(event.args, "path"),
      command: getStringProperty(event.args, "command")
    });
  }

  private collectToolEnd(event: Extract<AgentSessionEvent, { type: "tool_execution_end" }>): void {
    const pendingTool = this.pendingTools.get(event.toolCallId);
    this.pendingTools.delete(event.toolCallId);

    if (!pendingTool) {
      return;
    }

    if (!event.isError && (pendingTool.toolName === "edit" || pendingTool.toolName === "write") && pendingTool.path) {
      this.changedFiles.add(pendingTool.path);
    }

    if (pendingTool.toolName === "bash" && pendingTool.command) {
      this.checks.push({
        name: pendingTool.command,
        status: event.isError ? "failed" : "passed",
        output: getToolOutput(event.result)
      });
    }
  }
}

function getStringProperty(value: unknown, property: string): string | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const propertyValue = (value as Record<string, unknown>)[property];
  return typeof propertyValue === "string" ? propertyValue : undefined;
}

function getToolOutput(result: unknown): string | undefined {
  if (typeof result !== "object" || result === null) {
    return undefined;
  }

  const { content } = result as { content?: unknown };
  if (!Array.isArray(content)) {
    return undefined;
  }

  const output = content
    .filter(isTextContent)
    .map((item) => item.text)
    .join("\n")
    .trim();

  return output.length > 0 ? output : undefined;
}

function isTextContent(value: unknown): value is { type: "text"; text: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>).type === "text" &&
    typeof (value as Record<string, unknown>).text === "string"
  );
}
