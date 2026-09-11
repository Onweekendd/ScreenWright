import { spawn } from "node:child_process";

import { terminateChildProcessTree } from "../../shared/process-tree";
import type { AppSandbox, SandboxCommand, SandboxCommandResult } from "../app-sandbox";

const DEFAULT_TIMEOUT_MS = 120_000;

interface LocalCommand {
  readonly script: string;
  readonly timeoutMs: number;
  readonly signal?: AbortSignal;
}

/**
 * 使用本地子进程在已有 App 工作区中执行命令。
 *
 * 该实现仅用于本地开发和测试。固定进程工作目录并不能提供文件系统、
 * 进程或网络层面的安全隔离，因此不能用于执行不可信命令。
 */
export class LocalSandbox implements AppSandbox {
  /**
   * @param appId 当前沙箱对应的 App 唯一标识。
   * @param workspacePath 启动命令时使用的受信任本地工作目录。
   * 该路径必须由 {@link LocalSandboxManager} 完成真实路径解析和边界校验。
   */
  constructor(
    readonly appId: string,
    readonly workspacePath: string
  ) {}

  /**
   * 以 App 工作区作为初始工作目录执行 Shell 脚本。
   *
   * 标准输出和标准错误会被分别收集。非零退出码属于正常的命令执行结果，
   * 只有进程无法启动等执行基础设施错误才会使 Promise 拒绝。
   *
   * @throws {TypeError} 当脚本内容为空时抛出。
   * @throws {RangeError} 当 `timeoutMs` 不是有限正数时抛出。
   */
  async run(command: SandboxCommand): Promise<SandboxCommandResult> {
    const localCommand = normalizeCommand(command);

    if (localCommand.signal?.aborted) {
      throw new DOMException("The operation was aborted", "AbortError");
    }

    const child = startProcess(localCommand.script, this.workspacePath);
    return waitForProcess({
      child,
      timeoutMs: localCommand.timeoutMs,
      signal: localCommand.signal
    });
  }
}

/** 在创建进程前校验命令参数，并补充默认值。 */
function normalizeCommand(command: SandboxCommand): LocalCommand {
  const { script, timeoutMs = DEFAULT_TIMEOUT_MS, signal } = command;

  if (script.trim().length === 0) {
    throw new TypeError("Sandbox command script cannot be empty");
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError("Sandbox command timeoutMs must be greater than zero");
  }

  return { script, timeoutMs, signal };
}

/** 启动当前平台的 Shell，并关闭交互式标准输入。 */
function startProcess(script: string, workspacePath: string) {
  return spawn(script, {
    cwd: workspacePath,
    detached: process.platform !== "win32",
    shell: true,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"]
  });
}

/**
 * 收集进程输出，并在进程关闭时确保 Promise 只完成一次。
 * 超过时限后会终止整个进程树，并将结束原因标记为 `timed_out`。
 */
interface WaitForProcessInput {
  readonly child: ReturnType<typeof startProcess>;
  readonly timeoutMs: number;
  readonly signal?: AbortSignal;
}

function waitForProcess(input: WaitForProcessInput): Promise<SandboxCommandResult> {
  const { child, timeoutMs, signal } = input;

  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let requestedTermination: "timed_out" | "aborted" | undefined;
    let settled = false;

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    const timeout = setTimeout(() => {
      if (requestedTermination) {
        return;
      }

      requestedTermination = "timed_out";
      void terminateChildProcessTree(child);
    }, timeoutMs);

    const abort = () => {
      if (requestedTermination) {
        return;
      }

      requestedTermination = "aborted";
      void terminateChildProcessTree(child);
    };

    if (signal?.aborted) {
      abort();
    } else {
      signal?.addEventListener("abort", abort, { once: true });
    }

    child.once("error", (error) => {
      settle(() => reject(error));
    });

    child.once("close", (exitCode, exitSignal) => {
      settle(() => {
        resolve({
          exitCode,
          stdout,
          stderr,
          termination: requestedTermination ?? (exitSignal ? "signaled" : "exited")
        });
      });
    });

    function settle(complete: () => void) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
      complete();
    }
  });
}
