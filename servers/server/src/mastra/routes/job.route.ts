import { Hono } from "hono";

import { getGenerationProgress } from "@/mastra/services/generation-progress";
import { getQueueMode } from "@/queue/config";
import { getImageJobInfo } from "@/queue/image-client";

/** 队列任务状态查询（挂在 /customApi/jobs 下，随 /customApi/* 一起要求登录）。 */
export const jobRouter = new Hono()
  .get("/image/:id", async (c) => {
    if (getQueueMode() !== "redis") {
      return c.json({ message: "队列未启用（inline 模式没有任务可查）" }, 404);
    }
    const info = await getImageJobInfo(c.req.param("id"));
    if (!info) {
      return c.json({ message: "任务不存在或已过保留期" }, 404);
    }
    return c.json(info);
  })
  // 生图 / 生视频的工具调用进度：前端工具卡片按 toolCallId 轮询。查不到（还没开始、已过期、
  // 工具不是生成类）也回 200，让前端按「未知」处理，不用把 404 当错误刷控制台
  .get("/progress/:toolCallId", (c) => {
    return c.json(getGenerationProgress(c.req.param("toolCallId")) ?? { status: "unknown" });
  });
