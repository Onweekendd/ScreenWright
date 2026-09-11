export interface SandboxCommand {
  /** 交给沙箱 shell 执行的命令。 */
  readonly script: string;

  /** 命令超时时间。 */
  readonly timeoutMs?: number;

  /** 调用方取消命令执行的信号。 */
  readonly signal?: AbortSignal;
}

export interface SandboxCommandResult {
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly termination: "exited" | "signaled" | "timed_out" | "aborted";
}

export interface AppSandbox {
  readonly appId: string;

  /**
   * 执行进程看到的工作目录。
   * 本地实现可能是本地路径，容器实现通常是 /workspace。
   */
  readonly workspacePath: string;

  run(command: SandboxCommand): Promise<SandboxCommandResult>;
}
