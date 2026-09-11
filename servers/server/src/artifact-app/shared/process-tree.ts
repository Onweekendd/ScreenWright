import { type ChildProcess, spawn } from "node:child_process";

/**
 * 终止 pid 对应的整棵进程树。
 *
 * Windows 使用 `taskkill /T /F`，其他平台向进程组发送 SIGTERM。终止失败时退回到
 * fallback（默认直接向 pid 发送 SIGTERM），仍然失败也不抛出：残留进程最多存活到
 * 下一次回收，不应阻断调用方的正常流程。
 *
 * @param pid 进程树根进程的进程 ID。
 * @param fallback 进程树终止失败时的兜底终止方式。
 * @returns Windows 上等待 taskkill 结束；其他平台立即完成。
 */
export function terminateProcessTree(pid: number, fallback?: () => void): Promise<void> {
  if (process.platform === "win32") {
    return terminateWindowsProcessTree(pid, fallback);
  }

  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    runFallback(pid, fallback);
  }

  return Promise.resolve();
}

/**
 * 终止子进程及其全部后代进程。
 *
 * 子进程尚未分配 PID 或已经结束时不做任何处理，终止失败时退回到 `child.kill`。
 *
 * @param child 由本进程启动的进程树根子进程。
 */
export function terminateChildProcessTree(child: ChildProcess): Promise<void> {
  if (child.pid === undefined || child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve();
  }

  return terminateProcessTree(child.pid, () => child.kill("SIGTERM"));
}

/** 启动 taskkill 终止整棵进程树，无论成功与否都在命令结束后完成。 */
function terminateWindowsProcessTree(pid: number, fallback?: () => void): Promise<void> {
  return new Promise((resolve) => {
    const terminator = spawn("taskkill", ["/pid", String(pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true
    });

    terminator.once("error", () => {
      runFallback(pid, fallback);
      resolve();
    });
    terminator.once("close", () => resolve());
  });
}

/** 执行兜底终止；调用方没有提供时直接向 pid 发送 SIGTERM。 */
function runFallback(pid: number, fallback?: () => void): void {
  if (fallback) {
    fallback();
    return;
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch {
    // 进程恰好已退出时无需处理。
  }
}
