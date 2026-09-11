import { Hono } from "hono";

import { getEvalRun, listEvalRuns } from "../services/eval.server";

export const evalRouter = new Hono()
  .get("/runs", async (c) => {
    // 列数默认 12：再多横向就滚不动了，趋势看最近十来次足够
    const limit = Math.min(50, Math.max(1, Number(c.req.query("limit") ?? 12)));
    return c.json(await listEvalRuns(limit));
  })
  .get("/runs/:runId", async (c) => {
    return c.json(await getEvalRun(c.req.param("runId")));
  });
