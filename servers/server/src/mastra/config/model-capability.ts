/**
 * 模型上下文上限的兜底常量。
 *
 * 模型 id / 上下文上限的事实来源已迁到 `ai_model` 表（前端「设置」页维护，
 * 见 `provider/model-registry.ts`）。这里只留一个「查不到 contextLength 时」的保守兜底：
 * 宁可偏小、提前压缩，也不要溢出。
 */
export const FALLBACK_MODEL_CONTEXT_LIMIT = 200_000;
