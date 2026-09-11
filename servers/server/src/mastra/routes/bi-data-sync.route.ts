import { zValidator } from "@hono/zod-validator";
import type { ParsedLargeScreenInfo } from "@screenwright/types";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import {
  getComponentFormWorkspace,
  readScreenMeta,
  readWorkspaceFile,
  syncScreenData,
  syncScreenDescribe
} from "../services/bi-data-sync";
import {
  GetComponentRequestSchema,
  ReadWorkspaceFileRequestSchema,
  SyncScreenDataRequestSchema,
  SyncScreenDescribeRequestSchema
} from "../types/bi-data-sync";

export const biDataSyncRouter = new Hono()
  .post("/sync-global-data", zValidator("json", SyncScreenDataRequestSchema), async (c) => {
    try {
      const body = c.req.valid("json");
      syncScreenData({
        id: body.id,
        cacheTime: body.cacheTime,
        parsedLargeScreenInfo: body.parsedLargeScreenInfo as ParsedLargeScreenInfo
      });
      return c.json({ success: true });
    } catch (e) {
      throw new HTTPException(500, {
        message: e instanceof Error ? e.message : "同步失败"
      });
    }
  })
  .post("/sync-screen-describe", zValidator("json", SyncScreenDescribeRequestSchema), async (c) => {
    try {
      const body = c.req.valid("json");
      syncScreenDescribe({ id: body.id, describe: body.describe });
      return c.json({ success: true });
    } catch (e) {
      throw new HTTPException(500, {
        message: e instanceof Error ? e.message : "同步描述失败"
      });
    }
  })
  .get("/bi-data-sync/meta", async (c) => {
    try {
      const id = c.req.query("id") ?? "";
      const meta = readScreenMeta(id);
      return c.json(meta);
    } catch (e) {
      throw new HTTPException(500, {
        message: e instanceof Error ? e.message : "读取失败"
      });
    }
  })
  .get("/bi-data-sync/component", async (c) => {
    try {
      const params = GetComponentRequestSchema.parse({
        screenWithVersion: c.req.query("screenWithVersion") ?? "",
        componentId: Number(c.req.query("componentId"))
      });
      const component = getComponentFormWorkspace(params.screenWithVersion, params.componentId);
      return c.json(component);
    } catch (e) {
      if (e instanceof Error && "issues" in e) {
        throw new HTTPException(400, { message: e.message });
      }
      throw new HTTPException(404, {
        message: e instanceof Error ? e.message : "未知错误"
      });
    }
  })
  .post("/bi-data-sync/workspace-file", zValidator("json", ReadWorkspaceFileRequestSchema), async (c) => {
    try {
      const body = c.req.valid("json");
      const result = await readWorkspaceFile(body.path);
      return c.json(result);
    } catch (e) {
      if (e instanceof Error && e.message.includes("不存在")) {
        throw new HTTPException(404, { message: e.message });
      }
      throw new HTTPException(500, { message: e instanceof Error ? e.message : "读取文件失败" });
    }
  });
