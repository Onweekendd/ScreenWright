import { createOpenAI } from "@ai-sdk/openai";
import { generateImage } from "ai";

import { prismaClient } from "@/mastra/storage/prisma";

import { createConfiguredEmbeddingModel } from "../../provider/embedding-model";
import {
  type AiModelConfig,
  MODEL_ROLES,
  type ModelRole,
  resolveEmbeddingModel,
  warmModelConfigs
} from "../../provider/model-registry";
import { probeVideoService } from "../ai-generation/video/video-generation.server";
import { resolveVideoConfig } from "../ai-generation/video/video-provider";

export interface AiModelVo {
  id: string;
  role: ModelRole;
  /** 接口协议，空串 = 该角色的默认协议 */
  provider: string;
  name: string;
  baseUrl: string;
  /** 只回布尔，绝不回传 key 明文或任何片段（开源项目，尾位也算泄露） */
  hasApiKey: boolean;
  modelId: string;
  contextLength: number | null;
  dimensions: number | null;
  /** 该角色的默认配置（新对话、没在对话里单独选的角色都用它） */
  isDefault: boolean;
}

interface AiModelRow {
  id: string;
  role: string;
  provider: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  contextLength: number | null;
  dimensions: number | null;
  isDefault: boolean;
}

const toVo = (row: AiModelRow): AiModelVo => ({
  id: row.id,
  role: row.role as ModelRole,
  provider: row.provider,
  name: row.name,
  baseUrl: row.baseUrl,
  hasApiKey: !!row.apiKey,
  modelId: row.modelId,
  contextLength: row.contextLength,
  dimensions: row.dimensions,
  isDefault: row.isDefault
});

export class AiModelNotFoundError extends Error {
  constructor(id: string) {
    super(`模型配置不存在：${id}`);
  }
}

export class LastAiModelError extends Error {
  constructor() {
    super("每个角色至少保留一条配置");
  }
}

const findOrThrow = async (id: string) => {
  const row = await prismaClient.aiModel.findUnique({ where: { id } });
  if (!row) {
    throw new AiModelNotFoundError(id);
  }
  return row;
};

/** 全部配置：按角色顺序，同角色按创建时间 */
export async function listAiModels(): Promise<AiModelVo[]> {
  // warm 一次，确保每个角色至少一条且有默认行（首次访问会 seed）
  await warmModelConfigs();
  const rows = await prismaClient.aiModel.findMany({ orderBy: { createdTime: "asc" } });
  return MODEL_ROLES.flatMap((role) => rows.filter((r) => r.role === role).map(toVo));
}

export interface UpdateAiModelInput {
  provider?: string;
  name?: string;
  baseUrl?: string;
  /** 空 / 未传 → 不覆盖旧值 */
  apiKey?: string;
  modelId?: string;
  contextLength?: number | null;
  dimensions?: number | null;
}

export interface CreateAiModelInput extends UpdateAiModelInput {
  /** 没填 apiKey 时沿用这条已存配置的密钥（可跨角色），同一服务商的 key 不用反复粘贴 */
  copyKeyFrom?: string;
}

/** 只挑传了的字段；apiKey 空串视为「不改」 */
const pickData = (input: UpdateAiModelInput): Record<string, unknown> => {
  const data: Record<string, unknown> = {};
  if (input.provider !== undefined) {
    data.provider = input.provider.trim();
  }
  if (input.name !== undefined) {
    data.name = input.name.trim();
  }
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
  return data;
};

/** 新增一条；该角色还没有任何配置时自动设为默认 */
export async function createAiModel(role: ModelRole, input: CreateAiModelInput): Promise<AiModelVo> {
  const data = pickData(input);
  if (data.apiKey === undefined && input.copyKeyFrom) {
    data.apiKey = (await findOrThrow(input.copyKeyFrom)).apiKey;
  }
  const siblings = await prismaClient.aiModel.count({ where: { role } });
  const row = await prismaClient.aiModel.create({ data: { ...data, role, isDefault: siblings === 0 } });
  await warmModelConfigs();
  return toVo(row);
}

export async function updateAiModel(id: string, input: UpdateAiModelInput): Promise<AiModelVo> {
  await findOrThrow(id);
  const row = await prismaClient.aiModel.update({ where: { id }, data: pickData(input) });
  // 热更新：重建同步缓存，agent 下一次 run 就用新配置
  await warmModelConfigs();
  return toVo(row);
}

/**
 * 把一条设为该角色的默认。同一事务里先清同角色的默认标记再设新的，保证每个角色恰好一条默认。
 *
 * TODO(你)：两个请求并发切同一角色的默认时，这个事务够不够？要不要数据库层兜底？见交接说明第 2 块。
 */
export async function setDefaultAiModel(id: string): Promise<AiModelVo> {
  const target = await findOrThrow(id);
  const [, row] = await prismaClient.$transaction([
    prismaClient.aiModel.updateMany({ where: { role: target.role, isDefault: true }, data: { isDefault: false } }),
    prismaClient.aiModel.update({ where: { id }, data: { isDefault: true } })
  ]);
  await warmModelConfigs();
  return toVo(row);
}

/**
 * 删除一条；角色的最后一条不让删。
 * 删的是默认行时，warm 会把最早的一条补为默认；引用它的对话选择由外键级联删除，回到默认。
 */
export async function deleteAiModel(id: string): Promise<void> {
  const target = await findOrThrow(id);
  if ((await prismaClient.aiModel.count({ where: { role: target.role } })) <= 1) {
    throw new LastAiModelError();
  }
  await prismaClient.aiModel.delete({ where: { id } });
  await warmModelConfigs();
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
 * 表单里没重填的字段（尤其 apiKey——前端不显示明文）回退到 `storedId` 那条已存配置：
 * 编辑时是正在编辑的那条，新增时是 copyKeyFrom 指定的那条，都没有就只用表单值。
 */
export async function testAiModel(
  role: ModelRole,
  partial: Partial<Pick<AiModelConfig, "provider" | "baseUrl" | "apiKey" | "modelId" | "dimensions">>,
  storedId?: string
): Promise<TestAiModelResult> {
  const started = Date.now();
  const stored = storedId ? await prismaClient.aiModel.findUnique({ where: { id: storedId } }) : null;
  const cfg = {
    provider: partial.provider !== undefined ? partial.provider : (stored?.provider ?? ""),
    baseUrl: partial.baseUrl?.trim() || stored?.baseUrl || "",
    apiKey: partial.apiKey?.trim() || stored?.apiKey || "",
    modelId: partial.modelId?.trim() || stored?.modelId || "",
    dimensions: partial.dimensions !== undefined ? partial.dimensions : (stored?.dimensions ?? null)
  };
  try {
    if (!cfg.modelId) {
      return { ok: false, latencyMs: 0, error: "未填写模型 id" };
    }
    if (role === "embedding") {
      const model = createConfiguredEmbeddingModel(cfg);
      await model.doEmbed({
        values: ["ping"]
      });
    } else if (role === "image") {
      // 与 reasoning/embedding 分支同一个尺度：真打一次最小请求验证连通性，不是 mock。
      // 这里确实会烧一张图的配额——和上面 embedding 分支烧一次 embedding 调用是同一笔账。
      //
      // 尺寸用 1024x1024 而不是更小的 256x256：不同生图服务对最小图像面积的要求不一样
      // （实测豆包 seedream 系列要求至少 921600 像素，256x256 直接被拒），1024x1024
      // 覆盖了目前接过的服务商的下限，是个安全的通用测试尺寸。
      const provider = createOpenAI({ baseURL: cfg.baseUrl || undefined, apiKey: cfg.apiKey || "missing" });
      const model = provider.imageModel(cfg.modelId);
      await generateImage({ model, prompt: "a single red dot on white background", n: 1, size: "1024x1024" });
    } else if (role === "video") {
      // 视频是异步任务：按服务商验证地址和密钥，不等待生成完成。
      await probeVideoService(resolveVideoConfig(cfg));
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
  const { seedComponentEmbeddings } = await import("../../vector/seed-embeddings");
  return seedComponentEmbeddings({ reset: true });
}
