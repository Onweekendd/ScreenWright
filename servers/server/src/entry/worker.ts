import { createImageWorker } from "@/queue/image/image-worker";
import { createVideoWorker } from "@/queue/video/video-worker";

import type { Stoppable } from "./http";

/**
 * worker 角色：不监听 HTTP，只消费 BullMQ 队列。
 * 目前有生图、视频生成两个队列；后续新增的任务类型在这里各自 create 一个 worker 即可。
 * 入队用的队列客户端只在 ai 进程里创建，由 mount-ai 负责关闭；worker 里的任务若以后要再派任务，记得在这里一并关闭。
 */
export function startWorker(): Stoppable {
  const workers = [createImageWorker(), createVideoWorker()];
  console.log(`[worker] 已启动，消费队列：${workers.map((w) => w.name).join(", ")}`);

  return {
    // 不带 force：先停止领取新任务、等在途任务结束，再释放 worker 自己的 Redis 连接
    close: async () => {
      await Promise.all(workers.map((w) => w.close()));
    }
  };
}
