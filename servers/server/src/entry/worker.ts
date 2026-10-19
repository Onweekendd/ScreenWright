import { closeImageQueueClient } from "@/queue/image-client";
import { createImageWorker } from "@/queue/image-worker";

import type { Stoppable } from "./http";

/**
 * worker 角色：不监听 HTTP，只消费 BullMQ 队列。
 * 目前只有生图一个队列；后续新增的任务类型在这里各自 create 一个 worker 即可。
 */
export function startWorker(): Stoppable {
  const workers = [createImageWorker()];
  console.log(`[worker] 已启动，消费队列：${workers.map((w) => w.name).join(", ")}`);

  return {
    close: async () => {
      // 先停止领取新任务并等在途任务结束，再释放连接
      await Promise.all(workers.map((w) => w.close()));
      await closeImageQueueClient();
    }
  };
}
