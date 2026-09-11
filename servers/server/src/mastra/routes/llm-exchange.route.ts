import { Hono } from "hono";

import {
  getContentByObjectKey,
  getLlmExchangeContent,
  getThreadFileTree,
  listLlmExchangesByThread,
  listLlmExchangeThreads
} from "../services/llm-exchange.server";

export const llmExchangeRouter = new Hono()
  .get("/threads", async (c) => {
    const page = Math.max(1, Number(c.req.query("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(c.req.query("pageSize") ?? 20)));
    // 不传 evalRunId = 只看真实用户会话；传了 = 只看那一批 eval。两域互不重叠，见 service 注释
    return c.json(await listLlmExchangeThreads(page, pageSize, c.req.query("evalRunId")));
  })
  .get("/threads/:threadId/tree", async (c) => {
    return c.json(await getThreadFileTree(c.req.param("threadId")));
  })
  .get("/threads/:threadId", async (c) => {
    return c.json(await listLlmExchangesByThread(c.req.param("threadId")));
  })
  .get("/objects/content", async (c) => {
    const objectKey = c.req.query("objectKey");
    if (!objectKey) {
      return c.json({ code: 400, message: "objectKey is required" }, 400);
    }
    return c.json(await getContentByObjectKey(objectKey));
  })
  .get("/:id/content", async (c) => {
    return c.json(await getLlmExchangeContent(c.req.param("id")));
  });
