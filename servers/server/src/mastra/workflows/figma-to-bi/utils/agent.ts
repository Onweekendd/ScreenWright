import type { MastraLanguageModel } from "@mastra/core/agent";
import type { Agent } from "@mastra/core/agent";

import type { SingleModelTokenUsage } from "@/mastra/types";

/**
 * 从 Agent.generate 的结果中计算 Token 使用量
 * @param agent Agent 实例
 * @param result Agent.generate 的返回结果
 * @returns 包含 token 使用量的对象
 *
 * @example
 * ```typescript
 * const result = await agent.generate(...);
 * const { tokenUsage, totalTokens } = calculateTokenUsage(agent, result);
 * console.log(tokenUsage.modelId); // 模型 ID
 * console.log(tokenUsage.inputTokens); // 输入 token 数量
 * console.log(totalTokens); // 总 token 数量
 * ```
 */
export function calculateTokenUsage<T extends Awaited<ReturnType<Agent["generate"]>>>(
  agent: Agent,
  result: T
): { tokenUsage: SingleModelTokenUsage; totalTokens: number } {
  const model = agent.getModel() as MastraLanguageModel;
  const tokenUsage: SingleModelTokenUsage = {
    inputTokens: result.usage.inputTokens ?? 0,
    outputTokens: result.usage.outputTokens ?? 0,
    modelId: model.modelId
  };

  const totalTokens = tokenUsage.inputTokens + tokenUsage.outputTokens;

  return {
    tokenUsage,
    totalTokens
  };
}
