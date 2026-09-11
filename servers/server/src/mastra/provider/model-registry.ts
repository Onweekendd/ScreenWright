import { createOpenAI } from "@ai-sdk/openai";
import type { EmbeddingModel } from "ai";
import { extractReasoningMiddleware, wrapLanguageModel } from "ai";

import { prismaClient } from "@/mastra/storage/prisma";

import { createGenericFetch, inlineReasoningMiddleware, type WrapLMModel } from "./utils";

/**
 * 模型配置化：只 3 个角色，配置存 `ai_model` 表（前端「设置」页维护）。
 *
 * - **reasoning**：主 agent + 所有子 agent + 标题 + 摘要压缩 + 编排 + 截图 + subtab + artifact-app Pi
 * - **vision**：识图（vision-agent / semantic-layout-agent）
 * - **embedding**：组件 RAG 向量
 *
 * provider 一律按 OpenAI 兼容端点处理，reasoning 往返走 `provider/utils.ts` 的通用逻辑。
 * 配置热更新：写库后调 `warmModelConfigs()` 重建缓存，agent 的 `model: () => resolveXxx()`
 * 每次 run 重新解析，无需重启。
 */

export type ModelRole = "reasoning" | "vision" | "embedding";

export const MODEL_ROLES: readonly ModelRole[] = ["reasoning", "vision", "embedding"] as const;

export interface AiModelConfig {
  role: ModelRole;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  contextLength: number | null;
  dimensions: number | null;
}

/** 首启 seed 兜底：某行不存在时用 env 建。env 也空就建空行，等用户去设置页填。惰性读 env。 */
function envDefault(role: ModelRole): Omit<AiModelConfig, "role"> {
  const e = process.env;
  switch (role) {
    case "reasoning":
      return {
        baseUrl: e.REASONING_MODEL_BASE_URL ?? "",
        apiKey: e.REASONING_MODEL_API_KEY ?? "",
        modelId: e.REASONING_MODEL_ID ?? (e.REASONING_MODEL_API_KEY ? "deepseek-v4-flash" : ""),
        contextLength: 1_000_000,
        dimensions: null
      };
    case "vision":
      return {
        baseUrl: e.VISION_MODEL_BASE_URL ?? "",
        apiKey: e.VISION_MODEL_API_KEY ?? "",
        modelId: e.VISION_MODEL_ID ?? (e.VISION_MODEL_API_KEY ? "gemini-3.1-flash-lite" : ""),
        contextLength: null,
        dimensions: null
      };
    case "embedding":
      return {
        baseUrl: e.EMBEDDING_MODEL_BASE_URL ?? "",
        apiKey: e.EMBEDDING_MODEL_API_KEY ?? "",
        modelId: e.EMBEDDING_MODEL_ID ?? (e.EMBEDDING_MODEL_API_KEY ? "BAAI/bge-large-zh-v1.5" : ""),
        contextLength: null,
        dimensions: Number(e.EMBEDDING_MODEL_DIMENSIONS) || 1024
      };
  }
}

const cache = new Map<ModelRole, AiModelConfig>();

const toConfig = (row: {
  role: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  contextLength: number | null;
  dimensions: number | null;
}): AiModelConfig => ({
  role: row.role as ModelRole,
  baseUrl: row.baseUrl,
  apiKey: row.apiKey,
  modelId: row.modelId,
  contextLength: row.contextLength,
  dimensions: row.dimensions
});

/**
 * 从库里读 3 个角色配置进同步缓存；缺行用 env 兜底 seed。
 * 在 `runtime.ts` 顶层 await、以及每次写 `ai_model` 后调用。
 */
export async function warmModelConfigs(): Promise<void> {
  cache.clear();
  for (const role of MODEL_ROLES) {
    let row = await prismaClient.aiModel.findUnique({ where: { role } });
    if (!row) {
      const d = envDefault(role);
      row = await prismaClient.aiModel.create({
        data: {
          role,
          baseUrl: d.baseUrl,
          apiKey: d.apiKey,
          modelId: d.modelId,
          contextLength: d.contextLength,
          dimensions: d.dimensions
        }
      });
    }
    cache.set(role, toConfig(row));
  }
}

/** 读同步缓存；未 warm 抛错（不该发生——runtime 启动时已 warm）。 */
export function getModelConfigSync(role: ModelRole): AiModelConfig {
  const cfg = cache.get(role);
  if (!cfg) {
    throw new Error(`[model-registry] 角色 ${role} 未初始化，请确认 runtime 启动时调用了 warmModelConfigs()`);
  }
  return cfg;
}

/** 清缓存（写库前后配合 warmModelConfigs 用；单独调一般用不到）。 */
export function invalidateModelConfigs(): void {
  cache.clear();
}

const openaiFor = (cfg: AiModelConfig, fetch?: typeof globalThis.fetch) =>
  createOpenAI({ baseURL: cfg.baseUrl || undefined, apiKey: cfg.apiKey || "missing", fetch });

/** 推理模型：主 / 子 / 编排 / 标题（录制版） / 摘要 等一切文本推理。 */
export function resolveReasoningModel(): WrapLMModel {
  const cfg = getModelConfigSync("reasoning");
  const provider = openaiFor(cfg, createGenericFetch({ record: true, thinking: "enabled" }));
  return wrapLanguageModel({
    model: provider.chat(cfg.modelId) as unknown as WrapLMModel,
    middleware: [inlineReasoningMiddleware, extractReasoningMiddleware({ tagName: "think", startWithReasoning: true })]
  });
}

/** 推理模型（不录制、关思考）：供 title-agent，避免污染主 turn 记录。 */
export function resolveReasoningModelNoRecord(): WrapLMModel {
  const cfg = getModelConfigSync("reasoning");
  const provider = openaiFor(cfg, createGenericFetch({ record: false, thinking: "disabled" }));
  return provider.chat(cfg.modelId) as unknown as WrapLMModel;
}

/** 视觉模型：识图。不注入 deepseek 的 thinking 字段（视觉模型多为 gemini 类）。 */
export function resolveVisionModel(): WrapLMModel {
  const cfg = getModelConfigSync("vision");
  const provider = openaiFor(cfg, createGenericFetch({ record: true, thinking: null }));
  return wrapLanguageModel({
    model: provider.chat(cfg.modelId) as unknown as WrapLMModel,
    middleware: [inlineReasoningMiddleware, extractReasoningMiddleware({ tagName: "think", startWithReasoning: false })]
  });
}

/** 嵌入模型：组件 RAG。 */
export function resolveEmbeddingModel(): EmbeddingModel {
  const cfg = getModelConfigSync("embedding");
  const provider = createOpenAI({ baseURL: cfg.baseUrl || undefined, apiKey: cfg.apiKey || "missing" });
  return provider.embeddingModel(cfg.modelId) as unknown as EmbeddingModel;
}
