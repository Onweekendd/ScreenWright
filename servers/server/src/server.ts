import { parseRole, runsHttp, runsWorker } from "./entry/role";
import { getQueueMode } from "./queue/config";

/**
 * 进程入口。具体干什么由 ROLE 决定（api | ai | worker | all，默认 all），见 entry/role.ts。
 * 各角色的实现用动态 import 加载：api 进程不会加载 Mastra，worker 进程不会加载 HTTP 路由。
 */
const role = parseRole();
console.log(`[boot] ROLE=${role}`);

const stoppables: Array<{ close(): Promise<void> }> = [];

if (runsHttp(role)) {
  const { startHttp } = await import("./entry/http");
  stoppables.push(await startHttp(role));
}

// all 角色没配 Redis（inline 模式）时没有队列可消费；单独的 worker 角色则必须有 Redis，缺了直接报错
if (runsWorker(role) && (role === "worker" || getQueueMode() === "redis")) {
  const { startWorker } = await import("./entry/worker");
  stoppables.push(startWorker());
}

let shuttingDown = false;

async function shutdown(): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  const results = await Promise.allSettled(stoppables.map((s) => s.close()));
  for (const r of results) {
    if (r.status === "rejected") {
      console.error("关闭服务时出错", r.reason);
      process.exitCode = 1;
    }
  }
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
