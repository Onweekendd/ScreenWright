import { type ProcessInputStepArgs, TokenLimiter } from "@mastra/core/processors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ contextLength: 1_000_000 as number | null }));
vi.mock("@/mastra/provider/model-registry", () => ({
  getModelConfigSync: () => ({ contextLength: mocks.contextLength })
}));

import { FALLBACK_MODEL_CONTEXT_LIMIT } from "@/mastra/config/model-capability";
import {
  ContextWindowLimitProcessor,
  resolveContextTokenLimit
} from "@/mastra/lib/compaction/processors/contextWindowLimit";

beforeEach(() => {
  mocks.contextLength = 1_000_000;
  vi.restoreAllMocks();
});

describe("上下文窗口保险", () => {
  it("上限取模型 contextLength 的 95%，未配置时用兜底值", () => {
    expect(resolveContextTokenLimit()).toBe(950_000);
    mocks.contextLength = null;
    expect(resolveContextTokenLimit()).toBe(Math.floor(FALLBACK_MODEL_CONTEXT_LIMIT * 0.95));
  });

  it("每一步按当前模型上限截断，换模型后立即生效", async () => {
    const usedLimits: number[] = [];
    vi.spyOn(TokenLimiter.prototype, "processInputStep").mockImplementation(async function (this: TokenLimiter) {
      usedLimits.push(this.getMaxTokens());
    });
    const processor = new ContextWindowLimitProcessor();
    const args = {} as ProcessInputStepArgs;

    await processor.processInputStep(args);
    await processor.processInputStep(args);
    mocks.contextLength = 128_000;
    await processor.processInputStep(args);

    expect(usedLimits).toEqual([950_000, 950_000, 121_600]);
  });
});
