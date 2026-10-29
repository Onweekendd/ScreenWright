import type { BaseEntity } from "@/model/BaseEntity";
import { serverRequest } from "@/utils/serverService";

/** 4 个模型角色 */
export type ModelRole = "reasoning" | "embedding" | "image" | "video";

/** 可按对话单独选择的角色；embedding 与向量索引绑定，只能全局切换 */
export type ThreadModelRole = Exclude<ModelRole, "embedding">;

/** 对话的模型选择：角色 → 配置 id，缺的角色用默认 */
export type ThreadModelSelection = Partial<Record<ThreadModelRole, string>>;

/** 生视频接口协议；空串 = minimax-v2 */
export type VideoProvider = "minimax-v2" | "runlive";

export interface AiModelVo {
  id: string;
  role: ModelRole;
  /** 接口协议，空串 = 该角色的默认协议（目前只有 video 可选） */
  provider: string;
  /** 展示名，空则显示 modelId */
  name: string;
  baseUrl: string;
  /** 后端只回布尔，绝不回传 key 明文或任何片段 */
  hasApiKey: boolean;
  modelId: string;
  /** reasoning 专用：上下文窗口（前端进度条分母） */
  contextLength: number | null;
  /** embedding 专用：向量维度 */
  dimensions: number | null;
  /** 该角色的默认配置 */
  isDefault: boolean;
}

export interface UpdateAiModelBody {
  provider?: string;
  name?: string;
  baseUrl?: string;
  /** 空 / 不传 → 后端不覆盖旧值 */
  apiKey?: string;
  modelId?: string;
  contextLength?: number | null;
  dimensions?: number | null;
}

export interface CreateAiModelBody extends UpdateAiModelBody {
  role: ModelRole;
  /** 没填 apiKey 时沿用这条已存配置的密钥 */
  copyKeyFrom?: string;
}

export interface TestAiModelResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

const base = "/customApi/ai-models";

/** 展示名：没起名就用模型 id */
export const aiModelLabel = (vo: Pick<AiModelVo, "name" | "modelId">) => vo.name || vo.modelId || "未命名";

/** 拉全部配置（key 已脱敏） */
export const getAiModels = () =>
  serverRequest<BaseEntity<AiModelVo[]>>({ url: base, method: "get" }).then((r) => r.result);

export const createAiModel = (body: CreateAiModelBody) =>
  serverRequest<BaseEntity<AiModelVo>>({ url: base, method: "post", data: body }).then((r) => r.result);

/** 更新一条；apiKey 传空则保留旧值 */
export const updateAiModel = (id: string, body: UpdateAiModelBody) =>
  serverRequest<BaseEntity<AiModelVo>>({ url: `${base}/${id}`, method: "put", data: body }).then((r) => r.result);

/** 删除一条；角色的最后一条后端会拒绝 */
export const deleteAiModel = (id: string) =>
  serverRequest<BaseEntity<null>>({ url: `${base}/${id}`, method: "delete" }).then((r) => r.result);

/** 设为该角色默认 */
export const setDefaultAiModel = (id: string) =>
  serverRequest<BaseEntity<AiModelVo>>({ url: `${base}/${id}/default`, method: "post" }).then((r) => r.result);

/**
 * 用表单里的临时配置验证连通性（不落库）。
 * 未重填的字段回退到 `id` 那条已存配置（编辑时传自身 id，新增复制时传来源 id）。
 */
export const testAiModel = (
  role: ModelRole,
  body: Pick<UpdateAiModelBody, "provider" | "baseUrl" | "apiKey" | "modelId" | "dimensions"> & { id?: string }
) =>
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

/** 对话的模型选择（只含覆盖了默认的角色） */
export const getThreadModels = (threadId: string) =>
  serverRequest<BaseEntity<ThreadModelSelection>>({ url: `/customApi/thread-models/${threadId}`, method: "get" }).then(
    (r) => r.result
  );

/** 选定对话某角色的配置；null 改回默认 */
export const setThreadModel = (threadId: string, role: ThreadModelRole, aiModelId: string | null) =>
  serverRequest<BaseEntity<ThreadModelSelection>>({
    url: `/customApi/thread-models/${threadId}/${role}`,
    method: "put",
    data: { aiModelId }
  }).then((r) => r.result);
