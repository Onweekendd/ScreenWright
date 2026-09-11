/* eslint-disable no-console */
// tauri dev 被 Ctrl+C / IDE 停止按钮中断时，只有 Tauri 主进程退出，它拉起的子进程会变成孤儿：
//   - sidecar：target/debug/node.exe 还在跑 → tauri-build 覆盖 sidecar 时 Access is denied
//   - beforeDevCommand 的 Vite 还监听 5173 → Port 5173 is already in use
// 启动前把这两类残留进程清掉。找不到就静默跳过，绝不让 dev 因为清理失败而起不来。
import { execSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const targetDir = resolve(here, "..", "src-tauri", "target");
const DEV_PORT = 5173;

const sh = (cmd) => {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};
const ps = (script) => sh(`powershell -NoProfile -NonInteractive -Command "${script.replace(/"/g, '\\"')}"`);

const parsePids = (out) =>
  [...new Set(out.split(/\s+/).filter((s) => /^\d+$/.test(s)).map(Number))].filter((pid) => pid !== process.pid);

// 1. 从 target 目录里启动的 exe（sidecar node.exe、上次没退干净的 app 本体）
const findTargetPids = () => {
  if (process.platform === "win32") {
    const prefix = targetDir;
    return parsePids(ps(`Get-Process | Where-Object { $_.Path -like '${prefix}*' } | ForEach-Object { $_.Id }`));
  }
  return parsePids(sh(`pgrep -f '${targetDir}'`));
};

// 2. 监听 dev 端口的进程
const findPortPids = () => {
  if (process.platform === "win32") {
    return parsePids(
      ps(`Get-NetTCPConnection -LocalPort ${DEV_PORT} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { $_.OwningProcess }`),
    );
  }
  return parsePids(sh(`lsof -ti tcp:${DEV_PORT} -s tcp:LISTEN`));
};

const kill = (pid, why) => {
  const ok =
    process.platform === "win32"
      ? sh(`taskkill /PID ${pid} /T /F`) !== "" || !findTargetPids().includes(pid)
      : (() => {
          try {
            process.kill(pid, "SIGKILL");
            return true;
          } catch {
            return false;
          }
        })();
  console.log(`[kill-stale] ${ok ? "killed" : "failed to kill"} pid ${pid} (${why})`);
};

const stale = [
  ...findTargetPids().map((pid) => [pid, "stale process under src-tauri/target"]),
  ...findPortPids().map((pid) => [pid, `listening on :${DEV_PORT}`]),
];
const seen = new Set();
for (const [pid, why] of stale) {
  if (seen.has(pid)) continue;
  seen.add(pid);
  kill(pid, why);
}
if (seen.size === 0) console.log("[kill-stale] nothing to clean");
