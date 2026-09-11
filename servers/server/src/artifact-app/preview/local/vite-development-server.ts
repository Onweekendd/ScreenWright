import { type ChildProcess, spawn } from "node:child_process";
import { createServer } from "node:http";
import { request } from "node:http";

import { getErrorMessage } from "../../shared/error-message";
import { terminateChildProcessTree } from "../../shared/process-tree";

const PREVIEW_HOST = "127.0.0.1";
const DEFAULT_START_TIMEOUT_MS = 30_000;
const READINESS_RETRY_MS = 100;
const MAX_DIAGNOSTIC_LENGTH = 16_384;
const VITE_START_FAILED_MESSAGE = "Vite failed to start";

export interface StartViteDevelopmentServerInput {
  readonly appId: string;
  readonly workspacePath: string;
  readonly publicPath: string;
}

/** 由 PreviewManager 持有的长期 Vite 子进程。 */
export interface ViteDevelopmentServerProcess {
  /** 进程树根进程（cmd/pnpm/vite 链的最外层）的进程 ID，用于持久化回收。 */
  readonly pid: number;
  readonly port: number;
  readonly targetUrl: string;
  readonly closed: Promise<void>;
  stop(): Promise<void>;
}

export type StartViteDevelopmentServer = (
  input: StartViteDevelopmentServerInput
) => Promise<ViteDevelopmentServerProcess>;

/** 在本地项目目录中启动一个受控的 Vite 开发服务器。 */
export const startViteDevelopmentServer: StartViteDevelopmentServer = async (input) => {
  const port = await reserveLocalPort();
  const child = startViteProcess({ ...input, port });
  const processState = observeProcess(child);
  const targetUrl = `http://${PREVIEW_HOST}:${port}`;

  try {
    /**
     * 等待 Vite 变为可用状态，或者在失败或退出时抛出异常。
     * 这里使用 Promise.race 来同时等待多个事件，确保在任何情况下都能正确处理。
     * - waitUntilReady: 等待 Vite 变为可用状态。
     * - processState.failed: 如果子进程启动失败，立即抛出异常。
     * - processState.exited: 如果子进程在变为可用状态之前退出，抛出异常并附带诊断信息。
     */
    await Promise.race([
      waitUntilReady({ url: `${targetUrl}${input.publicPath}`, timeoutMs: DEFAULT_START_TIMEOUT_MS }),
      processState.failed,
      processState.exited.then(() => {
        throw new Error(`Vite exited before becoming ready.${formatDiagnostics(processState.getDiagnostics())}`);
      })
    ]);
  } catch (error) {
    /**
     * 出错了就杀掉子进程，避免孤儿进程。
     */
    void terminateChildProcessTree(child);
    await processState.exited;
    throw new Error(
      `${getErrorMessage(error, VITE_START_FAILED_MESSAGE)}${formatDiagnostics(processState.getDiagnostics())}`,
      { cause: error }
    );
  }

  if (child.pid === undefined) {
    void terminateChildProcessTree(child);
    await processState.exited;
    throw new Error("Vite process was not assigned a PID");
  }

  let stopPromise: Promise<void> | undefined;

  return {
    pid: child.pid,
    port,
    targetUrl,
    closed: processState.exited,
    stop: () => {
      stopPromise ??= stopProcess({ child, exited: processState.exited });
      return stopPromise;
    }
  };
};

interface StartViteProcessInput extends StartViteDevelopmentServerInput {
  readonly port: number;
}

function startViteProcess(input: StartViteProcessInput): ChildProcess {
  const viteArgs = [
    "dev",
    "--host",
    PREVIEW_HOST,
    "--port",
    String(input.port),
    "--strictPort",
    "--base",
    input.publicPath
  ];
  const command = resolvePnpmCommand(viteArgs);

  return spawn(command.executable, command.args, {
    cwd: input.workspacePath,
    detached: process.platform !== "win32",
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });
}

function resolvePnpmCommand(args: readonly string[]): { executable: string; args: string[] } {
  if (process.platform === "win32") {
    return {
      executable: process.env.ComSpec || "cmd.exe",
      args: ["/d", "/s", "/c", ["pnpm", ...args].join(" ")]
    };
  }

  return { executable: "pnpm", args: [...args] };
}

interface ObservedProcess {
  readonly exited: Promise<void>;
  readonly failed: Promise<never>;
  getDiagnostics(): string;
}

/**
 * 记录子进程的输出并提供退出和失败的 Promise。
 * @param child 子进程对象。
 * @returns  一个对象，包含 exited 和 failed Promise，以及获取诊断信息的函数。
 */
function observeProcess(child: ChildProcess): ObservedProcess {
  let diagnostics = "";
  const appendDiagnostics = (chunk: Buffer | string) => {
    diagnostics = `${diagnostics}${chunk.toString()}`.slice(-MAX_DIAGNOSTIC_LENGTH);
  };

  child.stdout?.on("data", appendDiagnostics);
  child.stderr?.on("data", appendDiagnostics);

  const exited = new Promise<void>((resolve) => {
    child.once("close", () => resolve());
  });
  const failed = new Promise<never>((_resolve, reject) => {
    child.once("error", reject);
  });

  return { exited, failed, getDiagnostics: () => diagnostics };
}

/**
 * 创建一个 Vite 开发服务器并分配一个本地端口。
 * @returns 分配的端口号。
 */
function reserveLocalPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, PREVIEW_HOST, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : undefined;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        if (port === undefined) {
          reject(new Error("Unable to allocate a local preview port"));
          return;
        }
        resolve(port);
      });
    });
  });
}

interface WaitUntilReadyInput {
  readonly url: string;
  readonly timeoutMs: number;
}

async function waitUntilReady(input: WaitUntilReadyInput): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < input.timeoutMs) {
    if (await canConnect(input.url)) {
      return;
    }
    await delay(READINESS_RETRY_MS);
  }

  throw new Error(`Vite did not become ready within ${input.timeoutMs}ms`);
}

function canConnect(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = request(url, { method: "GET" }, (response) => {
      response.resume();
      resolve(true);
    });
    req.once("error", () => resolve(false));
    req.setTimeout(1_000, () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

function delay(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeoutMs));
}

async function stopProcess(input: { child: ChildProcess; exited: Promise<void> }): Promise<void> {
  void terminateChildProcessTree(input.child);
  await input.exited;
}

function formatDiagnostics(diagnostics: string): string {
  const trimmed = diagnostics.trim();
  return trimmed ? `\n${trimmed}` : "";
}
