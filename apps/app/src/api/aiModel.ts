import type { BaseEntity } from "@/model/BaseEntity";
import { serverRequest } from "@/utils/serverService";

/** 3 个模型角色 */
export type ModelRole = "reasoning" | "vision" | "embedding";

export interface AiModelVo {
  role: ModelRole;
  baseUrl: string;
  /** 后端只回布尔，绝不回传 key 明文或任何片段 */
  hasApiKey: boolean;
  modelId: string;
  /** reasoning 专用：上下文窗口（前端进度条分母） */
  contextLength: number | null;
  /** embedding 专用：向量维度 */
  dimensions: number | null;
}

export interface UpdateAiModelBody {
  baseUrl?: string;
  /** 空 / 不传 → 后端不覆盖旧值 */
  apiKey?: string;
  modelId?: string;
  contextLength?: number | null;
  dimensions?: number | null;
}

export interface TestAiModelResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

const base = "/customApi/ai-models";

/** 拉 3 个角色配置（key 已脱敏） */
export const getAiModels = () =>
  serverRequest<BaseEntity<AiModelVo[]>>({ url: base, method: "get" }).then((r) => r.result);

/** 更新一个角色；apiKey 传空则保留旧值 */
export const updateAiModel = (role: ModelRole, body: UpdateAiModelBody) =>
  serverRequest<BaseEntity<AiModelVo>>({ url: `${base}/${role}`, method: "put", data: body }).then((r) => r.result);

/** 用表单里的临时配置验证连通性（不落库；未重填的字段回退库里已存值） */
export const testAiModel = (role: ModelRole, body: Pick<UpdateAiModelBody, "baseUrl" | "apiKey" | "modelId">) =>
  serverRequest<BaseEntity<TestAiModelResult>>({
    url: `${base}/${role}/test`,
    method: "post",
    data: body,
    timeOut: 1000 * 60
  }).then((r) => r.result);

/** 换嵌入模型后重建组件 RAG 向量索引 */
export const reindexEmbeddings = () =>
  serverRequest<BaseEntity<{ embedded: number; failed: number }>>({
    url: `${base}/embedding/reindex`,
    method: "post",
    timeOut: 1000 * 60 * 10
  }).then((r) => r.result);
