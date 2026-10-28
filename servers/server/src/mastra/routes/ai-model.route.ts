import { type Context, Hono } from "hono";

import { fail, ok } from "@/lib/http/envelope";

import { MODEL_ROLES, type ModelRole } from "../provider/model-registry";
import {
  AiModelNotFoundError,
  createAiModel,
  deleteAiModel,
  LastAiModelError,
  listAiModels,
  reindexEmbeddings,
  setDefaultAiModel,
  testAiModel,
  updateAiModel,
  type UpdateAiModelInput
} from "../services/ai-model/ai-model.server";
import {
  getThreadModels,
  isThreadModelRole,
  setThreadModel,
  ThreadModelRoleMismatchError
} from "../services/ai-model/thread-model.server";

/**
 * AI 模型配置（前端「设置」页 + 对话输入框模型选择）。挂在 /customApi 下：
 *   GET    /customApi/ai-models                       全部配置（key 脱敏）
 *   POST   /customApi/ai-models                       新增一条 { role, ...字段, copyKeyFrom? }
 *   PUT    /customApi/ai-models/:id                   更新一条（apiKey 空则不覆盖）
 *   DELETE /customApi/ai-models/:id                   删除一条（角色最后一条不让删）
 *   POST   /customApi/ai-models/:id/default           设为该角色默认
 *   POST   /customApi/ai-models/:role/test            用传入的临时配置验证连通性 { ...字段, id? }
 *   POST   /customApi/ai-models/embedding/reindex     换嵌入模型后重建向量索引
 *   GET    /customApi/thread-models/:threadId         对话的模型选择（只含覆盖了默认的角色）
 *   PUT    /customApi/thread-models/:threadId/:role   选定 { aiModelId }，null 改回默认
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

const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

const readBody = async (c: Context) => (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

const toInput = (body: Record<string, unknown>): UpdateAiModelInput => ({
  name: str(body.name),
  baseUrl: str(body.baseUrl),
  apiKey: str(body.apiKey),
  modelId: str(body.modelId),
  contextLength: num(body.contextLength),
  dimensions: num(body.dimensions)
});

/** 业务错误映射成 4xx，其余抛给全局错误处理 */
const handleKnownError = (c: Context, e: unknown) => {
  if (e instanceof AiModelNotFoundError) {
    return c.json(fail(null, e.message, 404), 404);
  }
  if (e instanceof LastAiModelError || e instanceof ThreadModelRoleMismatchError) {
    return c.json(fail(null, e.message, 400), 400);
  }
  throw e;
};

export const aiModelRouter = new Hono()
  .get("/ai-models", async (c) => {
    return c.json(ok(await listAiModels()));
  })
  .post("/ai-models", async (c) => {
    const body = await readBody(c);
    const role = str(body.role) ?? "";
    if (!isRole(role)) {
      return c.json(fail(null, "未知角色", 400), 400);
    }
    try {
      return c.json(ok(await createAiModel(role, { ...toInput(body), copyKeyFrom: str(body.copyKeyFrom) })));
    } catch (e) {
      return handleKnownError(c, e);
    }
  })
  .post("/ai-models/embedding/reindex", async (c) => {
    return c.json(ok(await reindexEmbeddings(), "向量索引已重建"));
  })
  .post("/ai-models/:role/test", async (c) => {
    const role = c.req.param("role");
    if (!isRole(role)) {
      return c.json(fail(null, "未知角色", 400), 400);
    }
    const body = await readBody(c);
    const result = await testAiModel(
      role,
      {
        baseUrl: str(body.baseUrl) ?? "",
        apiKey: str(body.apiKey) ?? "",
        modelId: str(body.modelId) ?? "",
        dimensions: num(body.dimensions)
      },
      str(body.id)
    );
    return c.json(ok(result));
  })
  .put("/ai-models/:id", async (c) => {
    try {
      return c.json(ok(await updateAiModel(c.req.param("id"), toInput(await readBody(c)))));
    } catch (e) {
      return handleKnownError(c, e);
    }
  })
  .delete("/ai-models/:id", async (c) => {
    try {
      await deleteAiModel(c.req.param("id"));
      return c.json(ok(null, "已删除"));
    } catch (e) {
      return handleKnownError(c, e);
    }
  })
  .post("/ai-models/:id/default", async (c) => {
    try {
      return c.json(ok(await setDefaultAiModel(c.req.param("id"))));
    } catch (e) {
      return handleKnownError(c, e);
    }
  })
  .get("/thread-models/:threadId", async (c) => {
    return c.json(ok(await getThreadModels(c.req.param("threadId"))));
  })
  .put("/thread-models/:threadId/:role", async (c) => {
    const role = c.req.param("role");
    if (!isThreadModelRole(role)) {
      return c.json(fail(null, "该角色不支持按对话选择", 400), 400);
    }
    const body = await readBody(c);
    const aiModelId = body.aiModelId === null ? null : str(body.aiModelId);
    if (aiModelId === undefined) {
      return c.json(fail(null, "缺少 aiModelId", 400), 400);
    }
    try {
      return c.json(ok(await setThreadModel(c.req.param("threadId"), role, aiModelId)));
    } catch (e) {
      return handleKnownError(c, e);
    }
  });
