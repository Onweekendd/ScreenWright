import { Hono } from "hono";

import { ok } from "@/lib/http/envelope";

import { MODEL_ROLES, type ModelRole } from "../provider/model-registry";
import {
  listAiModels,
  reindexEmbeddings,
  testAiModel,
  type UpdateAiModelInput,
  updateAiModel
} from "../services/ai-model.server";

/**
 * AI 模型配置（前端「设置」页）。挂在 /customApi 下：
 *   GET  /customApi/ai-models                     3 个角色配置（key 脱敏）
 *   PUT  /customApi/ai-models/:role               更新一个角色（apiKey 空则不覆盖）
 *   POST /customApi/ai-models/:role/test          用传入的临时配置验证连通性
 *   POST /customApi/ai-models/embedding/reindex   换嵌入模型后重建向量索引
 */

const isRole = (v: string): v is ModelRole => (MODEL_ROLES as readonly string[]).includes(v);

const num = (v: unknown): number | null | undefined => {
  if (v === undefined) {
    return undefined;
  }
  if (v === null || v === "") {
    return null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const aiModelRouter = new Hono()
  .get("/ai-models", async (c) => {
    return c.json(ok(await listAiModels()));
  })
  .put("/ai-models/:role", async (c) => {
    const role = c.req.param("role");
    if (!isRole(role)) {
      return c.json(ok(null, "未知角色"), 400);
    }
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const input: UpdateAiModelInput = {
      baseUrl: typeof body.baseUrl === "string" ? body.baseUrl : undefined,
      apiKey: typeof body.apiKey === "string" ? body.apiKey : undefined,
      modelId: typeof body.modelId === "string" ? body.modelId : undefined,
      contextLength: num(body.contextLength),
      dimensions: num(body.dimensions)
    };
    return c.json(ok(await updateAiModel(role, input)));
  })
  .post("/ai-models/:role/test", async (c) => {
    const role = c.req.param("role");
    if (!isRole(role)) {
      return c.json(ok(null, "未知角色"), 400);
    }
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const result = await testAiModel(role, {
      baseUrl: typeof body.baseUrl === "string" ? body.baseUrl : "",
      apiKey: typeof body.apiKey === "string" ? body.apiKey : "",
      modelId: typeof body.modelId === "string" ? body.modelId : ""
    });
    return c.json(ok(result));
  })
  .post("/ai-models/embedding/reindex", async (c) => {
    return c.json(ok(await reindexEmbeddings(), "向量索引已重建"));
  });
