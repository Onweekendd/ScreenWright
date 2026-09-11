import { Agent } from "@mastra/core/agent";

import { loadPrompt } from "@/agent-resources/prompts";

import { resolveReasoningModel } from "../provider/model-registry";

/**
 * 上下文压缩摘要 agent(L3)
 *
 * 当主 agent 上下文超过 triggerTokens 时,由 CompactionProcessor 调用本 agent
 * 把历史对话压成 8 章节的接续摘要(prompts/compact/prompt.md)。
 * 用便宜模型(deepseek-v4-flash),无工具、单次生成。
 */
const compactionSummarizerAgent = new Agent({
  id: "compaction-summarizer",
  name: "上下文压缩摘要器",
  description: "为长对话生成可接续的 8 章节摘要,用于 L3 压缩",
  instructions: loadPrompt("mastra/compact/prompt.md"),
  model: () => resolveReasoningModel(),
  tools: {},
  defaultOptions: {
    maxSteps: 1
  }
});

export { compactionSummarizerAgent };
