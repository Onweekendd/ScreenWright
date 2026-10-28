const parseNum = (v: string | undefined, fallback: number): number => {
  if (v === undefined) {
    return fallback;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const compactionConfig = {
  // 读取限长：新文本读取结果的 UTF-8 字节预算；不用于截断工具入参。
  toolResult: {
    maxBytes: Math.max(1, Math.floor(parseNum(process.env.COMPACTION_TOOL_RESULT_MAX_BYTES, 32_768)))
  },

  // 历史摘要：上一轮输入 token 超过阈值时，把历史全量替换为一条摘要。
  history: {
    triggerTokens: parseNum(process.env.COMPACTION_TRIGGER_TOKENS, 150_000),
    // 成功压缩一次后,接下来 N 轮(以 processor 调用次数计)内不再触发,避免每条消息都压缩
    cooldownRounds: parseNum(process.env.COMPACTION_COOLDOWN, 5),
    circuitBreakerFailures: 3
  }
};
