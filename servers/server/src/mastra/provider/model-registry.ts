import { createOpenAI } from "@ai-sdk/openai";
import type { ImageModel } from "ai";
import { extractReasoningMiddleware, wrapLanguageModel } from "ai";

import { prismaClient } from "@/mastra/storage/prisma";

import { createConfiguredEmbeddingModel } from "./embedding-model";
import { inlineImagesMiddleware } from "./image-middleware";
import { createGenericFetch, inlineReasoningMiddleware, type WrapLMModel } from "./utils";

/**
 * 模型配置化：4 个角色，配置存 `ai_model` 表（前端「设置」页维护）。每个角色可存多条，
 * `isDefault` 那条是默认；对话可在 `thread_model` 表里按角色改用别的配置（见 thread-model.server.ts）。
 * 缓存里放全部配置，`resolveXxx(configId?)` 按 id 取，id 缺失/失效回退默认。
 *
 * - **reasoning**：主 agent + 所有子 agent + 标题 + 摘要压缩 + 编排 + 截图 + subtab + artifact-app Pi
 * - **embedding**：组件 RAG 向量
 * - **image**：生图（效果图、装饰素材重画）。走 `images.generations` 接口，不是 chat 补全，
 *   所以 `resolveImageModel` 返回 `ImageModel` 而不是 `WrapLMModel`，见下方单独的 warm/resolve。
 * - **video**：生视频。异步任务接口，按配置的 `provider` 选协议（见 video-provider）。
 *
 * 文本、嵌入、生图按 OpenAI 兼容端点处理；视频的 `provider` 为空时按 MiniMax V2 协议处理。
 * reasoning 往返走 `provider/utils.ts` 的通用逻辑。
 * 配置热更新：写库后调 `warmModelConfigs()` 重建缓存，agent 的 `model: () => resolveXxx()`
 * 每次 run 重新解析，无需重启。
 */

export type ModelRole = "reasoning" | "embedding" | "image" | "video";

export const MODEL_ROLES: readonly ModelRole[] = ["reasoning", "embedding", "image", "video"] as const;

export const DEFAULT_VIDEO_MODEL = "MiniMax-H3";

export interface AiModelConfig {
  id: string;
  role: ModelRole;
  /** 接口协议，空串 = 该角色的默认协议 */
  provider: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  contextLength: number | null;
  dimensions: number | null;
}

/** 首启 seed 兜底：某行不存在时用 env 建。env 也空就建空行，等用户去设置页填。惰性读 env。 */
function envDefault(role: ModelRole, image?: AiModelConfig): Omit<AiModelConfig, "id" | "role"> {
  const e = process.env;
  switch (role) {
    case "reasoning":
      return {
        provider: "",
        baseUrl: e.REASONING_MODEL_BASE_URL ?? "",
        apiKey: e.REASONING_MODEL_API_KEY ?? "",
        modelId: e.REASONING_MODEL_ID ?? (e.REASONING_MODEL_API_KEY ? "deepseek-v4-flash" : ""),
        contextLength: 1_000_000,
        dimensions: null
      };
    case "embedding":
      return {
        provider: "",
        baseUrl: e.EMBEDDING_MODEL_BASE_URL ?? "",
        apiKey: e.EMBEDDING_MODEL_API_KEY ?? "",
        modelId: e.EMBEDDING_MODEL_ID ?? (e.EMBEDDING_MODEL_API_KEY ? "BAAI/bge-large-zh-v1.5" : ""),
        contextLength: null,
        dimensions: Number(e.EMBEDDING_MODEL_DIMENSIONS) || 1024
      };
    case "image":
      // 2026-09-17 实测跑通：豆包 seedream，走火山方舟的 OpenAI 兼容端点。
      // 注意 baseUrl 只到 /api/v3，不带 /images/generations——SDK 会自己拼这段路径，
      // 填全路径会导致拼出重复的 /images/generations/images/generations（真实踩过）。
      return {
        provider: "",
        baseUrl: e.IMAGE_MODEL_BASE_URL ?? "",
        apiKey: e.IMAGE_MODEL_API_KEY ?? "",
        modelId: e.IMAGE_MODEL_ID ?? (e.IMAGE_MODEL_API_KEY ? "doubao-seedream-5-0-pro-260628" : ""),
        contextLength: null,
        dimensions: null
      };
    case "video":
      // 升级时只初始化一次：优先 VIDEO_MODEL_*，缺项沿用原有生图配置。
      // 后续与其他角色一样只读数据库，设置页保存后不会再被 env 或生图配置覆盖。
      return {
        provider: e.VIDEO_MODEL_PROVIDER?.trim() ?? "",
        baseUrl:
          e.VIDEO_MODEL_BASE_URL?.trim() ||
          (image?.baseUrl && URL.canParse(image.baseUrl) ? `${new URL(image.baseUrl).origin}/minimax/v2` : ""),
        apiKey: e.VIDEO_MODEL_API_KEY?.trim() || image?.apiKey || "",
        modelId: e.VIDEO_MODEL_ID?.trim() || DEFAULT_VIDEO_MODEL,
        contextLength: null,
        dimensions: null
      };
  }
}

/** 全部配置按 id 索引；默认配置另按角色索引。两张表在 warm 时整体替换 */
let configsById = new Map<string, AiModelConfig>();
let defaultsByRole = new Map<ModelRole, AiModelConfig>();

const toConfig = (row: {
  id: string;
  role: string;
  provider: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  contextLength: number | null;
  dimensions: number | null;
}): AiModelConfig => ({
  id: row.id,
  role: row.role as ModelRole,
  provider: row.provider,
  baseUrl: row.baseUrl,
  apiKey: row.apiKey,
  modelId: row.modelId,
  contextLength: row.contextLength,
  dimensions: row.dimensions
});

/**
 * 从库里读全部配置进同步缓存，并确定各角色的默认配置：
 * - 一条都没有 → 用 env 兜底 seed 一条并设为默认；
 * - 有行但没有默认行（比如默认行被直接删库）→ 取最早一条补为默认。
 * 在 `runtime.ts` 顶层 await、以及每次写 `ai_model` 后调用。
 *
 * 先在新表里读齐再整体替换，不能先 clear 再逐个填：生图 worker 每个任务开始前都会重读一次，
 * worker 与 ai 同进程时（开发环境）批量生图的并发请求会读到半空的缓存，
 * 报「角色 image 未初始化」（实测一批 4 张里随机挂一张）。
 */
export async function warmModelConfigs(): Promise<void> {
  const rows = await prismaClient.aiModel.findMany({ orderBy: { createdTime: "asc" } });
  const nextById = new Map<string, AiModelConfig>();
  const nextDefaults = new Map<ModelRole, AiModelConfig>();
  for (const role of MODEL_ROLES) {
    const ofRole = rows.filter((r) => r.role === role);
    let defaultRow = ofRole.find((r) => r.isDefault) ?? ofRole[0];
    if (!defaultRow) {
      const d = envDefault(role, nextDefaults.get("image"));
      defaultRow = await prismaClient.aiModel.create({
        data: {
          role,
          provider: d.provider,
          baseUrl: d.baseUrl,
          apiKey: d.apiKey,
          modelId: d.modelId,
          contextLength: d.contextLength,
          dimensions: d.dimensions,
          isDefault: true
        }
      });
    } else if (!defaultRow.isDefault) {
      defaultRow = await prismaClient.aiModel.update({ where: { id: defaultRow.id }, data: { isDefault: true } });
    }
    for (const row of [...ofRole, defaultRow]) {
      nextById.set(row.id, toConfig(row));
    }
    nextDefaults.set(role, toConfig(defaultRow));
  }
  configsById = nextById;
  defaultsByRole = nextDefaults;
}

/** 读某角色的默认配置；未 warm 抛错（不该发生——runtime 启动时已 warm）。 */
export function getModelConfigSync(role: ModelRole): AiModelConfig {
  const cfg = defaultsByRole.get(role);
  if (!cfg) {
    throw new Error(`[model-registry] 角色 ${role} 未初始化，请确认 runtime 启动时调用了 warmModelConfigs()`);
  }
  return cfg;
}

/**
 * 按配置 id 取；id 为空、已被删、或角色对不上都回退该角色默认。
 * 回退而不是抛错：对话里存的选择可能指向刚删掉的配置，此时继续用默认比让整轮对话失败更合理。
 */
export function resolveModelConfig(role: ModelRole, configId?: string | null): AiModelConfig {
  const picked = configId ? configsById.get(configId) : undefined;
  return picked?.role === role ? picked : getModelConfigSync(role);
}

/** 清缓存（写库前后配合 warmModelConfigs 用；单独调一般用不到）。 */
export function invalidateModelConfigs(): void {
  configsById = new Map();
  defaultsByRole = new Map();
}

const openaiFor = (cfg: AiModelConfig, fetch?: typeof globalThis.fetch) =>
  createOpenAI({ baseURL: cfg.baseUrl || undefined, apiKey: cfg.apiKey || "missing", fetch });

/**
 * 推理模型：主 / 子 / 编排 / 标题（录制版） / 摘要 等一切推理；主模型自带视觉，图片经 inlineImagesMiddleware 直接喂。
 * `configId` 为对话选择的配置，不传用默认。
 */
export function resolveReasoningModel(configId?: string | null): WrapLMModel {
  const cfg = resolveModelConfig("reasoning", configId);
  const provider = openaiFor(cfg, createGenericFetch({ record: true, thinking: "enabled" }));
  return wrapLanguageModel({
    model: provider.chat(cfg.modelId) as unknown as WrapLMModel,
    middleware: [
      inlineImagesMiddleware,
      inlineReasoningMiddleware,
      // fetch 层已为 reasoning_content 补齐 <think> 标签；无标签的正文应直接保留为 text。
      extractReasoningMiddleware({ tagName: "think" })
    ]
  });
}

/** 推理模型（不录制、关思考）：供 title-agent，避免污染主 turn 记录。 */
export function resolveReasoningModelNoRecord(configId?: string | null): WrapLMModel {
  const cfg = resolveModelConfig("reasoning", configId);
  const provider = openaiFor(cfg, createGenericFetch({ record: false, thinking: "disabled" }));
  // 标题取自首条用户消息，可能带图：内网图 URL 外网模型访问不到，同样要换成二进制
  return wrapLanguageModel({
    model: provider.chat(cfg.modelId) as unknown as WrapLMModel,
    middleware: [inlineImagesMiddleware]
  });
}

/** 嵌入模型：组件 RAG。 */
export function resolveEmbeddingModel(): ReturnType<typeof createConfiguredEmbeddingModel> {
  const cfg = getModelConfigSync("embedding");
  return createConfiguredEmbeddingModel(cfg);
}

/**
 * 生图模型：走 `images.generations` 接口，不是 chat 补全，所以类型是 `ImageModel`
 * 不是 `WrapLMModel`——用 `ai` 包的 `generateImage({ model, prompt, ... })` 调用，
 * 不能塞进 `resolveReasoningModel` 那一套 wrapLanguageModel 管线。
 */
export function resolveImageModel(configId?: string | null): ImageModel {
  const cfg = resolveModelConfig("image", configId);
  const provider = createOpenAI({ baseURL: cfg.baseUrl || undefined, apiKey: cfg.apiKey || "missing" });
  return provider.imageModel(cfg.modelId);
}
