/**
 * 队列运行模式。
 * - redis：任务进 BullMQ，由独立的 worker 进程消费（生产形态）；
 * - inline：不连 Redis，任务在当前进程内直接执行（本地开发 / 没起 Redis 时的退路）。
 *
 * 显式用 QUEUE_MODE 指定；没指定时看有没有 REDIS_URL。
 */
export type QueueMode = "redis" | "inline";

export function getQueueMode(env: NodeJS.ProcessEnv = process.env): QueueMode {
  const explicit = env.QUEUE_MODE;
  if (explicit) {
    if (explicit !== "redis" && explicit !== "inline") {
      throw new Error(`QUEUE_MODE 只能是 redis 或 inline，收到：${explicit}`);
    }
    return explicit;
  }
  return env.REDIS_URL ? "redis" : "inline";
}

/** 需要连 Redis 的地方（队列客户端、worker）调用；没配直接报错，不静默降级。 */
export function requireRedisUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.REDIS_URL;
  if (!url) {
    throw new Error("未配置 REDIS_URL：队列客户端 / worker 需要 Redis");
  }
  return url;
}

/** BullMQ key 前缀。多个环境共用一个 Redis 时靠它隔离；测试也用它拿到独立的命名空间。 */
export function getQueuePrefix(env: NodeJS.ProcessEnv = process.env): string {
  return env.QUEUE_PREFIX || "funbi";
}
