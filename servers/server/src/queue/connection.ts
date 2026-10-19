import IORedis from "ioredis";

import { requireRedisUrl } from "./config";

/**
 * 新建一条 Redis 连接。BullMQ 的 Worker / QueueEvents 用阻塞命令，必须各自独占连接，
 * 不能和 Queue 共用；`maxRetriesPerRequest: null` 是 BullMQ 对阻塞连接的硬性要求。
 */
export function createRedisConnection(): IORedis {
  return new IORedis(requireRedisUrl(), { maxRetriesPerRequest: null });
}
