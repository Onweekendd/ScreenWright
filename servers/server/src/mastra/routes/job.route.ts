import { Hono } from "hono";

import { getQueueMode } from "@/queue/config";
import { getImageJobInfo } from "@/queue/image-client";

/** 队列任务状态查询（挂在 /customApi/jobs 下，随 /customApi/* 一起要求登录）。 */
export const jobRouter = new Hono().get("/image/:id", async (c) => {
  if (getQueueMode() !== "redis") {
    return c.json({ message: "队列未启用（inline 模式没有任务可查）" }, 404);
  }
  const info = await getImageJobInfo(c.req.param("id"));
  if (!info) {
    return c.json({ message: "任务不存在或已过保留期" }, 404);
  }
  return c.json(info);
});
