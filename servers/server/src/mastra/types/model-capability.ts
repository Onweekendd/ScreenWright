import { z } from "zod";

/**
 * 模型能力与压缩配置的只读快照，供前端渲染上下文进度条用。
 * 前端据此计算占用百分比和告警颜色，不再自己硬编码上限。
 */
export const ModelCapabilitySchema = z.object({
  /** 主对话 agent 当前使用的模型 id */
  modelId: z.string(),
  /** 该模型的上下文上限（token） */
  contextLimit: z.number().int().positive(),
  /** 上下文压缩配置：前端可据此把告警阈值对齐到真实压缩点 */
  compaction: z.object({
    /** 历史摘要的触发阈值（prompt token） */
    triggerTokens: z.number().int().positive()
  })
});

export type ModelCapability = z.infer<typeof ModelCapabilitySchema>;

export const ModelCapabilityErrorSchema = z.object({
  error: z.string()
});
