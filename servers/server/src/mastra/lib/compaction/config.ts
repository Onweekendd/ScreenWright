const parseBool = (v: string | undefined, fallback: boolean): boolean => {
  if (v === undefined) {
    return fallback;
  }
  return v === "1" || v.toLowerCase() === "true";
};

const parseNum = (v: string | undefined, fallback: number): number => {
  if (v === undefined) {
    return fallback;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const COMPACTION_L1_KEEP_ROUNDS = 3;

export const compactionConfig = {
  l1Enabled: parseBool(process.env.COMPACTION_L1_ENABLED, false),
  l3Enabled: parseBool(process.env.COMPACTION_L3_ENABLED, false),

  l1: {
    // 保留最近 N 轮对话(以 user 消息计)的工具结果不动,更老的 assistant 消息里命中白名单的
    // tool-invocation 会被清空 result。N=2 → 保留最后 2 个 user→assistant 回合的工具结果。
    keepRecentRounds: COMPACTION_L1_KEEP_ROUNDS,
    clearableTools: new Set(["readFileTool", "searchComponentTool", "editFilesTool", "executeInBrowserTool"]),
    placeholder: "[Old tool result cleared by compaction]"
  },

  l3: {
    triggerTokens: parseNum(process.env.COMPACTION_L3_TRIGGER_TOKENS, 150_000),
    userMessageKeepCount: parseNum(process.env.COMPACTION_L3_USER_KEEP, 10),
    // 成功压缩一次后,接下来 N 轮(以 processor 调用次数计)内不再触发 L3,避免每条消息都压缩
    cooldownRounds: parseNum(process.env.COMPACTION_L3_COOLDOWN, 5),
    circuitBreakerFailures: 3
  }
};
