import type { AgentSession } from "@earendil-works/pi-coding-agent";

import type { AppCodeExecutionResult, AppCodeTask } from "@/artifact-app/contracts";
import type { AppSandbox } from "@/artifact-app/sandbox/app-sandbox";

import { PiExecutionCollector } from "./pi-execution-collector";
import { runInPiRecordingTurn } from "./record/pi-recording-turn";

export type PiAgentRunnerSession = Pick<AgentSession, "prompt" | "sessionId" | "subscribe">;

export interface RunPiAgentInput {
  readonly taskListId: string;
  readonly task: AppCodeTask;
  readonly sandbox: AppSandbox;
  readonly session: PiAgentRunnerSession;
}

/** 驱动 Pi Agent 在沙箱中执行编码任务的运行器抽象。 */
export interface ArtifactAppPiAgentRunner {
  /** 在给定沙箱与会话中执行任务并返回执行结果。 */
  run(input: RunPiAgentInput): Promise<AppCodeExecutionResult>;
}

/**
 * 使用已经准备好的 Pi Session 执行一次应用编码任务。
 *
 * Runner 只负责启动 Agent 并收集本次执行结果，不创建 Sandbox、Session，
 * 也不读取或更新 TaskManager。
 */
export class PiAgentRunner {
  /**
   * 一次 run 就是 LLM 档案里的一个 turn，turn 内每次模型往返落一个 step_NN.json。
   * 未开启 RECORD_LLM 时 runInPiRecordingTurn 直接执行，行为与不录制时完全一致。
   */
  async run(input: RunPiAgentInput): Promise<AppCodeExecutionResult> {
    return runInPiRecordingTurn({ appId: input.sandbox.appId, taskListId: input.taskListId }, () =>
      this.execute(input)
    );
  }

  private async execute(input: RunPiAgentInput): Promise<AppCodeExecutionResult> {
    const { taskListId, task, sandbox, session } = input;
    const execution = new PiExecutionCollector();
    const unsubscribe = session.subscribe((event) => execution.collect(event));

    try {
      await session.prompt(createTaskPrompt(task));

      return execution.createResult({
        taskListId,
        taskId: task.id,
        appId: sandbox.appId,
        sessionId: session.sessionId
      });
    } catch (error: unknown) {
      return execution.createFailedResult({
        taskListId,
        taskId: task.id,
        appId: sandbox.appId,
        sessionId: session.sessionId,
        error
      });
    } finally {
      unsubscribe();
    }
  }
}

export function createTaskPrompt(task: AppCodeTask): string {
  const acceptanceCriteria = task.metadata.acceptanceCriteria
    .map((criterion, index) => `${index + 1}. ${criterion}`)
    .join("\n");

  return [
    `任务：${task.subject}`,
    "",
    task.description,
    "",
    "验收标准：",
    acceptanceCriteria,
    "",
    "请直接在当前项目中完成任务。完成后简要说明修改内容，以及已经执行的检查。"
  ].join("\n");
}
