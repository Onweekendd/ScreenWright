import {
  type BashOperations,
  type CreateAgentSessionOptions,
  createBashToolDefinition,
  defineTool
} from "@earendil-works/pi-coding-agent";

import type { AppSandbox } from "@/artifact-app/sandbox/app-sandbox";

type PiCustomTool = NonNullable<CreateAgentSessionOptions["customTools"]>[number];

interface ExecuteSandboxCommandInput {
  readonly sandbox: AppSandbox;
  readonly command: string;
  readonly onData: (data: Buffer) => void;
  readonly signal?: AbortSignal;
  readonly timeoutSeconds?: number;
}

/**
 * 创建一个名为 `bash` 的 Pi 工具，并将命令执行委托给当前 AppSandbox。
 *
 * 该工具会覆盖 Pi 同名的本地主机 Bash 工具，确保 Agent 不会绕过 Sandbox
 * 直接在 Screenwright 进程所在主机执行命令。
 */
export function createSandboxBashTool(sandbox: AppSandbox): PiCustomTool {
  return defineTool(
    createBashToolDefinition(sandbox.workspacePath, {
      exposeSessionEnvironment: false,
      operations: createSandboxBashOperations(sandbox)
    })
  );
}

/** 将 Pi BashOperations 适配到 AppSandbox.run。 */
export function createSandboxBashOperations(sandbox: AppSandbox): BashOperations {
  return {
    exec: async (command, _cwd, options) =>
      executeSandboxCommand({
        sandbox,
        command,
        onData: options.onData,
        signal: options.signal,
        timeoutSeconds: options.timeout
      })
  };
}

async function executeSandboxCommand(input: ExecuteSandboxCommandInput): Promise<{ exitCode: number | null }> {
  const { sandbox, command, onData, signal, timeoutSeconds } = input;

  if (signal?.aborted) {
    throw new Error("aborted");
  }

  const result = await sandbox.run({
    script: command,
    timeoutMs: timeoutSeconds === undefined ? undefined : timeoutSeconds * 1_000,
    signal
  });

  writeOutput(onData, result.stdout);
  writeOutput(onData, result.stderr);

  if (signal?.aborted || result.termination === "aborted") {
    throw new Error("aborted");
  }

  if (result.termination === "timed_out") {
    throw new Error(timeoutSeconds === undefined ? "Sandbox command timed out" : `timeout:${timeoutSeconds}`);
  }

  if (result.termination === "signaled") {
    throw new Error("Sandbox command was terminated by a signal");
  }

  return { exitCode: result.exitCode };
}

function writeOutput(onData: (data: Buffer) => void, output: string): void {
  if (output.length > 0) {
    onData(Buffer.from(output, "utf8"));
  }
}
