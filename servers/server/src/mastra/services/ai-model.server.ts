import { createOpenAI } from "@ai-sdk/openai";

import { prismaClient } from "@/mastra/storage/prisma";

import {
  type AiModelConfig,
  MODEL_ROLES,
  type ModelRole,
  resolveEmbeddingModel,
  warmModelConfigs
} from "../provider/model-registry";

export interface AiModelVo {
  role: ModelRole;
  baseUrl: string;
  /** 只回布尔，绝不回传 key 明文或任何片段（开源项目，尾位也算泄露） */
  hasApiKey: boolean;
  modelId: string;
  contextLength: number | null;
  dimensions: number | null;
}

const toVo = (row: {
  role: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  contextLength: number | null;
  dimensions: number | null;
}): AiModelVo => ({
  role: row.role as ModelRole,
  baseUrl: row.baseUrl,
  hasApiKey: !!row.apiKey,
  modelId: row.modelId,
  contextLength: row.contextLength,
  dimensions: row.dimensions
});

export async function listAiModels(): Promise<AiModelVo[]> {
  // warm 一次，确保 3 行都存在（首次访问会 seed）
  await warmModelConfigs();
  const rows = await prismaClient.aiModel.findMany();
  const byRole = new Map(rows.map((r) => [r.role, r]));
  return MODEL_ROLES.map((role) => toVo(byRole.get(role)!));
}

export interface UpdateAiModelInput {
  baseUrl?: string;
  /** 空 / 未传 → 不覆盖旧值 */
  apiKey?: string;
  modelId?: string;
  contextLength?: number | null;
  dimensions?: number | null;
}

export async function updateAiModel(role: ModelRole, input: UpdateAiModelInput): Promise<AiModelVo> {
  const data: Record<string, unknown> = {};
  if (input.baseUrl !== undefined) {
    data.baseUrl = input.baseUrl.trim();
  }
  if (input.apiKey !== undefined && input.apiKey.trim() !== "") {
    data.apiKey = input.apiKey.trim();
  }
  if (input.modelId !== undefined) {
    data.modelId = input.modelId.trim();
  }
  if (input.contextLength !== undefined) {
    data.contextLength = input.contextLength;
  }
  if (input.dimensions !== undefined) {
    data.dimensions = input.dimensions;
  }

  const row = await prismaClient.aiModel.upsert({
    where: { role },
    create: {
      role,
      baseUrl: (data.baseUrl as string) ?? "",
      apiKey: (data.apiKey as string) ?? "",
      modelId: (data.modelId as string) ?? "",
      contextLength: (data.contextLength as number | null) ?? null,
      dimensions: (data.dimensions as number | null) ?? null
    },
    update: data
  });

  // 热更新：重建同步缓存，agent 下一次 run 就用新配置
  await warmModelConfigs();
  return toVo(row);
}

export interface TestAiModelResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

/** upstream 的报错常把 key 原样回显（"Incorrect API key: sk-xxx"），抹掉再返回前端 */
const scrubKeys = (msg: string): string => msg.replace(/\b(sk|xai|key)-[A-Za-z0-9_-]{6,}/gi, "$1-***");

/**
 * 用传入的临时配置发一次最小请求验证连通性（不落库）。
 * 表单里没重填的字段（尤其 apiKey——前端不显示明文）回退到库里已存的值。
 */
export async function testAiModel(
  role: ModelRole,
  partial: Partial<Pick<AiModelConfig, "baseUrl" | "apiKey" | "modelId">>
): Promise<TestAiModelResult> {
  const started = Date.now();
  const stored = await prismaClient.aiModel.findUnique({ where: { role } });
  const cfg = {
    baseUrl: partial.baseUrl?.trim() || stored?.baseUrl || "",
    apiKey: partial.apiKey?.trim() || stored?.apiKey || "",
    modelId: partial.modelId?.trim() || stored?.modelId || ""
  };
  try {
    if (!cfg.modelId) {
      return { ok: false, latencyMs: 0, error: "未填写模型 id" };
    }
    if (role === "embedding") {
      const provider = createOpenAI({ baseURL: cfg.baseUrl || undefined, apiKey: cfg.apiKey || "missing" });
      const model = provider.textEmbeddingModel(cfg.modelId);
      await (model as unknown as { doEmbed: (o: { values: string[] }) => Promise<unknown> }).doEmbed({ values: ["ping"] });
    } else {
      const provider = createOpenAI({ baseURL: cfg.baseUrl || undefined, apiKey: cfg.apiKey || "missing" });
      const model = provider.chat(cfg.modelId);
      await (
        model as unknown as {
          doGenerate: (o: unknown) => Promise<unknown>;
        }
      ).doGenerate({
        prompt: [{ role: "user", content: [{ type: "text", text: "ping" }] }],
        maxOutputTokens: 1
      });
    }
    return { ok: true, latencyMs: Date.now() - started };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - started, error: scrubKeys((e as Error).message) };
  }
}

/** 重建组件 RAG 向量索引（换嵌入模型后调用）。 */
export async function reindexEmbeddings(): Promise<{ embedded: number; failed: number }> {
  await warmModelConfigs();
  resolveEmbeddingModel(); // 校验嵌入模型配置可解析
  const { seedComponentEmbeddings } = await import("../vector/seed-embeddings");
  return seedComponentEmbeddings({ reset: true });
}
