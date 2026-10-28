import { type ProcessInputStepArgs, type Processor, TokenLimiter } from "@mastra/core/processors";

import { FALLBACK_MODEL_CONTEXT_LIMIT } from "../../../config/model-capability";
import { getModelConfigSync } from "../../../provider/model-registry";

// 留 5% 余量：TokenLimiter 用 tokenx 估算，与模型 tokenizer 不完全一致，输出也占窗口。
const CONTEXT_USAGE_RATIO = 0.95;

export const resolveContextTokenLimit = (): number => {
  const contextLength = getModelConfigSync("reasoning").contextLength ?? FALLBACK_MODEL_CONTEXT_LIMIT;
  return Math.floor(contextLength * CONTEXT_USAGE_RATIO);
};

/**
 * 压缩失败、熔断或冷却期间的最后一道保险：即将超出模型上下文时，从最早的消息开始丢弃。
 * 上限跟随 ai_model.contextLength，设置页换模型后下一步即生效。
 */
export class ContextWindowLimitProcessor implements Processor {
  id = "context-window-limit";
  private limiter: TokenLimiter | undefined;

  processInputStep(args: ProcessInputStepArgs): Promise<void> {
    const limit = resolveContextTokenLimit();
    if (this.limiter?.getMaxTokens() !== limit) {
      this.limiter = new TokenLimiter(limit);
    }
    return this.limiter.processInputStep(args);
  }
}
