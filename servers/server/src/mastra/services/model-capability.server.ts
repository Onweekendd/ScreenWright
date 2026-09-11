import { FALLBACK_MODEL_CONTEXT_LIMIT } from "../config/model-capability";
import { compactionConfig } from "../lib/compaction/config";
import { getModelConfigSync } from "../provider/model-registry";
import { type ModelCapability, ModelCapabilitySchema } from "../types/model-capability";

/**
 * 返回推理模型的能力快照 + 当前压缩配置。
 *
 * modelId / contextLimit 取自 `ai_model` 表的 reasoning 行（前端「设置」页维护）；
 * 前端据此算上下文进度条，不再自己维护副本。
 */
export const getModelCapability = (): ModelCapability => {
  const reasoning = getModelConfigSync("reasoning");
  return ModelCapabilitySchema.parse({
    modelId: reasoning.modelId || "unset",
    contextLimit: reasoning.contextLength ?? FALLBACK_MODEL_CONTEXT_LIMIT,
    compaction: {
      l1Enabled: compactionConfig.l1Enabled,
      l3Enabled: compactionConfig.l3Enabled,
      l3TriggerTokens: compactionConfig.l3.triggerTokens
    }
  });
};
